// Deploys RRoyalStaking + RRoyalPayments and wires them to the RRx token.
// Testnet: also deploys a test stablecoin (tUSDC) unless STABLECOIN_ADDRESS is set.
// Mainnet: STABLECOIN_ADDRESS is required.
const hre = require("hardhat");

const RRX_ADDRESS = process.env.RRX_ADDRESS || "0x7C5524548FBF613b6B0A6BC8e2c534ED373b508a";

async function main() {
  const { ethers, network } = hre;
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("Set PRIVATE_KEY in .env");

  const isMainnet = network.config.chainId === 25;
  const treasury = process.env.TREASURY_ADDRESS || deployer.address;
  const feeBps = Number(process.env.FEE_BPS || 500); // 500 = 5%

  console.log(`Network:   ${network.name} (chainId ${network.config.chainId})`);
  console.log(`Deployer:  ${deployer.address}`);
  console.log(`RRx:       ${RRX_ADDRESS}`);
  console.log(`Treasury:  ${treasury}`);
  console.log(`Fee:       ${feeBps / 100}% to stakers`);

  let stablecoin = process.env.STABLECOIN_ADDRESS;
  if (!stablecoin) {
    if (isMainnet) throw new Error("Set STABLECOIN_ADDRESS in .env for mainnet (e.g. USDC on Cronos)");
    const mock = await ethers.deployContract("MockStablecoin");
    await mock.waitForDeployment();
    stablecoin = await mock.getAddress();
    await (await mock.mint(deployer.address, ethers.parseUnits("100000", 6))).wait();
    console.log(`tUSDC:     ${stablecoin} (test stablecoin, 100,000 minted to deployer)`);
  } else {
    console.log(`Stablecoin: ${stablecoin}`);
  }

  const staking = await ethers.deployContract("RRoyalStaking", [RRX_ADDRESS, deployer.address]);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log(`Staking:   ${stakingAddress}`);

  const payments = await ethers.deployContract("RRoyalPayments", [deployer.address, treasury, stakingAddress, feeBps]);
  await payments.waitForDeployment();
  const paymentsAddress = await payments.getAddress();
  console.log(`Payments:  ${paymentsAddress}`);

  for (const token of [RRX_ADDRESS, stablecoin]) {
    await (await staking.addRewardToken(token)).wait();
    await (await payments.setAcceptedToken(token, true)).wait();
  }
  console.log("Done: RRx and the stablecoin are accepted for payments and paid out as staking rewards.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
