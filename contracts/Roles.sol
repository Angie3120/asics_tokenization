// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.0 <0.8.0;

import "openzeppelin-solidity/contracts/access/AccessControl.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";

abstract contract Roles is Ownable, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    constructor(address account) public {
        _setupRole(DEFAULT_ADMIN_ROLE, account);

        _setRoleAdmin(ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
    }

    modifier onlySuperAdmin() {
        require(isSuperAdmin(tx.origin), "Restricted to super admins.");
        _;
    }

    modifier onlyAdmin() {
        require(isAdmin(tx.origin), "Restricted to admins.");
        _;
    }

    modifier onlySuperAdminOrAdmin() {
        require(isSuperAdmin(tx.origin) || isAdmin(tx.origin),
            "Restricted to super admins or admins.");
        _;
    }

    function addSuperAdmin(address account)
        public
        onlySuperAdmin
    {
        _assignRole(account, DEFAULT_ADMIN_ROLE);
    }

    function renounceSuperAdmin()
        public
        onlySuperAdmin
    {
        renounceRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function addAdmin(address account)
        public
        onlySuperAdmin
    {
        _assignRole(account, ADMIN_ROLE);
    }

    function removeAdmin(address account)
        public
        onlySuperAdmin
    {
        _removeRole(account, ADMIN_ROLE);
    }

    function renounceAdmin()
        public
        onlyAdmin
    {
        renounceRole(ADMIN_ROLE, _msgSender());
    }

    function isSuperAdmin(address account)
        public
        view
        returns (bool)
    {
        return hasRole(DEFAULT_ADMIN_ROLE, account);
    }

    function isAdmin(address account)
        public
        view
        returns (bool)
    {
        return hasRole(ADMIN_ROLE, account);
    }

    function _assignRole(address account, bytes32 role)
        private
    {
        grantRole(role, account);
    }

    function _removeRole(address account, bytes32 role)
        private
    {
        revokeRole(role, account);
    }
}
