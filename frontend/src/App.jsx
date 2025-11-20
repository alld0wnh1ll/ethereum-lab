import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { connectWallet, checkNodeStatus, getGuestWallet } from './web3'
import PoSABI from './PoS.json'
import InstructorDashboard from './InstructorDashboard'
import './index.css'

// Hardhat default private key for Account #0 (The "Bank")
const BANK_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// --- ORIENTATION CONTENT ---
const INTRO_SECTIONS = [
    {
        title: "Why This Lab Exists",
        bullets: [
            "Experience a complete Ethereum stack without cloud services",
            "Understand wallets, transactions, and finality in context",
            "Practice safely before touching production networks"
        ]
    },
    {
        title: "What You'll Experience",
        bullets: [
            "Manual wallet generation and key safety drills",
            "Simulated transactions and block confirmations",
            "Real-time collaboration with your classmates"
        ]
    },
    {
        title: "Classroom Roles",
        bullets: [
            "Instructor hosts the blockchain and faucet",
            "Students connect with burner wallets or MetaMask",
            "Everyone shares the same Proof-of-Stake simulator"
        ]
    }
]

const CONCEPT_CARDS = [
    {
        title: "Wallet Anatomy",
        description: "A wallet is math, not magic. Private keys sign, public addresses receive.",
        highlight: ["Private key → signature", "Address → identity", "Signatures prove ownership"]
    },
    {
        title: "Gas & Fees",
        description: "Every state change costs gas. Even chat messages consume ETH.",
        highlight: ["Gas limit caps work", "Gas price sets urgency", "Unused gas is refunded"]
    },
    {
        title: "Blocks & Finality",
        description: "Transactions live in blocks. Once finalized, history is locked.",
        highlight: ["Block number = progress", "Reorgs are rare", "Receipts prove inclusion"]
    },
    {
        title: "Consensus",
        description: "Validators stake ETH, propose blocks, and earn rewards for honesty.",
        highlight: ["Stake = skin in the game", "Slashing deters bad actors", "Rewards encourage uptime"]
    }
]

const EXPLORE_MISSIONS = [
    {
        title: "Observe the Chain",
        action: "Use the dashboard to note the latest block number and time between blocks.",
        tip: "Watch how the number changes every few seconds."
    },
    {
        title: "Decode an Address",
        action: "Explain the first 4 and last 4 characters of your wallet address.",
        tip: "Shorthand like 0x12ab...c0de helps in class."
    },
    {
        title: "Design a Transaction",
        action: "Describe who pays gas, where ETH goes, and why signatures matter.",
        tip: "Use the practice lab for hints."
    }
]

// --- CONTENT: LEARNING MODULES ---
const LESSONS = [
    {
        id: "intro",
        title: "What is Ethereum?",
        content: (
            <div className="lesson-slide">
                <h3>The World Computer</h3>
                <p>Ethereum is not just money. It is a global, shared computer that no one owns.</p>
                <ul>
                    <li><strong>Decentralized:</strong> Runs on thousands of computers (Nodes) at once.</li>
                    <li><strong>Immutable:</strong> Once data is written, it cannot be erased.</li>
                    <li><strong>Programmable:</strong> You can write code (Smart Contracts) that runs on it.</li>
                </ul>
            </div>
        )
    },
    {
        id: "account",
        title: "Accounts & Keys",
        content: (
            <div className="lesson-slide">
                <h3>Your Digital Identity</h3>
                <p>To use Ethereum, you need a Key Pair:</p>
                <div className="concept-box">
                    <p>🔑 <strong>Private Key:</strong> Like your Password. NEVER share this. It signs transactions.</p>
                    <p>bad64...91a2</p>
                </div>
                <div className="concept-box">
                    <p>📬 <strong>Public Address:</strong> Like your Email. Share this to receive money.</p>
                    <p>0x71C...9A21</p>
                </div>
            </div>
        )
    },
    {
        id: "tx",
        title: "Transactions & Gas",
        content: (
            <div className="lesson-slide">
                <h3>Moving Data</h3>
                <p>Every time you want to change the blockchain (send money, post chat), you must send a <strong>Transaction</strong>.</p>
                <p>Miners/Validators do the work to process it. You pay them a fee called <strong>Gas</strong> (in ETH).</p>
            </div>
        )
    }
];

// --- COMPONENT: SIMULATION MODE ---
function SimulationMode({ onComplete }) {
    const [simStep, setSimStep] = useState(1);

    return (
        <div className="simulation-container">
            <h2>🧪 Practice Lab (Fake Mode)</h2>
            
            {simStep === 1 && (
                <div className="sim-step">
                    <h3>Step 1: Generate a Wallet</h3>
                    <p>Click the button to create a random key pair locally.</p>
                    <button onClick={() => setSimStep(2)}>Generate Keys 🎲</button>
                </div>
            )}

            {simStep === 2 && (
                <div className="sim-step">
                    <h3>Step 2: Review Credentials</h3>
                    <div className="fake-wallet">
                        <p><strong>Private Key:</strong> 0x4c0883a69102937d6231471b5dbb6204</p>
                        <p><strong>Address:</strong> 0x71C7656EC7ab88b098defB751B7401B5f6d8976F</p>
                    </div>
                    <p>In the real world, you would save the Private Key securely!</p>
                    <button onClick={() => setSimStep(3)}>I saved it ✅</button>
                </div>
            )}

            {simStep === 3 && (
                <div className="sim-step">
                    <h3>Step 3: Craft a Transaction</h3>
                    <p>Let's simulate sending 1.0 ETH to Alice.</p>
                    <div className="fake-tx-form">
                        <label>To:</label>
                        <input disabled value="0xAlice..." />
                        <label>Amount:</label>
                        <input disabled value="1.0 ETH" />
                        <label>Gas Fee:</label>
                        <input disabled value="0.00042 ETH" />
                    </div>
                    <button onClick={() => setSimStep(4)}>Sign & Send ✍️</button>
                </div>
            )}

             {simStep === 4 && (
                <div className="sim-step">
                    <h3>Step 4: Confirmed!</h3>
                    <p>Your transaction was included in Block #492.</p>
                    <div className="success-icon">🎉</div>
                    <button className="primary-btn" onClick={onComplete}>Go to Live Network 🚀</button>
                </div>
            )}
        </div>
    )
}

// --- MAIN APP COMPONENT ---
function App() {
  // Check URL params for instructor mode
  const urlParams = new URLSearchParams(window.location.search)
  const isInstructor = urlParams.get('mode') === 'instructor'
  
  const [view, setView] = useState(isInstructor ? 'instructor' : 'intro'); // intro -> concepts -> explore -> learn -> sim -> live | instructor
  
  // --- LIVE MODE STATE ---
  // Auto-detect if accessing from remote (not localhost)
  const isRemote = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')
  
  // Check if we're on ngrok (they use HTTPS and specific domains)
  const isNgrok = window.location.hostname.includes('ngrok') || window.location.protocol === 'https:'
  
  // Set default RPC URL based on environment
  let defaultRpcUrl = "http://127.0.0.1:8545" // Default for local
  if (isNgrok) {
    // If using ngrok, RPC might be on a separate ngrok URL or same domain
    // User will need to configure this
    defaultRpcUrl = "" // Leave empty for ngrok users to fill in
  } else if (isRemote) {
    // If remote but not ngrok, try same host on port 8545
    defaultRpcUrl = `http://${window.location.hostname}:8545`
  }
  
  // Check for student mode and auto-load config
  const isStudentMode = localStorage.getItem('student_mode') === 'true'
  const customRpc = localStorage.getItem('custom_rpc')

  const [trail, setTrail] = useState(() => {
    try {
        return JSON.parse(localStorage.getItem('learning_trail')) || { intro: false, concepts: false, explore: false }
    } catch {
        return { intro: false, concepts: false, explore: false }
    }
  })

  const [exploreProgress, setExploreProgress] = useState(() => {
    try {
        return JSON.parse(localStorage.getItem('explore_progress')) || [false, false, false]
    } catch {
        return [false, false, false]
    }
  })

  const [navHint, setNavHint] = useState('')
  
  const [rpcUrl, setRpcUrl] = useState(customRpc || defaultRpcUrl)
  const [showRpcConfig, setShowRpcConfig] = useState(isRemote || isStudentMode) // Show config for remote users and students
  const [provider, setProvider] = useState(null)
  const [nodeStatus, setNodeStatus] = useState({ connected: false, blockNumber: 0 })
  const [wallet, setWallet] = useState({ address: null, signer: null, balance: '0', mode: null })
  const [posAddress, setPosAddress] = useState(() => localStorage.getItem("pos_addr") || "")
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState("")
  const [validators, setValidators] = useState([])
  const [statusMsg, setStatusMsg] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [sessionStart] = useState(() => {
      const stored = localStorage.getItem("session_start")
      if (!stored) {
          const now = Date.now()
          localStorage.setItem("session_start", now.toString())
          return now
      }
      return parseInt(stored)
  })

  // Peer To Peer Send State
  const [recipient, setRecipient] = useState("")
  const [sendAmount, setSendAmount] = useState("")

  const saveTrail = (next) => {
    setTrail(next)
    localStorage.setItem('learning_trail', JSON.stringify(next))
  }

  const markStageComplete = (stage) => {
    if (trail[stage]) return
    const updated = { ...trail, [stage]: true }
    saveTrail(updated)
  }

  useEffect(() => {
    localStorage.setItem('explore_progress', JSON.stringify(exploreProgress))
  }, [exploreProgress])

  const unlocks = {
    intro: true,
    concepts: trail.intro || view === 'concepts' || isInstructor,
    explore: (trail.intro && trail.concepts) || view === 'explore' || isInstructor,
    learn: (trail.intro && trail.concepts && trail.explore) || view === 'learn' || isInstructor,
    sim: (trail.intro && trail.concepts && trail.explore) || view === 'sim' || isInstructor,
    live: (trail.intro && trail.concepts && trail.explore) || view === 'live' || isInstructor
  }

  const requestView = (target) => {
    if (target === 'instructor') {
        setView('instructor')
        setNavHint('')
        return
    }
    if (unlocks[target]) {
        setView(target)
        setNavHint('')
    } else {
        const messages = {
            concepts: "Complete Orientation before moving on.",
            explore: "Finish the Basics cards before exploration.",
            learn: "Complete the exploration checklist before Learn mode.",
            sim: "Unlock Practice by finishing Orientation, Basics, and Explore.",
            live: "Unlock Live Network by finishing the earlier stages."
        }
        const msg = messages[target] || "Complete the previous stage first."
        setNavHint(msg)
        setTimeout(() => setNavHint(''), 4000)
    }
  }

  // 1. Initialize Provider
  useEffect(() => {
    const sanitizedUrl = (rpcUrl || "").trim()
    if (!sanitizedUrl) {
        setProvider(null)
        setNodeStatus({ connected: false, blockNumber: 0 })
        return
    }
    try {
        const newProvider = new ethers.JsonRpcProvider(sanitizedUrl)
        setProvider(newProvider)
    } catch (e) {
        console.error("Invalid RPC URL:", e)
        setProvider(null)
        setNodeStatus({ connected: false, blockNumber: 0 })
    }
  }, [rpcUrl])

  // 2. Auto-Connect Logic (Only in Live Mode)
  useEffect(() => {
    if (view !== 'live' || !provider || wallet.mode === 'metamask') return;

    let cancelled = false

    const check = async () => {
      try {
        const bn = await provider.getBlockNumber()
        if (!cancelled) {
            setNodeStatus({ connected: true, blockNumber: bn })
        }
      } catch (e) { 
        if (!cancelled) {
            setNodeStatus({ connected: false, blockNumber: 0 })
        }
      }
    }
    check();
    const interval = setInterval(check, 2000);

    const hydrateGuestWallet = async () => {
        try {
            const { mode, signer } = getGuestWallet()
            const addr = await signer.getAddress()
            const connectedSigner = signer.connect(provider)
            const bal = await provider.getBalance(addr).catch(() => 0n)
            if (!cancelled) {
                setWallet(prev => ({
                    ...prev,
                    address: addr,
                    signer: connectedSigner,
                    balance: ethers.formatEther(bal),
                    mode: mode || 'guest'
                }))
            }
        } catch (err) {
            console.error("Guest wallet init failed:", err)
        }
    }

    hydrateGuestWallet()

    return () => {
        cancelled = true
        clearInterval(interval)
    }
  }, [provider, view, wallet.mode]);

  // Real-time balance updates
  useEffect(() => {
    if (!provider || !wallet.address || view !== 'live') return;
    
    const updateBalance = async () => {
      try {
        const bal = await provider.getBalance(wallet.address)
        setWallet(prev => ({ ...prev, balance: ethers.formatEther(bal) }))
      } catch (e) {
        console.error("Balance update error:", e)
      }
    }
    
    // Initial update
    updateBalance()
    
    // Listen for new blocks for real-time updates
    const blockListener = (blockNumber) => {
      updateBalance()
    }
    provider.on("block", blockListener)
    
    // Poll every 2 seconds as backup
    const interval = setInterval(updateBalance, 2000)
    
    return () => {
      provider.off("block", blockListener)
      clearInterval(interval)
    }
  }, [provider, wallet.address, view])

  // Helpers
  const requestFunds = async () => {
    if (!wallet.address) return;
    
    // Prevent double-requests
    if (statusMsg.includes("Requesting") || statusMsg.includes("Processing")) {
        return setStatusMsg("Request already in progress...")
    }
    
    try {
        setStatusMsg("Requesting ETH from faucet...")
        const bankProvider = new ethers.JsonRpcProvider(rpcUrl)
        const bankWallet = new ethers.Wallet(BANK_PRIVATE_KEY, bankProvider)
        const tx = await bankWallet.sendTransaction({ to: wallet.address, value: ethers.parseEther("5.0") })
        setStatusMsg("Processing faucet request...")
        await tx.wait()
        setStatusMsg("Received 5 ETH from faucet!")
        
        // Update balance immediately
        const bal = await provider.getBalance(wallet.address)
        setWallet(prev => ({ ...prev, balance: ethers.formatEther(bal) }))
        
        // Clear message after 3 seconds
        setTimeout(() => setStatusMsg(""), 3000)
    } catch (e) { 
        setStatusMsg("Faucet Failed: " + (e.message || "Unknown error"))
    }
  }

  const sendEthToPeer = async () => {
      if(!ethers.isAddress(recipient)) return setStatusMsg("Invalid Recipient Address")
      if(!sendAmount) return setStatusMsg("Enter amount")
      
      // Prevent double-sending
      if (statusMsg.includes("Sending ETH")) {
          return setStatusMsg("Transaction already in progress...")
      }
      
      try {
          setStatusMsg("Sending ETH...")
          const tx = await wallet.signer.sendTransaction({
              to: recipient,
              value: ethers.parseEther(sendAmount)
          })
          await tx.wait()
          setStatusMsg(`Sent ${sendAmount} ETH to ${recipient.slice(0,6)}!`)
          setSendAmount("")
          setRecipient("") // Clear recipient after successful send
          
          // Update balance immediately
          const bal = await provider.getBalance(wallet.address)
          setWallet(prev => ({ ...prev, balance: ethers.formatEther(bal) }))
      } catch (e) { 
          setStatusMsg("Transfer Failed: " + e.message) 
      }
  }
  
  // Data Sync
  const syncBlockchainData = async () => {
      if (!posAddress || posAddress.length !== 42 || !provider) return
      setIsSyncing(true)
      try {
        const contract = new ethers.Contract(posAddress, PoSABI, provider)
        
        // Chat
        const chatEvents = await contract.queryFilter("NewMessage", 0)
        const formattedChat = chatEvents.map(e => ({
            sender: e.args[0],
            text: e.args[1],
            timestamp: Number(e.args[2])
        })).sort((a,b) => a.timestamp - b.timestamp)
        setMessages(formattedChat)

        // Roster Logic: Anyone who Staked OR Chatted is a "Participant"
        const stakeEvents = await contract.queryFilter("Staked", 0)
        const msgEvents = await contract.queryFilter("NewMessage", 0)
        const allAddrs = [...stakeEvents.map(e=>e.args[0]), ...msgEvents.map(e=>e.args[0])]
        setValidators([...new Set(allAddrs)]) // Unique list

      } catch (e) {}
      setIsSyncing(false)
  }

   const sendChatMessage = async () => {
      if(!chatInput.trim()) return
      if(!posAddress || posAddress.length !== 42) return setStatusMsg("Invalid Contract Address")
      try {
          // Use bank account to pay for gas if user has no ETH
          let signer = wallet.signer
          if (wallet.balance === '0' || parseFloat(wallet.balance) < 0.01) {
              // User has no ETH, use bank account to send message on their behalf
              const bankProvider = new ethers.JsonRpcProvider(rpcUrl)
              const bankWallet = new ethers.Wallet(BANK_PRIVATE_KEY, bankProvider)
              
              // Create contract with bank wallet but encode user's address in message
              const contract = new ethers.Contract(posAddress, PoSABI, bankWallet)
              const msgWithSender = `[${wallet.address.slice(0,6)}...${wallet.address.slice(-4)}] ${chatInput}`
              const tx = await contract.sendMessage(msgWithSender)
              setChatInput("")
              setStatusMsg("Sending message...")
              await tx.wait()
          } else {
              // User has ETH, send normally
              const contract = new ethers.Contract(posAddress, PoSABI, signer)
              const tx = await contract.sendMessage(chatInput)
              setChatInput("")
              setStatusMsg("Sending message...")
              await tx.wait()
          }
          syncBlockchainData()
          setStatusMsg("")
      } catch (err) { 
          console.error("Chat error:", err)
          setStatusMsg("Chat failed: " + (err.message || "Unknown error"))
      }
  }

  // "I am Here" Button
  const broadcastPresence = async () => {
      setChatInput("👋 Joined the class!")
      await sendChatMessage()
  }

  const copyAddress = (addr) => {
      navigator.clipboard.writeText(addr)
      setStatusMsg(`Copied ${addr.slice(0,6)}...`)
  }

  const getSessionAge = () => {
      const minutes = Math.floor((Date.now() - sessionStart) / 60000)
      return minutes
  }

  useEffect(() => {
    if(view === 'live' && posAddress.length === 42) {
        syncBlockchainData();
        const i = setInterval(syncBlockchainData, 2000);
        return () => clearInterval(i);
    }
  }, [posAddress, provider, view])


  return (
    <div className="app-layout">
        {/* NAVIGATION SIDEBAR */}
        <aside className="nav-sidebar">
            <h1>Web3 Lab</h1>
            <nav>
                <div className="learning-roadmap">
                    <button className={`roadmap-step ${view === 'intro' ? 'active' : ''} ${trail.intro ? 'done' : ''}`} onClick={() => requestView('intro')}>
                        <span>1</span> Orientation
                    </button>
                    <button className={`roadmap-step ${view === 'concepts' ? 'active' : ''} ${trail.concepts ? 'done' : ''} ${!unlocks.concepts ? 'locked' : ''}`} onClick={() => requestView('concepts')}>
                        <span>2</span> Basics
                    </button>
                    <button className={`roadmap-step ${view === 'explore' ? 'active' : ''} ${trail.explore ? 'done' : ''} ${!unlocks.explore ? 'locked' : ''}`} onClick={() => requestView('explore')}>
                        <span>3</span> Explore
                    </button>
                    <button className={`roadmap-step ${view === 'learn' ? 'active' : ''} ${!unlocks.learn ? 'locked' : ''}`} onClick={() => requestView('learn')}>
                        <span>4</span> Learn
                    </button>
                    <button className={`roadmap-step ${view === 'sim' ? 'active' : ''} ${!unlocks.sim ? 'locked' : ''}`} onClick={() => requestView('sim')}>
                        <span>5</span> Practice
                    </button>
                    <button className={`roadmap-step ${view === 'live' ? 'active' : ''} ${!unlocks.live ? 'locked' : ''}`} onClick={() => requestView('live')}>
                        <span>6</span> Live Network
                    </button>
                </div>
                {navHint && <p className="nav-hint">{navHint}</p>}
                {isInstructor ? (
                    <button className={view === 'instructor' ? 'active' : ''} onClick={() => requestView('instructor')}>
                        🎓 Instructor Dashboard
                    </button>
                ) : (
                    <small className="nav-caption">Instructor dashboard available at <code>?mode=instructor</code></small>
                )}
            </nav>

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
                    {!validators.includes(wallet.address) && wallet.address && (
                        <button className="secondary-btn small-btn" onClick={broadcastPresence}>
                            👋 Join Class List
                        </button>
                    )}
                    <div className="session-info">
                        <small>Your Session: {getSessionAge()} min</small>
                    </div>
                </div>
            )}
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="main-content">
            
            {/* 0. ORIENTATION VIEW */}
            {view === 'intro' && (
                <div className="intro-view">
                    <div className="intro-hero">
                        <div>
                            <p className="pill">Start Here</p>
                            <h2>Welcome to Mission Control</h2>
                            <p>This lab will walk you from zero to interacting with a live classroom Proof-of-Stake network.</p>
                            <ul>
                                <li>🧭 Orientation → Understand the mission</li>
                                <li>🧱 Basics → Learn the building blocks</li>
                                <li>🛰 Explore → Observe & hypothesize</li>
                                <li>🧠 Learn → Guided lessons</li>
                                <li>🧪 Practice → Simulation lab</li>
                                <li>🌐 Live → Join the shared network</li>
                            </ul>
                        </div>
                        <div className="intro-card">
                            <h3>Lab Checklist</h3>
                            <ul>
                                <li>✅ Instructor blockchain online</li>
                                <li>✅ Contracts deployed</li>
                                <li>✅ Faucet funded</li>
                                <li>✅ Student script executed</li>
                            </ul>
                        </div>
                    </div>
                    <div className="intro-grid">
                        {INTRO_SECTIONS.map(section => (
                            <div className="intro-section" key={section.title}>
                                <h4>{section.title}</h4>
                                <ul>
                                    {section.bullets.map(point => <li key={point}>{point}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <button className="primary-btn next-btn" onClick={() => {
                        markStageComplete('intro')
                        setView('concepts')
                    }}>
                        Continue to Basics →
                    </button>
                </div>
            )}

            {/* 1. BASIC CONCEPTS VIEW */}
            {view === 'concepts' && (
                <div className="concepts-view">
                    <h2>🔍 Core Concepts</h2>
                    <p className="section-subtitle">Skim each card and hover to expand the mental models you'll need later.</p>
                    <div className="concepts-grid">
                        {CONCEPT_CARDS.map(card => (
                            <div className="concept-card" key={card.title}>
                                <h3>{card.title}</h3>
                                <p>{card.description}</p>
                                <ul>
                                    {card.highlight.map(point => <li key={point}>{point}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div className="concept-actions">
                        <button onClick={() => setView('intro')}>← Back to Orientation</button>
                        <button className="primary-btn" onClick={() => {
                            markStageComplete('concepts')
                            setView('explore')
                        }}>I'm ready to explore →</button>
                    </div>
                </div>
            )}

            {/* 2. EXPLORATION VIEW */}
            {view === 'explore' && (
                <div className="explore-view">
                    <div className="explore-header">
                        <h2>🛰 Exploration Missions</h2>
                        <p>Complete each mission before the Learn, Practice, and Live phases.</p>
                    </div>
                    <div className="missions-grid">
                        {EXPLORE_MISSIONS.map((mission, idx) => (
                            <label className={`mission-card ${exploreProgress[idx] ? 'done' : ''}`} key={mission.title}>
                                <input
                                    type="checkbox"
                                    checked={exploreProgress[idx]}
                                    onChange={() => {
                                        const next = [...exploreProgress]
                                        next[idx] = !next[idx]
                                        setExploreProgress(next)
                                    }}
                                />
                                <div>
                                    <h3>{mission.title}</h3>
                                    <p>{mission.action}</p>
                                    <small>{mission.tip}</small>
                                </div>
                            </label>
                        ))}
                    </div>
                    <div className="concept-actions">
                        <button onClick={() => setView('concepts')}>← Back to Basics</button>
                        <button
                            className="primary-btn"
                            disabled={!exploreProgress.every(Boolean)}
                            onClick={() => {
                                saveTrail({ ...trail, explore: true })
                                setView('learn')
                            }}
                        >
                            {exploreProgress.every(Boolean) ? "Launch the Learn Module →" : "Complete all missions to continue"}
                        </button>
                    </div>
                </div>
            )}

            {/* 3. LEARNING VIEW */}
            {view === 'learn' && (
                <div className="learn-container">
                    <h2>Module 1: Blockchain Basics</h2>
                    <div className="slides-grid">
                        {LESSONS.map(l => (
                            <div key={l.id} className="card slide-card">
                                {l.content}
                            </div>
                        ))}
                    </div>
                    <button className="primary-btn next-btn" onClick={() => setView('sim')}>
                        Start Practice Lab 👉
                    </button>
                </div>
            )}

            {/* 2. SIMULATION VIEW */}
            {view === 'sim' && (
                <SimulationMode onComplete={() => setView('live')} />
            )}

            {/* 3. LIVE NETWORK VIEW */}
            {view === 'live' && (
                <div className="live-dashboard">
                    <header>
                        <div className="status-bar">
                            <span className={`dot ${nodeStatus.connected ? 'green' : 'red'}`}></span>
                            {nodeStatus.connected ? `Block #${nodeStatus.blockNumber}` : 'Connecting...'}
                            {isSyncing && <span className="sync-dot">•</span>}
                        </div>
                        <div className="user-bar">
                            <span title={wallet.address}>{wallet.address ? `${wallet.address.slice(0,6)}...` : 'Guest'}</span>
                            <span className="bal">{wallet.balance && parseFloat(wallet.balance).toFixed(2)} ETH</span>
                            <span className="session-badge">Session: {getSessionAge()}m</span>
                        </div>
                    </header>
                    
                    <div className="live-grid">
                        {/* Wallet Actions */}
                        <section className="card">
                            <h3>💰 Wallet</h3>
                            <div className="wallet-row">
                                <button 
                                    onClick={requestFunds}
                                    disabled={statusMsg.includes("Requesting") || statusMsg.includes("Processing")}
                                >
                                    {statusMsg.includes("Requesting") || statusMsg.includes("Processing") ? "Processing..." : "Request 5 ETH"}
                                </button>
                                <div className="my-addr-box">
                                    <small>My Address:</small>
                                    <code onClick={() => copyAddress(wallet.address)} title="Click to Copy">
                                        {wallet.address?.slice(0,10)}...
                                    </code>
                                </div>
                            </div>
                            
                            <hr/>
                            <h4>Send ETH to Classmate</h4>
                            <div className="input-group">
                                <input 
                                    placeholder="Recipient (Click sidebar name)" 
                                    value={recipient}
                                    onChange={e => setRecipient(e.target.value)}
                                />
                                <input 
                                    placeholder="Amount" 
                                    type="number"
                                    value={sendAmount}
                                    onChange={e => setSendAmount(e.target.value)}
                                    style={{width: '80px'}}
                                />
                                <button 
                                    onClick={sendEthToPeer}
                                    disabled={statusMsg.includes("Sending ETH")}
                                >
                                    {statusMsg.includes("Sending ETH") ? "Sending..." : "Send"}
                                </button>
                            </div>
                        </section>

                        {/* Contract Config */}
                        <section className="card">
                            <h3>⚙️ Connection Setup</h3>
                            {isRemote && (
                                <div className="remote-warning">
                                    📡 Remote Access Detected - Configure your connection below
                                </div>
                            )}
                            <div className="config-field">
                                <label>Contract Address (from instructor):</label>
                                <input 
                                    placeholder="0x..." 
                                    value={posAddress}
                                    onChange={e => {
                                        setPosAddress(e.target.value);
                                        localStorage.setItem("pos_addr", e.target.value);
                                    }}
                                />
                            </div>
                            <div className="config-field">
                                <label>Blockchain RPC URL:</label>
                                <input 
                                    placeholder={isNgrok ? "https://your-rpc.ngrok-free.dev" : "http://127.0.0.1:8545"} 
                                    value={rpcUrl}
                                    onChange={e => setRpcUrl(e.target.value)}
                                />
                                {isNgrok && (
                                    <small className="config-hint">
                                        💡 Using ngrok? Enter the HTTPS URL for the RPC endpoint (no port number)
                                        <br/>Example: https://blockchain-rpc.ngrok-free.dev
                                    </small>
                                )}
                                {isRemote && !isNgrok && (
                                    <small className="config-hint">
                                        💡 Ask instructor for the RPC URL (usually http://[instructor-ip]:8545)
                                    </small>
                                )}
                            </div>
                            <div className="connection-status">
                                {nodeStatus.connected ? (
                                    <span className="status-ok">✅ Connected to blockchain</span>
                                ) : (
                                    <span className="status-error">❌ Not connected - check RPC URL</span>
                                )}
                            </div>
                        </section>

                        {/* Global Chat */}
                        <section className="card full-width">
                            <h3>💬 Class Chat</h3>
                            <div className="chat-window">
                                {messages.map((msg, i) => (
                                    <div key={i} className={`msg ${msg.sender === wallet.address ? 'my-msg' : ''}`}>
                                        <div className="msg-header">
                                            <span className="sender-name" onClick={() => {setRecipient(msg.sender); copyAddress(msg.sender)}}>
                                                {msg.sender.slice(0,6)}
                                            </span>
                                            <span className="time">{new Date(msg.timestamp * 1000).toLocaleTimeString()}</span>
                                        </div>
                                        {msg.text}
                                    </div>
                                ))}
                            </div>
                            <div className="input-group">
                                <input 
                                    placeholder="Type message..."
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                                />
                                <button onClick={sendChatMessage}>Post</button>
                            </div>
                        </section>
                    </div>
                    <p className="status-footer">{statusMsg}</p>
                </div>
            )}
            
            {/* INSTRUCTOR VIEW */}
            {view === 'instructor' && (
                <div className="instructor-view">
                    {!posAddress && (
                        <div className="instructor-setup">
                            <h2>🎓 Instructor Dashboard Setup</h2>
                            <div className="setup-card">
                                <label>Enter PoS Contract Address:</label>
                                <input 
                                    placeholder="0x..." 
                                    value={posAddress}
                                    onChange={e => {
                                        setPosAddress(e.target.value);
                                        localStorage.setItem("pos_addr", e.target.value);
                                    }}
                                />
                                <small>This address was displayed when you ran the deployment script</small>
                                <small>Also saved in CONTRACT_ADDRESS.txt</small>
                            </div>
                        </div>
                    )}
                    {posAddress && (
                        <InstructorDashboard 
                            provider={provider}
                            posAddress={posAddress}
                        />
                    )}
                </div>
            )}
        </main>
    </div>
  )
}

export default App
