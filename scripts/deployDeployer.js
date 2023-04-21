(async () => {
    try {
      const TestDeployer = await hre.ethers.getContractFactory("TestDeployer");
      const deployerInstance = await TestDeployer.deploy();
  
      await deployerInstance.deployed();
  
      console.log(
        `Deployed deployer contract at ${deployerInstance.address}`
      );
    } catch (err) {
      console.error(err);
      process.exitCode = 1;
    }
  })();
  