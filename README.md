# TITLES Remix Protocol 

This project contains the smart contracts and Hardhat development environment for the Remix Protocol that powers the TITLES ecosystem.


### Setup
A `.env` file is needed with the following values:
```
SECRET={wallet_secret}
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/{key}
ALCHEMY_GOERLI_URL=https://eth-goerli.g.alchemy.com/v2/{key}
ALCHEMY_MAINNET_URL=https://eth-mainnet.g.alchemy.com/v2/{key}
ETHERSCAN_API_KEY={key}
```

### Running

Note - the default setup for testing forks Ethereum mainnet, due to depending on the pre-existing 0xSplits SplitMain contract.


**Compilation**

``` npx hardhat compile ```

**Test**

` npx hardhat test `

**Deploy**

` npx hardhat run scripts/deployDeployer.js --network {network} `

**Etherscan Verification**

` npx hardhat verify --network {network} {deployer_contract_address} 0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE 0xd9111EbeC09Ae2cb4778e6278d5959929bAA59Cc `
