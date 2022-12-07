const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Test swap tokens with poz token", function () {
  let treasure;
  let conversionRate;
  let pozToken;
  let usdtToken;
  let fastPoz;
  let accounts;

  before(async function () {
    accounts = await ethers.getSigners();
    treasure = accounts[2];
  })
  beforeEach(async function () {
    const PozToken = await ethers.getContractFactory("PozToken");
    pozToken = await PozToken.deploy("100000000000000000000000");
    await pozToken.deployed();
    const UsdtToken = await ethers.getContractFactory("PozToken");
    usdtToken = await UsdtToken.deploy("10000000000000000000000");
    await usdtToken.deployed();
    const ConversionRate = await ethers.getContractFactory("ConversionRate");
    conversionRate = await ConversionRate.deploy();
    await conversionRate.deployed();
    const FastPOZ = await ethers.getContractFactory("FastPOZ");
    fastPoz = await FastPOZ.deploy(treasure.address, conversionRate.address, pozToken.address);
    await fastPoz.deployed();

    await pozToken.connect(accounts[0]).approve(pozToken.address, "100000000000000000000000");
    await pozToken.connect(accounts[0]).transfer(fastPoz.address, "90000000000000000000000");
    await pozToken.connect(accounts[0]).transfer(accounts[1].address, "10000000000000000000000");
    await usdtToken.connect(accounts[0]).approve(usdtToken.address, "10000000000000000000000");
    await usdtToken.connect(accounts[0]).transfer(accounts[1].address, "10000000000000000000000");
  })

  it("Should have 90000 $POZ in fastPoz contract", async function () {
    expect(await pozToken.balanceOf(fastPoz.address)).to.be.equal("90000000000000000000000");
  })

  it("Set 1 USDT rate to 10 POZ", async function () {
    await conversionRate.connect(accounts[0]).setRatePerToken(usdtToken.address, "10");
    expect(await conversionRate.getRateOfToken(usdtToken.address)).to.be.equal("10");
  })

  it("Swap 1 USDT to 1 POZ", async function () {
    await conversionRate.connect(accounts[0]).setRatePerToken(usdtToken.address, "10");
    await usdtToken.connect(accounts[1]).approve(fastPoz.address, "1000000000000000000");
    await fastPoz.connect(accounts[1]).swapExactTokenForPoz(usdtToken.address, "1000000000000000000");
    expect(await usdtToken.balanceOf(treasure.address)).to.be.equal("1000000000000000000");
    expect(await pozToken.balanceOf(treasure.address)).to.be.equal("10000000000000000000");
  })

  it("Send 3000 onchain Poz token to treasury wallet", async function () {
    const balance = "3000000000000000000000";
    const remains = "7000000000000000000000";
    await pozToken.connect(accounts[1]).approve(fastPoz.address, balance);
    const tx = await fastPoz.connect(accounts[1]).sendPoz2Treasury(balance);
    const receipt = await tx.wait();
    expect(await pozToken.balanceOf(treasure.address)).to.be.equal(balance);
    expect(await pozToken.balanceOf(accounts[1].address)).to.be.equal(remains);
    const transferEvent = receipt.events?.filter((x) => { return x.event == "PozTransfered" });
    console.log("transactionHash: ", transferEvent[0].transactionHash); // transaction hash of sendPoz2Treasury
    expect(transferEvent[0].args._from).to.be.equal(accounts[1].address);
    expect(transferEvent[0].args._to).to.be.equal(treasure.address);
    expect(transferEvent[0].args._balance).to.be.equal(balance);
  })

  it("Only owner can set the treasury wallet address", async function () {
    await expect(fastPoz.connect(accounts[2]).setTreasuryWallet(accounts[2].address)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  })
});