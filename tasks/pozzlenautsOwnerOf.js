module.exports = async function (taskArgs, hre) {
  const tokenId = taskArgs.tokenId;
  var pozzlenautsONFT;

  if(hre.network.name === "polygon" || hre.network.name === "mumbai")
    pozzlenautsONFT = await ethers.getContract("PozzlenautsONFTPoz");
  else
    pozzlenautsONFT = await ethers.getContract("PozzlenautsONFT");
    
  console.log(`[source] PozzlenautsONFT.address: ${pozzlenautsONFT.address}`);

  try {
    let address = await pozzlenautsONFT.ownerOf(tokenId);
    console.log(`✅ [${hre.network.name}] ownerOf(${tokenId})`);
    console.log(` Owner address: ${address}`);
  } catch (e) {
    // console.log(e)

    if (e.error?.message.includes("ONFT: owner query for nonexistent oft")) {
      console.log(
        "ONFT: Not Found - (Its possible this oft has been burned from being sent to another chain)"
      );
    }
    if (e.reason.includes("nonexistent")) {
      console.log(
        "ONFT: Not Found - (Its possible this oft has been burned from being sent to another chain)"
      );
    } else {
      console.log(e);
    }
  }
};
