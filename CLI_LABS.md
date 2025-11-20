# 🖥️ Command Line Labs - Ethereum Development

This guide provides hands-on CLI exercises for students to build, deploy, and interact with Ethereum blockchains using Hardhat and command-line tools.

---

## 📋 Prerequisites

Before starting these labs, ensure you have:
- Node.js 18+ installed
- Git installed
- Terminal/PowerShell access
- Text editor (VS Code recommended)

---

## 🎯 Lab Overview

| Lab | Focus | Duration |
|-----|-------|----------|
| Lab 1 | Local Blockchain Setup | 15 min |
| Lab 2 | Smart Contract Development | 30 min |
| Lab 3 | Manual Transaction Signing | 20 min |
| Lab 4 | Blockchain Data Queries | 25 min |
| Lab 5 | Multi-Node Private Network | 45 min |
| Lab 6 | PoS Validator Management | 30 min |
| Lab 7 | Testing & Debugging | 30 min |

---

## 🧪 Lab 1: Local Blockchain Setup

**Objective**: Start your own Ethereum blockchain node and understand the basics.

### **Step 1: Clone or Use Existing Project**

**Option A: Use This Project (Recommended)**
```bash
# If you cloned the repo, you already have everything!
cd blockchain_web

# Install dependencies if needed
npm install
```

**Option B: Start Fresh**
```bash
# Create new directory
mkdir my-ethereum-lab
cd my-ethereum-lab

# Initialize npm project
npm init -y

# Install Hardhat 2.x (more stable for learning)
npm install --save-dev hardhat@^2.22.0 @nomicfoundation/hardhat-toolbox@^2.0.0

# Initialize Hardhat project
npx hardhat
# Select: "Create a JavaScript project"
```

**Note:** Hardhat 3.x has stricter requirements. For classroom use, Hardhat 2.x is recommended.

### **Step 2: Start Your Blockchain**

**All Platforms (Bash/PowerShell):**
```bash
# Start Hardhat node (keep this terminal open)
npx hardhat node
```

**Note:** `npx` commands work the same on Windows PowerShell, Linux, and Mac.

**What you should see:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...
```

**📝 Exercise Questions:**
1. How many accounts are pre-funded?
2. How much ETH does each account start with?
3. What is the RPC endpoint URL?
4. What is the chain ID?

### **Step 3: Check Node Status**

Open a **new terminal** and run:

**Bash/Linux/Mac:**
```bash
# Check block number
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check chain ID
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Get account balance
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","latest"],"id":1}'
```

**PowerShell/Windows:**
```powershell
# Check block number
Invoke-RestMethod -Uri http://localhost:8545 -Method POST -ContentType "application/json" -Body '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check chain ID
Invoke-RestMethod -Uri http://localhost:8545 -Method POST -ContentType "application/json" -Body '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Get account balance
Invoke-RestMethod -Uri http://localhost:8545 -Method POST -ContentType "application/json" -Body '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","latest"],"id":1}'
```

**🎓 Learning Points:**
- JSON-RPC is the protocol Ethereum uses
- Every request has: jsonrpc version, method, params, id
- Responses include: result or error
- Balances are in Wei (1 ETH = 10^18 Wei)

---

## 🔨 Lab 2: Smart Contract Development & Deployment

**Objective**: Write, compile, and deploy a smart contract using Hardhat.

### **Step 1: Create a Simple Contract**

Create `contracts/SimpleStorage.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleStorage {
    uint256 private storedValue;
    address public owner;
    
    event ValueChanged(uint256 oldValue, uint256 newValue, address changedBy);
    
    constructor() {
        owner = msg.sender;
    }
    
    function set(uint256 _value) public {
        uint256 oldValue = storedValue;
        storedValue = _value;
        emit ValueChanged(oldValue, _value, msg.sender);
    }
    
    function get() public view returns (uint256) {
        return storedValue;
    }
}
```

### **Step 2: Compile the Contract**

```bash
# Compile all contracts
npx hardhat compile

# Check compilation output
ls artifacts/contracts/SimpleStorage.sol/
# You should see: SimpleStorage.json (ABI + bytecode)
```

**📝 Exercise:**
- Open `artifacts/contracts/SimpleStorage.sol/SimpleStorage.json`
- Find the "abi" section - this is how your app talks to the contract
- Find the "bytecode" - this is what gets deployed to the blockchain

### **Step 3: Create Deployment Script**

Create `scripts/deploy-simple.js`:

```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying SimpleStorage...");
  
  const SimpleStorage = await hre.ethers.getContractFactory("SimpleStorage");
  const contract = await SimpleStorage.deploy();
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  
  console.log(`SimpleStorage deployed to: ${address}`);
  
  // Test the contract
  console.log("\nTesting contract...");
  const tx = await contract.set(42);
  await tx.wait();
  console.log("Set value to 42");
  
  const value = await contract.get();
  console.log(`Retrieved value: ${value}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### **Step 4: Deploy**

```bash
npx hardhat run scripts/deploy-simple.js --network localhost
```

**🎓 Learning Points:**
- Deployment creates a transaction
- Contract gets a permanent address
- You can interact with it immediately
- Gas is paid from deployer's account

### **Step 5: Interact via Console**

```bash
# Start Hardhat console
npx hardhat console --network localhost
```

Inside the console:
```javascript
// Get contract factory
const SimpleStorage = await ethers.getContractFactory("SimpleStorage");

// Attach to deployed contract (use your address)
const contract = SimpleStorage.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

// Read current value
await contract.get();

// Set new value
const tx = await contract.set(100);
await tx.wait();

// Read again
await contract.get();

// Check who the owner is
await contract.owner();
```

---

## ✍️ Lab 3: Manual Transaction Signing

**Objective**: Understand how transactions are signed and broadcast.

### **Step 1: Create Signing Script**

Create `scripts/sign-transaction.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
  // Get signers (pre-funded accounts)
  const [sender, receiver] = await ethers.getSigners();
  
  console.log("Sender:", sender.address);
  console.log("Receiver:", receiver.address);
  
  // Check balances before
  const senderBalBefore = await ethers.provider.getBalance(sender.address);
  const receiverBalBefore = await ethers.provider.getBalance(receiver.address);
  
  console.log("\n--- Before Transaction ---");
  console.log(`Sender balance: ${ethers.formatEther(senderBalBefore)} ETH`);
  console.log(`Receiver balance: ${ethers.formatEther(receiverBalBefore)} ETH`);
  
  // Create transaction object
  const tx = {
    to: receiver.address,
    value: ethers.parseEther("1.5"),
    gasLimit: 21000,
  };
  
  console.log("\n--- Transaction Details ---");
  console.log("To:", tx.to);
  console.log("Value:", ethers.formatEther(tx.value), "ETH");
  console.log("Gas Limit:", tx.gasLimit);
  
  // Sign and send
  console.log("\n--- Signing & Broadcasting ---");
  const txResponse = await sender.sendTransaction(tx);
  console.log("Transaction Hash:", txResponse.hash);
  console.log("Waiting for confirmation...");
  
  const receipt = await txResponse.wait();
  console.log("✓ Confirmed in block:", receipt.blockNumber);
  console.log("Gas Used:", receipt.gasUsed.toString());
  
  // Check balances after
  const senderBalAfter = await ethers.provider.getBalance(sender.address);
  const receiverBalAfter = await ethers.provider.getBalance(receiver.address);
  
  console.log("\n--- After Transaction ---");
  console.log(`Sender balance: ${ethers.formatEther(senderBalAfter)} ETH`);
  console.log(`Receiver balance: ${ethers.formatEther(receiverBalAfter)} ETH`);
  
  // Calculate actual cost
  const gasCost = receipt.gasUsed * receipt.gasPrice;
  const totalCost = tx.value + gasCost;
  
  console.log("\n--- Cost Breakdown ---");
  console.log(`Amount sent: ${ethers.formatEther(tx.value)} ETH`);
  console.log(`Gas cost: ${ethers.formatEther(gasCost)} ETH`);
  console.log(`Total cost: ${ethers.formatEther(totalCost)} ETH`);
}

main().catch(console.error);
```

Run it:
```bash
npx hardhat run scripts/sign-transaction.js --network localhost
```

**📝 Exercise:**
1. Why did the sender lose more than 1.5 ETH?
2. What happens if you set gasLimit too low?
3. Try sending to yourself - what happens?

### **Step 2: Raw Transaction Signing**

Create `scripts/raw-signing.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  
  // Create unsigned transaction
  const unsignedTx = {
    to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    value: ethers.parseEther("0.5"),
    gasLimit: 21000,
    nonce: await ethers.provider.getTransactionCount(signer.address),
    chainId: (await ethers.provider.getNetwork()).chainId
  };
  
  console.log("Unsigned Transaction:", unsignedTx);
  
  // Sign transaction
  const signedTx = await signer.signTransaction(unsignedTx);
  console.log("\nSigned Transaction (serialized):");
  console.log(signedTx);
  
  // Broadcast signed transaction
  console.log("\nBroadcasting...");
  const txResponse = await ethers.provider.broadcastTransaction(signedTx);
  console.log("Transaction Hash:", txResponse.hash);
  
  await txResponse.wait();
  console.log("✓ Confirmed!");
}

main().catch(console.error);
```

**🎓 Learning Points:**
- Transactions are signed offline with your private key
- Signature proves you authorized the transaction
- Nonce prevents replay attacks
- ChainId prevents cross-chain replay attacks

---

## 🔍 Lab 4: Blockchain Data Queries

**Objective**: Query blockchain data using Hardhat and ethers.js.

### **Step 1: Block Explorer Script**

Create `scripts/explore-blockchain.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
  const provider = ethers.provider;
  
  // Get latest block
  const blockNumber = await provider.getBlockNumber();
  console.log("Latest Block:", blockNumber);
  
  // Get block details
  const block = await provider.getBlock(blockNumber);
  console.log("\n--- Block Details ---");
  console.log("Hash:", block.hash);
  console.log("Parent Hash:", block.parentHash);
  console.log("Timestamp:", new Date(block.timestamp * 1000).toLocaleString());
  console.log("Transactions:", block.transactions.length);
  console.log("Gas Used:", block.gasUsed.toString());
  console.log("Gas Limit:", block.gasLimit.toString());
  
  // Get transaction details
  if (block.transactions.length > 0) {
    console.log("\n--- First Transaction ---");
    const txHash = block.transactions[0];
    const tx = await provider.getTransaction(txHash);
    console.log("From:", tx.from);
    console.log("To:", tx.to);
    console.log("Value:", ethers.formatEther(tx.value), "ETH");
    console.log("Gas Limit:", tx.gasLimit.toString());
    
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    console.log("\n--- Transaction Receipt ---");
    console.log("Status:", receipt.status === 1 ? "Success" : "Failed");
    console.log("Block:", receipt.blockNumber);
    console.log("Gas Used:", receipt.gasUsed.toString());
    console.log("Logs:", receipt.logs.length, "events emitted");
  }
  
  // Query account balances
  console.log("\n--- Account Balances ---");
  const accounts = await ethers.getSigners();
  for (let i = 0; i < 3; i++) {
    const balance = await provider.getBalance(accounts[i].address);
    console.log(`Account ${i}: ${ethers.formatEther(balance)} ETH`);
  }
}

main().catch(console.error);
```

Run it:
```bash
npx hardhat run scripts/explore-blockchain.js --network localhost
```

### **Step 2: Gas Analysis Script**

Create `scripts/gas-analysis.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  
  // Get current gas price
  const feeData = await ethers.provider.getFeeData();
  console.log("--- Gas Price Info ---");
  console.log("Gas Price:", ethers.formatUnits(feeData.gasPrice, "gwei"), "Gwei");
  console.log("Max Fee:", ethers.formatUnits(feeData.maxFeePerGas, "gwei"), "Gwei");
  console.log("Max Priority Fee:", ethers.formatUnits(feeData.maxPriorityFeePerGas, "gwei"), "Gwei");
  
  // Estimate gas for a simple transfer
  const gasEstimate = await ethers.provider.estimateGas({
    to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    value: ethers.parseEther("1.0")
  });
  
  console.log("\n--- Gas Estimation ---");
  console.log("Estimated Gas:", gasEstimate.toString());
  
  const gasCostWei = gasEstimate * feeData.gasPrice;
  const gasCostEth = ethers.formatEther(gasCostWei);
  
  console.log("Gas Cost:", gasCostEth, "ETH");
  console.log("Total Cost (1 ETH + gas):", (1 + parseFloat(gasCostEth)).toFixed(6), "ETH");
}

main().catch(console.error);
```

**📝 Exercise:**
- Run the script multiple times
- Compare gas prices
- Try estimating gas for contract deployments

---

## 📜 Lab 3: Smart Contract Development Cycle

**Objective**: Build a complete PoS staking contract from scratch.

### **Step 1: Create Staking Contract**

Create `contracts/MyStakingPool.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MyStakingPool {
    mapping(address => uint256) public stakes;
    mapping(address => uint256) public stakingTime;
    uint256 public totalStaked;
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);
    
    function stake() external payable {
        require(msg.value >= 1 ether, "Minimum 1 ETH");
        require(stakes[msg.sender] == 0, "Already staking");
        
        stakes[msg.sender] = msg.value;
        stakingTime[msg.sender] = block.timestamp;
        totalStaked += msg.value;
        
        emit Staked(msg.sender, msg.value);
    }
    
    function calculateReward(address user) public view returns (uint256) {
        if (stakes[user] == 0) return 0;
        
        uint256 duration = block.timestamp - stakingTime[user];
        // 5% APR = 0.05 / 365 days / 86400 seconds
        uint256 reward = (stakes[user] * duration * 5) / (365 * 86400 * 100);
        return reward;
    }
    
    function unstake() external {
        require(stakes[msg.sender] > 0, "Not staking");
        
        uint256 principal = stakes[msg.sender];
        uint256 reward = calculateReward(msg.sender);
        uint256 total = principal + reward;
        
        stakes[msg.sender] = 0;
        stakingTime[msg.sender] = 0;
        totalStaked -= principal;
        
        (bool sent, ) = msg.sender.call{value: total}("");
        require(sent, "Transfer failed");
        
        emit Unstaked(msg.sender, principal, reward);
    }
    
    receive() external payable {}
}
```

### **Step 2: Write Deployment Script**

Create `scripts/deploy-staking.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));
  
  const MyStakingPool = await hre.ethers.getContractFactory("MyStakingPool");
  const contract = await MyStakingPool.deploy();
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  
  console.log("MyStakingPool deployed to:", address);
  
  // Save address for later use
  const fs = require("fs");
  fs.writeFileSync("STAKING_ADDRESS.txt", address);
  
  return address;
}

main().catch(console.error);
```

### **Step 3: Compile and Deploy**

```bash
# Compile
npx hardhat compile

# Deploy
npx hardhat run scripts/deploy-staking.js --network localhost

# Save the contract address shown
```

### **Step 4: Interact with Contract**

Create `scripts/interact-staking.js`:

```javascript
const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const contractAddress = fs.readFileSync("STAKING_ADDRESS.txt", "utf8").trim();
  const [user1, user2] = await ethers.getSigners();
  
  const MyStakingPool = await ethers.getContractFactory("MyStakingPool");
  const contract = MyStakingPool.attach(contractAddress);
  
  console.log("Contract Address:", contractAddress);
  console.log("User1:", user1.address);
  
  // Stake 2 ETH
  console.log("\n--- Staking 2 ETH ---");
  const stakeTx = await contract.connect(user1).stake({ value: ethers.parseEther("2.0") });
  await stakeTx.wait();
  console.log("✓ Staked!");
  
  // Check stake
  const stakeAmount = await contract.stakes(user1.address);
  console.log("Stake amount:", ethers.formatEther(stakeAmount), "ETH");
  
  // Wait a bit (simulate time passing)
  console.log("\nWaiting 10 seconds to accumulate rewards...");
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Check reward
  const reward = await contract.calculateReward(user1.address);
  console.log("Pending reward:", ethers.formatEther(reward), "ETH");
  
  // Unstake
  console.log("\n--- Unstaking ---");
  const unstakeTx = await contract.connect(user1).unstake();
  const receipt = await unstakeTx.wait();
  console.log("✓ Unstaked!");
  
  // Parse events
  const event = receipt.logs.find(log => {
    try {
      return contract.interface.parseLog(log).name === "Unstaked";
    } catch { return false; }
  });
  
  if (event) {
    const parsed = contract.interface.parseLog(event);
    console.log("Principal returned:", ethers.formatEther(parsed.args[1]), "ETH");
    console.log("Reward earned:", ethers.formatEther(parsed.args[2]), "ETH");
  }
}

main().catch(console.error);
```

Run it:
```bash
npx hardhat run scripts/interact-staking.js --network localhost
```

**📝 Exercise:**
1. Modify the contract to require 5 ETH minimum
2. Change the reward rate to 10% APR
3. Add a function to view all stakers
4. Recompile and redeploy

---

## 🔗 Lab 5: Multi-Node Private Network

**Objective**: Create a private Ethereum network with multiple validator nodes.

### **Step 1: Configure Multi-Node Setup**

Create `hardhat-node1.config.js`:

```javascript
module.exports = {
  solidity: "0.8.19",
  networks: {
    node1: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk"
      }
    }
  }
};
```

Create `hardhat-node2.config.js`:

```javascript
module.exports = {
  solidity: "0.8.19",
  networks: {
    node2: {
      url: "http://127.0.0.1:8546",
      chainId: 31337,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk"
      }
    }
  }
};
```

### **Step 2: Start Multiple Nodes**

**All Platforms:**
```bash
# Terminal 1: Start Node 1
npx hardhat node --port 8545 --hostname 0.0.0.0

# Terminal 2: Start Node 2
npx hardhat node --port 8546 --hostname 0.0.0.0

# Terminal 3: Start Node 3
npx hardhat node --port 8547 --hostname 0.0.0.0
```

**PowerShell Tip:** Open new terminals with:
```powershell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx hardhat node --port 8545 --hostname 0.0.0.0"
```

### **Step 3: Connect Nodes (Manual Peering)**

Create `scripts/connect-nodes.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
  const provider1 = new ethers.JsonRpcProvider("http://localhost:8545");
  const provider2 = new ethers.JsonRpcProvider("http://localhost:8546");
  
  const block1 = await provider1.getBlockNumber();
  const block2 = await provider2.getBlockNumber();
  
  console.log("Node 1 Block:", block1);
  console.log("Node 2 Block:", block2);
  
  // Deploy contract to Node 1
  const [signer] = await ethers.getSigners();
  const signerNode1 = signer.connect(provider1);
  
  const SimpleStorage = await ethers.getContractFactory("SimpleStorage", signerNode1);
  const contract = await SimpleStorage.deploy();
  await contract.waitForDeployment();
  
  console.log("\nContract deployed to Node 1:", await contract.getAddress());
  
  // Try to access from Node 2 (will fail - separate chains)
  console.log("\nNote: Each Hardhat node is independent.");
  console.log("For true multi-node networking, use Geth or Besu.");
}

main().catch(console.error);
```

**🎓 Learning Points:**
- Hardhat nodes are independent by default
- Real Ethereum uses P2P networking (devp2p protocol)
- For production multi-node: use Geth, Besu, or Nethermind

---

## 🏦 Lab 6: PoS Validator Management

**Objective**: Simulate validator operations and understand staking mechanics.

### **Step 1: Validator Status Script**

Create `scripts/validator-status.js`:

```javascript
const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const posAddress = fs.readFileSync("CONTRACT_ADDRESS.txt", "utf8").trim();
  const PoSABI = require("./frontend/src/PoS.json");
  
  const contract = new ethers.Contract(posAddress, PoSABI, ethers.provider);
  
  // Get all validators
  console.log("--- Validator Status ---\n");
  
  const stakeEvents = await contract.queryFilter("Staked", 0);
  const validators = [...new Set(stakeEvents.map(e => e.args[0]))];
  
  console.log(`Total Validators: ${validators.length}\n`);
  
  for (const validator of validators) {
    const stake = await contract.stakes(validator);
    const reward = await contract.calculateReward(validator);
    const balance = await ethers.provider.getBalance(validator);
    
    console.log(`Validator: ${validator}`);
    console.log(`  Staked: ${ethers.formatEther(stake)} ETH`);
    console.log(`  Rewards: ${ethers.formatEther(reward)} ETH`);
    console.log(`  Balance: ${ethers.formatEther(balance)} ETH`);
    console.log("");
  }
  
  // Network stats
  const totalStaked = await contract.totalStaked();
  console.log("--- Network Stats ---");
  console.log(`Total Staked: ${ethers.formatEther(totalStaked)} ETH`);
  console.log(`Contract Balance: ${ethers.formatEther(await ethers.provider.getBalance(posAddress))} ETH`);
}

main().catch(console.error);
```

### **Step 2: Simulate Validator Selection**

Create `scripts/select-validator.js`:

```javascript
const { ethers } = require("hardhat");
const fs = require("fs");

async function weightedRandomSelection(validators, stakes) {
  const totalStake = stakes.reduce((a, b) => a + b, 0n);
  const random = BigInt(Math.floor(Math.random() * Number(totalStake)));
  
  let cumulative = 0n;
  for (let i = 0; i < validators.length; i++) {
    cumulative += stakes[i];
    if (random < cumulative) {
      return validators[i];
    }
  }
  return validators[validators.length - 1];
}

async function main() {
  const posAddress = fs.readFileSync("CONTRACT_ADDRESS.txt", "utf8").trim();
  const PoSABI = require("./frontend/src/PoS.json");
  const contract = new ethers.Contract(posAddress, PoSABI, ethers.provider);
  
  // Get all validators and their stakes
  const stakeEvents = await contract.queryFilter("Staked", 0);
  const validators = [...new Set(stakeEvents.map(e => e.args[0]))];
  
  const stakes = await Promise.all(
    validators.map(v => contract.stakes(v))
  );
  
  console.log("--- Validator Pool ---");
  validators.forEach((v, i) => {
    const stakeETH = ethers.formatEther(stakes[i]);
    const totalStake = stakes.reduce((a, b) => a + b, 0n);
    const probability = (Number(stakes[i]) / Number(totalStake) * 100).toFixed(2);
    console.log(`${v}: ${stakeETH} ETH (${probability}% chance)`);
  });
  
  console.log("\n--- Running 100 Selections ---");
  const selections = {};
  
  for (let i = 0; i < 100; i++) {
    const selected = await weightedRandomSelection(validators, stakes);
    selections[selected] = (selections[selected] || 0) + 1;
  }
  
  console.log("\nSelection Results:");
  Object.entries(selections).forEach(([validator, count]) => {
    console.log(`${validator}: selected ${count} times (${count}%)`);
  });
}

main().catch(console.error);
```

**🎓 Learning Points:**
- Higher stake = higher probability (not guarantee)
- Selection is pseudo-random
- Over time, selections converge to stake proportions

---

## 🧪 Lab 7: Testing Smart Contracts

**Objective**: Write and run automated tests for your contracts.

### **Step 1: Create Test File**

Create `test/MyStakingPool.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyStakingPool", function () {
  let stakingPool;
  let owner, user1, user2;
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const MyStakingPool = await ethers.getContractFactory("MyStakingPool");
    stakingPool = await MyStakingPool.deploy();
    await stakingPool.waitForDeployment();
  });
  
  describe("Staking", function () {
    it("Should allow users to stake ETH", async function () {
      await expect(
        stakingPool.connect(user1).stake({ value: ethers.parseEther("2.0") })
      ).to.emit(stakingPool, "Staked")
        .withArgs(user1.address, ethers.parseEther("2.0"));
      
      const stake = await stakingPool.stakes(user1.address);
      expect(stake).to.equal(ethers.parseEther("2.0"));
    });
    
    it("Should reject stakes below 1 ETH", async function () {
      await expect(
        stakingPool.connect(user1).stake({ value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Minimum 1 ETH");
    });
    
    it("Should prevent double staking", async function () {
      await stakingPool.connect(user1).stake({ value: ethers.parseEther("1.0") });
      
      await expect(
        stakingPool.connect(user1).stake({ value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Already staking");
    });
  });
  
  describe("Rewards", function () {
    it("Should calculate rewards over time", async function () {
      await stakingPool.connect(user1).stake({ value: ethers.parseEther("10.0") });
      
      // Fast-forward time by 30 days
      await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      
      const reward = await stakingPool.calculateReward(user1.address);
      expect(reward).to.be.gt(0);
      
      console.log("      Reward after 30 days:", ethers.formatEther(reward), "ETH");
    });
  });
  
  describe("Unstaking", function () {
    it("Should return stake + rewards", async function () {
      const stakeAmount = ethers.parseEther("5.0");
      await stakingPool.connect(user1).stake({ value: stakeAmount });
      
      const balanceBefore = await ethers.provider.getBalance(user1.address);
      
      // Fast-forward 7 days
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      
      const tx = await stakingPool.connect(user1).unstake();
      const receipt = await tx.wait();
      
      const balanceAfter = await ethers.provider.getBalance(user1.address);
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      
      // Should have more ETH than before (minus gas)
      expect(balanceAfter).to.be.gt(balanceBefore - gasCost);
    });
  });
});
```

### **Step 2: Run Tests**

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/MyStakingPool.test.js

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Run with coverage
npx hardhat coverage
```

**📝 Exercise:**
1. Add a test for multiple users staking
2. Test what happens if contract runs out of ETH
3. Add a test for the `totalStaked` variable
4. Test edge cases (0 ETH, max uint256)

---

## 🌐 Lab 8: Collaborative Network Setup

**Objective**: Students collaborate on a shared private blockchain.

### **Instructor Setup**

**All Platforms:**
```bash
# Start node with external access
npx hardhat node --hostname 0.0.0.0 --port 8545

# In a new terminal, deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Share with students:
# - RPC URL: http://YOUR_IP:8545
# - Contract Address: (from deployment output)
```

**PowerShell Alternative (Automated):**
```powershell
# Use the provided script
.\start-lab-instructor.ps1
```

### **Student Setup**

Each student creates `hardhat.config.js`:

```javascript
module.exports = {
  networks: {
    classroom: {
      url: "http://INSTRUCTOR_IP:8545",  // Replace with actual IP
      chainId: 31337,
      accounts: {
        mnemonic: "your unique twelve word mnemonic phrase here for this student"
      }
    }
  }
};
```

### **Collaborative Exercises**

**Exercise 1: Peer-to-Peer Transfers**
```bash
# Student 1 sends to Student 2
npx hardhat run scripts/send-to-peer.js --network classroom
```

**Exercise 2: Shared Contract Interaction**
```bash
# All students stake on the same contract
npx hardhat run scripts/interact-staking.js --network classroom
```

**Exercise 3: Event Monitoring**
```bash
# Watch for classmate transactions
npx hardhat run scripts/watch-events.js --network classroom
```

---

## 🛠️ Advanced CLI Tools

### **Hardhat Console (Interactive REPL)**

```bash
npx hardhat console --network localhost
```

Inside console:
```javascript
// Get signers
const [signer] = await ethers.getSigners();

// Send transaction
await signer.sendTransaction({
  to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  value: ethers.parseEther("1.0")
});

// Deploy contract interactively
const Contract = await ethers.getContractFactory("SimpleStorage");
const contract = await Contract.deploy();
await contract.waitForDeployment();

// Interact
await contract.set(42);
await contract.get();
```

### **Hardhat Tasks (Custom Commands)**

Add to `hardhat.config.js`:

```javascript
task("balance", "Prints an account's balance")
  .addParam("account", "The account's address")
  .setAction(async (taskArgs) => {
    const balance = await ethers.provider.getBalance(taskArgs.account);
    console.log(ethers.formatEther(balance), "ETH");
  });

task("block", "Prints current block number")
  .setAction(async () => {
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log("Current block:", blockNumber);
  });
```

Use them:
```bash
npx hardhat balance --account 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
npx hardhat block
```

---

## 💻 Platform-Specific Notes

### **Windows/PowerShell**
- All `npx` and `npm` commands work identically
- Use `Invoke-RestMethod` instead of `curl` for HTTP requests
- Use `Get-Content` instead of `cat` to read files
- Use `Start-Process powershell` to open new terminal windows
- Backslashes in paths: `.\scripts\deploy.js` (or use forward slashes)

### **Linux/Mac/Bash**
- All commands work as shown
- Use `curl` for HTTP requests
- Use `cat` to read files
- Use `&` to background processes
- Forward slashes in paths: `./scripts/deploy.js`

### **Cross-Platform Tips**
- Node.js and npm work the same everywhere
- Hardhat commands are identical across platforms
- JavaScript/Solidity code is platform-independent
- Use `npx` to run local packages without global installation

---

## 📚 Additional Resources

### **Hardhat Documentation**
- [Getting Started](https://hardhat.org/getting-started/)
- [Hardhat Network](https://hardhat.org/hardhat-network/)
- [Testing Contracts](https://hardhat.org/tutorial/testing-contracts)
- [Deploying Contracts](https://hardhat.org/tutorial/deploying-to-a-live-network)

### **Ethers.js Documentation**
- [Providers](https://docs.ethers.org/v6/api/providers/)
- [Signers](https://docs.ethers.org/v6/api/providers/#Signer)
- [Contracts](https://docs.ethers.org/v6/api/contract/)
- [Transactions](https://docs.ethers.org/v6/api/transaction/)

### **Solidity Documentation**
- [Language Basics](https://docs.soliditylang.org/en/latest/introduction-to-smart-contracts.html)
- [Security Considerations](https://docs.soliditylang.org/en/latest/security-considerations.html)

---

## 🎓 Learning Outcomes

After completing these CLI labs, students will be able to:
- ✅ Start and manage local Ethereum nodes
- ✅ Write, compile, and deploy smart contracts
- ✅ Sign and broadcast transactions manually
- ✅ Query blockchain data using JSON-RPC
- ✅ Test contracts with automated test suites
- ✅ Understand gas mechanics and optimization
- ✅ Debug contract interactions
- ✅ Collaborate on shared blockchain networks

---

## 🔄 Integration with Web UI

Students can use both CLI and web interface:
1. **CLI**: Deploy custom contracts, run scripts, test
2. **Web UI**: Visualize blockchain, interact with deployed contracts, chat with classmates
3. **Combined**: Deploy via CLI, interact via web UI

This provides a complete full-stack Ethereum development experience!

