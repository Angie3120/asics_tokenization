// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.0;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/GSN/Context.sol";

import "./Roles.sol";

contract BPTStakingPool is Context, Roles {
    using SafeMath for uint256;

    address private _bpt;
    address private _factory;

    uint256 private _totalStake;

    mapping(address => uint256) private _stakes;
    mapping(address => uint256) private _rewards;

    event Staked(address indexed account, uint256 amount);
    event Unstaked(address indexed account, uint256 amount);

    constructor(address bpt)
        Roles(_factory)
        public
    {
        _bpt = bpt;
        _factory = _msgSender();

        addAdmin(tx.origin);
    }

    function stake(uint256 amount)
        external
    {
        require(amount > 0, "Can not stake 0 tokens");

        IERC20 bpt = IERC20(_bpt);

        require(bpt.allowance(
            _msgSender(), address(this)) >= amount,
            "Not enough allowance for staking"
        );

        bpt.transferFrom(_msgSender(), address(this), amount);
        _stakes[_msgSender()] = _stakes[_msgSender()].add(amount);
        _totalStake = _totalStake.add(amount);

        emit Staked(_msgSender(), amount);
    }

    function unstake(uint256 amount)
        external
    {
        require(
            amount <= _stakes[_msgSender()],
            "Amount exceeds the number of staked tokens"
        );

        IERC20 bpt = IERC20(_bpt);

        bpt.transfer(_msgSender(), amount);
        _stakes[_msgSender()] = _stakes[_msgSender()].sub(amount);
        _totalStake = _totalStake.sub(amount);

        emit Unstaked(_msgSender(), amount);
    }

    function getTotalStake()
        external
        view
        returns (uint256)
    {
        return _totalStake;
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

    function _getStake(address account)
        private
        view
        returns (uint256)
    {
        return _stakes[account];
    }
}
