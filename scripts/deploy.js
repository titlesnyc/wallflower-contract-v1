(async () => {
    try {

        const EDITION_CONTRACT_NAME = "TestEditionV1"
        const DEPLOYER_CONTRACT_NAME = "TestPublisherV1"

        // Addresses
        const splitMainEthereum = '0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE';

        // Deployer Addresses
        const [defaultDeployer, prodDeployer] = await ethers.getSigners();

        // Controller addresses
        const titlesControllerGoerli = '0xEA7c0d05AE85a02ADd86c0FC7b348c997C0B1fF4' // GOERLI (deployer)
        const titlesControllerMainnet = '0x38b3C65800382Ff3Da70243C5AeFC0A4adA9f97f' // MAINNET (titlesadmin.eth)
        const titlesControllerEOA = '0xEA7c0d05AE85a02ADd86c0FC7b348c997C0B1fF4' // EOA on all chains

        // ======================================================
        //    GOERLI / MAINNET CONFIG
        const deployerAddress = defaultDeployer // prodDeployer
        const titlesController = titlesControllerEOA // controller address
        // ======================================================

        // Config values
        const distributorFee = 5000
        const secondaryRoyalty = 1000

        console.log("pre-deploy")

        // Deploy implementation
        const editionFactory = await ethers.getContractFactory(EDITION_CONTRACT_NAME)
        const implementation = await editionFactory.connect(deployerAddress).deploy();

        console.log("post-deploy")

        // Deploy deployer
        const publisherFactory = await ethers.getContractFactory(DEPLOYER_CONTRACT_NAME)
        const deployer = await publisherFactory.connect(deployerAddress).deploy(splitMainEthereum, titlesController, distributorFee, secondaryRoyalty, implementation.address);

        await implementation.deployed();
        await deployer.deployed();

        console.log(`🚀 Deployed implementation contract at ::::::: ${implementation.address}`)
        console.log(`🚀 Deployed deployer contract at ::::::::::::: ${deployer.address}`);
    } catch (err) {
        console.error(err);
        process.exitCode = 1;
    }
})();
  