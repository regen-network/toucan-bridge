# Toucan Bridge

Smart contracts for Toucan (Polygon) - Regen bridge.

## Summary

[Regen Ledger](https://regen.network/) is a blockchain dedicated for Earth sustainability and Regenerative Finance.
Regen Ledger provides a registry for all type of eco credits. Vintages are represented as batches and grouped into credit classes.

[Toucan](https://docs.toucan.earth) is a digitized carbon registry implemented on Polygon blockchain.
The carbon vintages are implemented as ERC20 smart contracts, called TCO2.

This repository provides smart contracts for a one way bridge from TCO2 carbon credits to Regen Ledger Eco Credits Batches. In parallel we are working for a fully decentralized 2-way bridge.

## Functionality

- burning TCO2 whitelisted tokens and issuing bridge events.

(TODO, more description will come)

## Setup

### Dependencies

- node > 16.0
- pnpm > 6.20

### Installation

```shell
git submodule sync
pnpm install
pnpm husky install
```

## Contributing

- get some Polygon Mumbai testnet tokens from [faucet](https://faucet.polygon.technology/).

### Hardhat usage

```shell
pnpm hardhat accounts
pnpm hardhat compile
pnpm hardhat clean
pnpm hardhat test
pnpm hardhat node
node scripts/sample-script.js
pnpm hardhat help
```

## License

See the [LICENSE](./LICENSE) file.
