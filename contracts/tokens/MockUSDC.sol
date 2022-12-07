// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./TokenFaucet.sol";

contract MockUSDC is TokenFaucet {

    constructor(uint256 _premint, uint256 _interval, uint256 _faucetTotal, uint256 _faucetAmount)
        Ownable(msg.sender) ERC20("USD Coin.k", "USDC.k") TokenFaucet (_interval, _faucetTotal, _faucetAmount) {
        _mint(msg.sender, _premint);
    }

}