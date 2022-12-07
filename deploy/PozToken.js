const deployPoz = async function (hre) {
  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre;
  const { deployer } = await getNamedAccounts();
  const treasury = "0xacCeBEdc9A58d2D535A1F0D6625942a9657D8467"
  console.log(`>>> your address: ${deployer}`);
  console.log(`>>> treasury address: ${treasury}`);
  const transferFeeRate = 100; // 1%
  await deploy('PozToken', {
    from: deployer,
    args: [treasury, transferFeeRate],
    log: true,
  });
};

module.exports = deployPoz;
module.exports.tags = ['Poz'];
