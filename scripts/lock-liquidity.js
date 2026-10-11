// Deploys a LiquidityLock for the VVS RRx / CRO LP token.
// Required in .env: LP_TOKEN_ADDRESS (shown on VVS / the explorer after adding liquidity).
// Optional: LOCK_MONTHS (default 12), LOCK_BENEFICIARY (default: deployer).
// After it deploys, transfer your LP tokens to the printed lock address.
const hre = require("hardhat");

async function main() {
  const { ethers, network } = hre;
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("Set PRIVATE_KEY in .env");
  const lpToken = process.env.LP_TOKEN_ADDRESS;
  if (!lpToken || !ethers.isAddress(lpToken)) throw new Error("Set LP_TOKEN_ADDRESS in .env");

  const months = Number(process.env.LOCK_MONTHS || 12);
  if (!(months >= 1 && months <= 60)) throw new Error("LOCK_MONTHS must be between 1 and 60");
  const beneficiary = process.env.LOCK_BENEFICIARY || deployer.address;
  const now = (await ethers.provider.getBlock("latest")).timestamp;
  const unlockTime = now + Math.round(months * 30.44 * 24 * 60 * 60);

  console.log(`Network:     ${network.name} (chainId ${network.config.chainId})`);
  console.log(`LP token:    ${lpToken}`);
  console.log(`Beneficiary: ${beneficiary}`);
  console.log(`Unlocks:     ${new Date(unlockTime * 1000).toUTCString()} (${months} months)`);

  const lock = await ethers.deployContract("LiquidityLock", [lpToken, beneficiary, unlockTime]);
  await lock.waitForDeployment();
  const address = await lock.getAddress();
  console.log(`Lock:        ${address}`);
  console.log("Next: send your LP tokens to the lock address above.");

  if (process.env.CRONOS_EXPLORER_API_KEY) {
    await lock.deploymentTransaction().wait(5);
    try {
      await hre.run("verify:verify", { address, constructorArguments: [lpToken, beneficiary, unlockTime] });
    } catch (err) {
      console.log(`Verification failed (you can retry later): ${err.message}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
