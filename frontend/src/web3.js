import { ethers } from "ethers";

const LOCAL_NODE_URL = "http://127.0.0.1:8545";

// Setup provider connecting to the local Hardhat node
export const provider = new ethers.JsonRpcProvider(LOCAL_NODE_URL);

// --- METAMASK CONNECTION ---
export const connectWallet = async () => {
  if (window.ethereum) {
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await browserProvider.getSigner();
      return { mode: 'metamask', signer };
    } catch (error) {
      console.error("User rejected connection", error);
      throw error;
    }
  } else {
    throw new Error("MetaMask not found");
  }
};

// --- BURNER / GUEST WALLET ---
export const getGuestWallet = () => {
    // Check if we already have a guest key for this tab
    let privateKey = sessionStorage.getItem("guest_sk");
    
    if (!privateKey) {
        // Generate random new identity
        const wallet = ethers.Wallet.createRandom();
        privateKey = wallet.privateKey;
        sessionStorage.setItem("guest_sk", privateKey);
    }

    // Connect wallet to our provider so it can send transactions
    const wallet = new ethers.Wallet(privateKey, provider);
    return { mode: 'guest', signer: wallet };
}

// Helper to check if local node is alive
export const checkNodeStatus = async () => {
    try {
        const network = await provider.getNetwork();
        const blockNumber = await provider.getBlockNumber();
        return {
            connected: true,
            chainId: network.chainId.toString(),
            blockNumber: blockNumber
        };
    } catch (error) {
        return { connected: false, error };
    }
};
