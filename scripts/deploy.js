const hre = require("hardhat");

async function main() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const unlockTime = currentTimestampInSeconds + 60;

  const lockedAmount = hre.ethers.parseEther("1");

  // 1. Deploy Lock Contract
  const lock = await hre.ethers.deployContract("Lock", [unlockTime], {
    value: lockedAmount,
  });
  await lock.waitForDeployment();
  console.log(`Lock deployed to ${lock.target}`);

  // 2. Deploy PoS Simulator
  const pos = await hre.ethers.deployContract("PoSSimulator");
  await pos.waitForDeployment();
  
  // Fund the reward pool with 100 ETH from the deployer
  const [deployer] = await hre.ethers.getSigners();
  await deployer.sendTransaction({
    to: pos.target,
    value: hre.ethers.parseEther("100.0")
  });

  console.log(`PoS Simulator deployed to ${pos.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
