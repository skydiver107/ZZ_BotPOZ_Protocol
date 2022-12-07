const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')
// const FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"
// const FACTORY_ABI = require('./abis/UniswapV2Factory.json')
// const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
// const ROUTER_ABI = require('./abis/UniswapV2Router.json')

describe('Test 1000 Random Flash Swap To Check Price Growth', () => {
  let vault1 = null,               // vault1 is mint wallet
    vault2 = null,                 // vault2 is burn, mining, sals, treasury ops and vesting wallet
    backReserve = null,            // backing reserve wallet
    emissionReserve = null,        // emission reserve wallet
    user = []                      // several wallets for test
  let pozToken, usdcToken          // poz and usdc token address
  let uniFactoryV2, uniRouterV2    // uniswap factory and router
  let poolAddress                  // poz-usdc lp pair address
  const transferFee = "300"        // spends 3% of poz token when transfer
  const backingRate = "5000"       // backing reserve rate is 50%


  const tradeLimit = 20          // number which represents how much time to test trade

  before(async () => {
    [owner, vault1, vault2, backReserve, emissionReserve, ...user] = await ethers.getSigners()

    const UsdcToken = await ethers.getContractFactory('MockUSDC')
    usdcToken = await UsdcToken.deploy(ethers.utils.parseEther("100000000"), 0, 0, 0) // deploy usdc token and premint $100 million
    const PozToken = await ethers.getContractFactory('PozToken')
    pozToken = await upgrades.deployProxy(PozToken, [
      transferFee,
      backReserve.address,
      10000 - backingRate,
      emissionReserve.address,
      0,
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      vault2.address,
      vault1.address
    ], { unsafeAllow: ['external-library-linking'] })
    console.log(`PozToken deployed to ${pozToken.address}`)
    await pozToken.setWhitelist(vault1.address, true)

    /* deploy uniswap factory and router */
    const UniswapV2Factory = await ethers.getContractFactory('UniswapV2Factory')
    uniFactoryV2 = await UniswapV2Factory.deploy(owner.address)
    const UniswapV2Router = await ethers.getContractFactory('UniswapV2Router02')
    uniRouterV2 = await UniswapV2Router.deploy(
      uniFactoryV2.address,
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      pozToken.address
    ) // set weth address to none as no need to use it
    console.log(`Router contract deployed to ${uniRouterV2.address}`)

    // await pozToken.setRift(uniRouterV2.address)
    await pozToken.setRift(owner.address)
    await pozToken.connect(vault1).transfer(owner.address, ethers.utils.parseEther("300000"))
    /* add initial liquidity to the uniswap v2 pair */
    await pozToken.approve(uniRouterV2.address, ethers.utils.parseEther("300000"))
    await usdcToken.approve(uniRouterV2.address, ethers.utils.parseEther("30000"))
    await uniRouterV2.addLiquidity(
      pozToken.address,
      usdcToken.address,
      ethers.utils.parseEther("300000"),
      ethers.utils.parseEther("30000"),
      0,
      0,
      owner.address,
      (parseInt(new Date().getTime() / 1000 + 100))
    ) // add 300000 poz and 30000 usdc to set the pool price as $0.1

    poolAddress = await uniFactoryV2.getPair(pozToken.address, usdcToken.address) // poz and usdc pair address
    await pozToken.setUniswapPair(poolAddress)
    console.log(`Poz-Usdc Lp deployed to ${poolAddress}`)

    /* airdrop poz token to vault2 */
    await pozToken.connect(vault1).transfer(vault2.address, ethers.utils.parseEther("999400000"))
    for (let i = 0; i < 10; i++) {
      await pozToken.connect(vault1).transfer(user[i].address, ethers.utils.parseEther("30000"))
      await usdcToken.connect(owner).transfer(user[i].address, ethers.utils.parseEther("3000"))
    }

    /* set wallet addresses and rate for poz token */
    await pozToken.setLockedAddress(vault2.address, true)
    await pozToken.setLockedAddress(poolAddress, true)
    await pozToken.setBackingReserve(backReserve.address, transferFee)
    await pozToken.setEmissionReserve(emissionReserve.address, 10000 - backingRate)
  })

  it('Check poz token distribution: 300,000POZ to pool and user, others to locked vault', async () => {
    expect(await pozToken.balanceOf(vault1.address)).to.equal(0)          // vault1 should be empty as sent all funds to other
    expect(await pozToken.balanceOf(vault2.address)).to.equal(            // vault2 should have 999,400,000 locked POZ
      ethers.utils.parseEther("999400000")
    )
    let circulatingSupply = ethers.BigNumber.from(0)
    for (let i = 0; i < 10; i++) {                                        // add total poz token amount to get circulating supply
      const balance = await pozToken.balanceOf(user[i].address)
      circulatingSupply = circulatingSupply.add(balance)
    }
    expect(circulatingSupply.eq(ethers.utils.parseEther("300000")))       // circulating supply should be 300000 POZ
  })

  it('Should get 30,000 USDC as backing reserve', async () => {
    expect(await usdcToken.balanceOf(poolAddress)).to.equal(              // usdc pool amount should be $30000
      ethers.utils.parseEther("30000")
    )
  })

  it('Generate random buy and sell to check poz growth', async () => {
    let tradeIndex = 1
    let prevPrice = 0.1

    do {
      /* get input parameters for trade */
      const rdUser = user[Math.floor(Math.random() * 10)]       // select one user among 10
      const tradeType = Math.floor(Math.random() * 2)           // choose trade type: 0 is sell and 1 is buy
      const tradeAmount = Math.floor(Math.random() * 100) + 100 // select how much token to trade [0, 100)
      // console.log("------", tradeType === 0 ? "sell" : "buy", `${tradeAmount} poz`, "------")
      const [token0, token1] = tradeType === 0 ?
        [pozToken, usdcToken] : [usdcToken, pozToken]
      const methodName = tradeType === 0 ?
        "swapExactTokensForTokensSupportingFeeOnTransferTokens" : "swapTokensForExactTokens"
      // const methodName = "swapExactTokensForTokens"
      const args = tradeType === 0 ? [
        ethers.utils.parseEther(tradeAmount.toString()),
        0,
        [token0.address, token1.address],
        rdUser.address,
        (parseInt(new Date().getTime() / 1000 + 100))
      ] : [
        ethers.utils.parseEther(tradeAmount.toString()),
        ethers.constants.MaxUint256,
        [token0.address, token1.address],
        rdUser.address,
        (parseInt(new Date().getTime() / 1000 + 100))
      ]

      /* approve and swap tokens */
      await (await token0.connect(rdUser).approve(
        uniRouterV2.address,
        ethers.utils.parseEther(tradeAmount.toString()))).wait()
      await (await uniRouterV2.connect(rdUser)[methodName](...args)).wait()

      /* dynamic price adjustment after swap: should be done by bot */
      await (await pozToken.dynamicAdjustment(tradeType)).wait()

      /* get poz token pool price */
      const pozBalance = ethers.utils.formatUnits(await pozToken.balanceOf(poolAddress), 18)
      const usdcBalance = ethers.utils.formatUnits(await usdcToken.balanceOf(poolAddress), 18)
      const curPrice = Number(usdcBalance) / Number(pozBalance)
      console.log("price after adjustment:", `$${curPrice} `, curPrice >= prevPrice)
      prevPrice = curPrice


      /* continue random trade till it reaches tradeLimit */
      tradeIndex++
    } while (tradeIndex <= tradeLimit)
  })
})