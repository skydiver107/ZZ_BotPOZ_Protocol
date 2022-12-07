const { ethers } = require('hardhat');
const { expect } = require('chai');
const { BigNumber } = require('ethers');
const { constants } = require('@openzeppelin/test-helpers');

describe('PozToken', () => {
  let owner;
  let alice;
  let bob;
  let carol;
  let treasury;
  let transferFeeRate = BigNumber.from('100'); // 1%
  let pozToken;
  const DENOMINATOR = BigNumber.from('10000');
  const NAME = 'PozToken';
  const SYMBOL = 'POZ';
  const DECIMALS = 18;
  const decimalsUnit = BigNumber.from('10').pow(
    BigNumber.from(DECIMALS.toString()),
  );
  const TOTAL_SUPPLY = BigNumber.from('16000000').mul(decimalsUnit);

  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    [owner, alice, bob, carol, treasury] = accounts;
    const PozToken = await ethers.getContractFactory('PozToken');
    pozToken = await PozToken.deploy(treasury.address, transferFeeRate);
  });

  describe('constructor', () => {
    it('Revert if treasury is zero', async () => {
      const PozToken = await ethers.getContractFactory('PozToken');
      await expect(
        PozToken.deploy(constants.ZERO_ADDRESS, transferFeeRate),
      ).to.be.revertedWith('POZTOKEN: treasury cannot be zero');
    });

    it('Revert if transfer fee rate is greater than 100%', async () => {
      const PozToken = await ethers.getContractFactory('PozToken');
      await expect(
        PozToken.deploy(
          treasury.address,
          DENOMINATOR.add(BigNumber.from('1')),
        ),
      ).to.be.revertedWith(
        'POZTOKEN: transfer fee rate can not be greater than 100%',
      );
    });
  });

  describe('Check token metadata', () => {
    it('Check name', async () => {
      expect(await pozToken.name()).to.equal(NAME);
    });

    it('Check symbol', async () => {
      expect(await pozToken.symbol()).to.equal(SYMBOL);
    });

    it('Check decimals', async () => {
      expect(await pozToken.decimals()).to.equal(DECIMALS);
    });

    it('Check total supply', async () => {
      expect(await pozToken.totalSupply()).to.equal(TOTAL_SUPPLY);
    });

    it('Check treasury balance', async () => {
      expect(await pozToken.balanceOf(treasury.address)).to.equal(
        TOTAL_SUPPLY,
      );
    });

    it('Check treasury', async () => {
      expect(await pozToken.treasury()).to.equal(treasury.address);
    });

    it('Check transfer fee rate', async () => {
      expect(await pozToken.transferFeeRate()).to.equal(transferFeeRate);
    });

    it('Check owner', async () => {
      expect(await pozToken.owner()).to.equal(owner.address);
    });
  });

  describe('setTransferFeeRate', () => {
    const newTransferRate = BigNumber.from('10');

    it('Revert if msg.sender is not owner', async () => {
      await expect(
        pozToken.connect(alice).setTransferFeeRate(newTransferRate),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Revert if transfer fee rate is greater than 100%', async () => {
      await expect(
        pozToken
          .connect(owner)
          .setTransferFeeRate(DENOMINATOR.add(BigNumber.from('1'))),
      ).to.be.revertedWith(
        'POZTOKEN: transfer fee rate can not be greater than 100%',
      );
    });

    it('Set transfer fee rate and emit TransferFeeRateUpdated event', async () => {
      const tx = await pozToken
        .connect(owner)
        .setTransferFeeRate(newTransferRate);
      expect(await pozToken.transferFeeRate()).to.equal(newTransferRate);
      expect(tx)
        .to.emit(pozToken, 'TransferFeeRateUpdated')
        .withArgs(newTransferRate);
    });
  });

  describe('setTreasury', () => {
    it('Revert if msg.sender is not owner', async () => {
      await expect(
        pozToken.connect(alice).setTreasury(bob.address),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Revert if treasury is zero', async () => {
      await expect(
        pozToken.connect(owner).setTreasury(constants.ZERO_ADDRESS),
      ).to.be.revertedWith('POZTOKEN: treasury cannot be zero');
    });

    it('Set treasury and emit TreasuryUpdated event', async () => {
      const tx = await pozToken.connect(owner).setTreasury(bob.address);
      expect(await pozToken.treasury()).to.equal(bob.address);
      expect(tx).to.emit(pozToken, 'TreasuryUpdated').withArgs(bob.address);
    });
  });

  describe('setBackingReserveAddress', () => {
    it('Revert if msg.sender is not owner', async () => {
      await expect(
        pozToken.connect(alice).setBackingReserveAddress(bob.address),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Revert if backing reserve is zero', async () => {
      await expect(
        pozToken.connect(owner).setBackingReserveAddress(constants.ZERO_ADDRESS),
      ).to.be.revertedWith('POZTOKEN: backing reserve address cannot be zero');
    });

    it('Set backing reserve and emit PoolAddressUpdated event', async () => {
      const tx = await pozToken.connect(owner).setBackingReserveAddress(bob.address);
      expect(await pozToken.backingReserveAddress()).to.equal(bob.address);
      expect(tx).to.emit(pozToken, 'BackingReserveAddressUpdated').withArgs(bob.address);
    });
  });

  describe('setStableTokenAddress', () => {
    it('Revert if msg.sender is not owner', async () => {
      await expect(
        pozToken.connect(alice).setStableTokenAddress(bob.address),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Revert if stable token is zero', async () => {
      await expect(
        pozToken.connect(owner).setStableTokenAddress(constants.ZERO_ADDRESS),
      ).to.be.revertedWith('POZTOKEN: stable token address cannot be zero');
    });

    it('Set stable token and emit PoolAddressUpdated event', async () => {
      const tx = await pozToken.connect(owner).setStableTokenAddress(bob.address);
      expect(await pozToken.stableTokenAddress()).to.equal(bob.address);
      expect(tx).to.emit(pozToken, 'StableTokenAddressUpdated').withArgs(bob.address);
    });
  });

  describe('setLockedAddress', () => {
    const status = true;
    it('Revert if msg.sender is not owner', async () => {
      await expect(
        pozToken.connect(alice).setLockedAddress(bob.address, status),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Revert if locked address is zero', async () => {
      await expect(
        pozToken.connect(owner).setLockedAddress(constants.ZERO_ADDRESS, status),
      ).to.be.revertedWith('POZTOKEN: locked address cannot be zero');
    });

    it('Set locked address and emit PoolAddressUpdated event', async () => {
      const tx = await pozToken.connect(owner).setLockedAddress(bob.address, status);
      expect(tx).to.emit(pozToken, 'LockedAddressUpdated').withArgs(bob.address, status);
    });
  });

  describe('setEmissionAddress', () => {
    it('Revert if msg.sender is not owner', async () => {
      await expect(
        pozToken.connect(alice).setEmissionAddress(bob.address),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Revert if emission address is zero', async () => {
      await expect(
        pozToken.connect(owner).setEmissionAddress(constants.ZERO_ADDRESS),
      ).to.be.revertedWith('POZTOKEN: emission address cannot be zero');
    });

    it('Set emission address and emit EmissionAddressUpdated event', async () => {
      const tx = await pozToken.connect(owner).setEmissionAddress(bob.address);
      expect(await pozToken.emissionAddress()).to.equal(bob.address);
      expect(tx).to.emit(pozToken, 'EmissionAddressUpdated').withArgs(bob.address);
    });
  });

  describe('setBackingReserveRate', () => {
    const newBackingReserveRate = BigNumber.from('10');

    it('Revert if msg.sender is not owner', async () => {
      await expect(
        pozToken.connect(alice).setBackingReserveRate(newBackingReserveRate),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Revert if backing reserve rate is greater than 100%', async () => {
      await expect(
        pozToken
          .connect(owner)
          .setBackingReserveRate(DENOMINATOR.add(BigNumber.from('1'))),
      ).to.be.revertedWith(
        'POZTOKEN: backing reserve rate can not be greater than 100%',
      );
    });

    it('Set backing reserve rate and emit BackingReserveRateUpdated event', async () => {
      const tx = await pozToken
        .connect(owner)
        .setBackingReserveRate(newBackingReserveRate);
      expect(await pozToken.backingReserveRate()).to.equal(newBackingReserveRate);
      expect(tx)
        .to.emit(pozToken, 'BackingReserveRateUpdated')
        .withArgs(newBackingReserveRate);
    });
  });

  describe('setEmissionRate', () => {
    const newEmissionRate = BigNumber.from('10');

    it('Revert if msg.sender is not owner', async () => {
      await expect(
        pozToken.connect(alice).setEmissionRate(newEmissionRate),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Revert if emission rate is greater than 100%', async () => {
      await expect(
        pozToken
          .connect(owner)
          .setEmissionRate(DENOMINATOR.add(BigNumber.from('1'))),
      ).to.be.revertedWith(
        'POZTOKEN: emission rate can not be greater than 100%',
      );
    });

    it('Set emission rate and emit EmissionRateUpdated event', async () => {
      const tx = await pozToken
        .connect(owner)
        .setEmissionRate(newEmissionRate);
      expect(await pozToken.emissionRate()).to.equal(newEmissionRate);
      expect(tx)
        .to.emit(pozToken, 'EmissionRateUpdated')
        .withArgs(newEmissionRate);
    });
  });

  describe('transfer', () => {
    it('Revert if recipient is zero', async () => {
      await expect(
        pozToken
          .connect(treasury)
          .transfer(constants.ZERO_ADDRESS, '10000000000'),
      ).to.be.revertedWith('ERC20: transfer to the zero address');
    });

    it('Revert if insufficient balance in msg.sender', async () => {
      await expect(
        pozToken.connect(alice).transfer(carol.address, '10000000000'),
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance');

      await pozToken.connect(treasury).transfer(alice.address, '10000000000');

      await expect(
        pozToken.connect(alice).transfer(carol.address, '100000000000'),
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance');
    });

    it('Transfer POZ token without fee if fee rate is zero', async () => {
      await pozToken
        .connect(treasury)
        .transfer(alice.address, BigNumber.from('10000').mul(decimalsUnit));

      const aliceBalanceBefore = BigNumber.from(
        await pozToken.balanceOf(alice.address),
      );
      const treasuryBalanceBefore = BigNumber.from(
        await pozToken.balanceOf(treasury.address),
      );

      const transferAmount = BigNumber.from('1000').mul(decimalsUnit);

      await pozToken.connect(owner).setTransferFeeRate('0');
      const tx = await pozToken
        .connect(alice)
        .transfer(carol.address, transferAmount);

      expect(await pozToken.balanceOf(treasury.address)).to.equal(
        treasuryBalanceBefore,
      );
      expect(await pozToken.balanceOf(alice.address)).to.equal(
        aliceBalanceBefore.sub(transferAmount),
      );
      expect(await pozToken.balanceOf(carol.address)).to.equal(transferAmount);
      expect(tx)
        .to.emit(pozToken, 'Transfer')
        .withArgs(alice.address, carol.address, transferAmount);
    });
  });

  describe('transferFrom', () => {
    it('Revert if recipient is zero', async () => {
      await expect(
        pozToken
          .connect(alice)
          .transferFrom(
            treasury.address,
            constants.ZERO_ADDRESS,
            '10000000000',
          ),
      ).to.be.revertedWith('ERC20: transfer to the zero address');
    });

    it('Revert if sender is zero', async () => {
      await expect(
        pozToken
          .connect(alice)
          .transferFrom(constants.ZERO_ADDRESS, carol.address, '10000000000'),
      ).to.be.revertedWith('ERC20: transfer from the zero address');
    });

    it('Revert if insufficient balance in sender', async () => {
      await pozToken.connect(alice).approve(bob.address, TOTAL_SUPPLY);
      await expect(
        pozToken
          .connect(bob)
          .transferFrom(alice.address, carol.address, '10000000000'),
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance');

      await pozToken.connect(treasury).transfer(alice.address, '10000000000');

      await expect(
        pozToken
          .connect(bob)
          .transferFrom(alice.address, carol.address, '100000000000'),
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance');
    });

    it('Revert if insufficient allowance to spender', async () => {
      await pozToken.connect(alice).approve(bob.address, '10000000000');

      await pozToken
        .connect(treasury)
        .transfer(alice.address, '1000000000000');

      await expect(
        pozToken
          .connect(bob)
          .transferFrom(alice.address, carol.address, '100000000000'),
      ).to.be.revertedWith('ERC20: transfer amount exceeds allowance');
    });

    it('Transfer POZ token without fee if fee rate is zero', async () => {
      await pozToken
        .connect(treasury)
        .transfer(alice.address, BigNumber.from('10000').mul(decimalsUnit));

      const aliceBalanceBefore = BigNumber.from(
        await pozToken.balanceOf(alice.address),
      );
      const treasuryBalanceBefore = BigNumber.from(
        await pozToken.balanceOf(treasury.address),
      );

      const transferAmount = BigNumber.from('1000').mul(decimalsUnit);

      await pozToken.connect(owner).setTransferFeeRate('0');

      await pozToken.connect(alice).approve(bob.address, TOTAL_SUPPLY);

      const tx = await pozToken
        .connect(bob)
        .transferFrom(alice.address, carol.address, transferAmount);

      expect(await pozToken.balanceOf(treasury.address)).to.equal(
        treasuryBalanceBefore,
      );
      expect(await pozToken.balanceOf(alice.address)).to.equal(
        aliceBalanceBefore.sub(transferAmount),
      );
      expect(await pozToken.balanceOf(carol.address)).to.equal(transferAmount);
      expect(await pozToken.allowance(alice.address, bob.address)).to.equal(
        TOTAL_SUPPLY.sub(transferAmount),
      );
      expect(tx)
        .to.emit(pozToken, 'Transfer')
        .withArgs(alice.address, carol.address, transferAmount);
    });
  });
});
