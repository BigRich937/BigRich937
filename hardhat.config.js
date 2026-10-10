require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const accounts = PRIVATE_KEY ? [PRIVATE_KEY] : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    cronos: {
      url: process.env.CRONOS_RPC_URL || "https://evm.cronos.org",
      chainId: 25,
      accounts,
    },
    cronosTestnet: {
      url: process.env.CRONOS_TESTNET_RPC_URL || "https://evm-t3.cronos.org",
      chainId: 338,
      accounts,
    },
  },
  etherscan: {
    apiKey: {
      cronos: process.env.CRONOS_EXPLORER_API_KEY || "",
      cronosTestnet: process.env.CRONOS_TESTNET_EXPLORER_API_KEY || "",
    },
    customChains: [
      {
        network: "cronos",
        chainId: 25,
        urls: {
          apiURL: "https://explorer-api.cronos.org/mainnet/api/v1/hardhat/contract?apikey=" + (process.env.CRONOS_EXPLORER_API_KEY || ""),
          browserURL: "https://explorer.cronos.org",
        },
      },
      {
        network: "cronosTestnet",
        chainId: 338,
        urls: {
          apiURL: "https://explorer-api.cronos.org/testnet/api/v1/hardhat/contract?apikey=" + (process.env.CRONOS_TESTNET_EXPLORER_API_KEY || ""),
          browserURL: "https://explorer.cronos.org/testnet",
        },
      },
    ],
  },
  sourcify: { enabled: false },
};
