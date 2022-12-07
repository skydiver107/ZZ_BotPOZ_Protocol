const MOCKPOZ_ARGS = require("../constants/tPOZ.json");

module.exports = async function ({ deployments, getNamedAccounts }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  console.log(`>>> your address: ${deployer}`);

  await deploy("MockPOZ", {
    from: deployer,
    args: [
      MOCKPOZ_ARGS.preMint,
    ],
    log: true,
    waitConfirmations: 1,
  });
};

module.exports.tags = ["MockPOZ"];
