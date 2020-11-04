// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.0 <0.8.0;
pragma experimental ABIEncoderV2;

import "./ZionodesToken.sol";
import "./Roles.sol";

contract ZionodesTokenFactory is Roles {
    struct ZToken {
        mapping(string => Price) prices;
        ZionodesToken token;
        uint256 weiPrice;
        bool initialized;
    }

    struct Price {
        string symbol;
        uint256 price;
        address addr;
    }

    mapping(address => ZToken) private _zTokens;
    mapping(string => address) private _zTokenAdressess;

    event TokenDeployed(
        address indexed zAddress,
        string indexed zName,
        string indexed zSymbol,
        uint256 decimals,
        uint256 totalSupply
    );

    modifier zTokenExists(address zAddress) {
        require(_zTokens[zAddress].initialized, "Token is not deployed yet.");
        _;
    }

    modifier zTokenNotPaused(address zAddress) {
        require(!_zTokens[zAddress].token.paused(), "Token is paused.");
        _;
    }

    constructor ()
        Roles(_msgSender())
        public
    {}

    function deployZToken
    (
        string memory zName,
        string memory zSymbol,
        uint256 decimals,
        uint256 totalSupply
    )
        external
        onlySuperAdminOrAdmin
        returns (address)
    {
        if (_zTokenAdressess[zSymbol] == address(0)
            || _zTokens[_zTokenAdressess[zSymbol]].token.paused()) {

            ZionodesToken tok = new ZionodesToken(
                zName,
                zSymbol,
                decimals,
                totalSupply,
                address(this)
            );

            ZToken memory zToken = ZToken({
                token: tok,
                weiPrice: 0,
                initialized: true
            });
            _zTokens[address(tok)] = zToken;
            _zTokenAdressess[zSymbol] = address(tok);

            emit TokenDeployed(
                address(tok),
                zName,
                zSymbol,
                decimals,
                totalSupply
            );
        }
    }

    function setupWeiPriceForZToken(address zAddress, uint256 weiPrice)
        external
        onlySuperAdminOrAdmin
        zTokenExists(zAddress)
        zTokenNotPaused(zAddress)
    {
        _zTokens[zAddress].weiPrice = weiPrice;
    }

    function setupERC20PricesForZToken
    (
        address zAddress,
        Price[] memory prices
    )
        external
        onlySuperAdminOrAdmin
        zTokenExists(zAddress)
        zTokenNotPaused(zAddress)
    {
        for (uint256 i = 0; i < prices.length; ++i) {
            _zTokens[zAddress].prices[prices[i].symbol] = prices[i];
        }
    }

    function getZTokenAddress(string memory zSymbol)
        external
        view
        returns (address)
    {
        return _zTokenAdressess[zSymbol];
    }

    function getZTokenPriceByERC20Token
    (
        address zAddress,
        string memory symbol
    )
        external
        view
        returns (uint256)
    {
        return _zTokens[zAddress].prices[symbol].price;
    }

    function getZTokenWeiPrice(address zAddress)
        external
        view
        returns (uint256)
    {
        return _zTokens[zAddress].weiPrice;
    }
}
