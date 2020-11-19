// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.0 <0.8.0;

import "./BPTStakingPool.sol";

contract BPTStakingPoolFactory {
    BPTStakingPool[] private _bptStakingPoolAddresses;

    event BPTStakingPoolCreated(BPTStakingPool bptStakingPoll);

    function createBPTStakingPoll(address bpt)
        external
    {
        BPTStakingPool bptStakingPoll = new BPTStakingPool(bpt);
        _bptStakingPoolAddresses.push(bptStakingPoll);

        emit BPTStakingPoolCreated(bptStakingPoll);
    }

    function getBPTStakingPools()
        external
        view
        returns (BPTStakingPool[] memory)
    {
        return _bptStakingPoolAddresses;
    }
}
