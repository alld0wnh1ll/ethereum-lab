import { ethers } from "ethers";

const LOCAL_NODE_URL = "http://127.0.0.1:8545";

// Storage key for wallet persistence
const WALLET_STORAGE_KEY = "eth_lab_wallet_pk";

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
// Persists across browser sessions using localStorage
export const getGuestWallet = () => {
    // Try localStorage first (persists across sessions), then sessionStorage (tab-only)
    let privateKey = localStorage.getItem(WALLET_STORAGE_KEY) || 
                     sessionStorage.getItem("guest_sk");
    
    if (!privateKey) {
        // Generate random new identity
        const wallet = ethers.Wallet.createRandom();
        privateKey = wallet.privateKey;
        console.log("[Wallet] Created new wallet:", wallet.address);
    }
    
    // Save to both storages for redundancy
    localStorage.setItem(WALLET_STORAGE_KEY, privateKey);
    sessionStorage.setItem("guest_sk", privateKey);

    // Connect wallet to our provider so it can send transactions
    const wallet = new ethers.Wallet(privateKey, provider);
    return { mode: 'guest', signer: wallet };
}

// Get existing wallet address without creating new one
export const getStoredWalletAddress = () => {
    const privateKey = localStorage.getItem(WALLET_STORAGE_KEY) || 
                       sessionStorage.getItem("guest_sk");
    if (!privateKey) return null;
    
    try {
        const wallet = new ethers.Wallet(privateKey);
        return wallet.address;
    } catch {
        return null;
    }
}

// Reset wallet - creates a new identity
export const resetWallet = () => {
    localStorage.removeItem(WALLET_STORAGE_KEY);
    sessionStorage.removeItem("guest_sk");
    console.log("[Wallet] Wallet reset - new identity will be created on next access");
}

// Export wallet private key (for backup purposes - warn user!)
export const exportWalletKey = () => {
    const privateKey = localStorage.getItem(WALLET_STORAGE_KEY);
    if (!privateKey) {
        console.warn("[Wallet] No wallet found to export");
        return null;
    }
    console.warn("[Wallet] ⚠️ SECURITY WARNING: Never share your private key!");
    return privateKey;
}

// Import wallet from private key
export const importWallet = (privateKey) => {
    try {
        // Validate the private key
        const wallet = new ethers.Wallet(privateKey);
        
        // Save to storage
        localStorage.setItem(WALLET_STORAGE_KEY, privateKey);
        sessionStorage.setItem("guest_sk", privateKey);
        
        console.log("[Wallet] Imported wallet:", wallet.address);
        return { success: true, address: wallet.address };
    } catch (error) {
        console.error("[Wallet] Invalid private key:", error);
        return { success: false, error: "Invalid private key" };
    }
}

// Helper to check if local node is alive
export const checkNodeStatus = async (customUrl = null) => {
    const targetProvider = customUrl 
        ? new ethers.JsonRpcProvider(customUrl) 
        : provider;
    
    try {
        const network = await targetProvider.getNetwork();
        const blockNumber = await targetProvider.getBlockNumber();
        return {
            connected: true,
            chainId: network.chainId.toString(),
            blockNumber: blockNumber
        };
    } catch (error) {
        return { connected: false, error: error.message };
    }
};
