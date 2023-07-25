require("@nomicfoundation/hardhat-toolbox");

require('dotenv').config()
let mnemonic = process.env.SECRET

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
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
        url: process.env.ALCHEMY_MAINNET_URL,
        blockNumber: 17237588
      }
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
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
