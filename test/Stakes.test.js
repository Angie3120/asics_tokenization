require("truffle-test-utils").init();

const truffleAssert = require('truffle-assertions');

const BPTStakingPoolFactory = artifacts.require("BPTStakingPoolFactory");
const BPTStakingPool = artifacts.require("BPTStakingPool");
const ZionodesTokenFactory = artifacts.require("ZionodesTokenFactory");
const ZionodesToken = artifacts.require("ZionodesToken");

const utils = require("./helpers/utils");

contract("BPTStakingPool", (accounts) => {
    const [bob, alice] = accounts;

    beforeEach(async () => {
        factory = await BPTStakingPoolFactory.new();
    });

    it("creating and retrieving staking pool", async () => {
        assert.equal(true, await factory.isSuperAdmin(bob, { from: bob }));

        let tx = await factory.createBPTStakingPoll("0x906681829b1b89b4d5b4907dc64de5db1d367311", "0x906681829b1b89b4d5b4907dc64de5db1d367311", { from: bob });
        let pools = await factory.getBPTStakingPools({ from: bob });

        truffleAssert.eventEmitted(tx, 'BPTStakingPoolCreated', (event) => {
            return event.bptStakingPoll == pools[0];
        });
    });

    it("staking and unstaking", async () => {
        let tokenFactory = await ZionodesTokenFactory.new();

        await tokenFactory.deployZToken("Bitmain Antminer S15+28", "S15+28", 18, BigInt(50 * (10 ** 18)), { from: bob });

        let tokenAddress = await tokenFactory.getZTokenAddress("S15+28", { from : bob });
        let token = await ZionodesToken.at(tokenAddress);

        await factory.createBPTStakingPoll(tokenAddress, tokenAddress, { from: bob });

        let pools = await factory.getBPTStakingPools({ from: bob });
        let pool = await BPTStakingPool.at(pools[0]);

        assert.equal(0, await pool._totalStaked({ from: bob }));

        await utils.shouldThrow(pool.stake(0, { from: bob }));

        await tokenFactory.setupWeiPriceForZToken(tokenAddress, BigInt(1 * (10 ** 18)), { from: bob });
        await tokenFactory.buyZTokenUsingWei(tokenAddress, 5, { from: bob, value: web3.utils.toWei("5", "ether") });
        await tokenFactory.buyZTokenUsingWei(tokenAddress, 10, { from: alice, value: web3.utils.toWei("10", "ether") });

        await token.approve(pool.address, BigInt(1 * (10 ** 18)), { from: bob });
        await token.approve(pool.address, BigInt(5 * (10 ** 18)), { from: alice });

        assert.equal(BigInt(1 * (10 ** 18)), await token.allowance(bob, pool.address, { from: bob }));
        assert.equal(BigInt(5 * (10 ** 18)), await token.allowance(alice, pool.address, { from: alice }));

        let tx = await pool.stake(BigInt(1 * (10 ** 18)), { from: bob });

        truffleAssert.eventEmitted(tx, 'Staked', (event) => {
            return event.amount == BigInt(1 * (10 ** 18)) && event.account == bob;
        });

        tx = await pool.stake(BigInt(5 * (10 ** 18)), { from: alice });

        assert.equal(BigInt(6 * (10 ** 18)), await pool._totalStaked({ from: bob }));
        assert.equal(BigInt(1 * (10 ** 18)), await pool.getStake({ from: bob }));
        assert.equal(BigInt(5 * (10 ** 18)), await pool.getStake({ from: alice }));

        assert.equal(tokenAddress, await pool._bpt({ from: bob }));

        tx = await pool.unstake(BigInt(2 * (10 ** 18)), { from: alice });

        truffleAssert.eventEmitted(tx, 'Unstaked', (event) => {
            return event.amount == BigInt(2 * (10 ** 18)) && event.account == alice;
        });

        assert.equal(BigInt(4 * (10 ** 18)), await pool._totalStaked({ from: bob }));
        assert.equal(BigInt(3 * (10 ** 18)), await pool.getStake({ from: alice }));

        await token.approve(pool.address, BigInt(2 * (10 ** 18)), { from: alice });
        assert.equal(BigInt(2 * (10 ** 18)), await token.allowance(alice, pool.address, { from: alice }));

        tx = await pool.stake(BigInt(1 * (10 ** 18)), { from: alice });

        assert.equal(BigInt(1 * (10 ** 18)), await token.allowance(alice, pool.address, { from: alice }));

        assert.equal(BigInt(5 * (10 ** 18)), await pool._totalStaked({ from: bob }));
        assert.equal(BigInt(4 * (10 ** 18)), await pool.getStake({ from: alice }));
    });

    it("rewards distributing", async () => {
        let tokenFactory = await ZionodesTokenFactory.new();

        await tokenFactory.deployZToken("S15+28 BPT", "BPT", 18, 0, { from: bob });
        await tokenFactory.deployZToken("Ren BTC", "renBTC", 8, 0, { from: bob });

        let btp_address = await tokenFactory.getZTokenAddress("BPT", { from : bob });
        let bpt = await ZionodesToken.at(btp_address);

        let renBTC_address = await tokenFactory.getZTokenAddress("renBTC", { from : bob });
        let renBTC = await ZionodesToken.at(renBTC_address);

        await factory.createBPTStakingPoll(btp_address, renBTC_address, { from: bob });

    });
});
