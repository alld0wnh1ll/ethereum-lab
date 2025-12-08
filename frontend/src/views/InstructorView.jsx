/**
 * InstructorView - Instructor dashboard with incremental event fetching
 * 
 * Displays student activity, staking stats, and provides
 * instructor controls. Uses incremental event fetching for performance.
 */

import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { rpcClient } from '../lib/RpcClient';

const POS_ABI = [
  "function totalStaked() view returns (uint256)",
  "function stakes(address) view returns (uint256)",
  "event Staked(address indexed user, uint256 amount)",
  "event Withdrawn(address indexed user, uint256 amount, uint256 reward)",
  "event NewMessage(address indexed sender, string message, uint256 timestamp)"
];

export function InstructorView({ provider, posAddress, rpcUrl }) {
  const [students, setStudents] = useState([]);
  const [contractBalance, setContractBalance] = useState('0');
  const [totalStaked, setTotalStaked] = useState('0');
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Track last processed block for incremental updates
  const lastBlockRef = useRef(0);
  const activityCacheRef = useRef({
    stakeEvents: [],
    withdrawEvents: [],
    messageEvents: [],
    addressMap: new Map()
  });

  useEffect(() => {
    if (!provider || !posAddress || posAddress.length !== 42) {
      console.log("Waiting for valid contract address...");
      return;
    }

    const fetchData = async () => {
      try {
        const currentBlock = await provider.getBlockNumber();
        const isInitialLoad = lastBlockRef.current === 0;
        const fromBlock = isInitialLoad ? 0 : lastBlockRef.current + 1;
        
        // Skip if no new blocks
        if (!isInitialLoad && currentBlock <= lastBlockRef.current) {
          return;
        }

        setIsLoading(true);
        
        const posContract = new ethers.Contract(posAddress, POS_ABI, provider);
        const cache = activityCacheRef.current;
        
        // Get total staked and contract balance
        const [total, balance] = await Promise.all([
          posContract.totalStaked(),
          provider.getBalance(posAddress)
        ]);
        setTotalStaked(ethers.formatEther(total));
        setContractBalance(ethers.formatEther(balance));
        
        // Fetch events (incremental after initial load)
        const [newStakes, newWithdraws, newMsgs] = await Promise.all([
          posContract.queryFilter(posContract.filters.Staked(), fromBlock, currentBlock),
          posContract.queryFilter(posContract.filters.Withdrawn(), fromBlock, currentBlock),
          posContract.queryFilter(posContract.filters.NewMessage(), fromBlock, currentBlock)
        ]);
        
        // Merge new events into cache
        cache.stakeEvents.push(...newStakes);
        cache.withdrawEvents.push(...newWithdraws);
        cache.messageEvents.push(...newMsgs);
        
        // Limit cache size (keep last 500 events each)
        if (cache.stakeEvents.length > 500) cache.stakeEvents = cache.stakeEvents.slice(-500);
        if (cache.withdrawEvents.length > 500) cache.withdrawEvents = cache.withdrawEvents.slice(-500);
        if (cache.messageEvents.length > 500) cache.messageEvents = cache.messageEvents.slice(-500);
        
        // Update address activity map
        newStakes.forEach(e => {
          if (!cache.addressMap.has(e.args.user)) {
            cache.addressMap.set(e.args.user, { stakes: 0, messages: 0, withdrawals: 0 });
          }
          cache.addressMap.get(e.args.user).stakes++;
        });
        
        newWithdraws.forEach(e => {
          if (!cache.addressMap.has(e.args.user)) {
            cache.addressMap.set(e.args.user, { stakes: 0, messages: 0, withdrawals: 0 });
          }
          cache.addressMap.get(e.args.user).withdrawals++;
        });
        
        newMsgs.forEach(e => {
          if (!cache.addressMap.has(e.args.sender)) {
            cache.addressMap.set(e.args.sender, { stakes: 0, messages: 0, withdrawals: 0 });
          }
          cache.addressMap.get(e.args.sender).messages++;
        });
        
        // Build student data from cache
        const studentData = await Promise.all(
          Array.from(cache.addressMap.keys()).map(async (address) => {
            const [bal, stake] = await Promise.all([
              provider.getBalance(address),
              posContract.stakes(address)
            ]);
            
            const activity = cache.addressMap.get(address);
            
            return {
              address,
              balance: ethers.formatEther(bal),
              stake: ethers.formatEther(stake),
              ...activity
            };
          })
        );
        
        // Sort by activity
        studentData.sort((a, b) => {
          const aTotal = a.stakes + a.messages + a.withdrawals;
          const bTotal = b.stakes + b.messages + b.withdrawals;
          return bTotal - aTotal;
        });
        
        setStudents(studentData);
        
        // Build recent activity from all cached events
        const allEvents = [
          ...cache.stakeEvents.map(e => ({ 
            type: 'stake', 
            address: e.args.user, 
            amount: ethers.formatEther(e.args.amount), 
            block: e.blockNumber 
          })),
          ...cache.withdrawEvents.map(e => ({ 
            type: 'withdraw', 
            address: e.args.user, 
            amount: ethers.formatEther(e.args.amount), 
            reward: ethers.formatEther(e.args.reward), 
            block: e.blockNumber 
          })),
          ...cache.messageEvents.map(e => ({ 
            type: 'message', 
            address: e.args.sender, 
            message: e.args.message, 
            block: e.blockNumber 
          }))
        ];
        
        allEvents.sort((a, b) => b.block - a.block);
        setRecentActivity(allEvents.slice(0, 10));
        
        lastBlockRef.current = currentBlock;
        
      } catch (error) {
        console.error("Error fetching instructor data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchData();
    
    // Refresh every 3 seconds
    const interval = setInterval(fetchData, 3000);
    
    return () => clearInterval(interval);
  }, [provider, posAddress]);

  const formatAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'stake': return '💰';
      case 'withdraw': return '🏦';
      case 'message': return '💬';
      default: return '📝';
    }
  };

  const deployNewContract = async () => {
    if (!confirm("Deploy a new PoS contract? Students will need the new address.")) return;
    alert("To deploy a new contract, run: npm run deploy\nThen update the contract address in the dashboard.");
  };

  const clearChatHistory = () => {
    if (!confirm("Clear chat history? This cannot be undone. (Note: blockchain events are permanent, but we can reset the UI)")) return;
    alert("Chat clearing requires redeployment of a new contract. Run: npm run deploy");
  };

  const resetStudentBalances = async () => {
    if (!confirm("Send 5 ETH to all students to reset their balances?")) return;
    
    try {
      const bankSigner = rpcClient.getBankSigner();
      if (!bankSigner) {
        alert("Bank signer not available. Check RPC connection.");
        return;
      }
      
      for (const student of students) {
        const tx = await bankSigner.sendTransaction({
          to: student.address,
          value: ethers.parseEther("5.0")
        });
        await tx.wait();
      }
      alert(`Sent 5 ETH to ${students.length} students!`);
    } catch (e) {
      console.error("Reset error:", e);
      alert("Failed to reset balances: " + e.message);
    }
  };

  return (
    <div className="instructor-dashboard">
      <h2>🎓 Instructor Dashboard</h2>
      
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: '#3b82f6',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          fontSize: '0.875rem'
        }}>
          Syncing...
        </div>
      )}
      
      {/* Instructor Controls */}
      <div className="instructor-controls" style={{marginBottom: '20px', padding: '15px', background: '#fef3c7', borderRadius: '8px'}}>
        <h3 style={{marginBottom: '15px', color: '#1e293b'}}>🎛️ Instructor Controls</h3>
        <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
          <button 
            onClick={deployNewContract}
            style={{padding: '10px 15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'}}
          >
            🚀 Deploy New Contract
          </button>
          <button 
            onClick={clearChatHistory}
            style={{padding: '10px 15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'}}
          >
            🗑️ Clear Chat (Requires Redeploy)
          </button>
          <button 
            onClick={resetStudentBalances}
            style={{padding: '10px 15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'}}
          >
            💰 Send 5 ETH to All Students
          </button>
        </div>
        <p style={{fontSize: '12px', marginTop: '10px', color: '#475569'}}>
          <strong style={{color: '#1e293b'}}>Note:</strong> Blockchain data is permanent. To truly reset, deploy a new contract and share the new address.
        </p>
      </div>
      
      {/* Overview Stats */}
      <div className="instructor-stats">
        <div className="stat-card">
          <div className="stat-label">Active Students</div>
          <div className="stat-value">{students.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Staked</div>
          <div className="stat-value">{parseFloat(totalStaked).toFixed(2)} ETH</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Contract Balance</div>
          <div className="stat-value">{parseFloat(contractBalance).toFixed(2)} ETH</div>
        </div>
      </div>
      
      {/* Student Table */}
      <div className="student-table-container">
        <h3>📊 Student Activity</h3>
        <table className="student-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Address</th>
              <th>Balance (ETH)</th>
              <th>Staked (ETH)</th>
              <th>Stakes</th>
              <th>Messages</th>
              <th>Withdrawals</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => (
              <tr key={student.address}>
                <td>{idx + 1}</td>
                <td className="address-cell">
                  <span title={student.address}>{formatAddress(student.address)}</span>
                  <button 
                    className="copy-btn"
                    onClick={() => navigator.clipboard.writeText(student.address)}
                    title="Copy full address"
                  >
                    📋
                  </button>
                </td>
                <td>{parseFloat(student.balance).toFixed(4)}</td>
                <td className={parseFloat(student.stake) > 0 ? 'staked' : ''}>
                  {parseFloat(student.stake).toFixed(4)}
                </td>
                <td>{student.stakes}</td>
                <td>{student.messages}</td>
                <td>{student.withdrawals}</td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan="7" className="empty-message">
                  Waiting for students to join...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Recent Activity Feed */}
      <div className="activity-feed">
        <h3>🔄 Recent Activity</h3>
        <div className="activity-list">
          {recentActivity.map((event, idx) => (
            <div key={idx} className="activity-item">
              <span className="activity-icon">{getActivityIcon(event.type)}</span>
              <span className="activity-address">{formatAddress(event.address)}</span>
              <span className="activity-detail">
                {event.type === 'stake' && `Staked ${event.amount} ETH`}
                {event.type === 'withdraw' && `Withdrew ${event.amount} ETH (+ ${event.reward} reward)`}
                {event.type === 'message' && `"${event.message.slice(0, 50)}${event.message.length > 50 ? '...' : ''}"`}
              </span>
              <span className="activity-block">Block #{event.block}</span>
            </div>
          ))}
          {recentActivity.length === 0 && (
            <div className="empty-message">No activity yet...</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InstructorView;

