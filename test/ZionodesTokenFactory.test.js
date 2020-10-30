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
        let token = await contract.deployToken("Bitmain Antminer S15+28", "S15+28", 0, 50, { from: bob });
        let address = await contract.getTokenAddress("S15+28", { from: bob });

        truffleAssert.eventEmitted(token, 'TokenDeployed', (event) => {
            return event.addr === address;
        });

        assert.equal(0, await contract.getTokenAddress("S15"));
    });

});
