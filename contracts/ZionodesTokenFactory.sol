// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.0 <0.8.0;

import "./ZionodesToken.sol";
import "./Roles.sol";

contract ZionodesTokenFactory is Roles {
    mapping(string => ZionodesToken) private _tokens;

    event TokenDeployed(
        address indexed addr,
        string indexed name,
        string indexed symbol,
        uint256 decimals,
        uint256 totalSupply
    );

    constructor ()
        Roles(_msgSender())
        public
    {}

    function deployToken
    (
        string memory name,
        string memory symbol,
        uint256 decimals,
        uint256 totalSupply
    )
        external
        onlySuperAdmin
        returns (address)
    {
        if (address(_tokens[symbol]) == address(0) || _tokens[symbol].paused()) {
            _tokens[symbol] = new ZionodesToken(
                name,
                symbol,
                decimals,
                totalSupply,
                address(this)
            );

            emit TokenDeployed(
                address(_tokens[symbol]),
                name,
                symbol,
                decimals,
                totalSupply
            );
        }
    }

    function getTokenAddress(string memory symbol)
        external
        view
        returns (address)
    {
        return address(_tokens[symbol]);
    }
}
