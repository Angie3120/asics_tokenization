// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.0;

import "openzeppelin-solidity/contracts/GSN/Context.sol";

import "./BPTStakingPool.sol";
import "./Roles.sol";

contract BPTStakingPoolFactory is Context, Roles {
    BPTStakingPool[] private _bptStakingPoolAddresses;

    event BPTStakingPoolCreated(BPTStakingPool bptStakingPoll);

    constructor()
        Roles(_msgSender())
        public
    { }

    function createBPTStakingPoll(address bpt)
        external
        onlySuperAdminOrAdmin
    {
        require(bpt != address(0), "Can not be zero address");
        require(bpt != address(this), "Can not be current contract address");

        BPTStakingPool bptStakingPoll = new BPTStakingPool(bpt);
        _bptStakingPoolAddresses.push(bptStakingPoll);

        emit BPTStakingPoolCreated(bptStakingPoll);
    }

    function getBPTStakingPools()
        external
        view
        onlySuperAdminOrAdmin
        returns (BPTStakingPool[] memory)
    {
        return _bptStakingPoolAddresses;
    }
}
