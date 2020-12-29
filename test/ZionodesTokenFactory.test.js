require("truffle-test-utils").init();

const truffleAssert = require("truffle-assertions");
const { expectRevert, constants, BN } = require("@openzeppelin/test-helpers");

const ZionodesTokenFactory = artifacts.require("ZionodesTokenFactory");
const ZionodesToken = artifacts.require("ZionodesToken");

const utils = require("./helpers/utils");

contract("ZionodesTokenFactory", (accounts) => {
  const [bob, alice] = accounts;

  beforeEach(async () => {
    contract = await ZionodesTokenFactory.new();
  });

  it("ensure that initial variables are correct", async () => {
    assert.equal(contract.address, await contract.paymentAddress());
  });

  it("ensure tha setting payment address works correctly", async () => {
    await expectRevert(
      contract.setPaymentAddress(constants.ZERO_ADDRESS, { from: alice }),
      "Restricted to super admins or admins."
    );
    await expectRevert(
      contract.setPaymentAddress(constants.ZERO_ADDRESS, { from: bob }),
      "Zero address"
    );
    await expectRevert(
      contract.setPaymentAddress(contract.address, { from: bob }),
      "Identical addresses"
    );
    await contract.setPaymentAddress(
      "0xf3e0d7bf58c5d455d31ef1c2d5375904df525105",
      { from: bob }
    );

    assert.equal(
      web3.utils.toChecksumAddress(
        "0xf3e0d7bf58c5d455d31ef1c2d5375904df525105"
      ),
      await contract.paymentAddress({ from: bob })
    );
  });

  it("deploy token", async () => {
    let token = await contract.deployZToken(
      "Bitmain Antminer S15+28",
      "S15+28",
      0,
      50,
      { from: bob }
    );
    let address = await contract._zTokenAdressess("S15+28", { from: bob });

    assert.equal(0, await contract._zTokenAdressess("S15"));

    await contract.addAdmin(alice, { from: bob });

    assert.equal(false, await contract.isSuperAdmin(alice, { from: alice }));
    assert.equal(true, await contract.isAdmin(alice, { from: alice }));

    token = await contract.deployZToken(
      "Bitmain Antminer S17+28",
      "S17+28",
      0,
      50,
      { from: alice }
    );
    address = await contract._zTokenAdressess("S17+28", { from: alice });
  });

  it("set price for ZToken and check it", async () => {
    let price;
    let zAddress;

    await contract.deployZToken("Bitmain Antminer S15+28", "S15+28", 0, 50, {
      from: bob,
    });

    zAddress = await contract._zTokenAdressess("S15+28", { from: bob });

    await contract.setupERC20PricesForZToken(
      zAddress,
      [
        {
          price: 120 * 10 ** 6,
          addr: "0xf3e0d7bf58c5d455d31ef1c2d5375904df525105",
        }, // USDT
        {
          price: 133 * 10 ** 6,
          addr: "0xad6d458402f60fd3bd25163575031acdce07538d",
        }, // DAI
      ],
      { from: bob }
    );
    await contract.setupWeiPriceForZToken(zAddress, BigInt(1.8 * 10 ** 18), {
      from: bob,
    });

    await utils.shouldThrow(
      contract.setupWeiPriceForZToken(
        "0xdac17f958d2ee523a2206206994597c13d831ec7",
        BigInt(2.2 * 10 ** 18),
        { from: bob }
      ),
      "Token isn't deployed"
    );

    price = await contract.getZTokenPriceByERC20Token(
      zAddress,
      "0xad6d458402f60fd3bd25163575031acdce07538d"
    ); // DAI
    assert.equal(price, 133 * 10 ** 6);
    price = await contract.getZTokenPriceByERC20Token(
      zAddress,
      "0xf3e0d7bf58c5d455d31ef1c2d5375904df525105"
    ); // USDT
    assert.equal(price, 120 * 10 ** 6);
    price = await contract.getZTokenPriceByERC20Token(
      zAddress,
      "0xf3e0d7bf58c5d455d31ef1c2d5375904df525000"
    ); // Non-existent address
    assert.equal(price, 0);
    price = await contract._zTokens(zAddress);
    assert.equal(price[1], BigInt(1.8 * 10 ** 18));
  });

  it("minting", async () => {
    let zAddress;
    let token;

    await contract.deployZToken("Bitmain Antminer S15+28", "S15+28", 0, 50, {
      from: bob,
    });

    zAddress = await contract._zTokenAdressess("S15+28", { from: bob });
    token = await ZionodesToken.at(zAddress);

    assert.equal(true, await token.isSuperAdmin(bob, { from: bob }));

    await contract.addAdmin(alice, { from: bob });

    assert.equal(true, await contract.isAdmin(alice, { from: alice }));

    await contract.mintZTokens(zAddress, contract.address, 200, { from: bob });

    assert.equal(250, await token.totalSupply({ from: bob }));

    assert.equal(true, await token.isAdmin(contract.address, { from: alice }));
    assert.equal(
      true,
      await token.isSuperAdmin(contract.address, { from: alice })
    );

    await contract.mintZTokens(zAddress, contract.address, 100, {
      from: alice,
    });

    assert.equal(350, await token.totalSupply({ from: bob }));
  });

  it("buying zTokens and withdrawing of funds", async () => {
    await contract.deployZToken("Bitmain Antminer S15+28", "S15+28", 0, 50, {
      from: bob,
    });
    await contract.deployZToken("Bitmain Antminer S17+64", "S17+64", 0, 50, {
      from: bob,
    });

    let s15_address = await contract._zTokenAdressess("S15+28", { from: bob });
    let s17_address = await contract._zTokenAdressess("S17+64", { from: bob });
    let s15_token = await ZionodesToken.at(s15_address);
    let s17_token = await ZionodesToken.at(s17_address);

    await utils.shouldThrow(
      contract.buyZTokenUsingWei(s15_address, 20, { from: alice }),
      "Price not set"
    );
    await contract.setupWeiPriceForZToken(
      s15_address,
      BigInt(web3.utils.toWei("1.8", "ether")),
      { from: bob }
    );
    await contract.setupWeiPriceForZToken(
      s17_address,
      BigInt(web3.utils.toWei("1.8", "ether")),
      { from: bob }
    );
    await utils.shouldThrow(
      contract.buyZTokenUsingWei(s15_address, 20, {
        from: alice,
        value: web3.utils.toWei("1.8", "ether"),
      }),
      "Not enough wei"
    );
    await contract.buyZTokenUsingWei(s15_address, 20, {
      from: alice,
      value: web3.utils.toWei("36", "ether"),
    });

    assert.equal(
      web3.utils.toWei("36", "ether"),
      await web3.eth.getBalance(contract.address)
    );

    await contract.buyZTokenUsingWei(s17_address, 30, {
      from: alice,
      value: web3.utils.toWei("54", "ether"),
    });

    assert.equal(
      web3.utils.toWei("90", "ether"),
      await web3.eth.getBalance(contract.address)
    );

    assert.equal(
      30,
      await s15_token.balanceOf(contract.address, { from: bob })
    );
    assert.equal(20, await s15_token.balanceOf(alice, { from: alice }));

    await utils.shouldThrow(
      contract.buyZTokenUsingERC20Token(s15_address, s17_address, 10, {
        from: alice,
      }),
      "Price not set"
    );

    await contract.setupERC20PricesForZToken(
      s15_address,
      [{ price: 2, addr: s17_address }],
      { from: bob }
    );

    await utils.shouldThrow(
      contract.buyZTokenUsingERC20Token(s15_address, s17_address, 31, {
        from: alice,
      }),
      "ERC20: transfer amount exceeds balance"
    );
    await utils.shouldThrow(
      contract.buyZTokenUsingERC20Token(s15_address, s17_address, 10, {
        from: alice,
      }),
      "ERC20: transfer amount exceeds allowance"
    );

    await s17_token.approve(contract.address, 20, { from: alice });
    assert.equal(20, await s17_token.allowance(alice, contract.address));

    await contract.buyZTokenUsingERC20Token(s15_address, s17_address, 10, {
      from: alice,
    });

    assert.equal(0, await s17_token.allowance(alice, contract.address));
    assert.equal(10, await s17_token.balanceOf(alice, { from: alice }));
    assert.equal(30, await s15_token.balanceOf(alice, { from: alice }));

    assert.equal(
      web3.utils.toWei("90", "ether"),
      await web3.eth.getBalance(contract.address)
    );

    await utils.shouldThrow(
      contract.withdrawWei(alice, { from: alice }),
      "Restricted to super admins or admins."
    );
    await utils.shouldThrow(
      contract.withdrawWei(constants.ZERO_ADDRESS, { from: bob }),
      "Zero address"
    );
    await utils.shouldThrow(
      contract.withdrawWei(contract.address, { from: bob }),
      "Identical addresses"
    );
    await contract.withdrawWei(bob, { from: bob });

    await contract.withdrawERC20Token(s17_address, bob, { from: bob });

    assert.equal(
      "40",
      new BN(await s17_token.balanceOf(bob, { from: bob })).toString()
    );
  });
});
