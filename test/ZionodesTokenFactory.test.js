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
            return event.addr === address;
        });

        assert.equal(0, await contract.getZTokenAddress("S15"));
    });

    it("set price for ZToken and check it", async () => {
        let price;

        await contract.deployZToken("Bitmain Antminer S15+28", "S15+28", 0, 50, { from: bob });
        await contract.setupPricesForToken("S15+28", [{symbol: "USDT", price: 12000}, {symbol: "DAI", price: 13300}], { from: bob });

        price = await contract.getZTokenPriceByToken("S15+28", "DAI");
        assert.equal(price, 13300);
        price = await contract.getZTokenPriceByToken("S15+28", "USDT");
        assert.equal(price, 12000);
        price = await contract.getZTokenPriceByToken("S15+28", "XTZ");
        assert.equal(price, 0);
    });

});
