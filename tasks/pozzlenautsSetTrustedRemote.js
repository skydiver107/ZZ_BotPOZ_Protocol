const CHAIN_ID = require("../constants/chainIds.json");
const { getDeploymentAddresses } = require("../utils/readStatic");

module.exports = async function (taskArgs, hre) {
  const dstChainId = CHAIN_ID[taskArgs.targetNetwork];
    
  var pozzlenautsONFT;
  var dstAddr;
  
  if(hre.network.name === "polygon" || hre.network.name === "mumbai")
    pozzlenautsONFT = await ethers.getContract("PozzlenautsONFTPoz");
  else
    pozzlenautsONFT = await ethers.getContract("PozzlenautsONFT");

  if(taskArgs.targetNetwork === "polygon" || taskArgs.targetNetwork === "mumbai")
    dstAddr = getDeploymentAddresses(taskArgs.targetNetwork)[
      "PozzlenautsONFTPoz"
    ];
  else
    dstAddr = getDeploymentAddresses(taskArgs.targetNetwork)[
      "PozzlenautsONFT"
    ];
  
  console.log(`[source] PozzlenautsONFT.address: ${pozzlenautsONFT.address} ${dstAddr}`);

  // setTrustedRemote() on the local contract, so it can receive message from the source contract
  try {
    let tx = await (
      await pozzlenautsONFT.setTrustedRemote(dstChainId, dstAddr)
    ).wait();
    console.log(
      `✅ [${hre.network.name}] setTrustedRemote(${dstChainId}, ${dstAddr})`
    );
    console.log(` tx: ${tx.transactionHash}`);
  } catch (e) {
    if (
      e.error.message.includes(
        "The trusted source address has already been set for the chainId"
      )
    ) {
      console.log("*trusted source already set*");
    } else {
      console.log(e);
    }
  }
};