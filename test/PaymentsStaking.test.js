const { expect } = require("chai");
const { ethers } = require("hardhat");

const rrx = (n) => ethers.parseUnits(String(n), 18);
const usd = (n) => ethers.parseUnits(String(n), 6);
const order = (s) => ethers.id(s);

describe("RRoyalPayments + RRoyalStaking", function () {
  async function setup() {
    const [owner, treasury, customer, alice, bob] = await ethers.getSigners();
    const token = await ethers.deployContract("Token", ["RRoyal", "RRx", rrx(100_000_000), owner.address]);
    const usdc = await ethers.deployContract("MockStablecoin");
    const staking = await ethers.deployContract("RRoyalStaking", [await token.getAddress(), owner.address]);
    await staking.addRewardToken(await token.getAddress());
    await staking.addRewardToken(await usdc.getAddress());
    const payments = await ethers.deployContract("RRoyalPayments", [
      owner.address, treasury.address, await staking.getAddress(), 500, // 5% fee
    ]);
    await payments.setAcceptedToken(await token.getAddress(), true);
    await payments.setAcceptedToken(await usdc.getAddress(), true);

    for (const u of [customer, alice, bob]) await token.transfer(u.address, rrx(1_000_000));
    await usdc.mint(customer.address, usd(10_000));
    return { owner, treasury, customer, alice, bob, token, usdc, staking, payments };
  }

  async function stake(token, staking, user, amount) {
    await token.connect(user).approve(await staking.getAddress(), amount);
    await staking.connect(user).stake(amount);
  }

  async function payOrder(payments, tokenContract, customer, id, amount) {
    await tokenContract.connect(customer).approve(await payments.getAddress(), amount);
    return payments.connect(customer).pay(order(id), await tokenContract.getAddress(), amount);
  }

  it("splits a stablecoin payment between treasury and stakers", async function () {
    const { treasury, customer, alice, token, usdc, staking, payments } = await setup();
    await stake(token, staking, alice, rrx(1000));

    await expect(payOrder(payments, usdc, customer, "order-1", usd(100)))
      .to.emit(payments, "OrderPaid")
      .withArgs(order("order-1"), customer.address, await usdc.getAddress(), usd(100), usd(5));

    expect(await usdc.balanceOf(treasury.address)).to.equal(usd(95));
    expect(await staking.earned(alice.address, await usdc.getAddress())).to.equal(usd(5));

    await staking.connect(alice).claim();
    expect(await usdc.balanceOf(alice.address)).to.equal(usd(5));
  });

  it("pays RRx fees to stakers without touching staked RRx", async function () {
    const { customer, alice, token, staking, payments } = await setup();
    await stake(token, staking, alice, rrx(1000));
    await payOrder(payments, token, customer, "order-rrx", rrx(200)); // fee 10 RRx

    expect(await staking.earned(alice.address, await token.getAddress())).to.equal(rrx(10));
    await staking.connect(alice).exit();
    expect(await token.balanceOf(alice.address)).to.equal(rrx(1_000_000) + rrx(10));
    expect(await staking.totalStaked()).to.equal(0);
  });

  it("shares fees in proportion to stake and only with people staked at the time", async function () {
    const { customer, alice, bob, token, usdc, staking, payments } = await setup();
    const usdcAddr = await usdc.getAddress();
    await stake(token, staking, alice, rrx(3000));
    await stake(token, staking, bob, rrx(1000));
    await payOrder(payments, usdc, customer, "a", usd(400)); // fee 20: alice 15, bob 5

    await staking.connect(bob).withdraw(rrx(1000));
    await payOrder(payments, usdc, customer, "b", usd(200)); // fee 10: all to alice

    // Rewards round down by at most one smallest unit, so the contract never owes more than it holds.
    expect(await staking.earned(alice.address, usdcAddr)).to.be.closeTo(usd(25), 1n);
    expect(await staking.earned(bob.address, usdcAddr)).to.equal(usd(5));
  });

  it("holds fees that arrive while nobody is staked for the first staker", async function () {
    const { customer, alice, token, usdc, staking, payments } = await setup();
    await payOrder(payments, usdc, customer, "early", usd(100));
    expect(await staking.queuedRewards(await usdc.getAddress())).to.equal(usd(5));

    await stake(token, staking, alice, rrx(1));
    expect(await staking.earned(alice.address, await usdc.getAddress())).to.equal(usd(5));
  });

  it("rejects paying the same order twice", async function () {
    const { customer, usdc, payments } = await setup();
    await payOrder(payments, usdc, customer, "dup", usd(10));
    await expect(payOrder(payments, usdc, customer, "dup", usd(10)))
      .to.be.revertedWithCustomError(payments, "OrderAlreadyPaid");
  });

  it("rejects tokens that are not accepted", async function () {
    const { customer, payments } = await setup();
    const other = await ethers.deployContract("MockStablecoin");
    await other.mint(customer.address, usd(10));
    await expect(payOrder(payments, other, customer, "x", usd(10)))
      .to.be.revertedWithCustomError(payments, "TokenNotAccepted");
  });

  it("caps the fee and limits admin functions to the owner", async function () {
    const { customer, payments, staking } = await setup();
    await expect(payments.setFee(2001)).to.be.revertedWithCustomError(payments, "FeeTooHigh");
    await expect(payments.connect(customer).setFee(100))
      .to.be.revertedWithCustomError(payments, "OwnableUnauthorizedAccount");
    await expect(staking.connect(customer).addRewardToken(customer.address))
      .to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");
  });

  it("does not let a user withdraw more than they staked", async function () {
    const { alice, token, staking } = await setup();
    await stake(token, staking, alice, rrx(10));
    await expect(staking.connect(alice).withdraw(rrx(11)))
      .to.be.revertedWithCustomError(staking, "InsufficientStake");
  });
});
