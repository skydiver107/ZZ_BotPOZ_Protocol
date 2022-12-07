const { ethers, upgrades } = require("hardhat")

const FACTORY_ADDRESS = "0xc35DADB65012eC5796536bD9864eD8773aBc74C4"
const FACTORY_ABI = require('./abis/UniswapV2Factory.json')
const ROUTER_ADDRESS = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"
const ROUTER_ABI = require('./abis/UniswapV2Router.json')

async function main() {
  const transferFee = "300"        // spends 3% of poz token when transfer
  const backingRate = "5000"       // backing reserve rate is 50%
  const [owner, vault1, vault2, backReserve, emissionReserve, ...user] = await ethers.getSigners()
  const tradeLimit = 20

  const UsdcToken = await ethers.getContractFactory('MockUSDC')
  usdcToken = await UsdcToken.deploy(ethers.utils.parseEther("100000000"), 0, 0, 0) // deploy usdc token and premint $100 million
  console.log(`usdc token deployed at ${usdcToken.address}`)
  const PozToken = await ethers.getContractFactory('PozToken')
  pozToken = await upgrades.deployProxy(
    PozToken, [
    transferFee,
    backReserve.address,
    10000 - backingRate,
    emissionReserve.address,
    0,
    owner.address,
    vault2.address,    // deploy poz token with 3 % transfer fee and mint 1 billion to vault1
    vault1.address
  ], { unsafeAllow: ['external-library-linking'] })
  console.log(`poz token deployed at ${pozToken.address}`)

  /* deploy uniswap factory and router */
  // const UniswapV2Factory = await ethers.getContractFactory('UniswapV2Factory')
  // uniFactoryV2 = await UniswapV2Factory.deploy(owner.address)
  // console.log(`Factory contract deployed to ${uniFactoryV2.address}`)
  // const UniswapV2Router = await ethers.getContractFactory('UniswapV2Router02')
  // uniRouterV2 = await UniswapV2Router.deploy(
  //   uniFactoryV2.address,
  //   "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  //   pozToken.address
  // ) // set weth address to none as no need to use it
  // console.log(`Router contract deployed to ${uniRouterV2.address}`)
  uniFactoryV2 = await ethers.getContractAt(FACTORY_ABI, FACTORY_ADDRESS, owner)
  uniRouterV2 = await ethers.getContractAt(ROUTER_ABI, ROUTER_ADDRESS, owner)

  // await (await pozToken.setRift(uniRouterV2.address)).wait()
  await (await pozToken.connect(vault1).transfer(owner.address, ethers.utils.parseEther("300000"))).wait()
  /* add initial liquidity to the uniswap v2 pair */
  await (await pozToken.approve(uniRouterV2.address, ethers.utils.parseEther("300000"))).wait()
  await (await usdcToken.approve(uniRouterV2.address, ethers.utils.parseEther("30000"))).wait()
  await (await uniRouterV2.addLiquidity(
    pozToken.address,
    usdcToken.address,
    ethers.utils.parseEther("300000"),
    ethers.utils.parseEther("30000"),
    0,
    0,
    owner.address,
    (parseInt(new Date().getTime() / 1000 + 300))
  )).wait() // add 300000 poz and 30000 usdc to set the pool price as $0.1
  console.log("add poz-usdc liquidity success")

  poolAddress = await uniFactoryV2.getPair(pozToken.address, usdcToken.address) // poz and usdc pair address
  await (await pozToken.setUniswapPair(poolAddress)).wait()
  console.log("poz-usdc pool deployed at:", poolAddress)

  /* airdrop poz token to vault2 */
  await (await pozToken.connect(vault1).transfer(vault2.address, ethers.utils.parseEther("999400000"))).wait()
  for (let i = 0; i < 10; i++) {
    await (await pozToken.connect(vault1).transfer(user[i].address, ethers.utils.parseEther("30000"))).wait()
    await (await usdcToken.connect(owner).transfer(user[i].address, ethers.utils.parseEther("3000"))).wait()
    console.log(`sent 30000 poz and 3000 usdc to ${user[i].address}`)
  }

  /* set wallet addresses and rate for poz token */
  await pozToken.setLockedAddress(vault2.address, true)
  await pozToken.setLockedAddress(poolAddress, true)
  await pozToken.setBackingReserve(backReserve.address, transferFee)
  await pozToken.setEmissionReserve(emissionReserve.address, 10000 - backingRate)

  // let tradeIndex = 1
  // let prevPrice = 0.1

  // do {
  //   /* get input parameters for trade */
  //   const rdUser = user[Math.floor(Math.random() * 10)]       // select one user among 10
  //   const tradeType = Math.floor(Math.random() * 2)           // choose trade type: 0 is sell and 1 is buy
  //   const tradeAmount = Math.floor(Math.random() * 100) + 100 // select how much token to trade [0, 100)
  //   // console.log("------", tradeType === 0 ? "sell" : "buy", `${tradeAmount} poz`, "------")
  //   const [token0, token1] = tradeType === 0 ?
  //     [pozToken, usdcToken] : [usdcToken, pozToken]
  //   const methodName = tradeType === 0 ?
  //     "swapExactTokensForTokensSupportingFeeOnTransferTokens" : "swapTokensForExactTokens"
  //   // const methodName = "swapExactTokensForTokens"
  //   const args = tradeType === 0 ? [
  //     ethers.utils.parseEther(tradeAmount.toString()),
  //     0,
  //     [token0.address, token1.address],
  //     rdUser.address,
  //     (parseInt(new Date().getTime() / 1000 + 400))
  //   ] : [
  //     ethers.utils.parseEther(tradeAmount.toString()),
  //     ethers.constants.MaxUint256,
  //     [token0.address, token1.address],
  //     rdUser.address,
  //     (parseInt(new Date().getTime() / 1000 + 400))
  //   ]

  //   /* approve and swap tokens */
  //   await (await token0.connect(rdUser).approve(
  //     uniRouterV2.address,
  //     ethers.utils.parseEther(tradeAmount.toString()))).wait()
  //   await (await uniRouterV2.connect(rdUser)[methodName](...args)).wait()

  //   /* dynamic price adjustment after swap: should be done by bot */
  //   // await (await pozToken.dynamicAdjustment(tradeType)).wait()

  //   /* get poz token pool price */
  //   const pozBalance = ethers.utils.formatUnits(await pozToken.balanceOf(poolAddress), 18)
  //   const usdcBalance = ethers.utils.formatUnits(await usdcToken.balanceOf(poolAddress), 18)
  //   const curPrice = Number(usdcBalance) / Number(pozBalance)
  //   console.log("price after adjustment:", `$${curPrice} `, curPrice >= prevPrice)
  //   prevPrice = curPrice

  //   /* continue random trade till it reaches tradeLimit */
  //   tradeIndex++
  // } while (tradeIndex <= tradeLimit)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});