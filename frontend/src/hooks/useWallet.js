/**
 * useWallet - React hook for wallet management
 * 
 * Manages a guest wallet stored in sessionStorage, providing
 * address, signer, and balance state. Automatically hydrates
 * the wallet when the provider changes.
 */

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const GUEST_KEY_STORAGE = 'guest_sk';

/**
 * Hook for managing guest wallet
 * @param {ethers.Provider} provider - The ethers provider
 * @returns {Object} - Wallet state and methods
 */
export function useWallet(provider) {
  const [wallet, setWallet] = useState({
    address: null,
    signer: null,
    balance: '0',
    mode: null
  });
  const [isLoading, setIsLoading] = useState(false);

  // Hydrate wallet when provider changes
  useEffect(() => {
    if (!provider) {
      setWallet({ address: null, signer: null, balance: '0', mode: null });
      return;
    }

    let cancelled = false;

    const hydrateWallet = async () => {
      setIsLoading(true);
      
      try {
        // Get or create private key
        let privateKey = sessionStorage.getItem(GUEST_KEY_STORAGE);
        
        if (!privateKey) {
          const newWallet = ethers.Wallet.createRandom();
          privateKey = newWallet.privateKey;
          sessionStorage.setItem(GUEST_KEY_STORAGE, privateKey);
        }
        
        // Create signer connected to provider
        const signer = new ethers.Wallet(privateKey, provider);
        const address = signer.address;
        
        // Get balance
        let balance = '0';
        try {
          const bal = await provider.getBalance(address);
          balance = ethers.formatEther(bal);
        } catch (e) {
          console.warn("Failed to get balance:", e);
        }
        
        if (!cancelled) {
          setWallet({
            address,
            signer,
            balance,
            mode: 'guest'
          });
        }
      } catch (err) {
        console.error("Failed to hydrate wallet:", err);
        if (!cancelled) {
          setWallet({ address: null, signer: null, balance: '0', mode: null });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    hydrateWallet();

    return () => {
      cancelled = true;
    };
  }, [provider]);

  // Update balance
  const updateBalance = useCallback(async () => {
    if (!provider || !wallet.address) return;
    
    try {
      const bal = await provider.getBalance(wallet.address);
      setWallet(prev => ({ ...prev, balance: ethers.formatEther(bal) }));
    } catch (e) {
      console.error("Failed to update balance:", e);
    }
  }, [provider, wallet.address]);

  // Send ETH to another address
  const sendEth = useCallback(async (toAddress, amountEth) => {
    if (!wallet.signer) {
      throw new Error("Wallet not initialized");
    }
    
    if (!ethers.isAddress(toAddress)) {
      throw new Error("Invalid recipient address");
    }
    
    const tx = await wallet.signer.sendTransaction({
      to: toAddress,
      value: ethers.parseEther(amountEth)
    });
    
    const receipt = await tx.wait();
    
    // Update balance after sending
    await updateBalance();
    
    return receipt;
  }, [wallet.signer, updateBalance]);

  // Get the private key (for display/export only)
  const getPrivateKey = useCallback(() => {
    return sessionStorage.getItem(GUEST_KEY_STORAGE);
  }, []);

  // Reset wallet (create new identity)
  const resetWallet = useCallback(() => {
    sessionStorage.removeItem(GUEST_KEY_STORAGE);
    
    // Force re-hydration by clearing state
    setWallet({ address: null, signer: null, balance: '0', mode: null });
    
    // Note: The useEffect will re-run and create a new wallet
    // when the component re-renders
  }, []);

  // Check if wallet has sufficient balance
  const hasSufficientBalance = useCallback((amountEth) => {
    const amount = parseFloat(amountEth);
    const balance = parseFloat(wallet.balance);
    return balance >= amount;
  }, [wallet.balance]);

  return {
    wallet,
    isLoading,
    updateBalance,
    sendEth,
    getPrivateKey,
    resetWallet,
    hasSufficientBalance
  };
}

