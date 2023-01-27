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

### Installation

```shell
git submodule update --init --recursive
yarn
```

To update the submodule to its latest version

```
git submodule update --remote --merge
```

## Contributing

- get some Polygon Mumbai testnet tokens from [faucet](https://faucet.polygon.technology/).

### Build

```shell
yarn build
```

### Deploy

Copy `.env.example` to `.env` and set the desired configuration in `.env`.

#### Testnets/Matic

Before you deploy you should set up your signer wallet. You can either pass a mnemonic via the environment variable `MNEMONIC` or create a `mnemonic.txt` file with the seed phrase in the root of the repository.

```shell
yarn hardhat run scripts/deploy.js --network [matic|mumbai]
```

#### Locally

The mnemonic is not required for local deployments. The script will automatically default to the first signer account from Hardhat.

Run a Hardhat node in one terminal:
```shell
yarn hardhat node
```

In another terminal deploy the bridge and all Toucan-related contracts:
```shell
yarn hardhat run scripts/deploy-local.js --network localhost
```

### Verify in Polygonscan

Add a Polygonscan API key in your `.env` file, then run:

```
yarn hardhat verify <contract_address> <issuer_address> <nct_address> --network <network>
```

## License

See the [LICENSE](./LICENSE) file.
