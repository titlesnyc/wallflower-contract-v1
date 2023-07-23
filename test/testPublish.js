const { expect } = require("chai");
const hre = require("hardhat");

const DERIVATIVE_FEE = 0.000999

// const { SplitsClient } = require('@0xsplits/splits-sdk')


describe("TitlesDeployer", function () {
    it("able to publish a Titles Remix", async function () {

        const splitMainEthereum = '0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE';
        const titlesController = '0xd9111EbeC09Ae2cb4778e6278d5959929bAA59Cc'

        console.log("1️⃣ - Test started")

        // Deploy Implementation
        const RemixImplementation = await hre.ethers.getContractFactory("ERC721Remix");
        const implementation = await RemixImplementation.deploy();

        console.log("🛠 Implementation deployed: ")
        console.log(implementation.address)

        // Deploy Deployer
        const TitlesDeployer = await hre.ethers.getContractFactory("TitlesDeployer");
        const deployer = await TitlesDeployer.deploy(splitMainEthereum, titlesController, implementation.address);

        console.log("Deployer address: " + deployer.address)

        console.log("2️⃣ - Deployed deployer w/ Split Main")

        // Publish Information
        const name = 'Test Name'
        const symbol = 'TS'
        const inputUri = 'ipfs://testURI'
        const priceEth = 0.1
        const priceWei = ethers.utils.parseUnits(priceEth.toString(), "ether")
        const supply = 10
        const mintLimit = 2
        const endTime = 0

        const rainbowDev = '0xd9111EbeC09Ae2cb4778e6278d5959929bAA59Cc'
        const metamaskDev = '0xEA7c0d05AE85a02ADd86c0FC7b348c997C0B1fF4'
        const accounts = [rainbowDev, metamaskDev]
        const allocations = [700000, 300000]

        // Get Signer
        const [signer] = await ethers.getSigners();
        const creatorAddress = signer.address
        console.log("Signer address: " + creatorAddress)


        // Publish
        await deployer.publishRemix(creatorAddress, name, symbol, inputUri, accounts, allocations, accounts, allocations, priceWei, supply, mintLimit, endTime)
        const publishedAddress = await deployer.remixContractArray(0)

        console.log("3️⃣ - Published remix")
        console.log("Remix address:  " + publishedAddress)

        const remix = await ethers.getContractAt('ERC721Remix', publishedAddress)

        // Get Addresses
        const creatorSplitAddress = await remix.creatorProceedRecipient()
        console.log("Creator split address:  " + creatorSplitAddress)
        const derivativeFeeSplitAddress = await remix.derivativeFeeRecipient()
        console.log("Derivatve Fee split address: " + derivativeFeeSplitAddress)

        const ownerAddress = await remix.owner()
        console.log("Owner address: " + ownerAddress)
        expect(ownerAddress).to.equal(creatorAddress)

        // Save balances
        const prePurchaseWalletBalance = await signer.getBalance();
        const prePurchaseContractBalance = await ethers.provider.getBalance(publishedAddress)
        const prePurchaseProceedBalance = await ethers.provider.getBalance(creatorSplitAddress)
        const prePurchaseFeeBalance = await ethers.provider.getBalance(derivativeFeeSplitAddress)

        // Purchase
        const purchaseQuantity = 1
        const basePrice = .1
        const purchasePrice = basePrice + DERIVATIVE_FEE
        const purchasePriceEth = ethers.utils.parseEther(purchasePrice.toString());
        const options = {
            value: purchasePriceEth
        }
        const purchaseTx = await remix.purchase(purchaseQuantity, options)
        const purchaseTxReceipt = await purchaseTx.wait()
        const purchaseGasCost = ethers.BigNumber.from(purchaseTxReceipt.effectiveGasPrice.mul(purchaseTxReceipt.cumulativeGasUsed))

        // Check NFT Data
        const remixUri = await remix.tokenURI(0)
        expect(remixUri).to.equal(inputUri);

        const masterUri = await remix.remixUri()
        expect(masterUri).to.equal(inputUri);

        // Check Money Flow - Purchaser
        const purchaseWalletBalance = await signer.getBalance();
        const expectedBalance = prePurchaseWalletBalance.sub(purchasePriceEth).sub(purchaseGasCost);
        expect(purchaseWalletBalance).to.equal(expectedBalance);

        // Check Money Flow - Contract
        const postPurchaseContractBalance = await ethers.provider.getBalance(publishedAddress)
        expect(postPurchaseContractBalance).to.equal(0)

        // Check Money Flow - Fee Address
        const postPurchaseFeeBalance = await ethers.provider.getBalance(derivativeFeeSplitAddress)
        const totalFees = ethers.utils.parseEther((DERIVATIVE_FEE * purchaseQuantity).toString())
        const expectedFeeBalance = ethers.BigNumber.from(prePurchaseFeeBalance).add(totalFees)
        expect(postPurchaseFeeBalance).to.equal(expectedFeeBalance)

        // Check Money Flow - Proceeds Address
        const postPurchaseProceedBalance = await ethers.provider.getBalance(creatorSplitAddress)
        const totalProceeds = ethers.utils.parseEther((basePrice * purchaseQuantity).toString())
        const expectedProceedBalance = ethers.BigNumber.from(prePurchaseProceedBalance).add(totalProceeds)
        expect(postPurchaseProceedBalance).to.equal(expectedProceedBalance)


        /* TODO: Further test
            - Buy an NFT
            - Distribute the funds
            - Make sure split wallets and allocations are right
        */



        // =================== Test Split - this doens't work for local dev bc SDK only works on real nets
        // const chainId = 1
        // const splitsClient = new SplitsClient({
        //     chainId
        // })
        // const args = {
        //     splitId: splitAddress,
        // }
        // const response = await splitsClient.getSplitMetadata(args)
        // console.log(response)


        // =================== Test Getting Mainnet Splits function
        // const contractInterface = new hre.ethers.utils.Interface([
        //     "function PERCENTAGE_SCALE() returns (uint256)",
        // ]);
        // const [signer] = await ethers.getSigners();
        // const connectedContract = new ethers.Contract(splitMainEthereum, contractInterface, signer);
        // const result = await connectedContract.callStatic.PERCENTAGE_SCALE();
        // const returnValue = result.toString();
        // console.log(returnValue);

    });

    it("able to publish with single allocation arrays", async function () {

        const splitMainEthereum = '0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE';
        const titlesController = '0xd9111EbeC09Ae2cb4778e6278d5959929bAA59Cc'

        console.log("1️⃣ - Test started")

        // Deploy Implementation
        const RemixImplementation = await hre.ethers.getContractFactory("ERC721Remix");
        const implementation = await RemixImplementation.deploy();

        console.log("🛠 Implementation deployed: ")
        console.log(implementation.address)

        // Deploy Deployer
        const TitlesDeployer = await hre.ethers.getContractFactory("TitlesDeployer");
        const deployer = await TitlesDeployer.deploy(splitMainEthereum, titlesController, implementation.address);

        console.log("Deployer address: " + deployer)
        console.log("2️⃣ - Deployed deployer w/ Split Main")

        const rainbowDev = '0xd9111EbeC09Ae2cb4778e6278d5959929bAA59Cc'
        const metamaskDev = '0xEA7c0d05AE85a02ADd86c0FC7b348c997C0B1fF4'

        // Publish Information
        const creatorAddress = '0x40211097528189E4Aa814bC2d6c76a7117e5a32C'
        const name = 'Meta'
        const symbol = 'META'
        const inputUri = 'https://ipfs.thirdwebcdn.com/ipfs/QmeDPAdEdmrjc9d3NeMt3DzusUDG5BjvrLQSpKgXYcG867/0'
        const proceedAccounts =[rainbowDev]
        const feeAccounts = [metamaskDev]
        const allocations = [1000000]
        const priceEth = 0.1
        const priceWei = ethers.utils.parseUnits(priceEth.toString(), "ether")
        const supply = 25
        const mintLimit = 3
        const endTime = 1686286044

        // check allocations
        const totalAllocations = allocations.reduce((a, b) => a + b)
        expect(totalAllocations).to.equal(1000000)

        // Get Signer
        const [signer] = await ethers.getSigners();

        // Publish
        await deployer.publishRemix(creatorAddress, name, symbol, inputUri, proceedAccounts, allocations, feeAccounts, allocations, priceWei, supply, mintLimit, endTime)
        const publishedAddress = await deployer.remixContractArray(0)

        console.log("3️⃣ - Published remix")
        console.log("Remix address:  " + publishedAddress)

        const remix = await ethers.getContractAt('ERC721Remix', publishedAddress)

        // Get Addresses
        const creatorSplitAddress = await remix.creatorProceedRecipient()
        console.log("Creator split address:  " + creatorSplitAddress)
        const derivativeFeeSplitAddress = await remix.derivativeFeeRecipient()
        console.log("Derivatve Fee split address: " + derivativeFeeSplitAddress)

        const ownerAddress = await remix.owner()
        console.log("Owner address: " + ownerAddress)
        expect(ownerAddress).to.equal(creatorAddress)

        // Save balances
        const prePurchaseWalletBalance = await signer.getBalance();
        const prePurchaseContractBalance = await ethers.provider.getBalance(publishedAddress)
        const prePurchaseProceedBalance = await ethers.provider.getBalance(creatorSplitAddress)
        const prePurchaseFeeBalance = await ethers.provider.getBalance(derivativeFeeSplitAddress)

        // Purchase
        const purchaseQuantity = 1
        const basePrice = .1
        const purchasePrice = basePrice + DERIVATIVE_FEE
        const purchasePriceEth = ethers.utils.parseEther(purchasePrice.toString());
        const options = {
            value: purchasePriceEth
        }
        const purchaseTx = await remix.purchase(purchaseQuantity, options)
        const purchaseTxReceipt = await purchaseTx.wait()
        const purchaseGasCost = ethers.BigNumber.from(purchaseTxReceipt.effectiveGasPrice.mul(purchaseTxReceipt.cumulativeGasUsed))

        // Check NFT Data
        const remixUri = await remix.tokenURI(0)
        expect(remixUri).to.equal(inputUri);

        const masterUri = await remix.remixUri()
        expect(masterUri).to.equal(inputUri);

        // Check Money Flow - Purchaser
        const purchaseWalletBalance = await signer.getBalance();
        const expectedBalance = prePurchaseWalletBalance.sub(purchasePriceEth).sub(purchaseGasCost);
        expect(purchaseWalletBalance).to.equal(expectedBalance);

        // Check Money Flow - Contract
        const postPurchaseContractBalance = await ethers.provider.getBalance(publishedAddress)
        expect(postPurchaseContractBalance).to.equal(0)

        // Check Money Flow - Fee Address
        const postPurchaseFeeBalance = await ethers.provider.getBalance(derivativeFeeSplitAddress)
        const totalFees = ethers.utils.parseEther((DERIVATIVE_FEE * purchaseQuantity).toString())
        const expectedFeeBalance = ethers.BigNumber.from(prePurchaseFeeBalance).add(totalFees)
        expect(postPurchaseFeeBalance).to.equal(expectedFeeBalance)

        // Check Money Flow - Proceeds Address
        const postPurchaseProceedBalance = await ethers.provider.getBalance(creatorSplitAddress)
        const totalProceeds = ethers.utils.parseEther((basePrice * purchaseQuantity).toString())
        const expectedProceedBalance = ethers.BigNumber.from(prePurchaseProceedBalance).add(totalProceeds)
        expect(postPurchaseProceedBalance).to.equal(expectedProceedBalance)


    });

    it("able to publish a nft from the TITLES app", async function () {

        const splitMainEthereum = '0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE';
        const titlesController = '0xd9111EbeC09Ae2cb4778e6278d5959929bAA59Cc'

        console.log("1️⃣ - Test started")

        // Deploy Implementation
        const RemixImplementation = await hre.ethers.getContractFactory("ERC721Remix");
        const implementation = await RemixImplementation.deploy();

        console.log("🛠 Implementation deployed: ")
        console.log(implementation.address)

        // Deploy Deployer
        const TitlesDeployer = await hre.ethers.getContractFactory("TitlesDeployer");
        const deployer = await TitlesDeployer.deploy(splitMainEthereum, titlesController, implementation.address);

        console.log("Deployer address: " + deployer)

        console.log("2️⃣ - Deployed deployer w/ Split Main")

        // Publish Information
        const creatorAddress = '0x40211097528189E4Aa814bC2d6c76a7117e5a32C'
        const name = 'Meta'
        const symbol = 'META'
        const inputUri = 'https://ipfs.thirdwebcdn.com/ipfs/QmeDPAdEdmrjc9d3NeMt3DzusUDG5BjvrLQSpKgXYcG867/0'
        const accounts =['0x40211097528189E4Aa814bC2d6c76a7117e5a32C', '0xF2254525E9f2147990279BA450fb23432040dfdd', '0xFFe7FAc6E73627D2f00A771a749E38fa781E5d67', ]
        const allocations = [600000, 200000, 200000]
        const priceEth = 0.1
        const priceWei = ethers.utils.parseUnits(priceEth.toString(), "ether")
        const supply = 0
        const mintLimit = 3
        const endTime = 1686286044

        // check allocations
        console.log(accounts)
        const totalAllocations = allocations.reduce((a, b) => a + b)
        expect(totalAllocations).to.equal(1000000)

        // Get Signer
        const [signer] = await ethers.getSigners();

        // Publish
        await deployer.publishRemix(creatorAddress, name, symbol, inputUri, accounts, allocations, accounts, allocations, priceWei, supply, mintLimit, endTime)
        const publishedAddress = await deployer.remixContractArray(0)

        console.log("3️⃣ - Published remix")
        console.log("Remix address:  " + publishedAddress)

        const remix = await ethers.getContractAt('ERC721Remix', publishedAddress)

        // Get Addresses
        const creatorSplitAddress = await remix.creatorProceedRecipient()
        console.log("Creator split address:  " + creatorSplitAddress)
        const derivativeFeeSplitAddress = await remix.derivativeFeeRecipient()
        console.log("Derivatve Fee split address: " + derivativeFeeSplitAddress)

        const ownerAddress = await remix.owner()
        console.log("Owner address: " + ownerAddress)
        expect(ownerAddress).to.equal(creatorAddress)

        // Save balances
        const prePurchaseWalletBalance = await signer.getBalance();
        const prePurchaseContractBalance = await ethers.provider.getBalance(publishedAddress)
        const prePurchaseProceedBalance = await ethers.provider.getBalance(creatorSplitAddress)
        const prePurchaseFeeBalance = await ethers.provider.getBalance(derivativeFeeSplitAddress)

        // Purchase
        const purchaseQuantity = 1
        const basePrice = .1
        const purchasePrice = basePrice + DERIVATIVE_FEE
        const purchasePriceEth = ethers.utils.parseEther(purchasePrice.toString());
        const options = {
            value: purchasePriceEth
        }
        const purchaseTx = await remix.purchase(purchaseQuantity, options)
        const purchaseTxReceipt = await purchaseTx.wait()
        const purchaseGasCost = ethers.BigNumber.from(purchaseTxReceipt.effectiveGasPrice.mul(purchaseTxReceipt.cumulativeGasUsed))

        // Check NFT Data
        const remixUri = await remix.tokenURI(0)
        expect(remixUri).to.equal(inputUri);

        const masterUri = await remix.remixUri()
        expect(masterUri).to.equal(inputUri);

        // Check Money Flow - Purchaser
        const purchaseWalletBalance = await signer.getBalance();
        const expectedBalance = prePurchaseWalletBalance.sub(purchasePriceEth).sub(purchaseGasCost);
        expect(purchaseWalletBalance).to.equal(expectedBalance);

        // Check Money Flow - Contract
        const postPurchaseContractBalance = await ethers.provider.getBalance(publishedAddress)
        expect(postPurchaseContractBalance).to.equal(0)

        // Check Money Flow - Fee Address
        const postPurchaseFeeBalance = await ethers.provider.getBalance(derivativeFeeSplitAddress)
        const totalFees = ethers.utils.parseEther((DERIVATIVE_FEE * purchaseQuantity).toString())
        const expectedFeeBalance = ethers.BigNumber.from(prePurchaseFeeBalance).add(totalFees)
        expect(postPurchaseFeeBalance).to.equal(expectedFeeBalance)

        // Check Money Flow - Proceeds Address
        const postPurchaseProceedBalance = await ethers.provider.getBalance(creatorSplitAddress)
        const totalProceeds = ethers.utils.parseEther((basePrice * purchaseQuantity).toString())
        const expectedProceedBalance = ethers.BigNumber.from(prePurchaseProceedBalance).add(totalProceeds)
        expect(postPurchaseProceedBalance).to.equal(expectedProceedBalance)



    });
});
