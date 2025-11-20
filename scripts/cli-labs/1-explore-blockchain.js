const { ethers } = require("hardhat");

async function main() {
  console.log("\n🔍 LAB 1: Exploring the Blockchain\n");
  console.log("=" .repeat(50));
  
  const provider = ethers.provider;
  
  // Get latest block
  const blockNumber = await provider.getBlockNumber();
  console.log("\n📊 Current Block Number:", blockNumber);
  
  // Get block details
  const block = await provider.getBlock(blockNumber);
  console.log("\n--- Block Details ---");
  console.log("Hash:", block.hash);
  console.log("Parent Hash:", block.parentHash);
  console.log("Timestamp:", new Date(block.timestamp * 1000).toLocaleString());
  console.log("Transactions:", block.transactions.length);
  console.log("Gas Used:", block.gasUsed.toString());
  console.log("Gas Limit:", block.gasLimit.toString());
  console.log("Miner/Validator:", block.miner);
  
  // Get network info
  const network = await provider.getNetwork();
  console.log("\n--- Network Info ---");
  console.log("Chain ID:", network.chainId.toString());
  console.log("Name:", network.name);
  
  // Get account balances
  console.log("\n--- Pre-funded Accounts ---");
  const accounts = await ethers.getSigners();
  for (let i = 0; i < 5; i++) {
    const balance = await provider.getBalance(accounts[i].address);
    console.log(`Account ${i}: ${accounts[i].address}`);
    console.log(`  Balance: ${ethers.formatEther(balance)} ETH`);
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("✅ Lab 1 Complete!");
  console.log("\n💡 Try this:");
  console.log("   - Send a transaction and run this script again");
  console.log("   - Watch the block number increase");
  console.log("   - See how account balances change");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

