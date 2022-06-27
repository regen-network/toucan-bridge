### Terminal window 1

```
$ yarn --version
3.2.0
```

```
$ solc --version
solc, the solidity compiler commandline interface
Version: 0.8.8+commit.dddeac2f.Darwin.appleclang
```

`git submodule update --init --recursive`

`git submodule update --remote --merge`

`yarn`

`yarn build`

`yarn hardhat node`

### Terminal window 2

```
$ yarn hardhat run scripts/deploy-all.js --network localhost
Deploying ToucanContractRegistry...
Deploying CarbonProjects...
Deploying CarbonProjectVintages...
Deploying CarbonOffsetBatches...
Deploying ToucanCarbonOffsetsFactory...
Deploying ToucanCarbonOffsets beacon...
Creating a new carbon project...
Created carbon project 1
Creating a new vintage for carbon project 1...
Created vintage 1
Deploying a TCO2 for vintage 1...
Deployed TCO2 0xf6cB1Bc71F7ed659E64C8a56dA5759494480e333
Starting the tokenization process for a broker...
1. Minting an empty batch...
Minted batch 1
2. Updating the batch with data...
3. Linking the batch to the vintage...
4. Confirming the batch...
5. Fractionalizing the batch to TCO2...
Bridge deployed to 0x172076E0166D1F9Cc711C77Adf8488051744980C
ToucanRegenBridge deployed to 0x172076E0166D1F9Cc711C77Adf8488051744980C
```

```
$ yarn hardhat run scripts/select-bridge.js --network localhost
Error: No Contract deployed with name ToucanRegenBridge
    at Object.getContract (/Users/dave/src/toucan-bridge/node_modules/@nomiclabs/hardhat-ethers/src/internal/helpers.ts:447:11)
    at processTicksAndRejections (node:internal/process/task_queues:96:5)
    at deploy (/Users/dave/src/toucan-bridge/scripts/select-bridge.js:6:19)
```
