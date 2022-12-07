module.exports = async function (taskArgs, hre) {
    var pozzlenautsONFT;
    const wallets = [
        "0x76a513Dd55364242ed52Ce5524fE20828f38AaFc",
        "0xD8277E1EE014268a7Cae003D52da851A512c9B94"
    ]

    for (i = 0; i < wallets.length; i++) {
        try {
            console.log(`setting fl claimable to false for wallet ${wallets[i]}`)
            if (hre.network.name === "polygon" || hre.network.name === "mumbai")
                pozzlenautsONFT = await ethers.getContract("PozzlenautsONFTPoz");
            else pozzlenautsONFT = await ethers.getContract("PozzlenautsONFT");
            let tx = await (await pozzlenautsONFT.setFLClaimed(wallets[i], false)).wait();
            console.log(`✅ [${hre.network.name}] set flClaimed to false for wallet: (${wallets[i]})`);
            console.log(` tx: ${tx.transactionHash}`);
            console.log('------------')
        } catch (error) {
            console.log(error)
        }

    }
};
