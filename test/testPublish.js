const { expect } = require("chai");
const hre = require("hardhat");

// const { SplitsClient } = require('@0xsplits/splits-sdk')

describe("TitlesDeployer", function () {
    it("able to publish a Titles Remix", async function () {

        const splitMainGoerli = '0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE';
        const splitMainEthereum = '0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE';

        console.log("1️⃣ - Test started")

        // Deploy Deployer
        const TitlesDeployer = await hre.ethers.getContractFactory("TitlesDeployer");
        const deployer = await TitlesDeployer.deploy(splitMainEthereum);

        console.log("Deployer address: " + deployer)

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
        await deployer.publishRemix(creatorAddress, name, symbol, inputUri, accounts, allocations, priceWei, supply, mintLimit, endTime)
        const publishedAddress = await deployer.remixContractArray(0)

        console.log("3️⃣ - Published remix")
        console.log("Remix address:  " + publishedAddress)

        const remix = await ethers.getContractAt('ERC721Remix', publishedAddress)


        // Save balances
        const prePurchaseWalletBalance = await signer.getBalance();
        const prePurchaseContractBalance = await ethers.provider.getBalance(publishedAddress)

        // Purchase
        const purchasePriceEth = ethers.utils.parseEther('0.1');
        const options = {
            value: purchasePriceEth
        }
        const purchaseTx = await remix.purchase(1, options)
        const purchaseTxReceipt = await purchaseTx.wait()
        const purchaseGasCost = ethers.BigNumber.from(purchaseTxReceipt.effectiveGasPrice.mul(purchaseTxReceipt.cumulativeGasUsed))

        // Check NFT Data
        const remixUri = await remix.tokenURI(0)
        expect(remixUri).to.equal(inputUri);

        const masterUri = await remix.remixUri()
        expect(masterUri).to.equal(inputUri);

        const splitAddress = await remix.splitAddress()
        console.log("Split address:  " + splitAddress)

        const ownerAddress = await remix.owner()
        console.log("Owner address: " + ownerAddress)
        expect(ownerAddress).to.equal(creatorAddress)


        // Check Money Flow - Purchaser
        const purchaseWalletBalance = await signer.getBalance();
        const expectedBalance = prePurchaseWalletBalance.sub(purchasePriceEth).sub(purchaseGasCost);
        expect(purchaseWalletBalance).to.equal(expectedBalance);

        // Check Money Flow - Contract
        const postPurchaseContractBalance = await ethers.provider.getBalance(publishedAddress)
        const expectedContractBalance = prePurchaseContractBalance + purchasePriceEth
        expect(postPurchaseContractBalance).to.equal(expectedContractBalance)


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
});
