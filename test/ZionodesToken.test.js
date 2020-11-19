require("truffle-test-utils").init();

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'));

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
        await contract.deployZToken("Bitmain Antminer S15+28", "S15+28", 0, 50, { from: bob });

        let zAddress = await contract.getZTokenAddress("S15+28", { from: bob });
        let token = await ZionodesToken.at(zAddress);

        await contract.setupWeiPriceForZToken(zAddress, BigInt(1.8 * (10 ** 18)), { from: bob });
        await contract.buyZTokenUsingWei(zAddress, 20, { from: alice, value: web3.utils.toWei("36", "ether") });

        let balance = await token.balanceOf(bob, { from: bob });
        assert.equal(balance, 0);
        balance = await token.balanceOf(alice, { from: alice });
        assert.equal(balance, 20);

        let fee = await token.getFee({ from: bob });
        assert.equal(fee, 1000);

        let feeForAmount = await token.getFeeForAmount(10, { from: bob });
        assert.equal(feeForAmount / (10 ** 18), 0.01);
        feeForAmount = await token.getFeeForAmount(20, { from: bob });
        assert.equal(feeForAmount / (10 ** 18), 0.02);
        feeForAmount = await token.getFeeForAmount(22, { from: bob });
        assert.equal(feeForAmount / (10 ** 18), 0.022);

        await token.addToTransferWhitelist(alice, { from: bob });
        await token.transfer(bob, 10, { from: alice });

        balance = await token.balanceOf(bob, { from: bob });
        assert.equal(balance, 10);
        balance = await token.balanceOf(alice, { from: alice });
        assert.equal(balance, 10);

        await token.removeFromTransferWhitelist(alice, { from: bob });
        await token.transfer(bob, 10, { from: alice });

        balance = await token.balanceOf(bob, { from: bob });
        assert.equal(balance, 20);
        balance = await token.balanceOf(alice, { from: alice });
        assert.equal(balance, 0);
    });

});
