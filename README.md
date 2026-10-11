# RRoyal (RRx) — Cronos Token Launch

| Name   | Symbol | Total supply | Decimals |
|--------|--------|--------------|----------|
| RRoyal | RRx    | 100,000,000  | 18       |

These settings live in `token.config.js`.

## Deployments

| Network        | Contract address                             | Explorer |
|----------------|----------------------------------------------|----------|
| Cronos testnet | `0x7C5524548FBF613b6B0A6BC8e2c534ED373b508a` | [view](https://explorer.cronos.org/testnet/address/0x7C5524548FBF613b6B0A6BC8e2c534ED373b508a) |
| Cronos mainnet | not deployed yet                             |          |

A fixed-supply ERC-20 token (OpenZeppelin v5) with Hardhat scripts to deploy it on the
**Cronos EVM** chain.

**What the token does**
- The whole supply is minted once, at deployment, to one wallet.
- There is no owner, no admin, and no way to mint more tokens later.
- Holders can burn their own tokens.
- It supports `permit` (EIP-2612), so wallets can approve spending with a signature instead of a transaction.

| Network        | Chain ID | RPC                         | Explorer                              |
|----------------|----------|-----------------------------|---------------------------------------|
| Cronos mainnet | 25       | https://evm.cronos.org      | https://explorer.cronos.org           |
| Cronos testnet | 338      | https://evm-t3.cronos.org   | https://explorer.cronos.org/testnet   |

## 1. Setup

```bash
npm install
cp .env.example .env    # then edit .env
npm test
```

In `.env`, set:
- `PRIVATE_KEY` is the private key of the wallet that deploys the token. Use a **new wallet made only for deploying**, and never commit or share this key.
- `TOKEN_RECIPIENT` (optional) is the wallet that receives the supply. A hardware wallet or multisig is a good choice. If you leave it blank, the deployer wallet gets the supply.

## 2. Deploy to testnet first

1. Add Cronos testnet to your wallet (chain ID 338) and get test CRO from the faucet: https://cronos.org/faucet
2. Run the deploy:
   ```bash
   npm run deploy:testnet
   ```
3. Open the printed address on the testnet explorer. Add the token to MetaMask and try a transfer.

## 3. Deploy to mainnet

1. Fund the deployer wallet with a small amount of real CRO to pay for gas.
2. Run the deploy:
   ```bash
   npm run deploy:mainnet
   ```
3. **Verify the source code** so people can read the contract on the explorer. Get an API key from the Cronos Explorer developer portal and put it in `CRONOS_EXPLORER_API_KEY`. With the key set, the deploy script verifies the contract automatically. To verify by hand instead:
   ```bash
   npx hardhat verify --network cronos <ADDRESS> "RRoyal" "RRx" 100000000000000000000000000 <RECIPIENT>
   ```

## 4. After the deploy: making the coin tradable

Deploying creates the token but does not give it a price or let people trade it. Usual next steps:

1. **Add liquidity on a Cronos DEX**, such as VVS Finance or another Cronos DEX. Pair your token with CRO or USDC. The ratio you deposit sets the starting price.
2. **Lock or burn the LP tokens** you get from adding liquidity. This shows buyers that the liquidity can't be pulled out.
3. **Publish the contract address** on the channels you control, so people can tell your token apart from copycats.
4. Optionally, **submit token info** (logo, website) to the Cronos Explorer and to token lists or trackers like CoinGecko and CoinMarketCap.

## Important notes

- Mainnet deploys are permanent. The name, symbol and supply can't be changed after deployment.
- Depending on where you live and how you sell or promote the token, it may be regulated as a security. Get legal advice before you raise money or market the token as an investment.
- For anything holding significant value, have the contract and your launch plan independently reviewed.
