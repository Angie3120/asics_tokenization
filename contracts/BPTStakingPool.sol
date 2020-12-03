// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.0;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/GSN/Context.sol";

import "./utils/Pause.sol";

contract BPTStakingPool is Context, Pause {
    using SafeMath for uint256;

    uint256 public constant BIG_NUMBER = 10 ** 18;

    address public _bpt;
    address public _factory;
    address public _renBTCAddress;

    uint256 public _totalStaked;
    uint256 public _cummRewardPerStake;

    mapping(address => uint256) public _stakes;
    mapping(address => uint256) public _accountCummRewardPerStake;

    event Staked(address indexed account, uint256 amount);
    event Unstaked(address indexed account, uint256 amount);
    event Claimed(address indexed account, address indexed recipient, uint256 amount);
    event Distributed(uint256 amount);

    constructor(address bpt, address renBTCAddress, address factoryAdmin)
        Roles(factoryAdmin)
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
        require(amount != 0, "Stake: can not stake 0 tokens");

        IERC20 bpt = IERC20(_bpt);

        require(
            bpt.transferFrom(_msgSender(), address(this), amount),
            "Stake: token transfer failed"
        );

        if (_stakes[_msgSender()] == 0) {
            _accountCummRewardPerStake[_msgSender()] = _cummRewardPerStake;
        } else {
            claimReward(_msgSender());
        }

        _stakes[_msgSender()] = _stakes[_msgSender()].add(amount);
        _totalStaked = _totalStaked.add(amount);

        emit Staked(_msgSender(), amount);

        return true;
    }

    function unstake(uint256 amount)
        external
        returns (bool)
    {
        require(amount > 0, "Unstake: can not ustake 0 tokens");
        require(
            amount <= _stakes[_msgSender()],
            "Unstake: amount exceeds the number of staked tokens"
        );

        claimReward(_msgSender());

        require(safeTokenTransfer(_bpt, _msgSender(), amount), "Unstake: token transfer failed");

        _stakes[_msgSender()] = _stakes[_msgSender()].sub(amount);
        _totalStaked = _totalStaked.sub(amount);

        emit Unstaked(_msgSender(), amount);

        return true;
    }

    function setRenBTCAddress(address renBTCAddress)
        external
        onlySuperAdminOrAdmin
    {
        _renBTCAddress = renBTCAddress;
    }

    function distributeRewards(uint256 rewards)
        external
        onlySuperAdminOrAdmin
        returns (bool)
    {
        require(_totalStaked != 0, "Distribute: not a single token has been staked yet");

        uint256 rewardAdded = rewards.mul(BIG_NUMBER).div(_totalStaked);

        _cummRewardPerStake = _cummRewardPerStake.add(rewardAdded);

        emit Distributed(rewards);

        return true;
    }

    function claimReward(address recipient)
        public
        returns (uint256)
    {
        require(recipient != address(0), "Claim: recipient can not be zero address");

        uint256 amountOwedPerToken = _cummRewardPerStake.sub(
            _accountCummRewardPerStake[_msgSender()]
        );
        uint256 claimableAmount = _stakes[_msgSender()].mul(amountOwedPerToken).div(BIG_NUMBER);

        require(
            safeTokenTransfer(_renBTCAddress, recipient, claimableAmount),
            "Claim: token transfer failed"
        );

        _accountCummRewardPerStake[_msgSender()] = _cummRewardPerStake;

        emit Claimed(_msgSender(), recipient, claimableAmount);

        return claimableAmount;
    }

    function safeTokenTransfer(address tok, address recipient, uint256 amount)
        internal
        returns (bool)
    {
        IERC20 token = IERC20(tok);
        uint256 tokenBalance = token.balanceOf(address(this));

        if (amount > tokenBalance) {
            token.transfer(recipient, tokenBalance);
        } else {
            token.transfer(recipient, amount);
        }

        return true;
    }

    function getStake()
        external
        view
        returns (uint256)
    {
        return _stakes[_msgSender()];
    }

    function getStakePerAccount(address account)
        external
        view
        onlySuperAdminOrAdmin
        returns (uint256)
    {
        return _stakes[account];
    }
}
