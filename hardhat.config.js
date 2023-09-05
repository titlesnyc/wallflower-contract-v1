require("@nomicfoundation/hardhat-toolbox");

require('dotenv').config()
let mnemonic = process.env.SECRET

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
      viaIR: true,
    }
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.ALCHEMY_MAINNET_URL, // 'https://testnet.rpc.zora.energy/',
        blockNumber: 17237588 // 1000000
      }
    },
    mainnet: {
      url: process.env.ALCHEMY_MAINNET_URL,
      accounts: {
        mnemonic,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
    sepolia: {
      url: process.env.ALCHEMY_SEPOLIA_URL,
      accounts: {
        mnemonic,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
    goerli: {
      url: process.env.ALCHEMY_GOERLI_URL,
      accounts: {
        mnemonic,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
    'zora-mainnet': {
      url: 'https://rpc.zora.energy/',
      // gasPrice: 3500000000,
      accounts: {
        mnemonic,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
    'zora-goerli': {
      url: 'https://testnet.rpc.zora.energy/',
      // gasPrice: 0,
      //gas: 3500000000,
      accounts: {
        mnemonic,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
