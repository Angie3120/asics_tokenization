// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.0;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/GSN/Context.sol";

import "./utils/Pause.sol";

contract BPTStakingPool is Context, Pause {
    using SafeMath for uint256;

    uint256 constant BIG_NUMBER = 10 ** 18;
    uint256 constant DECIMAL = 10 ** 8;

    address private _bpt;
    address private _factory;
    address private _renBTCAddress;

    uint256 private _totalStaked;
    uint256 private _cummRewardPerStake;

    mapping(address => uint256) private _stakes;
    mapping(address => uint256) private _accountCummRewardPerStake;

    event Staked(address indexed account, uint256 amount);
    event Unstaked(address indexed account, uint256 amount);
    event Claimed(address indexed account, uint256 amount);
    event Distributed(uint256 amount);

    constructor(address bpt, address renBTCAddress)
        Roles(_factory)
        public
    {
        _bpt = bpt;
        _renBTCAddress = renBTCAddress;
        _factory = _msgSender();
    }

    function stake(uint256 amount)
        external
        returns (bool)
    {
        require(amount != 0, "Can not stake 0 tokens");

        IERC20 bpt = IERC20(_bpt);

        require(
            bpt.allowance(_msgSender(), address(this)) >= amount,
            "Not enough allowance for staking"
        );
        require(
            bpt.transferFrom(_msgSender(), address(this), amount),
            "Token transfer failed"
        );

        if (_stakes[_msgSender()] == 0) {
            _stakes[_msgSender()] = amount;
            _accountCummRewardPerStake[_msgSender()] = _cummRewardPerStake;
        } else {
            claimReward(_msgSender());
            _stakes[_msgSender()] = _stakes[_msgSender()].add(amount);
        }

        _totalStaked = _totalStaked.add(amount);

        emit Staked(_msgSender(), amount);

        return true;
    }

    // function unstake(uint256 amount)
    //     external
    //     returns (bool)
    // {
    //     require(
    //         amount <= _stakes[_msgSender()],
    //         "Amount exceeds the number of staked tokens"
    //     );

    //     IERC20 bpt = IERC20(_bpt);

    //     require(bpt.transfer(_msgSender(), amount), "Token transfer failed");

    //     _stakes[_msgSender()] = _stakes[_msgSender()].sub(amount);
    //     _totalStaked = _totalStaked.sub(amount);

    //     emit Unstaked(_msgSender(), amount);

    //     return true;
    // }

    function setRenBTCAddress(address renBTCAddress)
        external
        onlySuperAdminOrAdmin
    {
        _renBTCAddress = renBTCAddress;
    }

    function distributeRewards(uint256 rewards)
        external
        returns (bool)
    {
        require(_totalStaked != 0, "Not a single token has been staked yet");

        uint256 rewardAdded = rewards.mul(BIG_NUMBER).div(_totalStaked);

        _cummRewardPerStake = _cummRewardPerStake.add(rewardAdded);

        emit Distributed(rewards);

        return true;
    }

    function claimReward(address account)
        public
        returns (uint256)
    {
        uint256 amountOwedPerToken = _cummRewardPerStake.sub(
            _accountCummRewardPerStake[_msgSender()]
        );
        uint256 claimableAmount = _stakes[account].mul(amountOwedPerToken).mul(DECIMAL).div(
            BIG_NUMBER
        );

        _accountCummRewardPerStake[_msgSender()] = _cummRewardPerStake;

        emit Claimed(_msgSender(), claimableAmount);

        return claimableAmount;
    }

    function getTotalStaked()
        external
        view
        returns (uint256)
    {
        return _totalStaked;
    }

    function getStake()
        external
        view
        returns (uint256)
    {
        return _getStake(_msgSender());
    }

    function getStakePerAccount(address account)
        external
        view
        onlySuperAdminOrAdmin
        returns (uint256)
    {
        return _getStake(account);
    }

    function getBalancerPoolAddress()
        external
        view
        returns (address)
    {
        return _bpt;
    }

    function _getStake(address account)
        private
        view
        returns (uint256)
    {
        return _stakes[account];
    }
}
