// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.0;

import "openzeppelin-solidity/contracts/utils/EnumerableSet.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

import "./utils/Pause.sol";

contract ZionodesToken is ERC20, Pause {
    using EnumerableSet for EnumerableSet.AddressSet;

    uint256 public _fee;
    uint256 public _feeDecimals;

    address public _factory;
    address public _collector;

    EnumerableSet.AddressSet _transferWhitelist;

    constructor
    (
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 totalSupply,
        address factoryAdmin
    )
        ERC20(name, symbol)
        Roles([factoryAdmin, _msgSender(), address(this)])
        public
    {
        _setupDecimals(decimals);

        _transferWhitelist.add(_msgSender());
        _transferWhitelist.add(address(0));

        _factory = _msgSender();
        _feeDecimals = 18;
        _fee = 0.01 * (10 ** 18);
        _collector = factoryAdmin;

        _mint(_factory, totalSupply);
    }

    function setFee(uint256 fee)
        public
        onlySuperAdminOrAdmin
    {
        _fee = fee;
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

    function setCollector(address newCollector)
        public
        onlySuperAdminOrAdmin
    {
        require(newCollector != address(0), "Can not be zero address");
        require(
            newCollector != _collector,
            "Can not be the same as the current collector address"
        );

        _collector = newCollector;
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

    function getFeeForAmount(uint256 amount)
        public
        view
        returns (uint256)
    {
        return _fee.mul(amount).div(100).div(10 ** _feeDecimals);
    }

    function getTotalSupplyExceptAdmins()
        external
        view
        returns (uint256)
    {
        uint256 adminBalances = 0;

        for (uint256 i = 0; i < _admins.length(); ++i) {
            adminBalances = adminBalances.add(balanceOf(_admins.at(i)));
        }

        return totalSupply().sub(adminBalances).add(balanceOf(_factory));
    }

    function isInTransferWhitelist(address account)
        external
        view
        returns (bool)
    {
        return _transferWhitelist.contains(account);
    }

    function _transfer(address sender, address recipient, uint256 amount)
        internal
        override
    {
        if (!_transferWhitelist.contains(sender)) {
            uint256 fee = getFeeForAmount(amount);

            super._transfer(sender, recipient, amount.sub(fee));
            super._transfer(sender, _collector, fee);
        }
        else {
            super._transfer(sender, recipient, amount);
        }
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        override
    {
        require(!paused(), "ERC20: token transfer while paused");
    }
}
