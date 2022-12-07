// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../common/Ownable.sol";

abstract contract TokenFaucet is ERC20, Ownable {

    uint256 public interval;
    uint256 public faucetTotal;
    uint256 public faucetAmount;
    uint256 public giveawayTotal;
    bool public faucetEnabled = true;

    mapping(address => uint256) userLastTime;

    constructor(uint256 _interval, uint256 _faucetTotal, uint256 _faucetAmount) {
        interval = _interval;
        faucetTotal = _faucetTotal;
        faucetAmount = _faucetAmount;
    }

    function faucet() external {
        require(faucetEnabled, "Faucet is not enabled now.");
        require(faucetTotal >= giveawayTotal + faucetAmount, "Faucet total is running out now.");
        require(block.timestamp - userLastTime[msg.sender] > interval, "Faucet interval is not expired.");

        giveawayTotal += faucetAmount;
        userLastTime[msg.sender] = block.timestamp;
        _mint(msg.sender, faucetAmount);
    }

    function setFaucetAmount(uint256 _faucetAmount) external onlyOwner {
        faucetAmount = _faucetAmount;
    }

    function setFaucetEnabled(bool _faucetEnabled) external onlyOwner {
        faucetEnabled = _faucetEnabled;
    }

    function setInterval(uint256 _inverval) external onlyOwner {
        interval = _inverval;
    }

    function setFaucetTotal(uint256 _faucetTotal) external {
        faucetTotal = _faucetTotal;
    }
}