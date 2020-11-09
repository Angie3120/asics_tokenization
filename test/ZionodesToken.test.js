require("truffle-test-utils").init();

const ZionodesTokenFactory = artifacts.require("ZionodesTokenFactory");
const ZionodesToken = artifacts.require("ZionodesToken");

contract("ZionodesToken", (accounts) => {
    const [bob, alice] = accounts;

    beforeEach(async () => {
        contract = await ZionodesTokenFactory.new();
    });

    it("check token data", async () => {
        await contract.deployZToken("Bitmain Antminer S15+28", "S15+28", 0, 50, { from: bob });

        zAddress = await contract.getZTokenAddress("S15+28", { from: bob });
        token = await ZionodesToken.at(zAddress);

        assert.equal("Bitmain Antminer S15+28", await token.name());
        assert.equal("S15+28", await token.symbol());
        assert.equal(0, await token.decimals());
        assert.equal(50, await token.totalSupply());
        assert.equal(50, await token.balanceOf(contract.address, { from: bob }));
    });

});
