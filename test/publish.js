const { expect } = require("chai");
const hre = require("hardhat");

// const { SplitsClient } = require('@0xsplits/splits-sdk')

describe("TitlesDeployer", function () {
    it("able to publish a Titles Remix", async function () {

        const splitMainGoerli = '0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE';
        const splitMainEthereum = '0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE';

        console.log("1️⃣ - Test started")

        const TitlesDeployer = await hre.ethers.getContractFactory("TitlesDeployer");
        const deployer = await TitlesDeployer.deploy(splitMainEthereum);

        console.log("2️⃣ - Deployed deployer w/ Split Main")

        const name = 'Test Name'
        const symbol = 'TS'
        const inputUri = 'ipfs://testURI'

        const rainbowDev = '0xd9111EbeC09Ae2cb4778e6278d5959929bAA59Cc'
        const metamaskDev = '0xEA7c0d05AE85a02ADd86c0FC7b348c997C0B1fF4'
        const accounts = [rainbowDev, metamaskDev]
        const allocations = [700000, 300000]

        await deployer.publishRemix(name, symbol, inputUri, accounts, allocations)
        const publishedAddress = await deployer.remixContractArray(0)

        console.log("3️⃣ - Published remix")
        console.log("Remix address:  " + publishedAddress)

        const remix = await ethers.getContractAt('ERC721Remix', publishedAddress)
        await remix.buyToken()
        const remixUri = await remix.tokenURI(0)
        expect(remixUri).to.equal(inputUri);

        const masterUri = await remix.remixUri()
        expect(masterUri).to.equal(inputUri);

        const splitAddress = await remix.splitAddress()
        console.log("Split address:  " + splitAddress)


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
