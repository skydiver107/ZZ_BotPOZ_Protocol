const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("test poz token in ONFT", function () {
    let accounts;
    let pozToken;
    let usdcToken;
    let onft;
    before(async function () {
        accounts = await ethers.getSigners();
    });
    beforeEach(async function () {

        //deploy poz token
        const PozToken = await ethers.getContractFactory("PozToken");
        pozToken = await PozToken.deploy("100000000000000000000000");
        await pozToken.deployed();
        //deploy usdc token
        const USDC = await ethers.getContractFactory("MockUSDC");
        usdcToken = await USDC.deploy(accounts[0].address, "100000000000000000000000", 0, 0, 0);
        await usdcToken.deployed();
        //deploy nft
        const ONFT = await ethers.getContractFactory("PozzlenautsONFT");
        onft = await ONFT.deploy(
            "https://ipfs.io/ipfs/QmaUhcwr1sYR8cRaKb831vSXHnK2q23xR8GH3MXzD54t99/",
            "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675",
            0,
            1221,
            usdcToken.address,
            pozToken.address
        );
        await onft.deployed();
        //transfer poz to onft contract
        await pozToken.connect(accounts[0]).transfer(onft.address, "10000000000000000000000");
        await usdcToken.connect(accounts[0]).transfer(accounts[1].address, "10000000000000000000000");
    })

    it("mint 1 nft withdraw within 3 monthes", async function () {
        await usdcToken.connect(accounts[1]).approve(onft.address, "10000000000000000000000");
        await onft.connect(accounts[1]).publicMint(3);
        await expect(onft.connect(accounts[1]).withdrawPoz(1)).to.be.revertedWith(
            'UniversalONFT721: Poz withdraw is not opened yet!'
        );
    })

    it("withdraw poz after 3 month", async function () {
        const nintyTwoDays = 92 * 24 * 60 * 60;
        const interval = 30 * 30 * 24 * 60 * 60;
        const balance = "6660000000000000000";
        const twoBalance = "13320000000000000000"
        await ethers.provider.send('evm_increaseTime', [nintyTwoDays]);
        await ethers.provider.send('evm_mine');
        await usdcToken.connect(accounts[1]).approve(onft.address, "10000000000000000000000");
        await onft.connect(accounts[1]).publicMint(3);
        await onft.connect(accounts[1]).withdrawPoz(1)
        expect(await pozToken.balanceOf(accounts[1].address)).to.be.equal(balance);
        // await ethers.provider.send('evm_increaseTime', [interval]);
        // await ethers.provider.send('evm_mine');
        // await onft.connect(accounts[1]).withdrawPoz(1)
        // expect(await pozToken.balanceOf(accounts[1].address)).to.be.equal(twoBalance);
    });

    it("withdraw poz in one month twice", async function () {
        const nintyTwoDays = 92 * 24 * 60 * 60;
        const balance = "6660000000000000000";
        await ethers.provider.send('evm_increaseTime', [nintyTwoDays]);
        await ethers.provider.send('evm_mine');
        await usdcToken.connect(accounts[1]).approve(onft.address, "10000000000000000000000");
        await onft.connect(accounts[1]).publicMint(3);
        await onft.connect(accounts[1]).withdrawPoz(1)
        expect(await pozToken.balanceOf(accounts[1].address)).to.be.equal(balance);
        await expect(onft.connect(accounts[1]).withdrawPoz(1)).to.be.revertedWith("UniversalONFT721: Poz withdraw time is not right!");
    })

    it("withdraw poz after 4 month", async function () {
        const nintyTwoDays = 92 * 24 * 60 * 60;
        const interval = 30 * 24 * 60 * 60;
        const balance = "6660000000000000000";
        const twoBalance = "13320000000000000000"
        await ethers.provider.send('evm_increaseTime', [nintyTwoDays]);
        await ethers.provider.send('evm_mine');
        await usdcToken.connect(accounts[1]).approve(onft.address, "10000000000000000000000");
        await onft.connect(accounts[1]).publicMint(3);
        await onft.connect(accounts[1]).withdrawPoz(1)
        expect(await pozToken.balanceOf(accounts[1].address)).to.be.equal(balance);
        await ethers.provider.send('evm_increaseTime', [interval]);
        await ethers.provider.send('evm_mine');
        await onft.connect(accounts[1]).withdrawPoz(1)
        expect(await pozToken.balanceOf(accounts[1].address)).to.be.equal(twoBalance);
    });
})