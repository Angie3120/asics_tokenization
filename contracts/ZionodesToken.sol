// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.0 <0.8.0;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/utils/Pausable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./Roles.sol";

contract ZionodesToken is IERC20, Roles, Pausable {
    using SafeMath for uint256;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;
    uint256 private _fee;
    uint256 private _decimals;

    string private _name;
    string private _symbol;

    address private _factory;

    constructor
    (
        string memory name,
        string memory symbol,
        uint256 decimals,
        uint256 totalSupply,
        address factory
    )
        Roles(_msgSender())
        public
    {
        _name = name;
        _symbol = symbol;
        _decimals = decimals;
        _factory = factory;
        // _fee = 0.1 * (uint256(10) ** _decimals); // 0.1 * 10^_decimals
        _fee = 0;

        _mint(_factory, totalSupply * (uint256(10) ** _decimals));
    }

    function setFee(uint256 fee)
        external
        onlySuperAdminOrAdmin
    {
        _fee = fee;
    }

    // function getFee(uint256 amount) external view returns (uint256) {
    //     return amount.mul(_fee.div(100));
    // }


    function name()
        public
        view
        returns (string memory)
    {
        return _name;
    }

    function symbol()
        public
        view
        returns (string memory)
    {
        return _symbol;
    }

    function decimals()
        public
        view
        returns (uint256)
    {
        return _decimals;
    }

    function totalSupply()
        public
        view
        override
        returns (uint256)
    {
        return _totalSupply;
    }

    function balanceOf(address account)
        public
        view
        override
        returns (uint256)
    {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount)
        public
        virtual
        override
        returns (bool)
    {
        _transfer(_msgSender(), recipient, amount);

        return true;
    }

    function allowance(address owner, address spender)
        public
        view
        virtual
        override
        returns (uint256)
    {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount)
        public
        virtual
        override
        returns (bool)
    {
        _approve(_msgSender(), spender, amount);

        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount)
        public
        virtual
        override
        returns (bool)
    {
        _transfer(sender, recipient, amount);
        _approve(sender, _msgSender(), _allowances[sender][_msgSender()].sub(
            amount,
            "ERC20: transfer amount exceeds allowance"
        ));

        return true;
    }

    function increaseAllowance(address spender, uint256 addedValue)
        public
        virtual
        returns (bool)
    {
        _approve(_msgSender(), spender, _allowances[_msgSender()][spender].add(
            addedValue
        ));

        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue)
        public
        virtual
        returns (bool)
    {
        _approve(_msgSender(), spender, _allowances[_msgSender()][spender].sub(
            subtractedValue,
            "ERC20: decreased allowance below zero"
        ));

        return true;
    }

    function pause()
        public
        virtual
        onlySuperAdminOrAdmin
    {
        if (!paused()) {
            _pause();
        }
    }

    function unpause()
        public
        virtual
        onlySuperAdminOrAdmin
    {
        if (paused()) {
            _unpause();
        }
    }

    function mint(uint256 amount)
        public
        virtual
        onlySuperAdminOrAdmin
    {
        _mint(_factory, amount);
    }

    function _transfer(address sender, address recipient, uint256 amount)
        internal
        virtual
    {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(
            recipient != address(0),
            "ERC20: transfer to the zero address"
        );
        require(sender != recipient, "ERC20: the sender is the recipient");

        _beforeTokenTransfer(sender, recipient, amount);

        _balances[sender] = _balances[sender].sub(
            amount,
            "ERC20: transfer amount exceeds balance"
        );

        // uint256 fee = amount.mul(_fee.div(10 ** _decimals).div(100));

        _balances[recipient] = _balances[recipient].add(amount);
        // _balances[recipient] = _balances[recipient].add(amount - fee);
        // _balances[address(this)] = _balances[address(this)].add(fee);

        emit Transfer(sender, recipient, amount);
    }

    function _mint(address account, uint256 amount)
        internal
        virtual
    {
        require(account != address(0), "ERC20: mint to the zero address");

        _beforeTokenTransfer(address(0), account, amount);

        _totalSupply = _totalSupply.add(amount);
        _balances[account] = _balances[account].add(amount);

        emit Transfer(address(0), account, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        virtual
    {
        require(account != address(0), "ERC20: burn from the zero address");

        _beforeTokenTransfer(account, address(0), amount);

        _balances[account] = _balances[account].sub(
            amount,
            "ERC20: burn amount exceeds balance"
        );
        _totalSupply = _totalSupply.sub(amount);

        emit Transfer(account, address(0), amount);
    }

    function _approve(address owner, address spender, uint256 amount)
        internal
        virtual
    {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;

        emit Approval(owner, spender, amount);
    }

    function _setupDecimals(uint256 decimals_)
        internal
    {
        _decimals = decimals_;
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        virtual
    {
        require(!paused(), "ERC20: token transfer while paused");
    }
}
