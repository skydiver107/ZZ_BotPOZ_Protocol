// SPDX-License-Identifier: MIT
pragma solidity ^0.8.5;

import "./interfaces/IERC20.sol";
import "./interfaces/IPOZ.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IConversionRate {
    function getRateOfToken(address token) external view returns (uint256);
}

contract FastPOZ is Ownable {
    address public _treasuryWallet;
    IConversionRate _iRate;
    IPOZ _poz;

    event PozTransfered(address indexed _from, address _to, uint256 _balance);

    event SwapExcuted(
        address indexed _from,
        address _token,
        uint256 _amount1,
        address _poz,
        uint256 _amount2
    );

    constructor(
        address treasure,
        address conversion,
        address poz
    ) {
        _treasuryWallet = treasure;
        _iRate = IConversionRate(conversion);
        _poz = IPOZ(poz);
    }

    function getLiveRate(address token, uint256 amount)
        public
        view
        returns (uint256)
    {
        uint256 price = _iRate.getRateOfToken(token);
        return price * amount;
    }

    function swapExactTokenForPoz(address inputToken, uint256 amount) external {
        require(amount > 0, "Input amount must be greater than zero.");
        address user = msg.sender;
        IERC20 token = IERC20(inputToken);
        uint256 userBalance = token.balanceOf(user);
        require(amount < userBalance, "Input amount exceeds balance.");
        uint256 pozAmount = getLiveRate(inputToken, amount);
        uint256 balance = _poz.balanceOf(address(this));
        require(pozAmount > 0, "Should specify rate first");
        require(pozAmount <= balance, "Swap amount exceeds balance.");
        _poz.transfer(_treasuryWallet, pozAmount);
        token.transferFrom(user, _treasuryWallet, amount);
        emit SwapExcuted(user, inputToken, amount, address(_poz), pozAmount);
    }

    function sendPoz2Treasury(uint256 amount) public {
        address user = msg.sender;
        uint256 balance = _poz.balanceOf(user);
        require(amount > 0, "Input amount must be greater thatn zero.");
        require(amount <= balance, "Transfer amount exceeds balance.");
        _poz.transferFrom(user, _treasuryWallet, amount);
        emit PozTransfered(user, _treasuryWallet, amount);
    }

    function setTreasuryWallet(address treasure) external onlyOwner {
        _treasuryWallet = treasure;
    }
}