const env = require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
const projectId = process.env.INFURA_PROJECT_ID;
const mnemonic = process.env.MNEMONIC;

const networkId = process.env.npm_package_config_ganache_networkId;
const gasPrice = process.env.npm_package_config_ganache_gasPrice;
const gasLimit = process.env.npm_package_config_ganache_gasLimit;
const etherscanApiKey = process.env.npm_package_config_deploy_etherscanApiKey;
const account = process.env.npm_package_config_deploy_account;
const deployKey = [process.env.npm_package_config_deploy_key];

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: networkId,
      gas: gasLimit,
      gasPrice: gasPrice
    },
    kovan: {
      network_id: "42",
      provider: () =>
        new HDWalletProvider(
          deployKey,
          "https://kovan.infura.io/v3/71b49581984e47a1b4869aa00aa1ea25"
        ),
        gasPrice: 10000000000, // 10 gwei
        gas: 6900000,
        from: account,
        timeoutBlocks: 500,
    },
    main: {
      network_id: "1",
      provider: () =>
        new HDWalletProvider(
          deployKey,
          "https://mainnet.infura.io/v3/71b49581984e47a1b4869aa00aa1ea25"
        ),
      gasPrice: 10000000000, // 10 gwei
      gas: 6900000,
      from: account,
      timeoutBlocks: 500,
    }
  },

  mocha: {
    reporter: 'eth-gas-reporter',
    reporterOptions : {
      currency: 'USD',
      gasPrice: 2
    }
  },

  compilers: {
    solc: {
        version: "^0.6.0"
    },
  },

  plugins: ["truffle-plugin-verify"],

  api_keys: {
    etherscan: etherscanApiKey,
  },

};
