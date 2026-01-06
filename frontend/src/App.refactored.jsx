/**
 * App.jsx - Refactored Main Application
 * 
 * This is a sample refactored version of App.jsx that demonstrates
 * how to use the new modular architecture with:
 * - Custom hooks (useRpc, useWallet, usePosContract)
 * - Extracted view components
 * - Centralized content constants
 * 
 * To migrate from the original App.jsx:
 * 1. Rename this file to App.jsx
 * 2. Test each view to ensure functionality
 * 3. Add any missing features from the original
 */

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Custom hooks for shared state management
import { useRpc } from './hooks/useRpc';
import { useWallet } from './hooks/useWallet';
import { usePosContract } from './hooks/usePosContract';

// View components
import { IntroView, ConceptsView, ExploreView, LearnView, InstructorView } from './views';

// Content constants
import { EXPLORE_MISSIONS } from './constants/content';

// Keep PoSABI for direct contract interactions
import PoSABI from './PoS.json';

import './index.css';

// Helper to determine default RPC URL based on environment
function getDefaultRpcUrl() {
  const isRemote = !window.location.hostname.includes('localhost') && 
                   !window.location.hostname.includes('127.0.0.1');
  const isNgrok = window.location.hostname.includes('ngrok') || 
                  window.location.protocol === 'https:';
  
  if (isNgrok) return ''; // User needs to configure
  if (isRemote) return `http://${window.location.hostname}:8545`;
  return 'http://127.0.0.1:8545';
}

function App() {
  // URL params
  const urlParams = new URLSearchParams(window.location.search);
  const isInstructor = urlParams.get('mode') === 'instructor';
  
  // View navigation state
  const [view, setView] = useState(isInstructor ? 'instructor' : 'intro');
  
  // Learning progress (persisted to localStorage)
  const [trail, setTrail] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('learning_trail')) || 
             { intro: false, concepts: false, explore: false };
    } catch {
      return { intro: false, concepts: false, explore: false };
    }
  });
  
  const [exploreProgress, setExploreProgress] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('explore_progress')) || 
             new Array(EXPLORE_MISSIONS.length).fill(false);
    } catch {
      return new Array(EXPLORE_MISSIONS.length).fill(false);
    }
  });
  
  // PoS contract address
  const [posAddress, setPosAddress] = useState(() => 
    localStorage.getItem("pos_addr") || ""
  );
  
  // Status messages
  const [statusMsg, setStatusMsg] = useState('');
  
  // Live network state
  const [chatInput, setChatInput] = useState('');
  const [recipient, setRecipient] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [stakeAmount, setStakeAmount] = useState('1');

  // ===== CUSTOM HOOKS =====
  const { 
    rpcUrl, 
    setRpcUrl, 
    provider, 
    nodeStatus, 
    getBankSigner,
    sendFromBank 
  } = useRpc(getDefaultRpcUrl());
  
  const { 
    wallet, 
    updateBalance, 
    sendEth 
  } = useWallet(provider);
  
  const {
    messages,
    validators,
    myStake,
    totalStaked,
    isSyncing,
    syncData,
    stake: posStake,
    withdraw: posWithdraw,
    sendMessage: posSendMessage,
    sendSponsoredMessage
  } = usePosContract(provider, posAddress);

  // ===== PERSISTENCE =====
  useEffect(() => {
    localStorage.setItem('learning_trail', JSON.stringify(trail));
  }, [trail]);
  
  useEffect(() => {
    localStorage.setItem('explore_progress', JSON.stringify(exploreProgress));
  }, [exploreProgress]);
  
  useEffect(() => {
    if (posAddress) {
      localStorage.setItem('pos_addr', posAddress);
    }
  }, [posAddress]);

  // ===== DATA SYNC =====
  useEffect(() => {
    if (view === 'live' && posAddress.length === 42 && wallet.address) {
      syncData(wallet.address);
      const interval = setInterval(() => syncData(wallet.address), 2000);
      return () => clearInterval(interval);
    }
  }, [posAddress, view, wallet.address, syncData]);

  // ===== HELPER FUNCTIONS =====
  const markStageComplete = (stage) => {
    if (trail[stage]) return;
    setTrail(prev => ({ ...prev, [stage]: true }));
  };

  const requestFunds = async () => {
    if (!wallet.address) return;
    if (statusMsg.includes("Requesting")) return;
    
    try {
      setStatusMsg("Requesting ETH from faucet...");
      await sendFromBank(wallet.address, "5.0");
      setStatusMsg("Received 5 ETH from faucet!");
      await updateBalance();
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (e) {
      setStatusMsg("Faucet Failed: " + (e.message || "Unknown error"));
    }
  };

  const sendEthToPeer = async () => {
    if (!ethers.isAddress(recipient)) {
      return setStatusMsg("Invalid Recipient Address");
    }
    if (!sendAmount) {
      return setStatusMsg("Enter amount");
    }
    
    try {
      setStatusMsg("Sending ETH...");
      await sendEth(recipient, sendAmount);
      setStatusMsg(`Sent ${sendAmount} ETH to ${recipient.slice(0,6)}!`);
      setSendAmount("");
      setRecipient("");
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (e) {
      setStatusMsg("Transfer Failed: " + e.message);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    if (!posAddress || posAddress.length !== 42) {
      return setStatusMsg("Invalid Contract Address");
    }
    
    try {
      setStatusMsg("Sending message...");
      
      if (parseFloat(wallet.balance) < 0.01) {
        // Use sponsored message for users with no ETH
        const bankSigner = getBankSigner();
        await sendSponsoredMessage(bankSigner, wallet.address, chatInput);
      } else {
        await posSendMessage(wallet.signer, chatInput);
      }
      
      setChatInput("");
      setStatusMsg("");
      syncData(wallet.address);
    } catch (err) {
      console.error("Chat error:", err);
      setStatusMsg("Chat failed: " + (err.message || "Unknown error"));
    }
  };

  const handleStake = async () => {
    if (!posAddress || !wallet.signer) {
      return setStatusMsg("Connect wallet first");
    }
    if (!stakeAmount || parseFloat(stakeAmount) < 1) {
      return setStatusMsg("Minimum stake is 1 ETH");
    }
    if (parseFloat(stakeAmount) > parseFloat(wallet.balance)) {
      return setStatusMsg("Insufficient balance");
    }
    
    try {
      setStatusMsg(`Staking ${stakeAmount} ETH...`);
      await posStake(wallet.signer, stakeAmount);
      setStatusMsg(`Successfully staked ${stakeAmount} ETH!`);
      await updateBalance();
      syncData(wallet.address);
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (e) {
      setStatusMsg("Staking failed: " + (e.message || "Unknown error"));
    }
  };

  const handleWithdraw = async () => {
    try {
      setStatusMsg("Withdrawing stake...");
      await posWithdraw(wallet.signer);
      setStatusMsg("Withdrew stake + rewards!");
      await updateBalance();
      syncData(wallet.address);
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (e) {
      setStatusMsg("Withdraw failed: " + (e.message || "Unknown error"));
    }
  };

  const copyAddress = (addr) => {
    if (addr) {
      navigator.clipboard.writeText(addr);
      setStatusMsg(`Copied ${addr.slice(0,6)}...`);
    }
  };

  // ===== RENDER =====
  return (
    <div className="app-layout">
      {/* NAVIGATION SIDEBAR */}
      <aside className="nav-sidebar">
        <h1>Ethereum Trainer</h1>
        <nav>
          <div className="learning-roadmap">
            <button 
              className={`roadmap-step ${view === 'intro' ? 'active' : ''} ${trail.intro ? 'done' : ''}`} 
              onClick={() => setView('intro')}
            >
              <span>1</span> Orientation
            </button>
            <button 
              className={`roadmap-step ${view === 'concepts' ? 'active' : ''} ${trail.concepts ? 'done' : ''}`}
              onClick={() => setView('concepts')}
            >
              <span>2</span> Basics
            </button>
            <button 
              className={`roadmap-step ${view === 'explore' ? 'active' : ''} ${trail.explore ? 'done' : ''}`}
              onClick={() => setView('explore')}
            >
              <span>3</span> Explore
            </button>
            <button 
              className={`roadmap-step ${view === 'learn' ? 'active' : ''}`}
              onClick={() => setView('learn')}
            >
              <span>4</span> Learn
            </button>
            <button 
              className={`roadmap-step ${view === 'sim' ? 'active' : ''}`}
              onClick={() => setView('sim')}
            >
              <span>5</span> Practice
            </button>
            <button 
              className={`roadmap-step ${view === 'live' ? 'active' : ''}`}
              onClick={() => setView('live')}
            >
              <span>6</span> Live Network
            </button>
            <button 
              className={`roadmap-step ${view === 'cli' ? 'active' : ''}`}
              onClick={() => setView('cli')}
            >
              <span>7</span> CLI Labs
            </button>
          </div>
          
          {isInstructor ? (
            <button 
              className={view === 'instructor' ? 'active' : ''} 
              onClick={() => setView('instructor')}
            >
              🎓 Instructor Dashboard
            </button>
          ) : (
            <small className="nav-caption">
              Instructor dashboard available at <code>?mode=instructor</code>
            </small>
          )}
        </nav>

        {/* Classmates Panel */}
        {view === 'live' && (
          <div className="roster-panel">
            <h3>👥 Classmates ({validators.length})</h3>
            <p className="roster-hint">Click to copy/send</p>
            <ul>
              {validators.map(v => (
                <li key={v} onClick={() => copyAddress(v)} title="Click to Copy Address">
                  <div className="avatar" style={{background: `#${v.slice(2,8)}`}}></div>
                  <div className="roster-item-content">
                    <span>{v.slice(0,6)}...{v.slice(-4)}</span>
                    {v === wallet.address && <span className="you-badge">(You)</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        
        {/* INTRO VIEW */}
        {view === 'intro' && (
          <IntroView 
            onNext={() => {
              markStageComplete('intro');
              setView('concepts');
            }} 
          />
        )}

        {/* CONCEPTS VIEW */}
        {view === 'concepts' && (
          <ConceptsView 
            onBack={() => setView('intro')}
            onNext={() => {
              markStageComplete('concepts');
              setView('explore');
            }}
          />
        )}

        {/* EXPLORE VIEW */}
        {view === 'explore' && (
          <ExploreView 
            missions={EXPLORE_MISSIONS}
            exploreProgress={exploreProgress}
            setExploreProgress={setExploreProgress}
            onBack={() => setView('concepts')}
            onContinue={() => {
              markStageComplete('explore');
              setView('learn');
            }}
          />
        )}

        {/* LEARN VIEW */}
        {view === 'learn' && (
          <LearnView 
            onBack={() => setView('explore')}
            onNext={() => setView('sim')}
          />
        )}

        {/* PRACTICE/SIM VIEW - Keep original for now */}
        {view === 'sim' && (
          <div className="practice-placeholder">
            <h2>🧪 Practice Mode</h2>
            <p>PoS Validator Simulation - Coming in next refactor phase</p>
            <button 
              className="primary-btn"
              onClick={() => setView('live')}
            >
              Go to Live Network →
            </button>
          </div>
        )}

        {/* LIVE NETWORK VIEW - Simplified, uses hooks */}
        {view === 'live' && (
          <div className="live-dashboard">
            {/* Connection Setup */}
            <div className="connection-setup" style={{marginBottom: '1.5rem', padding: '1rem', background: '#1e293b', borderRadius: '0.75rem'}}>
              <h3 style={{marginTop: 0}}>🔌 Connection Setup</h3>
              <div style={{display: 'flex', gap: '1rem', alignItems: 'flex-end'}}>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem'}}>RPC URL</label>
                  <input 
                    value={rpcUrl}
                    onChange={e => setRpcUrl(e.target.value)}
                    placeholder="http://127.0.0.1:8545"
                    style={{width: '100%'}}
                  />
                </div>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem'}}>Contract Address</label>
                  <input 
                    value={posAddress}
                    onChange={e => setPosAddress(e.target.value)}
                    placeholder="0x..."
                    style={{width: '100%'}}
                  />
                </div>
                <div>
                  <span className={`dot ${nodeStatus.connected ? 'green' : 'red'}`}></span>
                  {nodeStatus.connected ? ` Block #${nodeStatus.blockNumber}` : ' Disconnected'}
                </div>
              </div>
            </div>

            {/* Wallet Info */}
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              padding: '2rem',
              borderRadius: '1rem',
              marginBottom: '1.5rem',
              color: 'white'
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <div>
                  <div style={{fontSize: '0.85rem', opacity: 0.9}}>Your Wallet</div>
                  <div style={{fontFamily: 'monospace', fontSize: '0.9rem'}}>
                    {wallet.address ? `${wallet.address.slice(0,10)}...${wallet.address.slice(-8)}` : 'Connecting...'}
                  </div>
                </div>
                <button onClick={() => copyAddress(wallet.address)} style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  color: 'white',
                  cursor: 'pointer'
                }}>
                  📋 Copy
                </button>
              </div>
              <div style={{textAlign: 'center', padding: '2rem 0'}}>
                <div style={{fontSize: '3rem', fontWeight: 'bold'}}>
                  {parseFloat(wallet.balance || 0).toFixed(4)} ETH
                </div>
              </div>
              {parseFloat(myStake.amount) > 0 && (
                <div style={{background: 'rgba(255,255,255,0.15)', padding: '1rem', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between'}}>
                  <div>
                    <div style={{fontSize: '0.85rem', opacity: 0.9}}>Staked</div>
                    <div style={{fontWeight: 'bold'}}>{parseFloat(myStake.amount).toFixed(4)} ETH</div>
                  </div>
                  <div>
                    <div style={{fontSize: '0.85rem', opacity: 0.9}}>Rewards</div>
                    <div style={{fontWeight: 'bold', color: '#86efac'}}>+{parseFloat(myStake.reward).toFixed(6)} ETH</div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Grid */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem'}}>
              <button onClick={requestFunds} style={{
                background: '#10b981', color: 'white', border: 'none',
                padding: '1rem', borderRadius: '0.75rem', cursor: 'pointer',
                fontSize: '1rem', fontWeight: 'bold'
              }}>
                🚰 Get ETH
              </button>
              <button onClick={handleStake} style={{
                background: '#8b5cf6', color: 'white', border: 'none',
                padding: '1rem', borderRadius: '0.75rem', cursor: 'pointer',
                fontSize: '1rem', fontWeight: 'bold'
              }}>
                🏦 Stake
              </button>
              <button onClick={handleWithdraw} style={{
                background: '#3b82f6', color: 'white', border: 'none',
                padding: '1rem', borderRadius: '0.75rem', cursor: 'pointer',
                fontSize: '1rem', fontWeight: 'bold'
              }}>
                💰 Withdraw
              </button>
            </div>

            {/* Send & Chat */}
            <div className="live-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
              <section className="card">
                <h3>📤 Send ETH</h3>
                <input 
                  placeholder="Recipient 0x..." 
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  style={{marginBottom: '0.5rem'}}
                />
                <input 
                  type="number" 
                  placeholder="Amount" 
                  value={sendAmount}
                  onChange={e => setSendAmount(e.target.value)}
                  style={{marginBottom: '0.5rem'}}
                />
                <button onClick={sendEthToPeer} className="primary-btn">Send</button>
              </section>

              <section className="card">
                <h3>💬 Class Chat</h3>
                <div style={{maxHeight: '200px', overflowY: 'auto', marginBottom: '0.5rem'}}>
                  {messages.slice(-10).map((msg, idx) => (
                    <div key={idx} style={{marginBottom: '0.5rem', fontSize: '0.9rem'}}>
                      <strong style={{color: '#93c5fd'}}>
                        {msg.sender.slice(0,6)}...{msg.sender.slice(-4)}:
                      </strong> {msg.text}
                    </div>
                  ))}
                </div>
                <div style={{display: 'flex', gap: '0.5rem'}}>
                  <input 
                    placeholder="Type message..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                    style={{flex: 1}}
                  />
                  <button onClick={sendChatMessage}>Post</button>
                </div>
              </section>
            </div>

            {statusMsg && (
              <p style={{textAlign: 'center', marginTop: '1rem', color: '#fbbf24'}}>{statusMsg}</p>
            )}
          </div>
        )}

        {/* CLI LABS VIEW - Placeholder */}
        {view === 'cli' && (
          <div className="cli-placeholder">
            <h2>💻 CLI Labs</h2>
            <p>Command-line labs - See CLI_LABS.md for instructions</p>
            <a 
              href="https://github.com/codespaces/new?repo=YOUR_REPO"
              target="_blank"
              rel="noopener noreferrer"
              className="primary-btn"
            >
              🚀 Open in Codespaces
            </a>
          </div>
        )}

        {/* INSTRUCTOR VIEW */}
        {view === 'instructor' && (
          <InstructorView 
            provider={provider}
            posAddress={posAddress}
            rpcUrl={rpcUrl}
          />
        )}
      </main>
    </div>
  );
}

export default App;

