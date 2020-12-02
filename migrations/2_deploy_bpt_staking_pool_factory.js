const BPTStakingPoolFactory = artifacts.require("BPTStakingPoolFactory");

module.exports = function (deployer) {
  deployer.deploy(BPTStakingPoolFactory);
};
