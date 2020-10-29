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
        require(isSuperAdmin(_msgSender()), "Restricted to super admins.");
        _;
    }

    modifier onlyAdmin() {
        require(isAdmin(_msgSender()), "Restricted to admins.");
        _;
    }

    function addSuperAdmin(address account)
        external
        onlySuperAdmin
    {
        _assignRole(account, DEFAULT_ADMIN_ROLE);
    }

    function renounceSuperAdmin()
        external
        onlySuperAdmin
    {
        renounceRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function addAdmin(address account)
        external
        onlySuperAdmin
    {
        _assignRole(account, ADMIN_ROLE);
    }

    function removeAdmin(address account)
        external
        onlySuperAdmin
    {
        _removeRole(account, ADMIN_ROLE);
    }

    function renounceAdmin()
        external
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
