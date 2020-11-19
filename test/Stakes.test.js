require("truffle-test-utils").init();

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'));

const BPTStakingPoolFactory = artifacts.require("BPTStakingPoolFactory");
const BPTStakingPool = artifacts.require("BPTStakingPool");

contract("BPTStakingPool", (accounts) => {
    const [bob, alice] = accounts;

    beforeEach(async () => {
        factory = await BPTStakingPoolFactory.new();
        stakingPool = await factory.createBPTStakingPoll(0);
    });

});
