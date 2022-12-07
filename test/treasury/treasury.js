const { ethers, waffle, network } = require("hardhat");
const { expect } = require("chai");
//const { FakeContract, smock } = require("@defi-wonderland/smock");

const { utils } = require("ethers");

describe("Treasury", async () => {
  const debtLimit = "10000000000";

  let deployer, alice, bob, carol;
  let erc20Factory;
  let ohmFactory;
  let treasuryFactory;
  let authFactory;

  let auth;
  let ohm;
  let treasury;

  /**
   * Everything in this block is only run once before all tests.
   * This is the home for setup methodss
   */
  before(async () => {
    [deployer, alice, bob, carol] = await ethers.getSigners();
    authFactory = await ethers.getContractFactory("PozzlePlanetAuthority");
    ohmFactory = await ethers.getContractFactory("PozzlePlanetERC20Token");
    treasuryFactory = await ethers.getContractFactory("PozzlePlanetTreasury");
  });

  beforeEach(async () => {
    auth = await authFactory.deploy(deployer.address, deployer.address, deployer.address, deployer.address); // TODO
    ohm = await ohmFactory.deploy(auth.address);
    treasury = await treasuryFactory.deploy(ohm.address, "0", auth.address);
    await auth.pushVault(treasury.address, true);
    await treasury.connect(deployer).depos;
  });

  it("should not have alice as a debtor", async () => {
    expect(await treasury.permissions(7, alice.address)).to.equal(false);
  });

  it("should enable alice as a debtor", async () => {
    await treasury.enable(7, alice.address, alice.address);
    expect(await treasury.permissions(7, alice.address)).to.equal(true);
  });

  it("should have debt limit as zero", async () => {
    await treasury.enable(7, alice.address, alice.address);
    expect(await treasury.debtLimit(alice.address)).to.equal(0);
  });

  it("should set debt limit", async () => {
    await treasury.enable(7, alice.address, alice.address);
    await treasury.setDebtLimit(alice.address, debtLimit);
    expect(await treasury.debtLimit(alice.address)).to.equal(debtLimit);
  });
});
