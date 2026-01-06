# Ethereum Immersive Trainer - Interactive Blockchain Learning Environment

A comprehensive educational platform that teaches Ethereum, smart contracts, and Proof-of-Stake consensus through hands-on experimentation in a safe, classroom environment.

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Quick Start Options](#-quick-start-options)
- [Docker Deployment](#-docker-deployment)
- [For Instructors](#-for-instructors)
- [For Students](#-for-students)
- [Running the Lab](#-running-the-lab)
- [Lab Exercises](#-lab-exercises)
- [Troubleshooting](#-troubleshooting)

## 🔧 Prerequisites

- **Node.js** (v18 or later) - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **Web Browser** (Chrome, Firefox, Edge)
- **MetaMask** (optional, for wallet interactions) - [Download](https://metamask.io/)

## 🚀 Quick Start Options

### Option 1: GitHub Codespaces (Recommended - No Installation)

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/alld0wnh1ll/ethereum-lab)

1. Click the badge above and wait ~30 seconds
2. Everything is pre-installed and ready to use
3. **Free for students** with GitHub Student Pack

### Option 2: Local Development (Windows/Mac/Linux)

Clone and run locally on your machine.

### Option 3: Docker Deployment

Use Docker for consistent, reproducible deployments.

## 🐳 Docker Deployment

Docker provides the easiest way to deploy the Ethereum Immersive Trainer in a classroom or online environment.

### Prerequisites for Docker
- **Docker** - [Download](https://www.docker.com/products/docker-desktop/)
- **Docker Compose** (included with Docker Desktop)

### Instructor Mode (Runs Blockchain + Frontend)

```bash
# Clone the repository
git clone <repository-url>
cd blockchain_web

# Build and start instructor node
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

The instructor container will:
- ✅ Start a Hardhat blockchain node on port 8545
- ✅ Deploy smart contracts automatically
- ✅ Serve the frontend on port 5173
- ✅ Display the contract address in the console

**Access Points:**
- Frontend: `http://localhost:5173`
- Blockchain RPC: `http://localhost:8545`
- Contract Address: `http://localhost:5173/contract-address.txt`
- Config JSON: `http://localhost:5173/api/config.json`

### Student Mode (Frontend Only)

Students connect to the instructor's blockchain:

```bash
# Set instructor's RPC URL and start
INSTRUCTOR_RPC_URL=http://<instructor-ip>:8545 docker-compose -f docker-compose.student.yml up --build
```

Or edit `docker-compose.student.yml` and set the `INSTRUCTOR_RPC_URL` environment variable.

### Docker Quick Reference

```bash
# Start instructor node
docker-compose up --build

# Start in background
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Student mode with instructor IP
INSTRUCTOR_RPC_URL=http://192.168.1.100:8545 docker-compose -f docker-compose.student.yml up --build
```

### Getting the Contract Address

After starting the instructor container, the contract address is available at:
1. **Console output** - Displayed prominently when container starts
2. **Text file** - `http://localhost:5173/contract-address.txt`
3. **JSON config** - `http://localhost:5173/api/config.json`

Share this address with your students!

## 👨‍🏫 For Instructors

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd blockchain_web
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start the Lab Environment
```bash
# For Windows PowerShell
.\start-lab-instructor.ps1

# For remote students (via internet)
.\start-lab-instructor.ps1 -UseNgrok
```

This automatically:
- ✅ Starts the blockchain node
- ✅ Deploys smart contracts
- ✅ Opens instructor dashboard at `http://localhost:5173/?mode=instructor`
- ✅ Displays contract address and connection info

### Step 4: Share Connection Information
- **Contract Address**: Shown in terminal output (starts with 0x...)
- **RPC URL**: `http://YOUR_IP:8545` (for local) or ngrok URL (for remote)
- **Dashboard URL**: `http://YOUR_IP:5173` (for local) or ngrok URL (for remote)

## 👨‍🎓 For Students

### Option A: Connect to Instructor's Lab
```bash
# Clone repository
git clone <repository-url>
cd blockchain_web

# Install dependencies
npm install

# Run student setup
.\start-lab-student.ps1
```

When prompted:
1. Enter the **Contract Address** from your instructor
2. Enter the **RPC URL** from your instructor

### Option B: Use Instructor's Hosted Frontend
1. Open the URL provided by your instructor
2. Enter the Contract Address and RPC URL in the connection fields
3. Click "Request 5 ETH" to get started

## 🏫 Running the Lab

### Instructor Dashboard Features
- **Real-time Activity Monitoring**: See all student actions
- **Network Statistics**: Track total staked ETH and active validators
- **Student Management**: Fund students, slash penalties, advance epochs
- **Live Network Control**: Simulate block production and attestation

### Student Experience
1. **Request Test ETH**: Click "💰 Request 5 ETH" to get funds
2. **Connect Wallet**: Use MetaMask or burner wallet
3. **Stake ETH**: Lock funds to become a validator
4. **Earn Rewards**: Participate in consensus and earn staking rewards
5. **Interact**: Use the chat, explore mini-labs, and learn concepts

### Network Architecture
```
Instructor Machine          Student Machines
┌─────────────────┐        ┌──────────────┐
│ Blockchain Node │◄──────►│ Frontend #1  │
│ (port 8545)     │        │              │
│ Smart Contracts │◄──────►│ Frontend #2  │
│ Instructor      │        │              │
│ Dashboard       │◄──────►│ Frontend #3  │
└─────────────────┘        └──────────────┘
```

Everyone runs the frontend locally but connects to the instructor's blockchain!

## 🧪 Lab Exercises

### Core Learning Activities

1. **Getting Started**
   - Request test ETH from the faucet
   - Explore wallet functionality
   - Understand gas and transaction fees

2. **Proof-of-Stake Fundamentals**
   - Stake ETH to become a validator
   - Monitor real-time reward accumulation
   - Understand capital lock-up for network security

3. **Network Economics**
   - Participate in shared staking pool
   - Observe how individual actions affect network-wide statistics
   - Learn about slashing penalties and validator responsibilities

4. **Interactive Mini-Labs**
   - Blockchain Visualizer: Watch blocks being created
   - Address Decoder: Understand Ethereum addresses
   - Staking Calculator: Model reward scenarios
   - Validator Simulator: Experience consensus mechanisms

## 🌐 Remote Access (Optional)

For online classes where students aren't on the same network:

### Using ngrok for Remote Access
1. **Install ngrok**: Download from [ngrok.com](https://ngrok.com)
2. **Start your blockchain**: `npm run chain`
3. **Expose the RPC endpoint**: `ngrok http 8545`
4. **Share the HTTPS URL** with students

Students then use this URL as their RPC endpoint instead of a local IP address.

## 🐛 Troubleshooting

### Common Issues

**"Connection Refused" or "Network Error"**
- Verify the instructor's computer and students are on the same network
- Check that firewall allows connections on ports 8545 and 5173
- For remote access, ensure ngrok is pointing to port 8545 and students use the HTTPS URL

**MetaMask Nonce Errors**
- If you restart the blockchain node, students should reset MetaMask:
  - Settings → Advanced → Clear activity tab data

**Frontend Won't Load**
- Ensure all dependencies are installed: `npm install`
- Try clearing browser cache or using incognito mode
- Check that port 5173 isn't already in use

**Contract Deployment Issues**
- Verify the contract address is correct (42 characters, starts with 0x)
- Check that the blockchain node is running
- Try redeploying contracts: `npm run deploy`

### Getting Help
- Check the terminal output for error messages
- Verify all prerequisites are installed
- Try restarting the lab environment
