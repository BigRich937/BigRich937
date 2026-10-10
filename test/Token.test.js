const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token", function () {
  const supply = ethers.parseUnits("1000000", 18);

  async function deploy() {
    const [deployer, alice, treasury] = await ethers.getSigners();
    const token = await ethers.deployContract("Token", ["Test Coin", "TEST", supply, treasury.address]);
    return { token, deployer, alice, treasury };
  }

  it("sets name, symbol and decimals", async function () {
    const { token } = await deploy();
    expect(await token.name()).to.equal("Test Coin");
    expect(await token.symbol()).to.equal("TEST");
    expect(await token.decimals()).to.equal(18);
  });

  it("mints the full supply to the recipient", async function () {
    const { token, deployer, treasury } = await deploy();
    expect(await token.totalSupply()).to.equal(supply);
    expect(await token.balanceOf(treasury.address)).to.equal(supply);
    expect(await token.balanceOf(deployer.address)).to.equal(0);
  });

  it("transfers between accounts", async function () {
    const { token, alice, treasury } = await deploy();
    await token.connect(treasury).transfer(alice.address, 100n);
    expect(await token.balanceOf(alice.address)).to.equal(100n);
  });

  it("lets holders burn and reduces total supply", async function () {
    const { token, treasury } = await deploy();
    await token.connect(treasury).burn(1000n);
    expect(await token.totalSupply()).to.equal(supply - 1000n);
  });
});
