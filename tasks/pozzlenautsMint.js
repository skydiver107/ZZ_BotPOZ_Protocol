
module.exports = async function (taskArgs, hre) {
  var pozzlenautsONFT;

  if(hre.network.name === "polygon" || hre.network.name === "mumbai")
    pozzlenautsONFT = await ethers.getContract("PozzlenautsONFTPoz");
  else
    pozzlenautsONFT = await ethers.getContract("PozzlenautsONFT");

  console.log(`[source] PozzlenautsONFT.address: ${pozzlenautsONFT.address}`);

  try {
    let mintAmount = 1;
    let tx = await (await pozzlenautsONFT.publicMint(mintAmount)).wait();
    console.log(`✅ [${hre.network.name}] mint()`);
    console.log(` tx: ${tx.transactionHash}`);
    let onftTokenId = await ethers.provider.getTransactionReceipt(
      tx.transactionHash
    );
    
    console.log(
      ` ONFT nftId: ${parseInt(Number(onftTokenId.logs[2].topics[3]))}`
    );
  } catch (e) {
    if (e.error?.message.includes("ONFT: Max limit reached")) {
      console.log("*ONFT: Max limit reached*");
    } else {
      console.log(e);
    }
  }
};
