require("truffle-test-utils").init();

const ZionodesToken = artifacts.require("ZionodesToken");
const utils = require("./helpers/utils");

contract("ZionodesToken", (accounts) => {
    [bob, alice] = accounts;

    beforeEach(async () => {
        contract = await ZionodesToken().new();
    });

});
