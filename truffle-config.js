const env = require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
const projectId = process.env.INFURA_PROJECT_ID;
const mnemonic = process.env.MNEMONIC;

const networkId = process.env.npm_package_config_ganache_networkId;
const gasPrice = process.env.npm_package_config_ganache_gasPrice;
const gasLimit = process.env.npm_package_config_ganache_gasLimit;

module.exports = {
    networks: {
        development: {
            host: "127.0.0.1",
            port: 8545,
            network_id: networkId,
            gas: gasLimit,
            gasPrice: gasPrice
        },
        ropsten: {
            provider: () => new HDWalletProvider(mnemonic, `https://ropsten.infura.io/v3/${projectId}`),
            network_id: 3,
            gas: 5500000,
            confirmations: 2,
            timeoutBlocks: 200,
            skipDryRun: true
        },
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
};
