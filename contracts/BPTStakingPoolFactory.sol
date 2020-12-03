// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.0;

import "openzeppelin-solidity/contracts/GSN/Context.sol";

import "./BPTStakingPool.sol";

import "./utils/Pause.sol";

contract BPTStakingPoolFactory is Context, Pause {
    BPTStakingPool[] public _bptStakingPools;

    event BPTStakingPoolCreated(BPTStakingPool bptStakingPoll);

    constructor()
        Roles(_msgSender())
        public
    { }

    function createBPTStakingPoll(address bpt, address renBTCAddress)
        external
        onlySuperAdminOrAdmin
    {
        require(bpt != address(0), "Can not be zero address");
        require(bpt != address(this), "Can not be current contract address");

        BPTStakingPool bptStakingPoll = new BPTStakingPool(
            bpt,
            renBTCAddress,
            owner()
        );
        _bptStakingPools.push(bptStakingPoll);

        emit BPTStakingPoolCreated(bptStakingPoll);
    }

    function getBPTStakingPools()
        external
        view
        returns (BPTStakingPool[] memory)
    {
        return _bptStakingPools;
    }
}
