// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.4;

import "./tokens/extension/UniversalONFT721Poz.sol";

contract PozzlenautsONFTPoz is UniversalONFT721Poz {
    constructor(
        string memory _baseURI,
        address _layerZeroEndpoint,
        uint256 _startMintId,
        uint256 _endMintId,
        address _usdcAddress,
        address _pozAdderss,
        address _treasuryAddress
    )
        UniversalONFT721Poz(
            "Pozzlenauts",
            "PozNFT",
            _baseURI,
            _layerZeroEndpoint,
            _startMintId,
            _endMintId,
            _usdcAddress,
            _pozAdderss,
            _treasuryAddress
        )
    {}
}
