const ZionodesTokenFactory = artifacts.require("ZionodesTokenFactory");
const BPTStakingPoolFactory = artifacts.require("BPTStakingPoolFactory");

module.exports = function (deployer) {
  deployer.deploy(ZionodesTokenFactory);
  deployer.deploy(BPTStakingPoolFactory);
};
