// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.14;

interface ERC20Interface {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function transferFrom(address spender, address recipient, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Transfer(address indexed spender, address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 oldAmount, uint256 amount);
}

contract SimpleToken is ERC20Interface {
    mapping (address => uint256) private balances;
    mapping (address => mapping (address => uint256)) private allowances;

    uint256 public totalSupply;
    string public name;
    string public symbol;
    uint8 public decimals;
    uint private E18 = 1000000000000000000;

    constructor(string memory _getName, string memory _getSymbol) {
        name = _getName;
        symbol = _getSymbol;
        decimals = 18;
        totalSupply = 100000000 * E18;
        balances[msg.sender] = totalSupply; 
    }

    function balanceOf(address _account) external view virtual override returns (uint256) {
        return balances[_account];
    }

    function transfer(address _recipient, uint _amount) public virtual override returns (bool) {
        transferToken(msg.sender, _recipient, _amount);
        emit Transfer(msg.sender, _recipient, _amount);
        return true;
    }

    function allowance(address _owner, address _spender) external view override returns (uint256) {
        return allowances[_owner][_spender];
    }

    function approve(address _spender, uint _amount) external virtual override returns (bool) {
        uint256 currentAllowance = allowances[msg.sender][_spender];  
        require(balances[msg.sender] >= _amount,"ERC20: The amount to be transferred exceeds the amount of tokens held by the owner.");
        approveToken(msg.sender, _spender, currentAllowance, _amount);
        return true;
    }

    function transferFrom(address _sender, address _recipient, uint256 _amount) external virtual override returns (bool) {
        transferToken(_sender, _recipient, _amount);
        emit Transfer(msg.sender, _sender, _recipient, _amount);
        uint256 currentAllowance = allowances[_sender][msg.sender];
        require(currentAllowance >= _amount, "ERC20: transfer amount exceeds allowance");
        approveToken(_sender, msg.sender, currentAllowance, currentAllowance - _amount);
        return true;
    }

    function transferToken(address _sender, address _recipient, uint256 _amount) internal virtual {
        require(_sender != address(0), "ERC20: transfer from the zero address");
        require(_recipient != address(0), "ERC20: transfer to the zero address");
        uint256 senderBalance = balances[_sender];
        require(senderBalance >= _amount, "ERC20: transfer amount exceeds balance");
        balances[_sender] = senderBalance - _amount;
        balances[_recipient] += _amount;
    }

    function approveToken(address _owner, address _spender, uint256 _currentAmount, uint256 _amount) internal virtual {
        require(_owner != address(0), "ERC20: approve from the zero address");
        require(_spender != address(0), "ERC20: approve to the zero address");
        require(_currentAmount == allowances[_owner][_spender], "ERC20: invalid currentAmount");
        allowances[_owner][_spender] = _amount;  
        emit Approval(_owner, _spender, _currentAmount, _amount);
    }
}