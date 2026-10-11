# After the VVS pool is live: where people find and trade RRx

RRx contract (Cronos mainnet): `0x7C5524548FBF613b6B0A6BC8e2c534ED373b508a`

## Where people buy and sell

- **VVS Finance:** Swap page, paste the contract address, swap CRO for RRx.
- **Direct buy link** (opens VVS with RRx selected; test it once the pool is live):
  `https://vvs.finance/swap?outputCurrency=0x7C5524548FBF613b6B0A6BC8e2c534ED373b508a`
- **Wallets with a built-in swap** that support Cronos (for example the Crypto.com Onchain wallet).
  They usually trade through the same pools once someone pastes the address.

## Where people see the price and chart

These sites usually pick up a new pool on their own within minutes to hours:

- **DexScreener:** dexscreener.com (search "RRx" or the contract address)
- **GeckoTerminal:** geckoterminal.com (Cronos network)
- **DEXTools:** dextools.io

Most traders discover new coins here. DexScreener offers a paid profile upgrade to add the logo and
links. Add the `LiquidityLock` address there so traders can see the liquidity is locked.

## How people find out about it

A new pool gets no traffic on its own:

1. **Own channels:** X (Twitter), a Telegram group and the website. Always post the contract
   address and the buy link.
2. **The delivery app:** a "Buy RRx" button that opens the VVS buy link. Customers have a real
   reason to hold RRx, which is the biggest advantage.
3. **Token info** on the Cronos Explorer, CoinGecko and CoinMarketCap (see `brand/TOKEN_INFO.md`),
   so RRx shows up with the logo in searches.
4. **Always post the official address.** Scammers often copy new coins with the same name.

## Things to watch

- With 100,000 CRO in the pool, a 1,000 CRO buy moves the price about 2%; bigger buys move it more.
- Don't promise price gains. Describe RRx as the payment coin for the delivery app.

## To do right after the pool is created

1. Send the pool transaction link so the LP token (pool) address can be found.
2. Lock the LP tokens for 12 months: set `LP_TOKEN_ADDRESS` in `.env`, run
   `npm run lock-liquidity:mainnet`, then send the LP tokens to the printed lock address.
3. Write the announcement post: contract address, buy link, chart link and lock link.
