pragma solidity ^0.8.5;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestUsdc is ERC20 {
    constructor(uint256 supply) ERC20("TestUsdc", "tUsdc") {
        _mint(msg.sender, supply);
    }
}
