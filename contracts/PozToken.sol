// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./libraries/ABDKMath/ABDKMath64x64.sol";
import "./tokens/ERC20Upgradeable.sol";

library SafeSubtraction {
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    function sub(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;
        return c;
    }
}

contract PozToken is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ERC20Upgradeable
{
    using SafeSubtraction for uint256;

    struct LockedAddress {
        address lockedAddress;
        bool status;
    }
    struct ReserveInfo {
        address reserveAddress;
        uint256 reserveRate;
    }

    uint256 private priceDecimal;

    address public vault;
    address public rift;
    uint256 public maxBuyPercent;
    ReserveInfo public backing;
    ReserveInfo public emission;
    IUniswapV2Pair public pair;
    LockedAddress[] public lockedAddress;
    mapping(address => bool) whitelist;

    modifier onlyRift() {
        require(msg.sender == rift, "PozToken: invalid rift");
        _;
    }

    function initialize(
        uint256 _backRate,
        address _backAddr,
        uint256 _emissionRate,
        address _emissionAddr,
        uint256 _maxBuyPercent,
        address _rift,
        address _vault,
        address _premintAddr
    ) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ERC20_init("PozToken", "POZ");

        backing = ReserveInfo(_backAddr, _backRate);
        emission = ReserveInfo(_emissionAddr, _emissionRate);
        maxBuyPercent = _maxBuyPercent;
        rift = _rift;
        vault = _vault;
        priceDecimal = 18;

        whitelist[_vault] = true;
        whitelist[_backAddr] = true;
        whitelist[_emissionAddr] = true;
        whitelist[msg.sender] = true;
        whitelist[_premintAddr] = true;

        _mint(_premintAddr, 1000000000e18);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    function _balanceAdjustment(bool increase, uint256 amount) internal {
        if (increase) {
            require(
                _balances[vault] >= amount,
                "PozToken: mint amount exceeds balance"
            );
            _balances[vault] = _balances[vault] - amount;
            _balances[address(pair)] = _balances[address(pair)] + amount;
            emit Transfer(vault, address(pair), amount);
        } else {
            require(
                _balances[address(pair)] >= amount,
                "PozToken: burn amount exceeds balance"
            );
            unchecked {
                _balances[address(pair)] = _balances[address(pair)] - amount;
                _balances[vault] = _balances[vault] + amount;
                emit Transfer(address(pair), vault, amount);
            }
        }
        pair.sync();
    }

    function _getAmountOut(uint256 amountIn)
        internal
        view
        returns (uint256 amountOut)
    {
        bool isToken0 = pair.token0() == address(this);
        ERC20 pToken = isToken0 ? ERC20(pair.token1()) : ERC20(pair.token0());
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * pToken.balanceOf(address(pair));
        uint256 denominator = balanceOf(address(pair)) * 1000 + amountInWithFee;
        amountOut = numerator / denominator;
    }

    function _getCirculatingSupply()
        internal
        view
        returns (uint256 circSupply)
    {
        circSupply = totalSupply();

        for (uint256 i = 0; i < lockedAddress.length; i++) {
            if (lockedAddress[i].status) {
                uint256 tokenAmount = balanceOf(lockedAddress[i].lockedAddress);
                circSupply = circSupply.sub(tokenAmount);
            }
        }
    }

    function _getPoolPrice() internal view returns (uint256 price) {
        bool isToken0 = pair.token0() == address(this);
        ERC20 pToken = isToken0 ? ERC20(pair.token1()) : ERC20(pair.token0());
        uint256 poolBalance = pToken.balanceOf(address(pair));
        price =
            (poolBalance *
                (10**(decimals() + priceDecimal - pToken.decimals()))) /
            balanceOf(address(pair));
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        bool isWhitelist = whitelist[from] || whitelist[to];
        bool isTrade = from == address(pair) || to == address(pair);
        uint256 feeAmount;

        if (!isWhitelist && isTrade) {
            feeAmount = (amount * backing.reserveRate) / 10000;
        }

        super._transfer(from, to, amount - feeAmount);
        emit Transfer(from, to, amount - feeAmount);

        if (!isWhitelist && isTrade) {
            uint256 emissionAmount = (feeAmount * emission.reserveRate) / 10000;
            super._transfer(
                from,
                backing.reserveAddress,
                feeAmount - emissionAmount
            );
            emit Transfer(
                from,
                backing.reserveAddress,
                feeAmount - emissionAmount
            );
            super._transfer(from, emission.reserveAddress, emissionAmount);
            emit Transfer(from, emission.reserveAddress, emissionAmount);
        }
    }

    function dynamicAdjustment(bool tradeType) public onlyRift {
        bool isToken0 = pair.token0() == address(this);
        ERC20 pToken = isToken0 ? ERC20(pair.token1()) : ERC20(pair.token0());
        uint256 poolBalance = pToken.balanceOf(address(pair));
        // uint256 priceBefore = _getPoolPrice();

        uint256 backingReserve = pToken.balanceOf(backing.reserveAddress) +
            _getAmountOut(balanceOf(backing.reserveAddress));
        uint256 circSupply = _getCirculatingSupply();
        int128 divu = ABDKMath64x64.divu(
            circSupply,
            poolBalance + backingReserve
        );
        uint256 pozAmountOut = ABDKMath64x64.mulu(divu, poolBalance);

        if (tradeType) {
            pozAmountOut = (pozAmountOut * (10000 + maxBuyPercent)) / 10000;
            _balanceAdjustment(true, pozAmountOut - balanceOf(address(pair)));
        } else {
            _balanceAdjustment(false, balanceOf(address(pair)) - pozAmountOut);
        }
        // uint256 priceAfter = _getPoolPrice();
        // if (pausable) {
        //     require(
        //         priceAfter >= priceBefore,
        //         "PozToken: invalid price movement"
        //     );
        // }
    }

    function setBackingReserve(address _reserveAddress, uint256 _reserveRate)
        external
        onlyOwner
    {
        require(
            _reserveAddress != address(0),
            "PozToken: backing reserve address cannot be zero"
        );
        require(
            _reserveRate <= 10000,
            "PozToken: backing reserve rate cannot be greater than 100%"
        );
        backing = ReserveInfo(_reserveAddress, _reserveRate);
    }

    function setEmissionReserve(address _emissionAddress, uint256 _emissionRate)
        external
        onlyOwner
    {
        require(
            _emissionAddress != address(0),
            "PozToken: emission reserve address cannot be zero"
        );
        require(
            _emissionRate <= 10000,
            "PozToken: emission reserve rate cannot be greater than 100%"
        );
        emission = ReserveInfo(_emissionAddress, _emissionRate);
    }

    function setLockedAddress(address _lockedAddress, bool _status)
        external
        onlyOwner
    {
        require(
            _lockedAddress != address(0),
            "PozToken: locked address cannot be zero"
        );
        bool flag = false;
        for (uint256 i = 0; i < lockedAddress.length; i++) {
            // if address already exist, set the status of locked address
            if (lockedAddress[i].lockedAddress == _lockedAddress) {
                lockedAddress[i].status = _status;
                flag = true;
            }
        }
        // if address doesn't exist, add the locked address
        if (!flag) {
            lockedAddress.push(
                LockedAddress({lockedAddress: _lockedAddress, status: _status})
            );
        }
    }

    function setRift(address _rift) external onlyOwner {
        rift = _rift;
    }

    function setUniswapPair(address _pair) external onlyOwner {
        pair = IUniswapV2Pair(_pair);
    }

    function setWhitelist(address account, bool flag) external onlyOwner {
        whitelist[account] = flag;
    }
}
