const hre = require("hardhat");

async function main() {
  const name = process.env.TOKEN_NAME;
  const symbol = process.env.TOKEN_SYMBOL;
  const supply = process.env.TOKEN_SUPPLY; // whole tokens, e.g. "1000000"
  if (!name || !symbol || !supply) {
    throw new Error("Set TOKEN_NAME, TOKEN_SYMBOL and TOKEN_SUPPLY in .env");
  }

  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error("Set PRIVATE_KEY in .env");
  const recipient = process.env.TOKEN_RECIPIENT || deployer.address;
  const initialSupply = hre.ethers.parseUnits(supply, 18);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Network:   ${hre.network.name} (chainId ${hre.network.config.chainId})`);
  console.log(`Deployer:  ${deployer.address} (${hre.ethers.formatEther(balance)} CRO)`);
  console.log(`Token:     ${name} (${symbol}), supply ${supply} -> ${recipient}`);

  const args = [name, symbol, initialSupply, recipient];
  const token = await hre.ethers.deployContract("Token", args);
  await token.waitForDeployment();
  const address = await token.getAddress();
  console.log(`Deployed:  ${address}`);

  if (process.env.CRONOS_EXPLORER_API_KEY || process.env.CRONOS_TESTNET_EXPLORER_API_KEY) {
    console.log("Waiting for confirmations before verifying...");
    await token.deploymentTransaction().wait(5);
    try {
      await hre.run("verify:verify", { address, constructorArguments: args });
    } catch (err) {
      console.log(`Verification failed (you can retry later): ${err.message}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
