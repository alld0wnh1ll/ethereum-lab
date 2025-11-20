const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("\n🚀 LAB 3: Smart Contract Deployment\n");
  console.log("=".repeat(50));
  
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("\n--- Deployer Account ---");
  console.log("Address:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  
  // Deploy SimpleStorage
  console.log("\n--- Compiling Contract ---");
  console.log("Compiling SimpleStorage.sol...");
  
  const SimpleStorage = await hre.ethers.getContractFactory("SimpleStorage");
  
  console.log("\n--- Deploying Contract ---");
  console.log("Sending deployment transaction...");
  const contract = await SimpleStorage.deploy();
  
  console.log("Transaction Hash:", contract.deploymentTransaction().hash);
  console.log("Waiting for confirmation...");
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  
  console.log("✓ Contract deployed!");
  console.log("Contract Address:", address);
  
  // Save address
  fs.writeFileSync("SIMPLE_STORAGE_ADDRESS.txt", address);
  
  // Get deployment transaction receipt
  const receipt = await contract.deploymentTransaction().wait();
  console.log("\n--- Deployment Details ---");
  console.log("Block Number:", receipt.blockNumber);
  console.log("Gas Used:", receipt.gasUsed.toString());
  console.log("Gas Price:", ethers.formatUnits(receipt.gasPrice, "gwei"), "Gwei");
  
  const deploymentCost = receipt.gasUsed * receipt.gasPrice;
  console.log("Deployment Cost:", ethers.formatEther(deploymentCost), "ETH");
  
  // Test the contract
  console.log("\n--- Testing Contract ---");
  console.log("Setting value to 42...");
  const setTx = await contract.set(42);
  await setTx.wait();
  console.log("✓ Value set!");
  
  const value = await contract.get();
  console.log("Retrieved value:", value.toString());
  
  const owner = await contract.owner();
  console.log("Contract owner:", owner);
  console.log("Is deployer the owner?", owner === deployer.address);
  
  console.log("\n" + "=".repeat(50));
  console.log("✅ Lab 3 Complete!");
  console.log("\n💡 Next Steps:");
  console.log("   - Try deploying your own contract");
  console.log("   - Interact with it using scripts");
  console.log("   - Check contract code on the blockchain");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

