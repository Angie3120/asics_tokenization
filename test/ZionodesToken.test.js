require("truffle-test-utils").init();

const { constants } = require("@openzeppelin/test-helpers");
const utils = require("./helpers/utils");

const ZionodesTokenFactory = artifacts.require("ZionodesTokenFactory");
const ZionodesToken = artifacts.require("ZionodesToken");

contract("ZionodesToken", (accounts) => {
  const [bob, alice] = accounts;

  beforeEach(async () => {
    contract = await ZionodesTokenFactory.new();
  });

  it("check zToken data", async () => {
    await contract.deployZToken("Bitmain Antminer S15+28", "S15+28", 0, 50, {
      from: bob,
    });

    let zAddress = await contract._zTokenAdressess("S15+28", { from: bob });
    let token = await ZionodesToken.at(zAddress);

    assert.equal("Bitmain Antminer S15+28", await token.name());
    assert.equal("S15+28", await token.symbol());
    assert.equal(0, await token.decimals());
    assert.equal(50, await token.totalSupply());
    assert.equal(50, await token.balanceOf(contract.address, { from: bob }));
  });

  it("transfer zToken", async () => {
    await contract.deployZToken(
      "Bitmain Antminer S15+28",
      "S15+28",
      5,
      50 * 10 ** 5,
      { from: bob }
    );

    let zAddress = await contract._zTokenAdressess("S15+28", { from: bob });
    let token = await ZionodesToken.at(zAddress);

    await token.setCollector(token.address, { from: bob });

    await contract.setupWeiPriceForZToken(zAddress, BigInt(1.8 * 10 ** 18), {
      from: bob,
    });
    await contract.buyZTokenUsingWei(zAddress, 20, {
      from: alice,
      value: web3.utils.toWei("36", "ether"),
    });

    let balance = await token.balanceOf(bob, { from: bob });
    assert.equal(balance, 0);
    balance = await token.balanceOf(alice, { from: alice });
    assert.equal(balance, 20 * 10 ** 5);

    let fee = await token._fee({ from: bob });
    assert.equal(fee, 0.01 * 10 ** 18);

    let feeForAmount = await token.getFeeForAmount(10 * 10 ** 5, { from: bob });
    assert.equal(feeForAmount, 100);
    feeForAmount = await token.getFeeForAmount(20 * 10 ** 5, { from: bob });
    assert.equal(feeForAmount, 200);
    feeForAmount = await token.getFeeForAmount(22 * 10 ** 5, { from: bob });
    assert.equal(feeForAmount, 220);
    feeForAmount = await token.getFeeForAmount(1.5 * 10 ** 5, { from: bob });
    assert.equal(feeForAmount, 15);

    assert.equal(
      false,
      await token.isInTransferWhitelist(alice, { from: alice })
    );

    await token.addToTransferWhitelist(alice, { from: bob });

    assert.equal(
      true,
      await token.isInTransferWhitelist(alice, { from: alice })
    );

    await token.transfer(bob, 10 * 10 ** 5, { from: alice });

    let totalSupplyExceptAdmins = await token.getTotalSupplyExceptAdmins({
      from: bob,
    });
    assert.equal(40 * 10 ** 5, BigInt(totalSupplyExceptAdmins));

    balance = await token.balanceOf(bob, { from: bob });
    assert.equal(balance, 10 * 10 ** 5);
    balance = await token.balanceOf(alice, { from: alice });
    assert.equal(balance, 10 * 10 ** 5);

    await token.removeFromTransferWhitelist(alice, { from: bob });
    await token.removeFromTransferWhitelist(bob, { from: bob });

    assert.equal(
      false,
      await token.isInTransferWhitelist(alice, { from: alice })
    );

    await token.transfer(bob, 10 * 10 ** 5, { from: alice });

    totalSupplyExceptAdmins = await token.getTotalSupplyExceptAdmins({
      from: bob,
    });
    assert.equal(30 * 10 ** 5, BigInt(totalSupplyExceptAdmins));

    balance = await token.balanceOf(bob, { from: bob });
    assert.equal(balance, 1999900);
    balance = await token.balanceOf(alice, { from: alice });
    assert.equal(balance, 0);
    balance = await token.balanceOf(token.address, { from: alice });
    assert.equal(balance, 100);

    await token.transfer(alice, 1.5 * 10 ** 5, { from: bob });

    totalSupplyExceptAdmins = await token.getTotalSupplyExceptAdmins({
      from: bob,
    });
    assert.equal(31.49985 * 10 ** 5, BigInt(totalSupplyExceptAdmins));

    balance = await token.balanceOf(bob, { from: bob });
    assert.equal(balance, 1849900);
    balance = await token.balanceOf(alice, { from: alice });
    assert.equal(balance, 149985);

    await token.transfer(alice, 12.5 * 10 ** 5, { from: bob });

    balance = await token.balanceOf(bob, { from: bob });
    assert.equal(balance, 599900);
    balance = await token.balanceOf(alice, { from: alice });
    console.log(BigInt(balance));
    assert.equal(balance, 1399860);
  });

  it("ensure that balancer pool is correct after setup", async () => {
    await contract.deployZToken(
      "Bitmain Antminer S15+28",
      "S15+28",
      5,
      50 * 10 ** 5,
      { from: bob }
    );

    let zAddress = await contract._zTokenAdressess("S15+28", { from: bob });
    let token = await ZionodesToken.at(zAddress);

    await utils.shouldThrow(
      token.setBalancerPoolAddress(constants.ZERO_ADDRESS, { from: alice }),
      "Restricted to super admins or admins."
    );
    await utils.shouldThrow(
      token.setBalancerPoolAddress(constants.ZERO_ADDRESS, { from: bob }),
      "Can not be zero address"
    );
    await utils.shouldThrow(
      token.setBalancerPoolAddress(bob, { from: bob }),
      "Can not be the same like caller"
    );
    await token.setBalancerPoolAddress(
      "0xeff14d870008c34019a65f6065881b2a6e068f0d",
      { from: bob }
    );

    assert.equal(
      web3.utils.toChecksumAddress(
        "0xeff14d870008c34019a65f6065881b2a6e068f0d"
      ),
      await token._balancerPool({ from: bob })
    );

    await utils.shouldThrow(
      token.setBalancerPoolAddress(
        "0xeff14d870008c34019a65f6065881b2a6e068f0d",
        { from: bob }
      ),
      "Can not be the same like old one"
    );
  });
});
