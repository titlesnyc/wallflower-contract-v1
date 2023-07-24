(async () => {
    try {

        // Hard-coded addresses
        const splitMainEthereum = '0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE';
        const titlesController = '0xd9111EbeC09Ae2cb4778e6278d5959929bAA59Cc'

        // Deploy implementation
        const RemixImplementation = await hre.ethers.getContractFactory("ERC721Remix");
        const implementation = await RemixImplementation.deploy();

        // Deploy deployer
        const TitlesDeployer = await hre.ethers.getContractFactory("TitlesDeployer");
        const deployer = await TitlesDeployer.deploy(splitMainEthereum, titlesController, implementation.address);
    
        await implementation.deployed();
        await deployer.deployed();
    
        console.log(`Deployed implementation contract at ${implementation.address}`)
        console.log(`Deployed deployer contract at ${deployer.address}`);
    } catch (err) {
        console.error(err);
        process.exitCode = 1;
    }
})();
  