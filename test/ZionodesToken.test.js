require("truffle-test-utils").init();

const ZionodesTokenFactory = artifacts.require("ZionodesTokenFactory");
const ZionodesToken = artifacts.require("ZionodesToken");

contract("ZionodesToken", (accounts) => {
    const [bob, alice] = accounts;

    beforeEach(async () => {
        contract = await ZionodesTokenFactory.new();
    });

    it("check zToken data", async () => {
        await contract.deployZToken("Bitmain Antminer S15+28", "S15+28", 0, 50, { from: bob });

        let zAddress = await contract.getZTokenAddress("S15+28", { from: bob });
        let token = await ZionodesToken.at(zAddress);

        assert.equal("Bitmain Antminer S15+28", await token.name());
        assert.equal("S15+28", await token.symbol());
        assert.equal(0, await token.decimals());
        assert.equal(50, await token.totalSupply());
        assert.equal(50, await token.balanceOf(contract.address, { from: bob }));
    });

    it("transfer zToken", async () => {
        await contract.deployZToken("Bitmain Antminer S15+28", "S15+28", 5, 50 * (10 ** 5), { from: bob });

        let zAddress = await contract.getZTokenAddress("S15+28", { from: bob });
        let token = await ZionodesToken.at(zAddress);

        await token.setCollector(token.address, { from: bob });

        await contract.setupWeiPriceForZToken(zAddress, BigInt(1.8 * (10 ** 18)), { from: bob });
        await contract.buyZTokenUsingWei(zAddress, 20, { from: alice, value: web3.utils.toWei("36", "ether") });

        let balance = await token.balanceOf(bob, { from: bob });
        assert.equal(balance, 0);
        balance = await token.balanceOf(alice, { from: alice });
        assert.equal(balance, 20 * (10 ** 5));

        let fee = await token._fee({ from: bob });
        assert.equal(fee, 0.1 * (10 ** 18));

        let feeForAmount = await token.getFeeForAmount(10 * (10 ** 5), { from: bob });
        assert.equal(feeForAmount, 1000);
        feeForAmount = await token.getFeeForAmount(20 * (10 ** 5), { from: bob });
        assert.equal(feeForAmount, 2000);
        feeForAmount = await token.getFeeForAmount(22 * (10 ** 5), { from: bob });
        assert.equal(feeForAmount, 2200);
        feeForAmount = await token.getFeeForAmount(1.5 * (10 ** 5), { from: bob });
        assert.equal(feeForAmount, 150);

        assert.equal(false, await token.isInTransferWhitelist(alice, { from: alice }));

        await token.addToTransferWhitelist(alice, { from: bob });

        assert.equal(true, await token.isInTransferWhitelist(alice, { from: alice }));

        await token.transfer(bob, 10 * (10 ** 5), { from: alice });

        let totalSupplyExceptAdmins = await token.getTotalSupplyExceptAdmins({ from: bob });
        assert.equal(40 * (10 ** 5), BigInt(totalSupplyExceptAdmins));

        balance = await token.balanceOf(bob, { from: bob });
        assert.equal(balance, 10 * (10 ** 5));
        balance = await token.balanceOf(alice, { from: alice });
        assert.equal(balance, 10 * (10 ** 5));

        await token.removeFromTransferWhitelist(alice, { from: bob });
        await token.removeFromTransferWhitelist(bob, { from: bob });

        assert.equal(false, await token.isInTransferWhitelist(alice, { from: alice }));

        await token.transfer(bob, 10 * (10 ** 5), { from: alice });

        totalSupplyExceptAdmins = await token.getTotalSupplyExceptAdmins({ from: bob });
        assert.equal(30 * (10 ** 5), BigInt(totalSupplyExceptAdmins));

        balance = await token.balanceOf(bob, { from: bob });
        assert.equal(balance, 1999000);
        balance = await token.balanceOf(alice, { from: alice });
        assert.equal(balance, 0);
        balance = await token.balanceOf(token.address, { from: alice });
        assert.equal(balance, 1000);

        await token.transfer(alice, 1.5 * (10 ** 5), { from: bob });

        totalSupplyExceptAdmins = await token.getTotalSupplyExceptAdmins({ from: bob });
        assert.equal(31.49850 * (10 ** 5), BigInt(totalSupplyExceptAdmins));

        balance = await token.balanceOf(bob, { from: bob });
        assert.equal(balance, 1849000);
        balance = await token.balanceOf(alice, { from: alice });
        assert.equal(balance, 149850);

        await token.transfer(alice, 12.5 * (10 ** 5), { from: bob });

        balance = await token.balanceOf(bob, { from: bob });
        assert.equal(balance, 599000);
        balance = await token.balanceOf(alice, { from: alice });
        assert.equal(balance, 1398600);
    });

});
