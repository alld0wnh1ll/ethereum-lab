# Standalone CLI Labs

These labs work without Hardhat - just Node.js and ethers.js.
Perfect for Codespace, Replit, or any environment with permission issues.

## Setup

```bash
cd scripts/cli-labs/standalone
npm install
```

## Configuration

Set the instructor's RPC URL (get this from your instructor):

```bash
# Linux/Mac
export RPC_URL="http://INSTRUCTOR_IP:8545"

# Windows PowerShell
$env:RPC_URL = "http://INSTRUCTOR_IP:8545"
```

Or create a `.env` file:
```
RPC_URL=http://INSTRUCTOR_IP:8545
```

## Running Labs

```bash
node 1-explore-blockchain.js
node 2-sign-transaction.js
node 3-deploy-contract.js
```

## Notes

- These labs connect to the instructor's blockchain node
- You'll use test accounts pre-funded on the instructor's network
- No local blockchain needed!
