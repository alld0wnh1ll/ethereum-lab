const { ethers } = require("hardhat");

async function main() {
  console.log("\n🔎 LAB 4: Querying Blockchain Data\n");
  console.log("=".repeat(50));
  
  const provider = ethers.provider;
  
  // 1. Network Information
  console.log("\n--- Network Information ---");
  const network = await provider.getNetwork();
  console.log("Chain ID:", network.chainId.toString());
  console.log("Network Name:", network.name);
  
  const blockNumber = await provider.getBlockNumber();
  console.log("Latest Block:", blockNumber);
  
  // 2. Gas Price Information
  console.log("\n--- Gas Price Data ---");
  const feeData = await provider.getFeeData();
  console.log("Gas Price:", ethers.formatUnits(feeData.gasPrice, "gwei"), "Gwei");
  if (feeData.maxFeePerGas) {
    console.log("Max Fee:", ethers.formatUnits(feeData.maxFeePerGas, "gwei"), "Gwei");
    console.log("Max Priority Fee:", ethers.formatUnits(feeData.maxPriorityFeePerGas, "gwei"), "Gwei");
  }
  
  // 3. Block History
  console.log("\n--- Recent Blocks ---");
  for (let i = Math.max(0, blockNumber - 4); i <= blockNumber; i++) {
    const block = await provider.getBlock(i);
    const timestamp = new Date(block.timestamp * 1000);
    console.log(`Block ${i}: ${block.transactions.length} txs | ${timestamp.toLocaleTimeString()}`);
  }
  
  // 4. Account Analysis
  console.log("\n--- Account Analysis ---");
  const [account] = await ethers.getSigners();
  const address = account.address;
  
  console.log("Address:", address);
  const balance = await provider.getBalance(address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  
  const txCount = await provider.getTransactionCount(address);
  console.log("Transaction Count (Nonce):", txCount);
  
  const code = await provider.getCode(address);
  console.log("Is Contract?", code !== "0x" ? "Yes" : "No");
  
  // 5. Transaction History
  console.log("\n--- Recent Transactions ---");
  let txFound = 0;
  for (let i = blockNumber; i >= Math.max(0, blockNumber - 10) && txFound < 5; i--) {
    const block = await provider.getBlock(i, true);
    if (block && block.transactions) {
      for (const tx of block.transactions) {
        if (tx.from === address || tx.to === address) {
          console.log(`\nBlock ${i}:`);
          console.log(`  Hash: ${tx.hash}`);
          console.log(`  From: ${tx.from}`);
          console.log(`  To: ${tx.to || "Contract Creation"}`);
          console.log(`  Value: ${ethers.formatEther(tx.value)} ETH`);
          txFound++;
          if (txFound >= 5) break;
        }
      }
    }
  }
  
  if (txFound === 0) {
    console.log("No transactions found for this account yet.");
  }
  
  // 6. Estimate Gas
  console.log("\n--- Gas Estimation ---");
  const gasEstimate = await provider.estimateGas({
    to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    value: ethers.parseEther("1.0")
  });
  console.log("Estimated gas for 1 ETH transfer:", gasEstimate.toString());
  
  const estimatedCost = gasEstimate * feeData.gasPrice;
  console.log("Estimated cost:", ethers.formatEther(estimatedCost), "ETH");
  
  console.log("\n" + "=".repeat(50));
  console.log("✅ Lab 4 Complete!");
  console.log("\n💡 Try This:");
  console.log("   - Query a specific block: provider.getBlock(42)");
  console.log("   - Look up a transaction: provider.getTransaction(hash)");
  console.log("   - Check any address balance");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

