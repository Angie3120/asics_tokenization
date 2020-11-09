require("truffle-test-utils").init();

const truffleAssert = require('truffle-assertions');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'));

const ZionodesTokenFactory = artifacts.require("ZionodesTokenFactory");
const ZionodesToken = artifacts.require("ZionodesToken");
const utils = require("./helpers/utils");

contract("ZionodesTokenFactory", (accounts) => {
    const [bob, alice] = accounts;

    beforeEach(async () => {
        contract = await ZionodesTokenFactory.new();
    });

    it("deploy token", async () => {
        let token = await contract.deployZToken("Bitmain Antminer S15+28", "S15+28", 0, 50, { from: bob });
        let address = await contract.getZTokenAddress("S15+28", { from: bob });

        truffleAssert.eventEmitted(token, 'ZTokenDeployed', (event) => {
            return event.zAddress === address;
        });

        assert.equal(0, await contract.getZTokenAddress("S15"));
    });

    it("set price for ZToken and check it", async () => {
        let price;
        let zAddress;

        await contract.deployZToken("Bitmain Antminer S15+28", "S15+28", 0, 50, { from: bob });

        zAddress = await contract.getZTokenAddress("S15+28", { from: bob });

        await contract.setupERC20PricesForZToken(zAddress, [
            {price: 120 * (10 ** 6), addr: "0xf3e0d7bf58c5d455d31ef1c2d5375904df525105"}, // USDT
            {price: 133 * (10 ** 6), addr: "0xad6d458402f60fd3bd25163575031acdce07538d"} // DAI
        ], { from: bob });
        await contract.setupWeiPriceForZToken(zAddress, BigInt(1.8 * (10 ** 18)), { from: bob });

        await utils.shouldThrow(contract.setupWeiPriceForZToken("0xdac17f958d2ee523a2206206994597c13d831ec7", 2.2 * (10 ** 18), { from: bob }));

        price = await contract.getZTokenPriceByERC20Token(zAddress, "0xad6d458402f60fd3bd25163575031acdce07538d"); // DAI
        assert.equal(price, 133 * (10 ** 6));
        price = await contract.getZTokenPriceByERC20Token(zAddress, "0xf3e0d7bf58c5d455d31ef1c2d5375904df525105"); // USDT
        assert.equal(price, 120 * (10 ** 6));
        price = await contract.getZTokenPriceByERC20Token(zAddress, "0xf3e0d7bf58c5d455d31ef1c2d5375904df525000"); // Non-existent address
        assert.equal(price, 0);
        price = await contract.getZTokenWeiPrice(zAddress);
        assert.equal(price, BigInt(1.8 * (10 ** 18)));
    });

    it("minting", async () => {
        let zAddress;
        let token;

        await contract.deployZToken("Bitmain Antminer S15+28", "S15+28", 0, 50, { from: bob });

        zAddress = await contract.getZTokenAddress("S15+28", { from: bob });
        token = await ZionodesToken.at(zAddress);

        await contract.mintZTokens(zAddress, contract.address, 200, { from: bob });

        assert.equal(250, await token.totalSupply({ from: bob }));
    });

    it("buying zTokens and withdrawing of funds", async () => {
        await contract.deployZToken("Bitmain Antminer S15+28", "S15+28", 0, 50, { from: bob });
        await contract.deployZToken("Bitmain Antminer S17+64", "S17+64", 0, 50, { from: bob });

        let s15_address = await contract.getZTokenAddress("S15+28", { from: bob });
        let s17_address = await contract.getZTokenAddress("S17+64", { from: bob });
        let s15_token = await ZionodesToken.at(s15_address);
        let s17_token = await ZionodesToken.at(s17_address);

        await utils.shouldThrow(contract.buyZTokenUsingWei(s15_address, 20, { from: alice }));
        await contract.setupWeiPriceForZToken(s15_address, BigInt(web3.utils.toWei("1.8", "ether")), { from: bob });
        await contract.setupWeiPriceForZToken(s17_address, BigInt(web3.utils.toWei("1.8", "ether")), { from: bob });
        await utils.shouldThrow(contract.buyZTokenUsingWei(s15_address, 20, { from: alice, value: web3.utils.toWei("1.8", "ether") }));
        await contract.buyZTokenUsingWei(s15_address, 20, { from: alice, value: web3.utils.toWei("36", "ether") });

        assert.equal(web3.utils.toWei("36", "ether"), await web3.eth.getBalance(contract.address));

        await contract.buyZTokenUsingWei(s17_address, 30, { from: alice, value: web3.utils.toWei("54", "ether") });

        assert.equal(web3.utils.toWei("90", "ether"), await web3.eth.getBalance(contract.address));

        assert.equal(30, await s15_token.balanceOf(contract.address, { from: bob }));
        assert.equal(20, await s15_token.balanceOf(alice, { from: alice }));

        await utils.shouldThrow(contract.buyZTokenUsingERC20Token(s15_address, s17_address, 10, { from: alice }));

        await contract.setupERC20PricesForZToken(s15_address, [
            {price: 2, addr: s17_address},
        ], { from: bob });

        await utils.shouldThrow(contract.buyZTokenUsingERC20Token(s15_address, s17_address, 31, { from: alice }));
        await utils.shouldThrow(contract.buyZTokenUsingERC20Token(s15_address, s17_address, 10, { from: alice }));

        await s17_token.approve(contract.address, 20, { from: alice });
        assert.equal(20, await s17_token.allowance(alice, contract.address));

        await contract.buyZTokenUsingERC20Token(s15_address, s17_address, 10, { from: alice });

        assert.equal(0, await s17_token.allowance(alice, contract.address));
        assert.equal(10, await s17_token.balanceOf(alice, { from: alice }));
        assert.equal(30, await s15_token.balanceOf(alice, { from: alice }));

        assert.equal(web3.utils.toWei("90", "ether"), await web3.eth.getBalance(contract.address));

        await utils.shouldThrow(contract.withdrawWei({ from: alice }));
        await contract.withdrawWei({ from: bob });

        await utils.shouldThrow(contract.withdrawERC20Token(s17_address, { from: alice }));
        await contract.withdrawERC20Token(s17_address, { from: bob });
    });

});
