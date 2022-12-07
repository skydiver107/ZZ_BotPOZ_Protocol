const LZ_ENDPOINTS = require("../constants/layerzeroEndpoints.json");
const ONFT_ARGS = require("../constants/pozzlenautsArgs.json");
const METADATAS = require("../constants/pozzlenautsMetadata.json");
const TREASURY_ADDRESS = require("../constants/treasuryAddress.json");

module.exports = async function ({ deployments, getNamedAccounts }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  console.log(`>>> your address: ${deployer}`);

  const lzEndpointAddress = LZ_ENDPOINTS[hre.network.name];
  const onftArgs = ONFT_ARGS[hre.network.name];
  console.log({ onftArgs });
  console.log(
    `[${hre.network.name}] LayerZero Endpoint address: ${lzEndpointAddress}`
  );

  if(hre.network.name === "polygon" || hre.network.name === "mumbai") {
    await deploy("PozzlenautsONFTPoz", {
      from: deployer,
      args: [
        METADATAS[hre.network.name],
        lzEndpointAddress,
        onftArgs.startMintId,
        onftArgs.endMintId,
        onftArgs.usdcAddress,
        onftArgs.pozAddress,
        TREASURY_ADDRESS.treasuryAddress
      ],
      log: true,
      waitConfirmations: 1,
    });
  } else {
    await deploy("PozzlenautsONFT", {
      from: deployer,
      args: [
        METADATAS[hre.network.name],
        lzEndpointAddress,
        onftArgs.startMintId,
        onftArgs.endMintId,
        onftArgs.usdcAddress,
        TREASURY_ADDRESS.treasuryAddress
      ],
      log: true,
      waitConfirmations: 1,
    });
  }
};

module.exports.tags = ["PozzlenautsONFT"];
