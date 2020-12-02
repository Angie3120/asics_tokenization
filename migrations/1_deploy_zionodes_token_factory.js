const ZionodesTokenFactory = artifacts.require("ZionodesTokenFactory");

module.exports = function (deployer) {
  deployer.deploy(ZionodesTokenFactory);
};
