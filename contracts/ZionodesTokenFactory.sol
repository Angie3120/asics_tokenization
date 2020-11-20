// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./ZionodesToken.sol";

import "./utils/Pause.sol";

contract ZionodesTokenFactory is Pause {
    using SafeMath for uint256;

    struct ZToken {
        mapping(address => uint256) prices;
        ZionodesToken token;
        uint256 weiPrice;
        bool initialized;
    }

    struct Price {
        uint256 price;
        address addr;
    }

    mapping(address => ZToken) private _zTokens;
    mapping(string => address) private _zTokenAdressess;

    event ZTokenDeployed(
        address indexed zAddress,
        string indexed zName,
        string indexed zSymbol,
        uint256 decimals,
        uint256 totalSupply
    );

    event ZTokenSold(
        address indexed zAddress,
        address indexed buyer,
        uint256 amount
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
    { }

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
                address(this),
                owner()
            );

            ZToken memory zToken = ZToken({
                token: tok,
                weiPrice: 0,
                initialized: true
            });
            _zTokens[address(tok)] = zToken;
            _zTokenAdressess[zSymbol] = address(tok);

            emit ZTokenDeployed(address(tok), zName, zSymbol, decimals, totalSupply);
        }
    }

    function mintZTokens(address zAddress, address account, uint256 amount)
        external
        onlySuperAdminOrAdmin
        zTokenExists(zAddress)
        zTokenNotPaused(zAddress)
    {
        ZionodesToken token = _zTokens[zAddress].token;
        token.mint(account, amount.mul(10 ** token.decimals()));
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
            _zTokens[zAddress].prices[prices[i].addr] = prices[i].price;
        }
    }

    function buyZTokenUsingWei(address zAddress, uint256 amount)
        external
        payable
        zTokenExists(zAddress)
        zTokenNotPaused(zAddress)
        returns (bool)
    {
        require(
            _zTokens[zAddress].weiPrice > 0,
            "Price not set"
        );

        uint256 tokenDecimals = _zTokens[zAddress].token.decimals();

        require(
            msg.value == _zTokens[zAddress].weiPrice.mul(amount),
            "Not enough wei to buy tokens"
        );

        if (tokenDecimals == 0) {
            require(
                _zTokens[zAddress].token.balanceOf(address(this)) >= amount,
                "Not enough tokens"
            );
        } else {
            require(
                _zTokens[zAddress].token.balanceOf(address(this)).div(tokenDecimals) >= amount,
                "Not enough tokens"
            );
        }

        require(
            _zTokens[zAddress].token.transfer(_msgSender(), amount.mul(10 ** tokenDecimals)),
            "Token transfer failed"
        );

        emit ZTokenSold(zAddress, _msgSender(), amount);

        return true;
    }

    function buyZTokenUsingERC20Token
    (
        address zAddress,
        address addr,
        uint256 amount
    )
        external
        zTokenExists(zAddress)
        zTokenNotPaused(zAddress)
        returns (bool)
    {
        require(
            _zTokens[zAddress].prices[addr] > 0,
            "Price not set"
        );

        uint256 tokenDecimals = _zTokens[zAddress].token.decimals();

        if (tokenDecimals == 0) {
            require(
                _zTokens[zAddress].token.balanceOf(address(this)) >= amount,
                "Not enough tokens"
            );
        } else {
            require(
                _zTokens[zAddress].token.balanceOf(address(this)).div(tokenDecimals) >= amount,
                "Not enough tokens"
            );
        }

        IERC20 token = IERC20(addr);
        uint256 totalERC20Price = _zTokens[zAddress].prices[addr].mul(amount);

        require(
            token.allowance(_msgSender(), address(this)) >= totalERC20Price,
            "Token allowance too low"
        );
        require(
            token.transferFrom(_msgSender(), address(this), totalERC20Price),
            "Token transfer failed"
        );
        require(
            _zTokens[zAddress].token.transfer(_msgSender(), amount.mul(10 ** tokenDecimals)),
            "Token transfer failed"
        );

        emit ZTokenSold(zAddress, _msgSender(), amount);

        return true;
    }

    function withdrawWei()
        external
        onlySuperAdminOrAdmin
        returns (bool)
    {
        address payable admin = address(uint160(_msgSender()));

        admin.transfer(address(this).balance);

        return true;
    }

    function withdrawERC20Token(address addr)
        external
        onlySuperAdminOrAdmin
        returns (bool)
    {
        IERC20 token = IERC20(addr);

        token.transfer(_msgSender(), token.balanceOf(address(this)));

        return true;
    }

    function getZTokenAddress(string memory zSymbol)
        external
        view
        returns (address)
    {
        return _zTokenAdressess[zSymbol];
    }

    function getZTokenWeiPrice(address zAddress)
        external
        view
        returns (uint256)
    {
        return _zTokens[zAddress].weiPrice;
    }

    function getZTokenPriceByERC20Token
    (
        address zAddress,
        address addr
    )
        external
        view
        returns (uint256)
    {
        return _zTokens[zAddress].prices[addr];
    }
}
