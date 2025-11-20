# About This Project

## Ethereum Lab - Interactive Blockchain Learning Environment

This is a full-stack educational platform that allows students to interact with a real Ethereum blockchain in a safe, classroom environment. The project combines blockchain infrastructure, smart contracts, and an interactive web interface to teach Proof-of-Stake consensus, staking, and DeFi concepts.

---

## 🏗️ Architecture Overview

### **Backend: Blockchain Infrastructure**
- **Hardhat** - Local Ethereum development environment
- **Smart Contracts** - Solidity-based PoS simulator and chat system
- **Node.js** - Runtime environment

### **Frontend: Interactive Web Application**
- **React 19** - Modern UI framework
- **Vite 7** - Fast build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **Ethers.js 6** - Ethereum blockchain interaction library

### **Deployment**
- **Vercel** - Frontend hosting (static site)
- **Local/Ngrok** - Blockchain node RPC endpoint (instructor-hosted)

---

## 📦 Core Dependencies

### **Blockchain & Smart Contracts**

#### Hardhat (v2.22.17)
- **Purpose**: Local Ethereum development environment
- **Usage**: Runs a local blockchain node, compiles and deploys smart contracts
- **Key Features**:
  - Built-in Ethereum Virtual Machine (EVM)
  - Automatic account generation with test ETH
  - Console logging and debugging tools
  - Network management (localhost, testnet, mainnet)

#### Ethers.js (v6.15.0)
- **Purpose**: Ethereum blockchain interaction library
- **Usage**: Connect to blockchain, send transactions, interact with smart contracts
- **Key Features**:
  - Wallet management (private keys, signers)
  - Contract ABI encoding/decoding
  - Transaction signing and broadcasting
  - Event listening and filtering
  - BigNumber arithmetic for precise ETH calculations

#### @nomicfoundation/hardhat-toolbox (v6.1.0)
- **Purpose**: Hardhat plugin bundle
- **Includes**:
  - Ethers.js integration
  - Chai testing framework
  - Hardhat Network Helpers
  - Gas reporting
  - Solidity coverage tools

---

### **Frontend Framework**

#### React (v19.2.0)
- **Purpose**: UI component library
- **Usage**: Build interactive, stateful user interfaces
- **Key Features**:
  - Component-based architecture
  - Hooks for state management (useState, useEffect)
  - Virtual DOM for efficient rendering
  - Real-time updates via event listeners

#### React DOM (v19.2.0)
- **Purpose**: React renderer for web browsers
- **Usage**: Mounts React components to the HTML DOM

---

### **Build Tools**

#### Vite (v7.2.2)
- **Purpose**: Next-generation frontend build tool
- **Usage**: Development server and production bundler
- **Key Features**:
  - Lightning-fast Hot Module Replacement (HMR)
  - Native ES modules support
  - Optimized production builds
  - Built-in TypeScript support
  - Asset handling (SVG, images, fonts)

#### @vitejs/plugin-react (v4.7.0)
- **Purpose**: Vite plugin for React support
- **Usage**: Enables React Fast Refresh and JSX transformation

#### TypeScript (v5.9.3)
- **Purpose**: Typed superset of JavaScript
- **Usage**: Type checking for safer code
- **Key Features**:
  - Static type analysis
  - IntelliSense and autocomplete
  - Compile-time error detection
  - Better refactoring support

---

## 🔧 Development Tools

### **PowerShell Scripts**
- `start-lab-instructor.ps1` - Starts blockchain node, deploys contracts, launches instructor dashboard
- `start-lab-student.ps1` - Configures student connection to instructor's blockchain
- `start-lab.ps1` - General lab startup script

### **Configuration Files**
- `hardhat.config.js` - Hardhat network configuration
- `vite.config.js` - Vite build configuration
- `tsconfig.json` - TypeScript compiler options

---

## 🎨 Frontend Architecture

### **State Management**
- React Hooks (useState, useEffect)
- Local Storage for persistence (wallet addresses, RPC URLs, progress tracking)
- Real-time blockchain event listeners

### **Key Components**
1. **Wallet Interface** - Balance display, transaction history, asset portfolio
2. **Staking Interface** - Adjustable stake amounts, reward tracking, withdraw functionality
3. **Mini-Labs** - Interactive educational modules:
   - Blockchain Visualizer (chain of blocks)
   - Address Decoder (hexadecimal breakdown)
   - Staking Rewards Calculator
   - Validator Probability Simulator
   - Slashing Penalty Calculator
   - Attack Cost Calculator
4. **PoS Validator Simulator** - Step-by-step weighted random selection
5. **Instructor Dashboard** - Student monitoring, contract management, bulk operations

### **Styling**
- Custom CSS with CSS variables
- Dark theme optimized for readability
- Gradient backgrounds and smooth transitions
- Responsive grid layouts

---

## 🔐 Smart Contracts (Solidity)

### **PoSSimulator.sol**
- **Functions**:
  - `stake()` - Lock ETH to become a validator
  - `withdraw()` - Retrieve stake + rewards
  - `calculateReward()` - View pending rewards
  - `sendMessage()` - On-chain chat
- **Events**:
  - `Staked` - Emitted when ETH is staked
  - `Withdrawn` - Emitted when stake is withdrawn
  - `NewMessage` - Emitted for chat messages

---

## 🌐 Deployment Strategy

### **Frontend (Vercel)**
- Static site generation via `vite build`
- Automatic deployments on git push
- Edge network CDN for fast global access
- Environment variables for configuration

### **Blockchain Node (Local/Ngrok)**
- Instructor runs Hardhat node locally
- Exposes RPC endpoint via:
  - Local network (IP:8545)
  - Ngrok tunnel (HTTPS URL)
- Students connect via RPC URL in app

---

## 📊 Data Flow

1. **Instructor Setup**:
   - Runs `start-lab-instructor.ps1`
   - Hardhat node starts on port 8545
   - Smart contracts deployed
   - Contract address shared with students

2. **Student Connection**:
   - Runs `start-lab-student.ps1` or accesses Vercel URL
   - Enters RPC URL and contract address
   - Generates burner wallet (or connects MetaMask)
   - Requests test ETH from faucet

3. **Blockchain Interaction**:
   - Frontend → Ethers.js → RPC Endpoint → Hardhat Node
   - Transactions signed locally with private key
   - Events emitted by smart contract
   - Frontend listens for events and updates UI

---

## 🚀 Performance Optimizations

- **Vite**: Fast HMR during development
- **React 19**: Automatic batching and concurrent features
- **Ethers.js**: Efficient ABI encoding and event filtering
- **Local Storage**: Caches addresses and progress
- **Polling + Event Listeners**: Hybrid approach for real-time updates

---

## 🔒 Security Considerations

### **Development Environment**
- Uses test ETH with no real-world value
- Private keys stored in sessionStorage (cleared on tab close)
- Bank account private key hardcoded (acceptable for local dev only)

### **Production Warnings**
- ⚠️ Never use these private keys on mainnet
- ⚠️ Never commit real private keys to git
- ⚠️ Use environment variables for sensitive data
- ⚠️ Implement proper authentication for production

---

## 📚 Educational Features

### **Learning Modules**
1. **Orientation** - Why Ethereum matters
2. **Basics** - Wallets, gas, blocks, consensus
3. **Explore** - Deep dive into staking, validators, slashing, DeFi
4. **Learn** - PoW vs PoS comparison
5. **Practice** - Interactive PoS validator simulator
6. **Live Network** - Real blockchain interaction

### **Interactive Mini-Labs**
- Hands-on calculators and visualizations
- Real-time feedback
- Hover-to-learn interfaces
- Adjustable parameters

---

## 🛠️ Development Workflow

### **Local Development**
```bash
# Install dependencies
npm install

# Start blockchain node
npm run chain

# Deploy contracts (in new terminal)
npm run deploy

# Start frontend (in new terminal)
npm run web
```

### **Production Build**
```bash
# Build frontend for deployment
npm run build

# Output: frontend/dist/
```

---

## 📄 License

ISC License

---

## 👥 Contributors

Built for educational purposes to teach Ethereum, Proof-of-Stake, and blockchain fundamentals in a hands-on classroom environment.

---

## 🔗 Key Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/v6/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Ethereum.org](https://ethereum.org/en/developers/)
- [Solidity Documentation](https://docs.soliditylang.org/)

