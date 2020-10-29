require("truffle-test-utils").init();

const ZionodesTokenFactory = artifacts.require("ZionodesTokenFactory");
const utils = require("./helpers/utils");

contract("ZionodesTokenFactory", (accounts) => {
    [bob, alice] = accounts;

    beforeEach(async () => {
        contract = await ZionodesTokenFactory.new();
    });

});
