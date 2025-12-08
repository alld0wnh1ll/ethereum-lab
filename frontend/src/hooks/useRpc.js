/**
 * useRpc - React hook for RPC provider management
 * 
 * Manages the RPC connection state and provides a clean interface
 * for connecting to Ethereum nodes. Automatically checks connection
 * status and updates node status.
 */

import { useState, useEffect, useCallback } from 'react';
import { rpcClient } from '../lib/RpcClient';

/**
 * Hook for managing RPC connection
 * @param {string} initialUrl - Initial RPC URL
 * @returns {Object} - RPC state and methods
 */
export function useRpc(initialUrl = '') {
  const [rpcUrl, setRpcUrlState] = useState(initialUrl);
  const [provider, setProvider] = useState(null);
  const [nodeStatus, setNodeStatus] = useState({ 
    connected: false, 
    blockNumber: 0,
    chainId: null 
  });
  const [isConnecting, setIsConnecting] = useState(false);

  // Set RPC URL and update provider
  const setRpcUrl = useCallback((url) => {
    setRpcUrlState(url);
  }, []);

  // Update provider when URL changes
  useEffect(() => {
    if (rpcClient.setRpcUrl(rpcUrl)) {
      setProvider(rpcClient.getProvider());
    } else if (!rpcUrl) {
      setProvider(null);
      setNodeStatus({ connected: false, blockNumber: 0, chainId: null });
    }
  }, [rpcUrl]);

  // Periodically check connection status
  useEffect(() => {
    if (!provider) {
      setNodeStatus({ connected: false, blockNumber: 0, chainId: null });
      return;
    }

    let cancelled = false;
    let interval;

    const checkConnection = async () => {
      if (cancelled) return;
      
      try {
        setIsConnecting(true);
        const status = await rpcClient.checkConnection();
        if (!cancelled) {
          setNodeStatus(status);
        }
      } catch (e) {
        if (!cancelled) {
          setNodeStatus({ connected: false, blockNumber: 0, chainId: null });
        }
      } finally {
        if (!cancelled) {
          setIsConnecting(false);
        }
      }
    };

    // Initial check
    checkConnection();
    
    // Check every 2 seconds
    interval = setInterval(checkConnection, 2000);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [provider]);

  // Get the bank signer for faucet operations
  const getBankSigner = useCallback(() => {
    return rpcClient.getBankSigner();
  }, []);

  // Send ETH from bank (faucet)
  const sendFromBank = useCallback(async (toAddress, amountEth) => {
    return rpcClient.sendFromBank(toAddress, amountEth);
  }, []);

  return {
    rpcUrl,
    setRpcUrl,
    provider,
    nodeStatus,
    isConnecting,
    getBankSigner,
    sendFromBank
  };
}

