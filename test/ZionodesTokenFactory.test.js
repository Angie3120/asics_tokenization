require("truffle-test-utils").init();

const truffleAssert = require('truffle-assertions');
const ZionodesTokenFactory = artifacts.require("ZionodesTokenFactory");
const utils = require("./helpers/utils");

contract("ZionodesTokenFactory", (accounts) => {
    [bob, alice] = accounts;

    beforeEach(async () => {
        contract = await ZionodesTokenFactory.new();
    });

    it("deploy token", async () => {
        let token = await contract.deployZToken("Bitmain Antminer S15+28", "S15+28", 0, 50, { from: bob });
        let address = await contract.getZTokenAddress("S15+28", { from: bob });

        truffleAssert.eventEmitted(token, 'TokenDeployed', (event) => {
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
            {symbol: "USDT", price: 120 * (10 ** 6), addr: "0xdac17f958d2ee523a2206206994597c13d831ec7"},
            {symbol: "DAI", price: 133 * (10 ** 6), addr: "0x6b175474e89094c44da98b954eedeac495271d0f"}
        ], { from: bob });
        await contract.setupWeiPriceForZToken(zAddress, BigInt(1.8 * (10 ** 18)), { from: bob });

        await utils.shouldThrow(contract.setupWeiPriceForZToken("0xdac17f958d2ee523a2206206994597c13d831ec7", 2.2 * (10 ** 18), { from: bob }));

        price = await contract.getZTokenPriceByERC20Token(zAddress, "DAI");
        assert.equal(price, 133 * (10 ** 6));
        price = await contract.getZTokenPriceByERC20Token(zAddress, "USDT");
        assert.equal(price, 120 * (10 ** 6));
        price = await contract.getZTokenPriceByERC20Token(zAddress, "XTZ");
        assert.equal(price, 0);
        price = await contract.getZTokenWeiPrice(zAddress);
        assert.equal(price, BigInt(1.8 * (10 ** 18)));
    });

});
