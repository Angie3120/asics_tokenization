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

        await bpt.addAdmin(tokenFactory.address, { from: bob });
        await tokenFactory.mintZTokens(btp_address, bob, BigInt(2 * (10 ** 18)), { from: bob });

        assert.equal(2 * (10 ** 18), await bpt.balanceOf(bob, { from: bob }));

        let pools = await factory.getBPTStakingPools({ from: bob });
        let pool = await BPTStakingPool.at(pools[0]);

        await bpt.approve(pool.address, BigInt(2 * (10 ** 18)), { from: bob });
        await pool.stake(BigInt(2 * (10 ** 18)), { from: bob });

        assert.equal(BigInt(2 * (10 ** 18)), await pool.getStake({ from: bob }));

        await renBTC.addAdmin(tokenFactory.address, { from: bob });
        await tokenFactory.mintZTokens(renBTC_address, pool.address, BigInt(10 * (10 ** 8)), { from: bob });
        await pool.distributeRewards(BigInt(10 * (10 ** 8)), { from: bob });

        console.log((await pool._cummRewardPerStake({ from: bob })).toNumber());

        await pool.claimReward(bob, { from: bob });

        assert.equal(10 * (10 ** 8), (await renBTC.balanceOf(bob, { from: bob })).toNumber());

        await pool.claimReward(bob, { from: bob });

        assert.equal(10 * (10 ** 8), (await renBTC.balanceOf(bob, { from: bob })).toNumber());

        await tokenFactory.mintZTokens(btp_address, bob, BigInt(2 * (10 ** 18)), { from: bob });
        await tokenFactory.mintZTokens(btp_address, alice, BigInt(2 * (10 ** 18)), { from: bob });

        assert.equal(BigInt(2 * (10 ** 18)), BigInt(await pool.getStake({ from: bob })));

        await bpt.approve(pool.address, BigInt(1 * (10 ** 18)), { from: bob });
        await pool.stake(BigInt(1 * (10 ** 18)), { from: bob });

        assert.equal(BigInt(3 * (10 ** 18)), BigInt(await pool.getStake({ from: bob })));
        assert.equal(10 * (10 ** 8), (await renBTC.balanceOf(bob, { from: bob })).toNumber());

        await bpt.approve(pool.address, BigInt(2 * (10 ** 18)), { from: alice });
        await pool.stake(BigInt(2 * (10 ** 18)), { from: alice });

        assert.equal(BigInt(2 * (10 ** 18)), BigInt(await pool.getStake({ from: alice })));
        assert.equal(0, (await renBTC.balanceOf(alice, { from: alice })).toNumber());

        await tokenFactory.mintZTokens(renBTC_address, pool.address, BigInt(6 * (10 ** 8)), { from: bob });
        await pool.distributeRewards(BigInt(6 * (10 ** 8)), { from: bob });

        console.log((await pool._cummRewardPerStake({ from: bob })).toNumber());

        await pool.claimReward(alice, { from: alice });

        assert.equal(2.4 * (10 ** 8), (await renBTC.balanceOf(alice, { from: alice })).toNumber());

        await pool.claimReward(bob, { from: bob });

        assert.equal(13.6 * (10 ** 8), (await renBTC.balanceOf(bob, { from: bob })).toNumber());

        await tokenFactory.mintZTokens(renBTC_address, pool.address, BigInt(12 * (10 ** 8)), { from: bob });
        await pool.distributeRewards(BigInt(12 * (10 ** 8)), { from: bob });

        await pool.claimReward(alice, { from: alice });

        assert.equal(7.2 * (10 ** 8), (await renBTC.balanceOf(alice, { from: alice })).toNumber());

        await tokenFactory.mintZTokens(renBTC_address, pool.address, BigInt(5 * (10 ** 8)), { from: bob });
        await pool.distributeRewards(BigInt(5 * (10 ** 8)), { from: bob });

        await pool.claimReward(alice, { from: alice });

        assert.equal(920000000, (await renBTC.balanceOf(alice, { from: alice })).toNumber());

        await pool.claimReward(bob, { from: bob });

        assert.equal(23.8 * (10 ** 8), (await renBTC.balanceOf(bob, { from: bob })).toNumber());

        await pool.unstake(BigInt(2 * (10 ** 18)), { from: bob });

        await tokenFactory.mintZTokens(renBTC_address, pool.address, BigInt(10 * (10 ** 8)), { from: bob });
        await pool.distributeRewards(BigInt(10 * (10 ** 8)), { from: bob });

        await pool.claimReward(bob, { from: bob });
        await pool.claimReward(alice, { from: alice });

        console.log((await pool._cummRewardPerStake({ from: bob })).toNumber());

        assert.equal(2713333333, (await renBTC.balanceOf(bob, { from: bob })).toNumber());
        assert.equal(1586666666, (await renBTC.balanceOf(alice, { from: alice })).toNumber());
    });
});
