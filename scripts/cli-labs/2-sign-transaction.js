const { ethers } = require("hardhat");

async function main() {
  console.log("\n✍️  LAB 2: Manual Transaction Signing\n");
  console.log("=".repeat(50));
  
  const [sender, receiver] = await ethers.getSigners();
  
  console.log("\n--- Accounts ---");
  console.log("Sender:", sender.address);
  console.log("Receiver:", receiver.address);
  
  // Check balances before
  const senderBalBefore = await ethers.provider.getBalance(sender.address);
  const receiverBalBefore = await ethers.provider.getBalance(receiver.address);
  
  console.log("\n--- Before Transaction ---");
  console.log(`Sender: ${ethers.formatEther(senderBalBefore)} ETH`);
  console.log(`Receiver: ${ethers.formatEther(receiverBalBefore)} ETH`);
  
  // Create transaction
  const tx = {
    to: receiver.address,
    value: ethers.parseEther("1.5"),
    gasLimit: 21000,
  };
  
  console.log("\n--- Transaction Object ---");
  console.log("To:", tx.to);
  console.log("Value:", ethers.formatEther(tx.value), "ETH");
  console.log("Gas Limit:", tx.gasLimit);
  
  // Sign and send
  console.log("\n--- Signing & Broadcasting ---");
  console.log("Signing with private key...");
  const txResponse = await sender.sendTransaction(tx);
  console.log("✓ Transaction signed!");
  console.log("Transaction Hash:", txResponse.hash);
  console.log("Nonce:", txResponse.nonce);
  console.log("\nWaiting for confirmation...");
  
  const receipt = await txResponse.wait();
  console.log("✓ Confirmed in block:", receipt.blockNumber);
  console.log("Gas Used:", receipt.gasUsed.toString());
  console.log("Gas Price:", ethers.formatUnits(receipt.gasPrice, "gwei"), "Gwei");
  
  // Check balances after
  const senderBalAfter = await ethers.provider.getBalance(sender.address);
  const receiverBalAfter = await ethers.provider.getBalance(receiver.address);
  
  console.log("\n--- After Transaction ---");
  console.log(`Sender: ${ethers.formatEther(senderBalAfter)} ETH`);
  console.log(`Receiver: ${ethers.formatEther(receiverBalAfter)} ETH`);
  
  // Calculate costs
  const gasCost = receipt.gasUsed * receipt.gasPrice;
  const totalCost = tx.value + gasCost;
  
  console.log("\n--- Cost Breakdown ---");
  console.log(`Amount sent: ${ethers.formatEther(tx.value)} ETH`);
  console.log(`Gas cost: ${ethers.formatEther(gasCost)} ETH`);
  console.log(`Total deducted: ${ethers.formatEther(totalCost)} ETH`);
  
  const actualDeduction = senderBalBefore - senderBalAfter;
  console.log(`Actual deduction: ${ethers.formatEther(actualDeduction)} ETH`);
  
  console.log("\n" + "=".repeat(50));
  console.log("✅ Lab 2 Complete!");
  console.log("\n💡 Key Takeaways:");
  console.log("   - Every transaction requires a signature");
  console.log("   - Gas is paid by the sender");
  console.log("   - Nonce prevents replay attacks");
  console.log("   - Receipts prove transaction inclusion");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

