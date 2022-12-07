# Pozzle Planet Protocol Development

#### Local setup

To run this project locally, follow these steps.

1. Clone the project locally, change into the directory, and install the dependencies:

```sh
git clone https://github.com/PozzlePlanet/protocol-development.git

cd protocol-development

# install using NPM or Yarn
npm install

# or

yarn
```

2. Start the local Hardhat node

```sh
npx hardhat node
```

3. Deploy the contracts to the EVM chain or local network in a separate terminal window

Copy the .env.example file to a file named .env, and then edit it to fill in the details.
Enter your PolygonScan API key, your Polygon node URL using Moralis Speedy Nodes, and the
private key of the account which will send the deployment transaction.
With a valid .env file in place, first deploy your contract:

```sh

npx hardhat deploy --network bsc-testnet --tags MockUSDC

npx hardhat verify --network bsc-testnet --constructor-args "args/tUSDC.js" --contract "contracts/tokens/MockUSDC.sol:MockUSDC" [deployed address]

npx hardhat deploy --network mumbai --tags MockPOZ

npx hardhat verify --network mumbai --constructor-args "args/tPOZ.js" --contract "contracts/tokens/MockPOZ.sol:MockPOZ" [deployed address]

```

```sh
npx hardhat deploy --network bsc-testnet --tags PozzlenautsONFT

npx hardhat verify --network bsc-testnet --constructor-args "args/bscTestnet.js" --contract "contracts/PozzlenautsONFT.sol:PozzlenautsONFT" [deployed address]

npx hardhat deploy --network rinkeby --tags PozzlenautsONFT

npx hardhat verify --network rinkeby --constructor-args "args/rinkeby.js" --contract "contracts/PozzlenautsONFT.sol:PozzlenautsONFT" [deployed address]

------------------ For Polygon and Mumbai --------------------

npx hardhat deploy --network polygon --tags PozzlenautsONFT

npx hardhat verify --network polygon --constructor-args "args/polygon.js" --contract "contracts/PozzlenautsONFTPoz.sol:PozzlenautsONFTPoz" [deployed address]

npx hardhat deploy --network mumbai --tags PozzlenautsONFT

npx hardhat verify --network mumbai --constructor-args "args/mumbai.js" --contract "contracts/PozzlenautsONFTPoz.sol:PozzlenautsONFTPoz" [deployed address]

```

```sh
npx hardhat --network [from chain] pozzlenautsSetTrustedRemote --target-network [to chain]

```

Repeat above command line for all chains each other.


4. To test the contract run the test scripts in the test folder

```

Approve specific amount of USDC to be transferred for minting at Blockchain Explorer [199 * Mint Amount]


```

```sh
npx hardhat --network bsc-testnet pozzlenautsMint

npx hardhat --network rinkeby pozzlenautsMint
```

```sh
npx hardhat --network bsc-testnet pozzlenautsOwnerOf --token-id 1622

npx hardhat --network mumbai pozzlenautsOwnerOf --token-id 1226
```

```sh
npx hardhat --network mumbai pozzlenautsSend --target-network bsc-testnet --token-id 1222
```

```sh
npx hardhat --network bsc-testnet pozzlenautsOwnerOf --token-id 1622

npx hardhat --network mumbai pozzlenautsOwnerOf --token-id 1222
```