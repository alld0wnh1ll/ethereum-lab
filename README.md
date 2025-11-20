# Local Web3 Training Environment

This is a lightweight, offline-capable Web3 development environment powered by Hardhat. It simulates a smart contract environment with instant block mining, full RPC interface, and pre-funded accounts.

## Features
- **Instant Block Mining:** No waiting for confirmations.
- **Instructor Dashboard:** Special view at `http://localhost:5173/?mode=instructor` to monitor all student activity
- **Networked Lab Mode:** Students can connect to the instructor's machine to simulate a shared blockchain.
- **Proof-of-Stake Simulator:** Interactive contract to teach staking, rewards, and slashing concepts.
- **Built-in Faucet:** Students can request Test ETH directly from the dashboard.
- **Auto-Generated Wallets:** Each browser tab gets its own unique identity (burner wallet)
- **Real-time Activity Tracking:** See who's staking, chatting, and transacting

## Prerequisites

- Node.js (v18 or later recommended)
- `npm` or `yarn`
- MetaMask (Browser Extension)
- ngrok (optional, for remote student access) - [Download](https://ngrok.com/download)

## 🚀 Quick Start

### For Instructors (Host the Blockchain)
```powershell
# Local network (same room)
./start-lab-instructor.ps1

# Remote students (via internet)
./start-lab-instructor.ps1 -UseNgrok
```

### For Students (Connect to Instructor)
```powershell
./start-lab-student.ps1
# Enter contract address and RPC URL when prompted
```

### Legacy All-in-One Setup
```powershell
./start-lab.ps1
```
This will:
- Start the blockchain node
- Deploy contracts
- Open the instructor dashboard at `http://localhost:5173/?mode=instructor`
- Display all necessary information

### Remote Student Access (via ngrok)
After running `start-lab.ps1`, open a new terminal:
```powershell
./start-ngrok.ps1
```
This will:
- Expose your frontend via HTTPS
- Display the URL for remote students
- Show connection instructions

### Manual Setup
1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start the Blockchain Node:**
    ```bash
    npm run chain
    ```
    *This starts the node on `0.0.0.0`, allowing other devices on your Wi-Fi to connect.*

3.  **Deploy Contracts:**
    Open a new terminal and run:
    ```bash
    npm run deploy
    ```
    **Copy the "PoS Simulator" address from the output.**

4.  **Start the Dashboard:**
    ```bash
    npm run web
    ```
    Open `http://localhost:5173` in your browser.

---

## 🎓 Classroom Lab Setup (Networked Session)

To have multiple students interact on the same blockchain:

### 1. Instructor Setup
1.  Run the Quick Start steps above.
2.  Find your computer's **Local IP Address**:
    *   **Windows:** Run `ipconfig` (Look for IPv4 Address, e.g., `192.168.1.50`)
    *   **Mac/Linux:** Run `ifconfig` or `ip a`
3.  Write your IP Address and the **PoS Contract Address** on the whiteboard.

### 2. Student Setup
1.  Open the Dashboard URL provided by the instructor (e.g., `http://192.168.1.50:5173`).
    *   *Alternatively, students can run the frontend locally (`npm run web`) and point it to the instructor's IP.*
2.  In the Dashboard header, change **Node URL** to:
    `http://<INSTRUCTOR_IP>:8545`
    *(Example: http://192.168.1.50:8545)*
3.  **Connect MetaMask:**
    *   Create a **new, empty account** in MetaMask.
    *   Add Network:
        *   **Name:** Classroom Net
        *   **RPC URL:** `http://<INSTRUCTOR_IP>:8545`
        *   **Chain ID:** `31337`
        *   **Currency:** ETH
4.  **Get Funds:** Click the **"💰 Request 5 ETH"** button on the dashboard.
5.  **Start Staking:** Paste the PoS Contract Address and click "Stake".

---

## 🧪 Lab Exercises

### Exercise 1: The Faucet
*   **Goal:** Understand how transactions require gas and funds.
*   **Action:** Use the "Request 5 ETH" button.
*   **Observation:** Watch the wallet balance update. Check MetaMask activity to see the incoming transfer.

### Exercise 2: Proof of Stake
*   **Goal:** Understand network security via capital lock-up.
*   **Action:** Stake 1.0 ETH into the PoS contract.
*   **Observation:**
    1.  "My Stake" updates to 1.0.
    2.  **"Global Network Stake"** increases for everyone in the class.
    3.  "Pending Rewards" begin accumulating in real-time.

### Exercise 3: Unbonding
*   **Goal:** Realize rewards.
*   **Action:** Click "Unstake & Claim".
*   **Observation:** Principal + Rewards are returned to the wallet. The Global Network Stake decreases.

## 🌐 Remote Access via ngrok (For Online Classes)

If students are not on the same Wi-Fi network, use **ngrok** to expose your local node to the internet:

### Instructor Setup:
1.  **Install ngrok:** Download from [ngrok.com](https://ngrok.com) or `choco install ngrok` (Windows)
2.  **Start your Hardhat node** (as usual): `npm run chain`
3.  **Expose port 8545:**
    ```bash
    ngrok http 8545
    ```
4.  **Copy the HTTPS URL** ngrok provides (e.g., `https://abc123.ngrok.io`)
5.  **Share this URL** with students (they paste it in the "Node URL" box)

### Student Setup:
1.  Open the Dashboard (can be hosted anywhere or run locally)
2.  In the **"Node URL"** field, paste the ngrok URL from the instructor
3.  Click "Join Class List" to announce your presence
4.  Start interacting!

**Note:** The blockchain itself provides consensus. All browsers reading from the same node (via ngrok) see identical data. There's no need for browsers to vote—the Hardhat node is the single source of truth.

## Troubleshooting

- **"Network Error" / "Connection Refused":**
    - Ensure the Instructor's computer is on the **same Wi-Fi** as the students (or use ngrok for remote).
    - Ensure the Instructor's **Firewall** allows connections on port `8545` and `5173`.
- **ngrok Connection Issues:**
    - Make sure ngrok is pointing to port `8545` (not `5173`).
    - Students should use the **HTTPS** URL ngrok provides (not HTTP).
- **Nonce Errors:** If you restart the node (`npm run chain`), tell students to reset their MetaMask account:
    - *Settings -> Advanced -> Clear activity tab data.*
