require("truffle-test-utils").init();

const ZionodesTokenFactory = artifacts.require("ZionodesTokenFactory");
const utils = require("./helpers/utils");

contract("ZionodesTokenFactory", (accounts) => {
    const [superadmin, bob, alice] = accounts;

    beforeEach(async () => {
        contract = await ZionodesTokenFactory.new();
    });

    it("is superadmin", async () => {
        assert.equal(true, await contract.isSuperAdmin(superadmin, { from: superadmin }));
    });

    it("add admin", async () => {
        await utils.shouldThrow(contract.addAdmin(bob, { from: alice }));
        await contract.addAdmin(bob, { from: superadmin });

        assert.equal(true, await contract.isAdmin(bob, { from: bob }));
        assert.equal(false, await contract.isAdmin(alice, { from: alice }));
    });

    it("remove admin", async () => {
        await contract.addAdmin(alice, { from: superadmin });

        assert.equal(false, await contract.isSuperAdmin(bob, { from: bob }));
        assert.equal(true, await contract.isAdmin(alice, { from: alice }));

        await utils.shouldThrow(contract.removeAdmin(alice, { from: bob }));
        await contract.removeAdmin(alice, { from: superadmin });

        assert.equal(false, await contract.isAdmin(alice, { from: alice }));
    });

    it("renounce admin", async () => {
        assert.equal(false, await contract.isAdmin(alice, { from: alice }));

        await contract.addAdmin(alice, { from: superadmin });

        assert.equal(true, await contract.isAdmin(alice, { from: alice }));

        await contract.renounceAdmin({ from: alice });

        assert.equal(false, await contract.isAdmin(alice, { from: alice }));
    });

    it("add and renounce superadmin", async () => {
        await utils.shouldThrow(contract.addSuperAdmin(bob, { from: alice }));
        await contract.addSuperAdmin(bob, { from: superadmin });

        assert.equal(true, await contract.isSuperAdmin(bob, { from: bob }));

        await utils.shouldThrow(contract.renounceSuperAdmin({ from: alice }));
        await contract.renounceSuperAdmin({ from: bob });

        assert.equal(false, await contract.isSuperAdmin(bob, { from: bob }));
    });
});
