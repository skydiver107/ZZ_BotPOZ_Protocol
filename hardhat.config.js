const dotenv = require("dotenv");
dotenv.config();

const { task } = require("hardhat/config");
const utils = require("ethers").utils;
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("./tasks");
require('solidity-coverage');
require('hardhat-contract-sizer');
require('@nomiclabs/hardhat-ethers');
require('@openzeppelin/hardhat-upgrades');

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

function getMnemonic(networkName) {
  if (networkName) {
    const mnemonic = process.env["MNEMONIC_" + networkName.toUpperCase()];
    if (mnemonic && mnemonic !== "") {
      return mnemonic;
    }
  }

  const mnemonic = process.env.MNEMONIC;
  if (!mnemonic || mnemonic === "") {
    return "test test test test test test test test test test test junk";
  }

  return mnemonic;
}

function accounts(chainKey) {
  return { mnemonic: getMnemonic(chainKey) };
}

const chainIds = {
  ethereum: 1,
  bsc: 56,
  avalanche: 43114,
  polygon: 137,
  arbitrumOne: 42161,
  optimism: 10,

  goerli: 5,
  hardhat: 1337,
  kovan: 42,
  ropsten: 3,
  rinkeby: 4,
  mumbai: 80001,
  "bsc-testnet": 97,
  fuji: 43113,
  "arbitrum-rinkeby": 421611,
  "optimism-kovan": 69,
  "fantom-testnet": 4002,
};

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: chainIds.hardhat,
    },
    ethereum: {
      url: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", // public infura endpoint
      chainId: chainIds.ethereum,
      accounts: accounts(),
    },
    bsc: {
      url: "https://bsc-dataseed1.binance.org",
      chainId: chainIds.bsc,
      accounts: accounts(),
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: chainIds.avalanche,
      accounts: accounts(),
    },
    polygon: {
      url: "https://polygon-rpc.com",
      chainId: chainIds.polygon,
      accounts: accounts(),
    },
    arbitrumOne: {
      url: "https://rpc.ankr.com/arbitrum",
      chainId: chainIds.arbitrumOne,
      accounts: accounts(),
    },
    optimism: {
      url: "https://mainnet.optimism.io",
      chainId: chainIds.optimism,
      accounts: accounts(),
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", // public infura endpoint
      chainId: chainIds.rinkeby,
      accounts: accounts(),
    },
    goerli: {
      url: "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", // public infura endpoint
      chainId: chainIds.goerli,
      accounts: accounts(),
    },
    "bsc-testnet": {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      chainId: chainIds["bsc-testnet"],
      accounts: accounts(),
    },
    fuji: {
      url: `https://api.avax-test.network/ext/bc/C/rpc`,
      chainId: chainIds.fuji,
      accounts: accounts(),
    },
    mumbai: {
      url: "https://matic-mumbai.chainstacklabs.com",
      chainId: chainIds.mumbai,
      accounts: accounts(),
    },
    "arbitrum-rinkeby": {
      url: `https://rinkeby.arbitrum.io/rpc`,
      chainId: chainIds["arbitrum-rinkeby"],
      accounts: accounts(),
    },
    "optimism-kovan": {
      url: `https://kovan.optimism.io/`,
      chainId: chainIds["optimism-kovan"],
      accounts: accounts(),
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      ropsten: process.env.ETHERSCAN_API_KEY,
      rinkeby: process.env.ETHERSCAN_API_KEY,
      goerli: process.env.ETHERSCAN_API_KEY,
      kovan: process.env.ETHERSCAN_API_KEY,
      // binance smart chain
      bsc: process.env.BSCSCAN_API_KEY,
      bscTestnet: process.env.BSCSCAN_API_KEY,
      // fantom mainnet
      opera: process.env.FTMSCAN_API_KEY,
      ftmTestnet: process.env.FTMSCAN_API_KEY,
      // optimism
      optimisticEthereum: process.env.OPTIMISTIC_ETHERSCAN_API_KEY,
      optimisticKovan: process.env.OPTIMISTIC_ETHERSCAN_API_KEY,
      // polygon
      polygon: process.env.POLYGONSCAN_API_KEY,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY,
      // arbitrum
      arbitrumOne: process.env.ARBISCAN_API_KEY,
      arbitrumTestnet: process.env.ARBISCAN_API_KEY,
      // avalanche
      avalanche: process.env.SNOWTRACE_API_KEY,
      avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY,
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
    deploy: "./deploy",
    deployments: "./deployments",
  },
  contractSizer: {
    alphaSort: false,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  namedAccounts: {
    deployer: {
      default: 0, // wallet address 0, of the mnemonic in .env
    },
    treasury: {
      137: '0x0BD107E0275d9AD9D56d1E9914a222C7C7C40464',
      80001: '0x0BD107E0275d9AD9D56d1E9914a222C7C7C40464',
    },
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.10",
        settings: {
          metadata: {
            bytecodeHash: "none",
          },
          optimizer: {
            enabled: true,
            runs: 800,
          },
        },
      },
      {
        version: "0.8.0",
        settings: {
          metadata: {
            bytecodeHash: "none",
          },
          optimizer: {
            enabled: true,
            runs: 800,
          },
        },
      },
      {
        version: "0.7.5",
        settings: {
          metadata: {
            bytecodeHash: "none",
          },
          optimizer: {
            enabled: true,
            runs: 800,
          },
        },
      },
      {
        version: "0.6.12",
        settings: {
          metadata: {
            bytecodeHash: "none",
          },
          optimizer: {
            enabled: true,
            runs: 800,
          },
        },
      },
      {
        version: "0.5.16",
      },
    ],
    settings: {
      outputSelection: {
        "*": {
          "*": ["storageLayout"],
        },
      },
    },
  },
};
