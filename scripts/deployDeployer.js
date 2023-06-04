(async () => {
    try {
      const splitMainEthereum = '0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE';
      const titlesController = '0xd9111EbeC09Ae2cb4778e6278d5959929bAA59Cc'

      const TitlesDeployer = await hre.ethers.getContractFactory("TitlesDeployer");
      const deployerInstance = await TitlesDeployer.deploy(splitMainEthereum, titlesController);
  
      await deployerInstance.deployed();
  
      console.log(
        `Deployed deployer contract at ${deployerInstance.address}`
      );
    } catch (err) {
      console.error(err);
      process.exitCode = 1;
    }
  })();
  