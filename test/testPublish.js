const { expect } = require("chai");
const hre = require("hardhat");

// Names
const EDITION_CONTRACT_NAME = "TitlesEditionV1"
const DEPLOYER_CONTRACT_NAME = "TitlesPublisherV1"
const PUBLISH_EVENT_NAME = "EditionPublished"

// Deployer config
const splitMainEthereum = '0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE';
const titlesController = '0xd9111EbeC09Ae2cb4778e6278d5959929bAA59Cc'
const distributorFee = 5000
const ROYALTY_BPS = 1000

// Contract interaction
const DERIVATIVE_FEE = 0.000999

async function deployContracts() {
    console.log("1️⃣ - Starting deployment")

    // Deploy Implementation
    const implementation = await hre.ethers.deployContract(EDITION_CONTRACT_NAME);
    console.log("🛠 Implementation address: " + implementation.address)

    // Deploy Deployer
    const deployer = await hre.ethers.deployContract(DEPLOYER_CONTRACT_NAME, [splitMainEthereum, titlesController, distributorFee, ROYALTY_BPS, implementation.address]);
    console.log("🛠 Deployer address: " + deployer.address)
    console.log("2️⃣ - Deployed deployer")

    return deployer
}

async function getPublishedAddress(publishTx) {
    const publishReceipt = await publishTx.wait()
    const event = publishReceipt.events?.find(e => e.event === PUBLISH_EVENT_NAME)
    expect(event).to.not.be.undefined;
    const publishedAddress = event.args.remixContractAddress

    console.log("3️⃣ - Published remix")
    console.log("Remix address:  " + publishedAddress)

    return publishedAddress
}

async function testPurchase(publishedAddress, input) {
    // Get Signer
    const [signer] = await ethers.getSigners();

    // Get Remix Contract
    const remix = await ethers.getContractAt(EDITION_CONTRACT_NAME, publishedAddress)

    // Get Addresses
    const creatorSplitAddress = await remix.creatorProceedRecipient()
    console.log("Creator split address:  " + creatorSplitAddress)
    const derivativeFeeSplitAddress = await remix.derivativeFeeRecipient()
    console.log("Derivatve Fee split address: " + derivativeFeeSplitAddress)

    const ownerAddress = await remix.owner()
    console.log("Owner address: " + ownerAddress)
    expect(ownerAddress).to.equal(input.creatorAddress)

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
    expect(remixUri).to.equal(input.uri);

    const masterUri = await remix.contractURI()
    expect(masterUri).to.equal(input.uri);

    // Check Money Flow - Purchaser
    const purchaseWalletBalance = await signer.getBalance();
    const expectedBalance = prePurchaseWalletBalance.sub(purchasePriceEth).sub(purchaseGasCost);
    expect(purchaseWalletBalance).to.equal(expectedBalance);

    // Check Money Flow - Contract
    const postPurchaseContractBalance = await ethers.provider.getBalance(publishedAddress)
    expect(postPurchaseContractBalance).to.equal(prePurchaseContractBalance)

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
    
}


describe("TitlesPublisher", function () {
    it("able to publish a Titles Remix", async function () {
        // Deploy Contracts
        const deployer = await deployContracts()

        // Publish Information
        const rainbowDev = '0xd9111EbeC09Ae2cb4778e6278d5959929bAA59Cc'
        const metamaskDev = '0xEA7c0d05AE85a02ADd86c0FC7b348c997C0B1fF4'
        const priceEth = 0.1
        const [signer] = await ethers.getSigners();


        const input = {
            creatorAddress: signer.address,
            name: 'Test Name',
            symbol: 'TS',
            uri: 'ipfs://testURI',
            priceEth: priceEth,
            priceWei: ethers.utils.parseUnits(priceEth.toString(), "ether"),
            supply: 10,
            mintLimit: 2,
            endTime: 0,
            accounts: [rainbowDev, metamaskDev],
            allocations: [700000, 300000]
        }

        // Publish
        const publishTx = await deployer.publishEdition(
            input.creatorAddress, 
            input.name, 
            input.symbol, 
            input.uri,
            input.accounts, 
            input.allocations, 
            input.accounts, 
            input.allocations, 
            input.priceWei, 
            input.supply, 
            input.mintLimit, 
            input.endTime
        )
        const publishedAddress = await getPublishedAddress(publishTx)
        
        await testPurchase(publishedAddress, input)


        /* TODO: Further test
            - Buy an NFT
            - Distribute the funds
            - Make sure split wallets and allocations are right
        */

    });

    it("able to publish with single allocation arrays", async function () {
        // Deploy
        const deployer = await deployContracts()

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

        // Publish
        const publishTx = await deployer.publishEdition(creatorAddress, name, symbol, inputUri, proceedAccounts, allocations, feeAccounts, allocations, priceWei, supply, mintLimit, endTime)
        const publishedAddress = await getPublishedAddress(publishTx)
        const remix = await ethers.getContractAt(EDITION_CONTRACT_NAME, publishedAddress)

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

        const masterUri = await remix.contractURI()
        expect(masterUri).to.equal(inputUri);

        // Check Money Flow - Purchaser
        const purchaseWalletBalance = await signer.getBalance();
        const expectedBalance = prePurchaseWalletBalance.sub(purchasePriceEth).sub(purchaseGasCost);
        expect(purchaseWalletBalance).to.equal(expectedBalance);

        // Check Money Flow - Contract
        const postPurchaseContractBalance = await ethers.provider.getBalance(publishedAddress)
        expect(postPurchaseContractBalance).to.equal(prePurchaseContractBalance)

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

        // Get Signer
        const [signer] = await ethers.getSigners();
        console.log("Signer address: " + signer.address)

        // Deploy Contracts
        const deployer = await deployContracts()

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

        // Publish
        const publishTx = await deployer.publishEdition(creatorAddress, name, symbol, inputUri, accounts, allocations, accounts, allocations, priceWei, supply, mintLimit, endTime)
        const publishedAddress = await getPublishedAddress(publishTx)
        const remix = await ethers.getContractAt(EDITION_CONTRACT_NAME, publishedAddress)

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

        const masterUri = await remix.contractURI()
        expect(masterUri).to.equal(inputUri);

        // Check Money Flow - Purchaser
        const purchaseWalletBalance = await signer.getBalance();
        const expectedBalance = prePurchaseWalletBalance.sub(purchasePriceEth).sub(purchaseGasCost);
        expect(purchaseWalletBalance).to.equal(expectedBalance);

        // Check Money Flow - Contract
        const postPurchaseContractBalance = await ethers.provider.getBalance(publishedAddress)
        expect(postPurchaseContractBalance).to.equal(prePurchaseContractBalance)

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


        // const { SplitsClient } = require('@0xsplits/splits-sdk')

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