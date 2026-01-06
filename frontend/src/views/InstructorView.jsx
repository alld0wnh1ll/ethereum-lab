/**
 * InstructorView - Enhanced Instructor Dashboard
 * 
 * Features:
 * - Real-time student monitoring with staking stats
 * - Slashing controls for misbehavior
 * - Block proposal simulation with weighted validator selection
 * - Attestation checking and penalties
 * - Network stats (APY, validators, epochs)
 */

import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { rpcClient } from '../lib/RpcClient';
import PoSABI from '../PoS.json';

export function InstructorView({ provider, posAddress, rpcUrl }) {
  // Initialize rpcClient with the RPC URL
  useEffect(() => {
    if (rpcUrl) {
      rpcClient.setRpcUrl(rpcUrl);
      console.log('[InstructorView] RpcClient initialized with:', rpcUrl);
    }
  }, [rpcUrl]);
  
  // Student data
  const [students, setStudents] = useState([]);
  
  // Contract stats
  const [contractBalance, setContractBalance] = useState('0');
  const [totalStaked, setTotalStaked] = useState('0');
  const [validatorCount, setValidatorCount] = useState(0);
  const [currentAPY, setCurrentAPY] = useState(0);
  const [currentEpoch, setCurrentEpoch] = useState(1);
  const [timeUntilNextEpoch, setTimeUntilNextEpoch] = useState(0);
  
  // Activity feed
  const [recentActivity, setRecentActivity] = useState([]);
  const [blockProposals, setBlockProposals] = useState([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [slashReason, setSlashReason] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [lastProposedValidator, setLastProposedValidator] = useState(null);
  const [actionLog, setActionLog] = useState([]);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  
  // Track last processed block for incremental updates
  const lastBlockRef = useRef(0);
  const activityCacheRef = useRef({
    stakeEvents: [],
    withdrawEvents: [],
    messageEvents: [],
    slashEvents: [],
    blockEvents: [],
    addressMap: new Map()
  });

  // Main data fetching effect
  useEffect(() => {
    if (!provider || !posAddress || posAddress.length !== 42) {
      console.log("InstructorView: Waiting for valid contract address...");
      return;
    }

    const fetchData = async () => {
      try {
        // Verify contract exists before fetching data
        const code = await provider.getCode(posAddress);
        if (code === '0x' || code === '0x0') {
          // Contract not deployed yet - silently skip
          return;
        }
        
        const currentBlock = await provider.getBlockNumber();
        const isInitialLoad = lastBlockRef.current === 0;
        const fromBlock = isInitialLoad ? 0 : lastBlockRef.current + 1;
        
        // Skip if no new blocks
        if (!isInitialLoad && currentBlock <= lastBlockRef.current) {
          return;
        }

        setIsLoading(true);
        
        const posContract = new ethers.Contract(posAddress, PoSABI, provider);
        const cache = activityCacheRef.current;
        
        // Get contract stats
        const [total, balance, valCount, apy, epoch, epochTime] = await Promise.all([
          posContract.totalStaked(),
          provider.getBalance(posAddress),
          posContract.getValidatorCount(),
          posContract.getCurrentAPY(),
          posContract.currentEpoch(),
          posContract.getTimeUntilNextEpoch()
        ]);
        
        setTotalStaked(ethers.formatEther(total));
        setContractBalance(ethers.formatEther(balance));
        setValidatorCount(Number(valCount));
        setCurrentAPY(Number(apy) / 100); // Convert from 500 to 5.00
        setCurrentEpoch(Number(epoch));
        setTimeUntilNextEpoch(Number(epochTime));
        
        // Fetch all event types
        const [newStakes, newWithdraws, newMsgs, newSlashes, newBlocks] = await Promise.all([
          posContract.queryFilter(posContract.filters.Staked(), fromBlock, currentBlock),
          posContract.queryFilter(posContract.filters.Withdrawn(), fromBlock, currentBlock),
          posContract.queryFilter(posContract.filters.NewMessage(), fromBlock, currentBlock),
          posContract.queryFilter(posContract.filters.Slashed(), fromBlock, currentBlock),
          posContract.queryFilter(posContract.filters.BlockProposed(), fromBlock, currentBlock)
        ]);
        
        // Merge new events into cache
        cache.stakeEvents.push(...newStakes);
        cache.withdrawEvents.push(...newWithdraws);
        cache.messageEvents.push(...newMsgs);
        cache.slashEvents.push(...newSlashes);
        cache.blockEvents.push(...newBlocks);
        
        // Limit cache size
        const maxCache = 500;
        if (cache.stakeEvents.length > maxCache) cache.stakeEvents = cache.stakeEvents.slice(-maxCache);
        if (cache.withdrawEvents.length > maxCache) cache.withdrawEvents = cache.withdrawEvents.slice(-maxCache);
        if (cache.messageEvents.length > maxCache) cache.messageEvents = cache.messageEvents.slice(-maxCache);
        if (cache.slashEvents.length > maxCache) cache.slashEvents = cache.slashEvents.slice(-maxCache);
        if (cache.blockEvents.length > maxCache) cache.blockEvents = cache.blockEvents.slice(-maxCache);
        
        // Update address activity map
        newStakes.forEach(e => {
          if (!cache.addressMap.has(e.args.validator)) {
            cache.addressMap.set(e.args.validator, { stakes: 0, messages: 0, withdrawals: 0, slashes: 0, blocks: 0 });
          }
          cache.addressMap.get(e.args.validator).stakes++;
        });
        
        newWithdraws.forEach(e => {
          if (!cache.addressMap.has(e.args.validator)) {
            cache.addressMap.set(e.args.validator, { stakes: 0, messages: 0, withdrawals: 0, slashes: 0, blocks: 0 });
          }
          cache.addressMap.get(e.args.validator).withdrawals++;
        });
        
        newMsgs.forEach(e => {
          if (!cache.addressMap.has(e.args.sender)) {
            cache.addressMap.set(e.args.sender, { stakes: 0, messages: 0, withdrawals: 0, slashes: 0, blocks: 0 });
          }
          cache.addressMap.get(e.args.sender).messages++;
        });
        
        newSlashes.forEach(e => {
          if (!cache.addressMap.has(e.args.validator)) {
            cache.addressMap.set(e.args.validator, { stakes: 0, messages: 0, withdrawals: 0, slashes: 0, blocks: 0 });
          }
          cache.addressMap.get(e.args.validator).slashes++;
        });
        
        newBlocks.forEach(e => {
          if (!cache.addressMap.has(e.args.proposer)) {
            cache.addressMap.set(e.args.proposer, { stakes: 0, messages: 0, withdrawals: 0, slashes: 0, blocks: 0 });
          }
          cache.addressMap.get(e.args.proposer).blocks++;
        });
        
        // Build student data with enhanced stats
        const studentData = await Promise.all(
          Array.from(cache.addressMap.keys()).map(async (address) => {
            try {
              const [bal, stats] = await Promise.all([
              provider.getBalance(address),
                posContract.getValidatorStats(address)
            ]);
            
            const activity = cache.addressMap.get(address);
            
            return {
              address,
              balance: ethers.formatEther(bal),
                stake: ethers.formatEther(stats.stakeAmount),
                reward: ethers.formatEther(stats.rewardAmount),
                slashCount: Number(stats.slashes),
                blocksProposed: Number(stats.blocks),
                missedAttestations: Number(stats.attestations),
                unbondingTime: Number(stats.unbondingTime),
              ...activity
            };
            } catch (e) {
              console.error(`Error fetching stats for ${address}:`, e);
              return null;
            }
          })
        );
        
        // Filter out nulls and sort by activity
        const validStudents = studentData.filter(s => s !== null);
        validStudents.sort((a, b) => {
          const aTotal = a.stakes + a.messages + a.withdrawals + a.blocks;
          const bTotal = b.stakes + b.messages + b.withdrawals + b.blocks;
          return bTotal - aTotal;
        });
        
        setStudents(validStudents);
        
        // Build recent activity feed
        const allEvents = [
          ...cache.stakeEvents.map(e => ({ 
            type: 'stake', 
            address: e.args.validator, 
            amount: ethers.formatEther(e.args.amount), 
            block: e.blockNumber 
          })),
          ...cache.withdrawEvents.map(e => ({ 
            type: 'withdraw', 
            address: e.args.validator, 
            amount: ethers.formatEther(e.args.amount), 
            reward: ethers.formatEther(e.args.reward), 
            block: e.blockNumber 
          })),
          ...cache.messageEvents.map(e => ({ 
            type: 'message', 
            address: e.args.sender, 
            message: e.args.message, 
            block: e.blockNumber 
          })),
          ...cache.slashEvents.map(e => ({
            type: 'slash',
            address: e.args.validator,
            amount: ethers.formatEther(e.args.amount),
            reason: e.args.reason,
            block: e.blockNumber
          })),
          ...cache.blockEvents.map(e => ({
            type: 'block',
            address: e.args.proposer,
            blockNumber: Number(e.args.blockNumber),
            reward: ethers.formatEther(e.args.reward),
            block: e.blockNumber 
          }))
        ];
        
        allEvents.sort((a, b) => b.block - a.block);
        setRecentActivity(allEvents.slice(0, 15));
        
        // Set block proposals separately
        setBlockProposals(cache.blockEvents.slice(-10).reverse());
        
        lastBlockRef.current = currentBlock;
        
      } catch (error) {
        // Only log if it's not a contract-not-found error
        if (!error.message?.includes('BAD_DATA') && !error.message?.includes('could not decode')) {
          console.error("Error fetching instructor data:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // Fast 1-second polling for responsive instructor dashboard
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, [provider, posAddress]);

  // Format address for display
  const formatAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Get activity icon
  const getActivityIcon = (type) => {
    switch (type) {
      case 'stake': return '💰';
      case 'withdraw': return '🏦';
      case 'message': return '💬';
      case 'slash': return '⚡';
      case 'block': return '🎲';
      default: return '📝';
    }
  };

  // Show temporary status message
  const showStatus = (msg, duration = 3000) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(''), duration);
  };

  // Add to action log with timestamp
  const logAction = (action, status, details = '') => {
    const timestamp = new Date().toLocaleTimeString();
    const entry = { timestamp, action, status, details };
    console.log(`[Instructor ${timestamp}] ${action}: ${status}${details ? ' - ' + details : ''}`);
    setActionLog(prev => [entry, ...prev.slice(0, 19)]); // Keep last 20 entries
  };

  // ==================== INSTRUCTOR ACTIONS ====================

  // Slash a validator
  const handleSlash = async (address) => {
    if (!slashReason.trim()) {
      showStatus('⚠️ Please enter a reason for slashing');
      logAction('Slash', '⚠️ BLOCKED', 'No reason provided');
      return;
    }
    
    if (!confirm(`Slash ${formatAddress(address)} for "${slashReason}"?\nThis will deduct 5% of their stake.`)) {
      logAction('Slash', '❌ CANCELLED', `User cancelled for ${formatAddress(address)}`);
      return;
    }
    
    setIsActionInProgress(true);
    logAction('Slash', '⏳ STARTED', `Target: ${formatAddress(address)}, Reason: ${slashReason}`);
    
    try {
      showStatus('⚡ Slashing validator...');
      const bankSigner = rpcClient.getBankSigner();
      if (!bankSigner) {
        showStatus('❌ Bank signer not initialized. Check RPC connection.');
        logAction('Slash', '❌ FAILED', 'Bank signer not initialized');
        return;
      }
      const contract = new ethers.Contract(posAddress, PoSABI, bankSigner);
      console.log('[Instructor] Sending slash transaction...');
      const tx = await contract.slash(address, slashReason);
      console.log('[Instructor] Slash TX sent:', tx.hash);
      logAction('Slash', '📤 TX SENT', `Hash: ${tx.hash.slice(0, 18)}...`);
      
      const receipt = await tx.wait();
      console.log('[Instructor] Slash TX confirmed in block:', receipt.blockNumber);
      
      showStatus(`✅ Slashed ${formatAddress(address)}!`);
      logAction('Slash', '✅ SUCCESS', `${formatAddress(address)} slashed, block #${receipt.blockNumber}`);
      setSlashReason('');
      setSelectedStudent(null);
    } catch (e) {
      console.error('Slash error:', e);
      showStatus('❌ Slash failed: ' + (e.reason || e.message));
      logAction('Slash', '❌ FAILED', e.reason || e.message);
    } finally {
      setIsActionInProgress(false);
    }
  };

  // Simulate block proposal
  const handleSimulateBlock = async () => {
    setIsActionInProgress(true);
    logAction('Block Proposal', '⏳ STARTED', 'Selecting validator...');
    
    try {
      showStatus('🎲 Simulating block proposal...');
      const bankSigner = rpcClient.getBankSigner();
      if (!bankSigner) {
        showStatus('❌ Bank signer not initialized');
        logAction('Block Proposal', '❌ FAILED', 'Bank signer not initialized');
        return;
      }
      const contract = new ethers.Contract(posAddress, PoSABI, bankSigner);
      
      console.log('[Instructor] Sending block proposal transaction...');
      const tx = await contract.simulateBlockProposal();
      console.log('[Instructor] Block proposal TX sent:', tx.hash);
      logAction('Block Proposal', '📤 TX SENT', `Hash: ${tx.hash.slice(0, 18)}...`);
      
      const receipt = await tx.wait();
      console.log('[Instructor] Block proposal TX confirmed in block:', receipt.blockNumber);
      
      // Parse the event to get the selected validator
      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === 'BlockProposed';
        } catch { return false; }
      });
      
      if (event) {
        const parsed = contract.interface.parseLog(event);
        const proposer = parsed.args.proposer;
        const reward = ethers.formatEther(parsed.args.reward);
        setLastProposedValidator(proposer);
        showStatus(`✅ Block proposed by ${formatAddress(proposer)}!`, 5000);
        logAction('Block Proposal', '✅ SUCCESS', `Proposer: ${formatAddress(proposer)}, Reward: ${reward} ETH`);
        console.log('[Instructor] Block proposed by:', proposer, 'Reward:', reward, 'ETH');
      } else {
        showStatus('✅ Block proposed!');
        logAction('Block Proposal', '✅ SUCCESS', 'Block confirmed (no event found)');
      }
    } catch (e) {
      console.error('Block simulation error:', e);
      showStatus('❌ Simulation failed: ' + (e.reason || e.message));
      logAction('Block Proposal', '❌ FAILED', e.reason || e.message);
    } finally {
      setIsActionInProgress(false);
    }
  };

  // Check missed attestations
  const handleCheckAttestations = async () => {
    setIsActionInProgress(true);
    logAction('Attestation Check', '⏳ STARTED', 'Scanning validators...');
    
    try {
      showStatus('🔍 Checking missed attestations...');
      const bankSigner = rpcClient.getBankSigner();
      if (!bankSigner) {
        showStatus('❌ Bank signer not initialized');
        logAction('Attestation Check', '❌ FAILED', 'Bank signer not initialized');
        return;
      }
      const contract = new ethers.Contract(posAddress, PoSABI, bankSigner);
      
      console.log('[Instructor] Sending attestation check transaction...');
      const tx = await contract.checkMissedAttestations();
      console.log('[Instructor] Attestation check TX sent:', tx.hash);
      logAction('Attestation Check', '📤 TX SENT', `Hash: ${tx.hash.slice(0, 18)}...`);
      
      const receipt = await tx.wait();
      console.log('[Instructor] Attestation check TX confirmed in block:', receipt.blockNumber);
      
      // Count penalty events
      const penaltyEvents = receipt.logs.filter(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === 'AttestationMissed';
        } catch { return false; }
      });
      
      showStatus('✅ Attestation check complete!');
      logAction('Attestation Check', '✅ SUCCESS', `${penaltyEvents.length} validators penalized`);
      console.log('[Instructor] Attestation check complete,', penaltyEvents.length, 'validators penalized');
    } catch (e) {
      console.error('Attestation check error:', e);
      showStatus('❌ Check failed: ' + (e.reason || e.message));
      logAction('Attestation Check', '❌ FAILED', e.reason || e.message);
    } finally {
      setIsActionInProgress(false);
    }
  };

  // Advance epoch manually
  const handleAdvanceEpoch = async () => {
    setIsActionInProgress(true);
    logAction('Advance Epoch', '⏳ STARTED', `Current epoch: ${currentEpoch}`);
    
    try {
      showStatus('⏰ Advancing epoch...');
      const bankSigner = rpcClient.getBankSigner();
      if (!bankSigner) {
        showStatus('❌ Bank signer not initialized');
        logAction('Advance Epoch', '❌ FAILED', 'Bank signer not initialized');
        return;
      }
      const contract = new ethers.Contract(posAddress, PoSABI, bankSigner);
      
      console.log('[Instructor] Sending advance epoch transaction...');
      const tx = await contract.advanceEpoch();
      console.log('[Instructor] Advance epoch TX sent:', tx.hash);
      logAction('Advance Epoch', '📤 TX SENT', `Hash: ${tx.hash.slice(0, 18)}...`);
      
      const receipt = await tx.wait();
      console.log('[Instructor] Advance epoch TX confirmed in block:', receipt.blockNumber);
      
      showStatus('✅ Epoch advanced!');
      logAction('Advance Epoch', '✅ SUCCESS', `Now epoch ${currentEpoch + 1}`);
    } catch (e) {
      console.error('Epoch advance error:', e);
      showStatus('❌ Advance failed: ' + (e.reason || e.message));
      logAction('Advance Epoch', '❌ FAILED', e.reason || e.message);
    } finally {
      setIsActionInProgress(false);
    }
  };

  // Send ETH to all students
  const resetStudentBalances = async () => {
    if (students.length === 0) {
      showStatus('⚠️ No students to fund');
      logAction('Fund Students', '⚠️ BLOCKED', 'No students found');
      return;
    }
    
    if (!confirm(`Send 5 ETH to all ${students.length} students?`)) {
      logAction('Fund Students', '❌ CANCELLED', 'User cancelled');
      return;
    }
    
    setIsActionInProgress(true);
    logAction('Fund Students', '⏳ STARTED', `Funding ${students.length} students...`);
    
    try {
      showStatus('💰 Sending ETH to students...');
      const bankSigner = rpcClient.getBankSigner();
      if (!bankSigner) {
        showStatus('❌ Bank signer not initialized');
        logAction('Fund Students', '❌ FAILED', 'Bank signer not initialized');
        return;
      }
      
      let funded = 0;
      for (const student of students) {
        console.log(`[Instructor] Sending 5 ETH to ${formatAddress(student.address)}...`);
        const tx = await bankSigner.sendTransaction({
          to: student.address,
          value: ethers.parseEther("5.0")
        });
        await tx.wait();
        funded++;
        showStatus(`💰 Funded ${funded}/${students.length} students...`);
      }
      
      showStatus(`✅ Sent 5 ETH to ${students.length} students!`);
      logAction('Fund Students', '✅ SUCCESS', `${funded} students received 5 ETH each`);
      console.log('[Instructor] Successfully funded', funded, 'students');
    } catch (e) {
      console.error("Reset error:", e);
      showStatus('❌ Failed: ' + e.message);
      logAction('Fund Students', '❌ FAILED', e.message);
    } finally {
      setIsActionInProgress(false);
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="instructor-dashboard">
      <h2>🎓 Instructor Dashboard</h2>
      
      {/* Status Messages */}
      {(isLoading || statusMessage) && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: statusMessage.includes('❌') ? '#ef4444' : '#3b82f6',
          color: 'white',
          padding: '0.75rem 1.25rem',
          borderRadius: '0.5rem',
          fontSize: '0.9rem',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          {statusMessage || 'Syncing...'}
        </div>
      )}
      
      {/* Instructor Controls */}
      <div style={{
        marginBottom: '20px', 
        padding: '20px', 
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
        borderRadius: '12px',
        border: '2px solid #f59e0b'
      }}>
        <h3 style={{marginBottom: '15px', color: '#1e293b'}}>🎛️ Instructor Controls</h3>
        
        {/* Action Buttons */}
        <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px'}}>
          <button 
            onClick={handleSimulateBlock}
            style={{
              padding: '12px 20px', 
              background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.9rem'
            }}
          >
            🎲 Simulate Block Proposal
          </button>
          <button 
            onClick={handleCheckAttestations}
            style={{
              padding: '12px 20px', 
              background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.9rem'
            }}
          >
            🔍 Check Attestations
          </button>
          <button 
            onClick={handleAdvanceEpoch}
            disabled={timeUntilNextEpoch > 0}
            style={{
              padding: '12px 20px', 
              background: timeUntilNextEpoch > 0 ? '#94a3b8' : 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: timeUntilNextEpoch > 0 ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '0.9rem'
            }}
          >
            ⏰ Advance Epoch {timeUntilNextEpoch > 0 ? `(${timeUntilNextEpoch}s)` : ''}
          </button>
          <button 
            onClick={resetStudentBalances}
            style={{
              padding: '12px 20px', 
              background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.9rem'
            }}
          >
            💰 Fund All Students
          </button>
        </div>
        
        {/* Last Block Proposal */}
        {lastProposedValidator && (
          <div style={{
            padding: '10px 15px',
            background: 'rgba(139, 92, 246, 0.2)',
            borderRadius: '8px',
            marginBottom: '10px',
            border: '1px solid #8b5cf6'
          }}>
            <span style={{color: '#1e293b'}}>
              🎲 Last block proposed by: <strong>{formatAddress(lastProposedValidator)}</strong>
            </span>
          </div>
        )}
        
        <p style={{fontSize: '12px', color: '#475569'}}>
          <strong>Note:</strong> Slashing and attestation penalties affect validator stakes. Block proposals demonstrate weighted random selection.
        </p>
        
        {/* Action Log Panel */}
        <div style={{
          marginTop: '15px',
          background: '#1e293b',
          borderRadius: '8px',
          border: '1px solid #334155',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          <div style={{
            padding: '8px 12px',
            background: '#334155',
            borderBottom: '1px solid #475569',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{fontWeight: 'bold', fontSize: '0.85rem', color: '#e2e8f0'}}>
              📋 Action Log {isActionInProgress && <span style={{color: '#fbbf24', marginLeft: '8px'}}>⏳ Processing...</span>}
            </span>
            <button 
              onClick={() => setActionLog([])}
              style={{
                padding: '4px 8px',
                background: '#475569',
                border: 'none',
                borderRadius: '4px',
                color: '#94a3b8',
                fontSize: '0.7rem',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          </div>
          <div style={{padding: '8px'}}>
            {actionLog.length === 0 ? (
              <div style={{color: '#64748b', fontSize: '0.8rem', textAlign: 'center', padding: '10px'}}>
                No actions yet. Click a button above to see the log.
              </div>
            ) : (
              actionLog.map((entry, idx) => (
                <div 
                  key={idx} 
                  style={{
                    padding: '6px 8px',
                    borderBottom: idx < actionLog.length - 1 ? '1px solid #334155' : 'none',
                    fontSize: '0.8rem',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start'
                  }}
                >
                  <span style={{color: '#64748b', minWidth: '70px', fontFamily: 'monospace'}}>
                    {entry.timestamp}
                  </span>
                  <span style={{
                    color: entry.status.includes('SUCCESS') ? '#34d399' : 
                           entry.status.includes('FAILED') ? '#ef4444' : 
                           entry.status.includes('STARTED') ? '#fbbf24' :
                           entry.status.includes('TX SENT') ? '#22d3ee' : '#94a3b8',
                    fontWeight: 'bold',
                    minWidth: '80px'
                  }}>
                    {entry.status}
                  </span>
                  <span style={{color: '#e2e8f0', flex: 1}}>
                    <strong>{entry.action}</strong>
                    {entry.details && <span style={{color: '#94a3b8', marginLeft: '8px'}}>{entry.details}</span>}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Network Stats */}
      <div className="instructor-stats" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div className="stat-card" style={{background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '15px', borderRadius: '10px', textAlign: 'center'}}>
          <div style={{fontSize: '0.8rem', color: '#94a3b8', marginBottom: '5px'}}>Active Validators</div>
          <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#22d3ee'}}>{validatorCount}</div>
        </div>
        <div className="stat-card" style={{background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '15px', borderRadius: '10px', textAlign: 'center'}}>
          <div style={{fontSize: '0.8rem', color: '#94a3b8', marginBottom: '5px'}}>Total Staked</div>
          <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#a78bfa'}}>{parseFloat(totalStaked).toFixed(2)} ETH</div>
        </div>
        <div className="stat-card" style={{background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '15px', borderRadius: '10px', textAlign: 'center'}}>
          <div style={{fontSize: '0.8rem', color: '#94a3b8', marginBottom: '5px'}}>Contract Balance</div>
          <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#34d399'}}>{parseFloat(contractBalance).toFixed(2)} ETH</div>
        </div>
        <div className="stat-card" style={{background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '15px', borderRadius: '10px', textAlign: 'center'}}>
          <div style={{fontSize: '0.8rem', color: '#94a3b8', marginBottom: '5px'}}>Current APY</div>
          <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24'}}>{currentAPY.toFixed(2)}%</div>
        </div>
        <div className="stat-card" style={{background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '15px', borderRadius: '10px', textAlign: 'center'}}>
          <div style={{fontSize: '0.8rem', color: '#94a3b8', marginBottom: '5px'}}>Current Epoch</div>
          <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#f472b6'}}>{currentEpoch}</div>
        </div>
        <div className="stat-card" style={{background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '15px', borderRadius: '10px', textAlign: 'center'}}>
          <div style={{fontSize: '0.8rem', color: '#94a3b8', marginBottom: '5px'}}>Next Epoch</div>
          <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#38bdf8'}}>{timeUntilNextEpoch}s</div>
        </div>
      </div>
      
      {/* Student Table */}
      <div style={{marginBottom: '20px', overflowX: 'auto'}}>
        <h3 style={{marginBottom: '15px'}}>📊 Validator Activity</h3>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          background: '#1e293b',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <thead>
            <tr style={{background: '#334155'}}>
              <th style={{padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '0.8rem'}}>#</th>
              <th style={{padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '0.8rem'}}>Address</th>
              <th style={{padding: '12px', textAlign: 'right', color: '#94a3b8', fontSize: '0.8rem'}}>Balance</th>
              <th style={{padding: '12px', textAlign: 'right', color: '#94a3b8', fontSize: '0.8rem'}}>Staked</th>
              <th style={{padding: '12px', textAlign: 'right', color: '#94a3b8', fontSize: '0.8rem'}}>Rewards</th>
              <th style={{padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem'}}>Blocks</th>
              <th style={{padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem'}}>Slashes</th>
              <th style={{padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem'}}>Missed</th>
              <th style={{padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => (
              <tr 
                key={student.address} 
                style={{
                  borderBottom: '1px solid #334155',
                  background: lastProposedValidator === student.address ? 'rgba(139, 92, 246, 0.2)' : 'transparent'
                }}
              >
                <td style={{padding: '12px', color: '#e2e8f0'}}>{idx + 1}</td>
                <td style={{padding: '12px'}}>
                  <span 
                    style={{color: '#22d3ee', fontFamily: 'monospace', cursor: 'pointer'}}
                    onClick={() => navigator.clipboard.writeText(student.address)}
                    title={student.address}
                  >
                    {formatAddress(student.address)}
                  </span>
                  {student.unbondingTime > 0 && student.unbondingTime < 9999999999 && (
                    <span style={{marginLeft: '8px', fontSize: '0.75rem', color: '#fbbf24'}}>
                      ⏳ {student.unbondingTime}s
                    </span>
                  )}
                </td>
                <td style={{padding: '12px', textAlign: 'right', color: '#e2e8f0'}}>
                  {parseFloat(student.balance).toFixed(3)}
                </td>
                <td style={{
                  padding: '12px', 
                  textAlign: 'right', 
                  color: parseFloat(student.stake) > 0 ? '#a78bfa' : '#64748b',
                  fontWeight: parseFloat(student.stake) > 0 ? 'bold' : 'normal'
                }}>
                  {parseFloat(student.stake).toFixed(3)}
                </td>
                <td style={{padding: '12px', textAlign: 'right', color: '#34d399'}}>
                  +{parseFloat(student.reward).toFixed(6)}
                </td>
                <td style={{padding: '12px', textAlign: 'center', color: '#8b5cf6', fontWeight: 'bold'}}>
                  {student.blocksProposed}
                </td>
                <td style={{
                  padding: '12px', 
                  textAlign: 'center', 
                  color: student.slashCount > 0 ? '#ef4444' : '#64748b',
                  fontWeight: student.slashCount > 0 ? 'bold' : 'normal'
                }}>
                  {student.slashCount}
                </td>
                <td style={{
                  padding: '12px', 
                  textAlign: 'center', 
                  color: student.missedAttestations > 0 ? '#f59e0b' : '#64748b'
                }}>
                  {student.missedAttestations}
                </td>
                <td style={{padding: '12px', textAlign: 'center'}}>
                  {parseFloat(student.stake) > 0 && (
                    <button
                      onClick={() => setSelectedStudent(selectedStudent === student.address ? null : student.address)}
                      style={{
                        padding: '6px 12px',
                        background: selectedStudent === student.address ? '#ef4444' : '#475569',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      ⚡ Slash
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan="9" style={{padding: '30px', textAlign: 'center', color: '#64748b'}}>
                  Waiting for students to stake...
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* Slash Input Panel */}
        {selectedStudent && (
          <div style={{
            marginTop: '15px',
            padding: '15px',
            background: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)',
            borderRadius: '10px',
            border: '2px solid #ef4444'
          }}>
            <div style={{marginBottom: '10px', color: '#fecaca'}}>
              ⚡ Slashing {formatAddress(selectedStudent)} - Enter reason:
            </div>
            <div style={{display: 'flex', gap: '10px'}}>
              <input
                type="text"
                value={slashReason}
                onChange={(e) => setSlashReason(e.target.value)}
                placeholder="e.g., Double signing, being offline, misbehavior..."
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '0.9rem'
                }}
              />
              <button
                onClick={() => handleSlash(selectedStudent)}
                style={{
                  padding: '10px 20px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Confirm Slash
              </button>
              <button
                onClick={() => { setSelectedStudent(null); setSlashReason(''); }}
                style={{
                  padding: '10px 20px',
                  background: '#475569',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Recent Activity Feed */}
      <div style={{marginBottom: '20px'}}>
        <h3 style={{marginBottom: '15px'}}>🔄 Recent Activity</h3>
        <div style={{
          background: '#1e293b',
          borderRadius: '10px',
          padding: '15px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {recentActivity.map((event, idx) => (
            <div 
              key={idx} 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px',
                borderBottom: idx < recentActivity.length - 1 ? '1px solid #334155' : 'none',
                background: event.type === 'slash' ? 'rgba(239, 68, 68, 0.1)' : 
                           event.type === 'block' ? 'rgba(139, 92, 246, 0.1)' : 'transparent'
              }}
            >
              <span style={{fontSize: '1.25rem'}}>{getActivityIcon(event.type)}</span>
              <span style={{color: '#22d3ee', fontFamily: 'monospace', minWidth: '100px'}}>
                {formatAddress(event.address)}
              </span>
              <span style={{flex: 1, color: '#e2e8f0', fontSize: '0.9rem'}}>
                {event.type === 'stake' && `Staked ${parseFloat(event.amount).toFixed(2)} ETH`}
                {event.type === 'withdraw' && `Withdrew ${parseFloat(event.amount).toFixed(2)} ETH (+${parseFloat(event.reward).toFixed(4)} reward)`}
                {event.type === 'message' && `"${event.message?.slice(0, 40)}${event.message?.length > 40 ? '...' : ''}"`}
                {event.type === 'slash' && <span style={{color: '#ef4444'}}>Slashed {parseFloat(event.amount).toFixed(4)} ETH - "{event.reason}"</span>}
                {event.type === 'block' && <span style={{color: '#a78bfa'}}>Proposed block #{event.blockNumber}</span>}
              </span>
              <span style={{color: '#64748b', fontSize: '0.8rem'}}>
                Block #{event.block}
              </span>
            </div>
          ))}
          {recentActivity.length === 0 && (
            <div style={{padding: '20px', textAlign: 'center', color: '#64748b'}}>
              No activity yet...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InstructorView;
