require("truffle-test-utils").init();

const ZionodesToken = artifacts.require("ZionodesToken");
const utils = require("./helpers/utils");

contract("ZionodesToken", (accounts) => {
    [bob, alice] = accounts;

    beforeEach(async () => {
        contract = await ZionodesToken.new("Bitmain Antminer S15+28", "S15+28", 0, 50);
    });

    xit("check name", async () => {
        assert.equal("Bitmain Antminer S15+28", await contract.name());
    });

    xit("check symbol", async () => {
        assert.equal("S15+28", await contract.symbol());
    });

    xit("check decimals", async () => {
        assert.equal(0, await contract.decimals());
    });

    xit("check total supply", async () => {
        assert.equal(50, await contract.totalSupply());
    });

    xit("check balance", async () => {
        assert.equal(50, await contract.balanceOf(contract.address, { from: bob }));
    });
});
