// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.0 <0.8.0;
pragma experimental ABIEncoderV2;

import "./ZionodesToken.sol";
import "./Roles.sol";

contract ZionodesTokenFactory is Roles {
    struct ZToken {
        mapping(string => uint256) prices;
        ZionodesToken token;
        address addr;
        bool initialized;
    }

    struct Price {
        string symbol;
        uint256 price;
    }

    mapping(string => ZToken) private _zTokens;

    event TokenDeployed(
        address indexed addr,
        string indexed name,
        string indexed zSymbol,
        uint256 decimals,
        uint256 totalSupply
    );

    modifier zTokenExists(string memory zSymbol) {
        require(_zTokens[zSymbol].initialized, "Token is not deployed yet.");
        _;
    }

    constructor ()
        Roles(_msgSender())
        public
    {}

    function deployZToken
    (
        string memory name,
        string memory zSymbol,
        uint256 decimals,
        uint256 totalSupply
    )
        external
        onlySuperAdminOrAdmin
        returns (address)
    {
        if (address(_zTokens[zSymbol].token) == address(0)
            || _zTokens[zSymbol].token.paused()) {

            ZionodesToken tok = new ZionodesToken(
                name,
                zSymbol,
                decimals,
                totalSupply,
                address(this)
            );

            ZToken memory zToken = ZToken({
                token: tok,
                initialized: true,
                addr: address(tok)
            });
            _zTokens[zSymbol] = zToken;

            emit TokenDeployed(
                address(tok),
                name,
                zSymbol,
                decimals,
                totalSupply
            );
        }
    }

    function setupPricesForToken
    (
        string memory zSymbol,
        Price[] calldata prices
    )
        external
        onlySuperAdminOrAdmin
        zTokenExists(zSymbol)
    {
        for (uint256 i = 0; i < prices.length; ++i) {
            _zTokens[zSymbol].prices[prices[i].symbol] = prices[i].price;
        }
    }

    function getZTokenAddress(string memory zSymbol)
        external
        view
        returns (address)
    {
        return address(_zTokens[zSymbol].token);
    }

    function getZTokenPriceByToken(string memory zSymbol, string memory symbol)
        external
        view
        zTokenExists(zSymbol)
        returns (uint256)
    {
        return _zTokens[zSymbol].prices[symbol];
    }
}
