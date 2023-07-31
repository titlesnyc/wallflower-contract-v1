(async () => {
    try {

        // Addresses
        const splitMainEthereum = '0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE';

        const titlesController = '0xd9111EbeC09Ae2cb4778e6278d5959929bAA59Cc' // GOERLI (goerli-maxi.eth)
        // const titlesController = '0x38b3C65800382Ff3Da70243C5AeFC0A4adA9f97f' // MAINNET (titlesadmin.eth)

        // Config values
        const distributorFee = 5000
        const secondaryRoyalty = 1000

        // Deploy implementation
        const RemixImplementation = await hre.ethers.getContractFactory("TitlesEditionV1");
        const implementation = await RemixImplementation.deployContract();

        // Deploy deployer
        const TitlesDeployer = await hre.ethers.getContractFactory("TitlesPublisherV1");
        const deployer = await TitlesDeployer.deployContract(splitMainEthereum, titlesController, distributorFee, secondaryRoyalty, implementation.address);
    
        await implementation.waitForDeployment();
        await deployer.waitForDeployment();
    
        console.log(`Deployed implementation contract at ${implementation.address}`)
        console.log(`Deployed deployer contract at ${deployer.address}`);
    } catch (err) {
        console.error(err);
        process.exitCode = 1;
    }
})();
  