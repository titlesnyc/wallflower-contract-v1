const { expect } = require("chai");
const hre = require("hardhat");

// Names
const EDITION_CONTRACT_NAME = "TitlesEditionV1"
const DEPLOYER_CONTRACT_NAME = "TitlesPublisherV1"
const PUBLISH_EVENT_NAME = "EditionPublished"
const SALE_EVENT_NAME = "Sale"

// Deployer config
const splitMainEthereum = '0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE';
const titlesController = '0xd9111EbeC09Ae2cb4778e6278d5959929bAA59Cc'
const distributorFee = 5000
const royaltyBps = 1000

// Contract interaction
const DERIVATIVE_FEE = 0.000999

// Test Addresses
const rainbowDev = '0xd9111EbeC09Ae2cb4778e6278d5959929bAA59Cc'
const metamaskDev = '0xEA7c0d05AE85a02ADd86c0FC7b348c997C0B1fF4'
const secondaryDev = '0x40211097528189E4Aa814bC2d6c76a7117e5a32C'


// =================================================================================================================================================
// =================================================================================================================================================
//                                                          PUBLISHER TESTS
// =================================================================================================================================================
// =================================================================================================================================================


describe("TitlesPublisher", function () {
    it("transfers ownership to controller on construction", async function () {
        const [signer] = await ethers.getSigners()

        // Deploy
        const deployer = await deployContracts(titlesController)

        // Check Owner
        const ownerAddress = await deployer.owner()
        console.log("signer: " + signer.address)
        console.log("Owner: " + ownerAddress)
        expect(ownerAddress).to.equal(titlesController)

    });
    it("is unable to be modifed by a non-owner", async function () {

        const [signer, nonSigner] = await ethers.getSigners()

        const deployer = await deployContracts(titlesController)

        // Check Distributor Fee
        const preDistributorFee = await deployer.splitDistributorFee()
        await expect(deployer.setSplitDistributorFee(10000)).to.be.revertedWith("Ownable: caller is not the owner");
        const postDistributorFee = await deployer.splitDistributorFee()
        expect(postDistributorFee).to.equal(preDistributorFee)

        // Check SecondaryRoyalty
        const preRoyalty = await deployer.secondaryRoyalty()
        await expect(deployer.setSecondaryRoyalty(500)).to.be.revertedWith("Ownable: caller is not the owner");
        const postRoyalty = await deployer.secondaryRoyalty()
        expect(preRoyalty).to.equal(postRoyalty)

        // Check Controller
        const preController = await deployer.controller()
        await expect(deployer.setController(nonSigner.address)).to.be.revertedWith("Ownable: caller is not the owner");
        const postController = await deployer.controller()
        expect(preController).to.equal(postController)

        // Check transferOwnership
        const preOwner = await deployer.owner()
        await expect(deployer.transferOwnership(nonSigner.address)).to.be.revertedWith("Ownable: caller is not the owner");
        const postOwner = await deployer.owner()
        expect(preOwner).to.equal(postOwner)

    });
    it("is able to be modifed by the owner", async function () {
        const [signer, nonSigner] = await ethers.getSigners()
        const deployer = await deployContracts(signer.address)

        // Change Distributor Fee
        const preDistributorFee = await deployer.splitDistributorFee()
        const newDistributorFee = 10000
        const changeTx = await deployer.setSplitDistributorFee(newDistributorFee)
        const postDistributorFee = await deployer.splitDistributorFee()
        expect(postDistributorFee).to.equal(newDistributorFee)

        // Check SecondaryRoyalty
        const preRoyalty = await deployer.secondaryRoyalty()
        const newRoyalty = 500
        const changeRoyaltyTx = await deployer.setSecondaryRoyalty(newRoyalty)
        const postRoyalty = await deployer.secondaryRoyalty()
        expect(postRoyalty).to.equal(newRoyalty)

        // Check Controller
        const preController = await deployer.controller()
        const newController = nonSigner.address
        const changeControllerTx = await deployer.setController(newController)
        const postController = await deployer.controller()
        expect(postController).to.equal(newController)
    });
    it("is able to transfer ownership", async function () {
        const [signer, nonSigner] = await ethers.getSigners()
        const deployer = await deployContracts(nonSigner.address)

        // Non-owner (signer) Shouldn't be able to modify
        const preDistributorFee = await deployer.splitDistributorFee()
        await expect(deployer.setSplitDistributorFee(10000)).to.be.revertedWith("Ownable: caller is not the owner");
        const postDistributorFee = await deployer.splitDistributorFee()
        expect(postDistributorFee).to.equal(preDistributorFee)
    

        // Owner (non-signer) should be able to transfer ownership to signer
        const preOwner = await deployer.owner()
        const transferTx = await deployer.connect(nonSigner).transferOwnership(signer.address)
        const postOwner = await deployer.owner()
        expect(postOwner).to.equal(signer.address)

        // Old owner (non-Signer) shouldn't be able to modify
        const preDistributorFee2 = await deployer.splitDistributorFee()
        await expect(deployer.connect(nonSigner).setSplitDistributorFee(10000)).to.be.revertedWith("Ownable: caller is not the owner");
        const postDistributorFee2 = await deployer.splitDistributorFee()
        expect(postDistributorFee2).to.equal(preDistributorFee2)

        // New owner (signer) should be able to modify
        const preDistributorFee3 = await deployer.splitDistributorFee()
        const newDistributorFee = 10000
        const changeTx = await deployer.setSplitDistributorFee(newDistributorFee)
        const postDistributorFee3 = await deployer.splitDistributorFee()
        expect(postDistributorFee3).to.equal(newDistributorFee)
    });
    it("anybody is able to publish a Titles Remix", async function () {
        const [signer, nonSigner] = await ethers.getSigners()
        const deployer = await deployContracts(titlesController)

        const input = standardInput()
        const publishedTx = await publishEdition(deployer, input)
        const publishedAddress = await getPublishedAddress(publishedTx)
        await testContractData(publishedAddress, input)
        await testPurchase(publishedAddress, input)

        const publishedTx2 = await publishEdition(deployer.connect(nonSigner), input)
        const publishedAddress2 = await getPublishedAddress(publishedTx2)
        await testContractData(publishedAddress2, input)
        await testPurchase(publishedAddress2, input)
    })
    it("editions with different input types can be published", async function () {
        const deployer = await deployContracts(titlesController)

        const input = standardInput()
        const publishedTx = await publishEdition(deployer, input)
        const publishedAddress = await getPublishedAddress(publishedTx)
        await testContractData(publishedAddress, input)
        await testPurchase(publishedAddress, input)

        const input2 = singleAllocationInput()
        const publishedTx2 = await publishEdition(deployer, input2)
        const publishedAddress2 = await getPublishedAddress(publishedTx2)
        await testContractData(publishedAddress2, input2)
        await testPurchase(publishedAddress2, input2)

        const input3 = titlesAppInput()
        const publishedTx3 = await publishEdition(deployer, input3)
        const publishedAddress3 = await getPublishedAddress(publishedTx3)
        await testContractData(publishedAddress3, input3)
        await testPurchase(publishedAddress3, input3)

    })
    it("splits don't get created for single allocation recipients", async function () {
        const [signer, nonSigner] = await ethers.getSigners()
        const deployer = await deployContracts(titlesController)

        // Set proceed as single addresses
        const input = singleAllocationInput()
        const publishedTx = await publishEdition(deployer, input)
        const event = await getPublishedEvent(publishedTx)

        const proceedRecipient = event.args.creatorProceedRecipient
        const feeRecipient = event.args.derivativeFeeRecipient

        expect(proceedRecipient).to.equal(input.proceedAccounts[0])
        expect(feeRecipient).to.equal(input.feeAccounts[0])
    })
});

// =================================================================================================================================================
// =================================================================================================================================================
//                                                          EDITION TESTS
// =================================================================================================================================================
// =================================================================================================================================================

describe("TitlesEdition", function () {
    it("base implementation can't be interacted with", async function () {
        const implementation = await hre.ethers.deployContract(EDITION_CONTRACT_NAME);
        console.log("🛠 Implementation address: " + implementation.address)

        // Initialized
        const input = standardInput()
        await expect(implementation.initialize(
            input.creatorAddress, 
            input.name, 
            input.symbol, 
            input.uri, 
            rainbowDev, // Proceed recipient
            metamaskDev, // Fee recipient
            input.priceWei, 
            input.supply, 
            input.mintLimit, 
            input.endTime, 
            royaltyBps
        )).to.be.revertedWith("Initializable: contract is already initialized");

        // Purchased
        const purchaseQuantity = 1
        const basePrice = 0
        const purchasePrice = basePrice + DERIVATIVE_FEE
        const purchasePriceEth = ethers.utils.parseEther(purchasePrice.toString());
        const options = {
            value: purchasePriceEth
        }
        await expect(implementation.purchase(purchaseQuantity, options)).to.be.revertedWith('Sale has ended')
    })
    it("Royalty is set to what the deployer is set to", async function () {
        const [signer, nonSigner] = await ethers.getSigners()

        // Deploy with different royalty
        const royaltyOverride = 2000
        const deployer = await deployContracts(signer.address, royaltyOverride)

        // Publish
        const input = standardInput()
        const publishedTx = await publishEdition(deployer, input)
        const publishedAddress = await getPublishedAddress(publishedTx)
        await testContractData(publishedAddress, input, royaltyOverride) // Royalty gets checked in here
        await testPurchase(publishedAddress, input)

        // Adjust royalty again
        const newRoyalty = 500
        const changeRoyaltyTx = await deployer.setSecondaryRoyalty(newRoyalty)
        const postRoyalty = await deployer.secondaryRoyalty()
        expect(postRoyalty).to.equal(newRoyalty)

        // Publish & check royalty
        const publishedTx2 = await publishEdition(deployer, input)
        const publishedAddress2 = await getPublishedAddress(publishedTx2)
        await testContractData(publishedAddress2, input, newRoyalty)
        await testPurchase(publishedAddress2, input)
    })
    it("ETH can be withdrawn but only by owner", async function () {
        const [signer, nonSigner] = await ethers.getSigners()
        const deployer = await deployContracts(nonSigner.address)

        // Publish
        const input = standardInput()
        input.creatorAddress = nonSigner.address
        const publishedTx = await publishEdition(deployer, input)
        const publishedAddress = await getPublishedAddress(publishedTx)
        await testContractData(publishedAddress, input)
        const remix = await ethers.getContractAt(EDITION_CONTRACT_NAME, publishedAddress)

        // Send ETH to contract
        const amount = ethers.utils.parseEther("1"); // 1 ETH
        await signer.sendTransaction({
            to: publishedAddress,
            value: amount
        });
        const contractBalance = await ethers.provider.getBalance(publishedAddress);
        expect(contractBalance).to.equal(amount);

        // Confirm non-owner can't withdraw
        await expect(remix.withdrawETH()).to.be.revertedWith('Ownable: caller is not the owner')

        // Withdraw by owner
        const preWithdrawerBalance = await ethers.provider.getBalance(nonSigner.address)
        const withdrawTx = await remix.connect(nonSigner).withdrawETH()
        const withdrawTxReceipt = await withdrawTx.wait()
        const withdrawGasCost = ethers.BigNumber.from(withdrawTxReceipt.effectiveGasPrice.mul(withdrawTxReceipt.cumulativeGasUsed))

        // Check Withdrawer balance
        const postWithdrawerBalance = await ethers.provider.getBalance(nonSigner.address)
        const expectedBalance = ethers.BigNumber.from(preWithdrawerBalance).add(amount).sub(withdrawGasCost)
        expect(postWithdrawerBalance).to.equal(expectedBalance);

        // Check contract balance
        const postContractBalance = await ethers.provider.getBalance(publishedAddress);
        expect(postContractBalance).to.equal(0);
    })
    it("NFTs can't be purchased if sold out", async function () {
        const [signer, nonSigner] = await ethers.getSigners()
        const deployer = await deployContracts(nonSigner.address)

        // Publish
        const input = standardInput()
        input.supply = 2
        const publishedTx = await publishEdition(deployer, input)
        const publishedAddress = await getPublishedAddress(publishedTx)
        await testContractData(publishedAddress, input)
        await testPurchase(publishedAddress, input)
        await testPurchase(publishedAddress, input)
        await expect(testPurchase(publishedAddress, input)).to.be.revertedWith('This drop is sold out')


    })
    it("NFTs can't be purchased if minting too many per wallet", async function () {
        const [signer, nonSigner] = await ethers.getSigners()
        const deployer = await deployContracts(nonSigner.address)

        // Publish
        const input = standardInput()
        input.mintLimit = 2
        const publishedTx = await publishEdition(deployer, input)
        const publishedAddress = await getPublishedAddress(publishedTx)
        await testContractData(publishedAddress, input)

        // Try to purchase 3 at once
        await expect(testPurchase(publishedAddress, input, 3)).to.be.revertedWith('This wallet cannot purchase that many')

        // Try to purchase 3 in succession
        await testPurchase(publishedAddress, input, 2)
        await expect(testPurchase(publishedAddress, input)).to.be.revertedWith('This wallet cannot purchase that many')
    })
    it("NFTs can't be purchased if past end date", async function () {
        const [signer, nonSigner] = await ethers.getSigners()
        const deployer = await deployContracts(nonSigner.address)

        // Publish
        const input = standardInput()
        input.endTime = 2 // long in the past
        
        const publishedTx = await publishEdition(deployer, input)
        const publishedAddress = await getPublishedAddress(publishedTx)
        await testContractData(publishedAddress, input)

        await expect(testPurchase(publishedAddress, input)).to.be.revertedWith('Sale has ended')
    })
    it("sales emit events", async function () {
        const [signer, nonSigner] = await ethers.getSigners()
        const deployer = await deployContracts(nonSigner.address)

        // Publish
        const input = standardInput()
        
        const publishedTx = await publishEdition(deployer, input)
        const publishedAddress = await getPublishedAddress(publishedTx)
        await testContractData(publishedAddress, input)
        await testPurchase(publishedAddress, input)
    })
})

// =================================================================================================================================================
// =================================================================================================================================================
//                                                          HELPER FUNCTIONS
// =================================================================================================================================================
// =================================================================================================================================================



async function deployContracts(controller, royaltyOverride) {
    console.log("1️⃣ - Starting deployment")

    // Deploy Implementation
    const implementation = await hre.ethers.deployContract(EDITION_CONTRACT_NAME);
    console.log("🛠 Implementation address: " + implementation.address)

    const royalty = royaltyOverride ?? royaltyBps

    // Deploy Deployer
    const deployer = await hre.ethers.deployContract(DEPLOYER_CONTRACT_NAME, [splitMainEthereum, controller, distributorFee, royalty, implementation.address]);
    console.log("🛠 Deployer address: " + deployer.address)
    console.log("2️⃣ - Deployed deployer")

    // Check Base Implementation
    const baseImplementation = await deployer.titlesEditionImplementation()
    expect(baseImplementation).to.equal(implementation.address)

    return deployer
}

function checkAllocations(input) {
    const totalProceedAllocation = input.proceedAllocations.reduce((a, b) => a + b)
    expect(totalProceedAllocation).to.equal(1000000)
    const totalFeeAllocation = input.feeAllocations.reduce((a, b) => a + b)
    expect(totalFeeAllocation).to.equal(1000000)
}

async function publishEdition(deployer, input) {
    const publishTx = await deployer.publishEdition(
        input.creatorAddress, 
        input.name, 
        input.symbol, 
        input.uri,
        input.proceedAccounts, 
        input.proceedAllocations, 
        input.feeAccounts, 
        input.feeAllocations, 
        input.priceWei, 
        input.supply, 
        input.mintLimit, 
        input.endTime
    )
    return publishTx
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

async function getPublishedEvent(publishTx) {
    const publishReceipt = await publishTx.wait()
    const event = publishReceipt.events?.find(e => e.event === PUBLISH_EVENT_NAME)
    expect(event).to.not.be.undefined;
    return event
}

async function getSaleEvent(saleTx) {
    const saleReceipt = await saleTx.wait()
    const event = saleReceipt.events?.find(e => e.event === SALE_EVENT_NAME)
    expect(event).to.not.be.undefined;
    return event
}

async function testContractData(publishedAddress, input, royaltyOverride) {
    const remix = await ethers.getContractAt(EDITION_CONTRACT_NAME, publishedAddress)

    // Check Owner
    const ownerAddress = await remix.owner()
    expect(ownerAddress).to.equal(input.creatorAddress)

    // Check contractURI
    const contractUri = await remix.contractURI()
    expect(contractUri).to.equal(input.uri);

    // Check no tokens
    const supply = await remix.totalSupply()
    expect(supply).to.equal(0)

    // Check royalty
    const [recipient, amount] = await remix.royaltyInfo(0, 10000) // 10,000 Scale for royaltyBps
    const proceedRecipient = await remix.creatorProceedRecipient()
    expect(recipient).to.equal(proceedRecipient)
    expect(amount).to.equal(royaltyOverride ?? royaltyBps)
}

async function testPurchase(publishedAddress, input, quantityOverride) {
    const [signer] = await ethers.getSigners();
    const remix = await ethers.getContractAt(EDITION_CONTRACT_NAME, publishedAddress)

    // Get Addresses
    const creatorSplitAddress = await remix.creatorProceedRecipient()
    const derivativeFeeSplitAddress = await remix.derivativeFeeRecipient()

    // Save balances
    const prePurchaseWalletBalance = await signer.getBalance();
    const prePurchaseContractBalance = await ethers.provider.getBalance(publishedAddress)
    const prePurchaseProceedBalance = await ethers.provider.getBalance(creatorSplitAddress)
    const prePurchaseFeeBalance = await ethers.provider.getBalance(derivativeFeeSplitAddress)

    // Purchase
    const purchaseQuantity = quantityOverride ?? 1
    const basePrice = input.priceEth
    const purchasePrice = (basePrice + DERIVATIVE_FEE) * purchaseQuantity
    const purchasePriceEth = ethers.utils.parseEther(purchasePrice.toString());
    const options = {
        value: purchasePriceEth
    }
    const purchaseTx = await remix.purchase(purchaseQuantity, options)
    const purchaseTxReceipt = await purchaseTx.wait()
    const purchaseGasCost = ethers.BigNumber.from(purchaseTxReceipt.effectiveGasPrice.mul(purchaseTxReceipt.cumulativeGasUsed))

    // Check Sale event
    const saleEvent = await getSaleEvent(purchaseTx)
    expect (saleEvent.args.quantity).to.equal(purchaseQuantity)

    // Check NFT exists & URI
    const remixUri = await remix.tokenURI(0)
    expect(remixUri).to.equal(input.uri);
    const tokenOwner = await remix.ownerOf(0)
    expect(tokenOwner).to.equal(signer.address)

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

// =================================================================================================================================================
// =================================================================================================================================================
//                                                          INPUT DATA
// =================================================================================================================================================
// =================================================================================================================================================

function standardInput() {
    const priceEth = 0.1
    const input = {
        creatorAddress: secondaryDev,
        name: 'Test Name',
        symbol: 'TS',
        uri: 'ipfs://testURI',
        priceEth: priceEth,
        priceWei: ethers.utils.parseUnits(priceEth.toString(), "ether"),
        supply: 10,
        mintLimit: 2,
        endTime: 0,
        proceedAccounts: [rainbowDev, metamaskDev],
        proceedAllocations: [700000, 300000],
        feeAccounts: [rainbowDev, metamaskDev],
        feeAllocations: [700000, 300000]
    }
    checkAllocations(input)
    return input
}

function singleAllocationInput() {
    const priceEth = 0.1
    const input = {
        creatorAddress: '0x40211097528189E4Aa814bC2d6c76a7117e5a32C',
        name: 'Meta',
        symbol: 'META',
        uri: 'https://ipfs.thirdwebcdn.com/ipfs/QmeDPAdEdmrjc9d3NeMt3DzusUDG5BjvrLQSpKgXYcG867/0',
        priceEth: priceEth,
        priceWei: ethers.utils.parseUnits(priceEth.toString(), "ether"),
        supply: 25,
        mintLimit: 3,
        endTime: 1686286044,
        proceedAccounts: [rainbowDev],
        proceedAllocations: [1000000],
        feeAccounts: [metamaskDev],
        feeAllocations: [1000000]
    }
    checkAllocations(input)
    return input
}

function titlesAppInput() {
    const priceEth = 0
    const input = {
        creatorAddress: '0x40211097528189E4Aa814bC2d6c76a7117e5a32C',
        name: 'Meta',
        symbol: 'META',
        uri: 'https://ipfs.thirdwebcdn.com/ipfs/QmeDPAdEdmrjc9d3NeMt3DzusUDG5BjvrLQSpKgXYcG867/0',
        priceEth: priceEth,
        priceWei: ethers.utils.parseUnits(priceEth.toString(), "ether"),
        supply: 0,
        mintLimit: 3,
        endTime: 1686286044,
        proceedAccounts: ['0x40211097528189E4Aa814bC2d6c76a7117e5a32C', '0xF2254525E9f2147990279BA450fb23432040dfdd', '0xFFe7FAc6E73627D2f00A771a749E38fa781E5d67', ],
        proceedAllocations: [600000, 200000, 200000],
        feeAccounts: ['0x40211097528189E4Aa814bC2d6c76a7117e5a32C', '0xF2254525E9f2147990279BA450fb23432040dfdd', '0xFFe7FAc6E73627D2f00A771a749E38fa781E5d67', ],
        feeAllocations: [600000, 200000, 200000]
    }
    checkAllocations(input)
    return input
}



