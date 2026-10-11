const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("LiquidityLock", function () {
  const SIX_MONTHS = 182 * 24 * 60 * 60;

  async function setup() {
    const [owner, stranger] = await ethers.getSigners();
    const lp = await ethers.deployContract("Token", ["VVS LP", "VVS-LP", 1000n, owner.address]);
    const unlockTime = (await time.latest()) + SIX_MONTHS;
    const lock = await ethers.deployContract("LiquidityLock", [await lp.getAddress(), owner.address, unlockTime]);
    await lp.transfer(await lock.getAddress(), 1000n);
    return { owner, stranger, lp, lock, unlockTime };
  }

  it("holds the LP tokens", async function () {
    const { lock } = await setup();
    expect(await lock.lockedAmount()).to.equal(1000n);
  });

  it("refuses to release before the unlock time", async function () {
    const { lock, unlockTime } = await setup();
    await time.increaseTo(unlockTime - 60);
    await expect(lock.release()).to.be.revertedWithCustomError(lock, "StillLocked");
  });

  it("releases to the beneficiary after the unlock time, even if someone else calls", async function () {
    const { owner, stranger, lp, lock, unlockTime } = await setup();
    await time.increaseTo(unlockTime);
    await expect(lock.connect(stranger).release()).to.emit(lock, "Released").withArgs(owner.address, 1000n);
    expect(await lp.balanceOf(owner.address)).to.equal(1000n);
    expect(await lp.balanceOf(stranger.address)).to.equal(0);
  });

  it("can only be extended, never shortened, and only by the beneficiary", async function () {
    const { stranger, lock, unlockTime } = await setup();
    await expect(lock.extendLock(unlockTime - 1)).to.be.revertedWithCustomError(lock, "CanOnlyExtend");
    await expect(lock.connect(stranger).extendLock(unlockTime + 1))
      .to.be.revertedWithCustomError(lock, "NotBeneficiary");
    await lock.extendLock(unlockTime + SIX_MONTHS);
    expect(await lock.unlockTime()).to.equal(unlockTime + SIX_MONTHS);
  });

  it("rejects an unlock time in the past", async function () {
    const [owner] = await ethers.getSigners();
    await expect(ethers.deployContract("LiquidityLock", [owner.address, owner.address, 1n]))
      .to.be.revertedWithCustomError(await ethers.getContractFactory("LiquidityLock"), "UnlockTimeInPast");
  });
});
