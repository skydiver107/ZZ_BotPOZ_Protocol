// SPDX-License-Identifier: MIT
pragma solidity ^0.8.5;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ConversionRate is Ownable {
    mapping(address => uint) rates;

    constructor() { }

    function setRatePerToken(address token, uint rate) external onlyOwner {
        rates[token] = rate;
    }

    function getRateOfToken(address token) external view returns (uint) {
        return rates[token];
    }
}