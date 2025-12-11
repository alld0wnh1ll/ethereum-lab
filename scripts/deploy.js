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

  // 2. Deploy PoS Simulator (deployer becomes instructor automatically)
  const [deployer] = await hre.ethers.getSigners();
  console.log(`\n🎓 Deploying PoS Simulator with instructor: ${deployer.address}`);
  
  const pos = await hre.ethers.deployContract("PoSSimulator");
  await pos.waitForDeployment();
  
  // Fund the reward pool with 200 ETH from the deployer
  // This provides enough for rewards, slashing burns, and extended demos
  const fundingAmount = hre.ethers.parseEther("200.0");
  await deployer.sendTransaction({
    to: pos.target,
    value: fundingAmount
  });

  console.log(`\n✅ PoS Simulator deployed to: ${pos.target}`);
  console.log(`💰 Reward pool funded with: 200 ETH`);
  console.log(`\n📋 Contract Features:`);
  console.log(`   - Minimum stake: 1 ETH`);
  console.log(`   - Unbonding period: 60 seconds`);
  console.log(`   - Min stake duration: 30 seconds`);
  console.log(`   - Epoch duration: 30 seconds`);
  console.log(`   - Slash penalty: 5%`);
  console.log(`   - Attestation penalty: 0.1%`);
  console.log(`   - Block reward: 0.01 ETH`);
  console.log(`\n🎛️ Instructor Commands (from instructor dashboard):`);
  console.log(`   - Slash validators for misbehavior`);
  console.log(`   - Simulate block proposals`);
  console.log(`   - Check missed attestations`);
  console.log(`\n📣 Share this contract address with students: ${pos.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
