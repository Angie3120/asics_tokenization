// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.0;

import "openzeppelin-solidity/contracts/utils/EnumerableSet.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./utils/Pause.sol";

contract ZionodesToken is ERC20, Pause {
    using EnumerableSet for EnumerableSet.AddressSet;

    uint256 public _fee;
    uint256 public _feeDecimals;

    address public _factory;

    EnumerableSet.AddressSet _transferWhitelist;

    constructor
    (
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 totalSupply,
        address factory,
        address factoryAdmin
    )
        ERC20(name, symbol)
        Roles(factoryAdmin)
        public
    {
        _setupDecimals(decimals);

        _factory = factory;
        _feeDecimals = 18;
        _fee = 1000;

        _mint(_factory, totalSupply);
        _transferWhitelist.add(factory);
        _transferWhitelist.add(address(this));
    }

    function setFee(uint256 fee)
        external
        onlySuperAdminOrAdmin
    {
        _fee = fee;
    }

    function getFeeForAmount(uint256 amount)
        external
        view
        returns (uint256)
    {
        return amount.mul(10 ** _feeDecimals).div(_fee);
    }

    function addToTransferWhitelist(address account)
        public
        onlySuperAdminOrAdmin
    {
        _transferWhitelist.add(account);
    }

    function removeFromTransferWhitelist(address account)
        public
        onlySuperAdminOrAdmin
    {
        _transferWhitelist.remove(account);
    }

    function mint(address account, uint256 amount)
        public
        onlySuperAdminOrAdmin
    {
        _mint(account, amount);
    }

    function burn(uint256 amount)
        public
    {
        _burn(_msgSender(), amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        override
    {
        require(!paused(), "ERC20: token transfer while paused");
    }
}
