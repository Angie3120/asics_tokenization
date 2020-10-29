var ZionodesTokenFactory = artifacts.require("ZionodesTokenFactory");

module.exports = function (deployer) {
  deployer.deploy(ZionodesTokenFactory);
};
