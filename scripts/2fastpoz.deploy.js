const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const chainId = await deployer.getChainId();
  let pozTokenAddress = "0x701fD77F1B00547BE745957Ddf1cc92F9D088B6B"; // poz token address, mainnet address as default  
  const treasuryWallet = deployer.address; // set treasuryWallet address of FastPOZ as deployer address, can change it after deployment
  console.log("deploying with the account ", deployer.address);

  const ConversionRate = await hre.ethers.getContractFactory("ConversionRate");
  const conversionRate = await ConversionRate.deploy();
  await conversionRate.deployed();
  console.log("ConversionRate contract deployed to ", conversionRate.address);

  if (chainId != 137) {
    // poz token already deployed on mainnet so only deploy poz token contract for testnet and localhost
    const PozToken = await hre.ethers.getContractFactory("PozToken");
    const pozToken = await PozToken.deploy("100000000000000000000000");
    await pozToken.deployed();
    pozTokenAddress = pozToken.address;
    console.log("PozToken contract deployed to ", pozTokenAddress);
  }

  const FastPOZ = await hre.ethers.getContractFactory("FastPOZ");
  const fastPoz = await FastPOZ.deploy(treasuryWallet, conversionRate.address, pozTokenAddress);
  await fastPoz.deployed();
  console.log("FastPoz contract deployed to ", fastPoz.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
