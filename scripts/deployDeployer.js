(async () => {
    try {
      const TitlesDeployer = await hre.ethers.getContractFactory("TitlesDeployer");
      const deployerInstance = await TitlesDeployer.deploy();
  
      await deployerInstance.deployed();
  
      console.log(
        `Deployed deployer contract at ${deployerInstance.address}`
      );
    } catch (err) {
      console.error(err);
      process.exitCode = 1;
    }
  })();
  