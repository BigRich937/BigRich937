# RRoyal (RRx) — Cronos Token Launch

| Name   | Symbol | Total supply | Decimals |
|--------|--------|--------------|----------|
| RRoyal | RRx    | 100,000,000  | 18       |

These settings live in `token.config.js`.

## Deployments

| Network        | Contract address                             | Explorer |
|----------------|----------------------------------------------|----------|
| Cronos testnet | `0x7C5524548FBF613b6B0A6BC8e2c534ED373b508a` | [view](https://explorer.cronos.org/testnet/address/0x7C5524548FBF613b6B0A6BC8e2c534ED373b508a) |
| Cronos mainnet | `0x7C5524548FBF613b6B0A6BC8e2c534ED373b508a` | [view](https://explorer.cronos.org/address/0x7C5524548FBF613b6B0A6BC8e2c534ED373b508a) |

## Launch status

- [x] Launched on Cronos testnet and checked in MetaMask
- [x] Launched on Cronos mainnet — all 100,000,000 RRx sent to the launch wallet `0x636653f148ba0215Ad40b7D7259C4168473324DA`
- [x] Source code verified on the explorer: https://explorer.cronos.org/address/0x7C5524548FBF613b6B0A6BC8e2c534ED373b508a#code
- [x] Pool plan chosen: 10,000,000 RRx + 100,000 CRO on VVS Finance (starting price 1 RRx = 0.01 CRO)
- [x] Decided: keep the current RRx contract and list it on VVS Finance (not a relaunch on Cronos Launch)
- [ ] Create the RRx / CRO pool on VVS Finance
- [ ] Lock the LP tokens for 12 months with `LiquidityLock` (`npm run lock-liquidity:mainnet`); more LP can be added to the lock anytime
- [x] First logo done (gold "RRx" with scepter "x", ruby location pin and delivery trail), see `brand/`
- [ ] Pick the final mirrored "Я x R" monogram (see `brand/README.md` for options and next decisions)
- [ ] Submit logo and token info (see `brand/TOKEN_INFO.md`)

The address is the same on both networks because it is derived from the deployer wallet and its
transaction count, and this was the wallet's first transaction on each network.

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

## Liquidity lock

`LiquidityLock` holds the VVS Finance LP tokens until a fixed date. Nobody can withdraw them
early, and the date can only be pushed later, never earlier. After adding liquidity on VVS:

1. Put the LP token address in `.env` as `LP_TOKEN_ADDRESS`, and optionally `LOCK_MONTHS` (default 12).
2. Run `npm run lock-liquidity:mainnet`. It deploys the lock and verifies it on the explorer.
3. Send your LP tokens to the printed lock address.

## Delivery app: payments and fee escrow

Two more contracts connect RRx to the delivery app:

- **`RRoyalPayments`** — a customer pays for an order in RRx or a stablecoin by calling
  `pay(orderId, token, amount)`. A fee (default 5%, at most 20%) goes to the fee vault and the
  rest goes to the treasury wallet. Each order id can be paid only once. The app backend should
  dispatch an order only after it sees the matching `OrderPaid(orderId, payer, token, amount, fee)`
  event on chain, with the right token and amount.
- **`RRoyalFeeVault`** — an escrow that holds the collected fees. Funds stay there until the
  owner releases them with `release(token, to, amount)`. Fees are not shared with token holders.

Deploy them (after the token is live):

```bash
npm run deploy-app:testnet   # also deploys a test stablecoin, tUSDC
npm run deploy-app:mainnet   # needs STABLECOIN_ADDRESS (e.g. USDC on Cronos) in .env
```

Optional `.env` settings: `TREASURY_ADDRESS` (where order payments go, defaults to the deployer)
and `FEE_BPS` (fee in basis points, `500` = 5%).

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
