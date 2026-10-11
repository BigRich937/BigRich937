const { expect } = require("chai");
const { ethers } = require("hardhat");

const rrx = (n) => ethers.parseUnits(String(n), 18);
const usd = (n) => ethers.parseUnits(String(n), 6);
const order = (s) => ethers.id(s);

describe("RRoyalPayments + RRoyalFeeVault", function () {
  async function setup() {
    const [owner, treasury, customer, other] = await ethers.getSigners();
    const token = await ethers.deployContract("Token", ["RRoyal", "RRx", rrx(100_000_000), owner.address]);
    const usdc = await ethers.deployContract("MockStablecoin");
    const vault = await ethers.deployContract("RRoyalFeeVault", [owner.address]);
    const payments = await ethers.deployContract("RRoyalPayments", [
      owner.address, treasury.address, await vault.getAddress(), 500, // 5% fee
    ]);
    await payments.setAcceptedToken(await token.getAddress(), true);
    await payments.setAcceptedToken(await usdc.getAddress(), true);

    await token.transfer(customer.address, rrx(1_000_000));
    await usdc.mint(customer.address, usd(10_000));
    return { owner, treasury, customer, other, token, usdc, vault, payments };
  }

  async function payOrder(payments, tokenContract, customer, id, amount) {
    await tokenContract.connect(customer).approve(await payments.getAddress(), amount);
    return payments.connect(customer).pay(order(id), await tokenContract.getAddress(), amount);
  }

  it("splits a stablecoin payment between treasury and the fee vault", async function () {
    const { treasury, customer, usdc, vault, payments } = await setup();
    await expect(payOrder(payments, usdc, customer, "order-1", usd(100)))
      .to.emit(payments, "OrderPaid")
      .withArgs(order("order-1"), customer.address, await usdc.getAddress(), usd(100), usd(5));

    expect(await usdc.balanceOf(treasury.address)).to.equal(usd(95));
    expect(await vault.balanceOf(await usdc.getAddress())).to.equal(usd(5));
    expect(await usdc.balanceOf(await payments.getAddress())).to.equal(0);
  });

  it("collects RRx fees in the vault", async function () {
    const { treasury, customer, token, vault, payments } = await setup();
    await payOrder(payments, token, customer, "order-rrx", rrx(200));
    expect(await token.balanceOf(treasury.address)).to.equal(rrx(190));
    expect(await vault.balanceOf(await token.getAddress())).to.equal(rrx(10));
  });

  it("lets only the owner release fees from the vault", async function () {
    const { owner, customer, other, usdc, vault, payments } = await setup();
    const usdcAddr = await usdc.getAddress();
    await payOrder(payments, usdc, customer, "o", usd(100));

    await expect(vault.connect(other).release(usdcAddr, other.address, usd(5)))
      .to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");

    await expect(vault.release(usdcAddr, owner.address, usd(5)))
      .to.emit(vault, "Released").withArgs(usdcAddr, owner.address, usd(5));
    expect(await usdc.balanceOf(owner.address)).to.equal(usd(5));
  });

  it("rejects paying the same order twice", async function () {
    const { customer, usdc, payments } = await setup();
    await payOrder(payments, usdc, customer, "dup", usd(10));
    await expect(payOrder(payments, usdc, customer, "dup", usd(10)))
      .to.be.revertedWithCustomError(payments, "OrderAlreadyPaid");
  });

  it("rejects tokens that are not accepted", async function () {
    const { customer, payments } = await setup();
    const unknown = await ethers.deployContract("MockStablecoin");
    await unknown.mint(customer.address, usd(10));
    await expect(payOrder(payments, unknown, customer, "x", usd(10)))
      .to.be.revertedWithCustomError(payments, "TokenNotAccepted");
  });

  it("caps the fee and limits settings to the owner", async function () {
    const { customer, payments } = await setup();
    await expect(payments.setFee(2001)).to.be.revertedWithCustomError(payments, "FeeTooHigh");
    await expect(payments.connect(customer).setFee(100))
      .to.be.revertedWithCustomError(payments, "OwnableUnauthorizedAccount");
    await expect(payments.connect(customer).setFeeVault(customer.address))
      .to.be.revertedWithCustomError(payments, "OwnableUnauthorizedAccount");
  });
});
