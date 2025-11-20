const { ethers } = require("hardhat");
const fs = require("fs");

async function weightedRandomSelection(validators, stakes) {
  const totalStake = stakes.reduce((a, b) => a + b, 0n);
  const random = BigInt(Math.floor(Math.random() * Number(totalStake)));
  
  let cumulative = 0n;
  for (let i = 0; i < validators.length; i++) {
    cumulative += stakes[i];
    if (random < cumulative) {
      return i;
    }
  }
  return validators.length - 1;
}

async function main() {
  console.log("\n🏦 LAB 5: Proof of Stake Validator Simulation\n");
  console.log("=".repeat(50));
  
  // Check if PoS contract is deployed
  let posAddress;
  try {
    posAddress = fs.readFileSync("CONTRACT_ADDRESS.txt", "utf8").trim();
  } catch {
    console.log("❌ PoS contract not found. Deploy it first:");
    console.log("   npx hardhat run scripts/deploy.js --network localhost");
    return;
  }
  
  const PoSABI = require("../../frontend/src/PoS.json");
  const contract = new ethers.Contract(posAddress, PoSABI, ethers.provider);
  
  // Get all validators
  console.log("\n--- Fetching Validators ---");
  const stakeEvents = await contract.queryFilter("Staked", 0);
  
  if (stakeEvents.length === 0) {
    console.log("❌ No validators found. Stake some ETH first!");
    console.log("\nTo stake:");
    console.log("   npx hardhat console --network localhost");
    console.log("   > const contract = await ethers.getContractAt('PoSSimulator', '" + posAddress + "')");
    console.log("   > await contract.stake({ value: ethers.parseEther('2.0') })");
    return;
  }
  
  const validators = [...new Set(stakeEvents.map(e => e.args[0]))];
  
  console.log(`Found ${validators.length} validators\n`);
  
  // Get stakes for each validator
  const stakes = await Promise.all(
    validators.map(v => contract.stakes(v))
  );
  
  const totalStake = stakes.reduce((a, b) => a + b, 0n);
  
  console.log("--- Validator Pool ---");
  validators.forEach((v, i) => {
    const stakeETH = ethers.formatEther(stakes[i]);
    const probability = (Number(stakes[i]) * 100 / Number(totalStake)).toFixed(2);
    console.log(`${i + 1}. ${v}`);
    console.log(`   Stake: ${stakeETH} ETH`);
    console.log(`   Selection Probability: ${probability}%`);
  });
  
  console.log(`\nTotal Network Stake: ${ethers.formatEther(totalStake)} ETH`);
  
  // Run simulation
  console.log("\n--- Running 100 Block Proposals ---");
  const selections = new Array(validators.length).fill(0);
  
  for (let i = 0; i < 100; i++) {
    const selected = await weightedRandomSelection(validators, stakes);
    selections[selected]++;
  }
  
  console.log("\n--- Selection Results ---");
  validators.forEach((v, i) => {
    const expected = (Number(stakes[i]) * 100 / Number(totalStake)).toFixed(1);
    const actual = selections[i];
    console.log(`${v.slice(0, 10)}...`);
    console.log(`   Expected: ${expected}% | Actual: ${actual}%`);
    console.log(`   Selected: ${actual} times`);
  });
  
  console.log("\n" + "=".repeat(50));
  console.log("✅ Lab 5 Complete!");
  console.log("\n💡 Observations:");
  console.log("   - Higher stake = More selections (but not guaranteed)");
  console.log("   - Over time, selections match stake proportions");
  console.log("   - This is how Ethereum achieves fair consensus");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

