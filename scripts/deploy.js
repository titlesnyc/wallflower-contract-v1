(async () => {
    try {

        // Addresses
        const splitMainEthereum = '0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE';

        const titlesController = '0xEA7c0d05AE85a02ADd86c0FC7b348c997C0B1fF4' // GOERLI (deployer)
        // const titlesController = '0x38b3C65800382Ff3Da70243C5AeFC0A4adA9f97f' // MAINNET (titlesadmin.eth)

        // Config values
        const distributorFee = 5000
        const secondaryRoyalty = 1000

        // Deploy implementation
        const implementation = await hre.ethers.deployContract("TitlesEditionV1");

        // Deploy deployer
        const deployer = await hre.ethers.deployContract("TitlesPublisherV1", [splitMainEthereum, titlesController, distributorFee, secondaryRoyalty, implementation.address]);
    
        await implementation.deployed();
        await deployer.deployed();
    
        console.log(`Deployed implementation contract at ${implementation.address}`)
        console.log(`Deployed deployer contract at ${deployer.address}`);
    } catch (err) {
        console.error(err);
        process.exitCode = 1;
    }
})();
  