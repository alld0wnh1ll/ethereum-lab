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
        title: "🎯 Why This Lab Exists",
        bullets: [
            "Experience a complete Ethereum stack without cloud services or real money",
            "Understand how the world's second-largest blockchain actually works",
            "Practice safely in a classroom environment before touching production networks",
            "See firsthand why Ethereum switched from Proof-of-Work to Proof-of-Stake"
        ]
    },
    {
        title: "📚 What You'll Learn",
        bullets: [
            "How Ethereum's Proof-of-Stake consensus keeps the network secure",
            "Why validators stake 32 ETH and how they earn rewards",
            "What 'slashing' means and why it prevents attacks",
            "How DeFi protocols use staking beyond just validation",
            "The real economics: why a 51% attack costs $51 billion"
        ]
    },
    {
        title: "🛠️ What You'll Do",
        bullets: [
            "Generate your own wallet and receive test ETH from the faucet",
            "Send transactions to classmates and watch blocks confirm",
            "Stake ETH to become a validator and earn rewards",
            "Participate in the class chat (stored on-chain!)",
            "Experience the validator selection algorithm in action"
        ]
    },
    {
        title: "👥 Classroom Setup",
        bullets: [
            "Instructor runs a local Ethereum node (Hardhat) with deployed smart contracts",
            "Students connect via web browser—no installation required",
            "Everyone shares the same blockchain producing blocks every ~12 seconds",
            "All transactions are real (but using test ETH with no real-world value)"
        ]
    }
]

const CONCEPT_CARDS = [
    {
        title: "🔐 Wallet Anatomy",
        description: "A wallet is cryptographic math, not a physical container. Your private key is everything.",
        highlight: [
            "Private key (64 hex chars) → signs transactions to prove you own the account",
            "Public address (0x + 40 hex chars) → your identity on Ethereum, derived from public key",
            "Never share your private key—anyone with it controls your funds",
            "Addresses start with '0x' and use hexadecimal (0-9, a-f)"
        ]
    },
    {
        title: "⛽ Gas & Transaction Fees",
        description: "Every operation on Ethereum costs 'gas'—computational work measured in ETH.",
        highlight: [
            "Gas limit: Maximum gas you're willing to use (prevents infinite loops)",
            "Base fee: Burned (destroyed) ETH—reduces supply, can cause deflation",
            "Tip (priority fee): Goes to validator—higher tip = faster inclusion",
            "Simple ETH transfer: ~21,000 gas | Complex smart contract: 100k+ gas"
        ]
    },
    {
        title: "🧱 Blocks & Finality",
        description: "Ethereum produces a new block every ~12 seconds containing batched transactions.",
        highlight: [
            "Block = batch of transactions + cryptographic hash linking to previous block",
            "Block number (height) = total blocks since genesis (July 30, 2015)",
            "Finality: After ~15 minutes (64 blocks), blocks are irreversible",
            "Each block has a proposer (validator) who earns fees + rewards"
        ]
    },
    {
        title: "🤝 Proof-of-Stake Consensus",
        description: "How 8,600+ validators worldwide agree on the state of Ethereum without a central authority.",
        highlight: [
            "Validators stake 32 ETH as collateral to participate",
            "Every 12 seconds, one validator is pseudo-randomly selected to propose a block",
            "Other validators attest (vote) that the block is valid",
            "Honest validators earn ~4-5% annual return; dishonest ones get slashed",
            "Replaced Proof-of-Work in Sept 2022, cutting energy use by 99.95%"
        ],
        diagram: true,
        fullWidth: true
    },
    {
        title: "💎 Ether (ETH)",
        description: "The native cryptocurrency of Ethereum—required for all transactions and staking.",
        highlight: [
            "Market cap: 2nd largest crypto after Bitcoin (~$200B+)",
            "Total supply: ~120 million ETH (no hard cap, but issuance is low)",
            "Uses: Pay gas fees, stake to become validator, collateral in DeFi",
            "Units: 1 ETH = 1,000,000,000 Gwei = 10¹⁸ Wei"
        ]
    },
    {
        title: "📜 Smart Contracts",
        description: "Self-executing code deployed to Ethereum that anyone can interact with.",
        highlight: [
            "Written in Solidity, compiled to EVM bytecode",
            "Immutable: Once deployed, code cannot be changed",
            "Powers DeFi, NFTs, DAOs, games, and more",
            "Our lab uses a PoS simulator contract for staking and chat"
        ]
    }
]

const EXPLORE_MISSIONS = [
    {
        title: "🔗 Understanding Staking",
        category: "Proof of Stake",
        action: "What is staking and why do validators lock up their ETH?",
        details: [
            "Staking means depositing ETH as collateral to become a validator",
            "Minimum stake on Ethereum: 32 ETH (our lab uses 1 ETH for learning)",
            "Staked ETH is locked—you can't spend it while validating",
            "Purpose: Creates 'skin in the game' so validators act honestly",
            "Honest validators earn rewards; dishonest ones get slashed"
        ],
        miniLab: 'staking-rewards',
        quiz: {
            question: "Why must validators stake ETH?",
            options: [
                "To prove they have money",
                "To create economic incentive for honest behavior",
                "To pay for electricity",
                "Just for fun"
            ],
            correct: 1
        }
    },
    {
        title: "👮 Validator Responsibilities",
        category: "Network Security",
        action: "Learn what validators do to keep Ethereum secure",
        details: [
            "Propose new blocks when selected by the algorithm",
            "Verify (attest to) blocks proposed by other validators",
            "Must be online 24/7 with stable internet",
            "Run honest software—no cheating or double-signing",
            "Earn transaction fees + block rewards for good work"
        ],
        miniLab: 'validator-probability',
        quiz: {
            question: "What happens if a validator goes offline?",
            options: [
                "Nothing, they just miss rewards",
                "They lose all their staked ETH",
                "They get small penalties (inactivity leak)",
                "They get a warning email"
            ],
            correct: 2
        }
    },
    {
        title: "⚔️ Slashing: The Penalty System",
        category: "Network Security",
        action: "Understand how Ethereum punishes bad actors",
        details: [
            "Slashing = Burning (destroying) a validator's staked ETH",
            "Triggers: Double-signing blocks, or proposing contradictory data",
            "Penalty: Lose up to 100% of staked ETH (usually ~1 ETH minimum)",
            "Purpose: Make attacks extremely expensive (would need 51% of stake)",
            "Slashed validators are forcibly ejected from the network"
        ],
        miniLab: 'slashing-penalty',
        quiz: {
            question: "What is slashing designed to prevent?",
            options: [
                "Validators taking vacations",
                "Network attacks and dishonest behavior",
                "Too many validators joining",
                "Gas fees from rising"
            ],
            correct: 1
        }
    },
    {
        title: "🏦 DeFi: Staking Beyond Validation",
        category: "DeFi Applications",
        action: "Explore how staking powers decentralized finance",
        details: [
            "Liquid Staking: Deposit ETH, get stETH token, still earn rewards",
            "Example: Lido, Rocket Pool let you stake without 32 ETH",
            "Yield Farming: Stake tokens in protocols to earn interest",
            "Governance: Staked tokens often give voting rights in DAOs",
            "Risk: Smart contract bugs or protocol failures"
        ],
        quiz: {
            question: "What is 'liquid staking'?",
            options: [
                "Staking water molecules",
                "Getting a tradable token while your ETH is staked",
                "Staking in a pool of liquid",
                "Only available for liquids"
            ],
            correct: 1
        }
    },
    {
        title: "💰 Staking Rewards Economics",
        category: "Economics",
        action: "Calculate the incentives for running a validator",
        details: [
            "Base reward: ~4-5% annual return on staked ETH",
            "Higher when fewer validators are online",
            "Transaction fees (tips) add extra income",
            "MEV (Maximal Extractable Value): Advanced validators earn more",
            "Costs: Hardware, electricity, internet, downtime risks"
        ],
        quiz: {
            question: "Why would someone run a validator?",
            options: [
                "Just to help the network (no rewards)",
                "Earn passive income on their ETH",
                "Get free NFTs",
                "To mine Bitcoin"
            ],
            correct: 1
        }
    },
    {
        title: "🎯 Real-World Scenario: Attack Cost",
        category: "Network Security",
        action: "Calculate how expensive it is to attack Ethereum",
        details: [
            "To control 51% of validators, need 51% of all staked ETH",
            "Currently ~34 million ETH staked on Ethereum",
            "51% attack needs: ~17 million ETH",
            "At $3,000/ETH: $51 BILLION dollars needed",
            "And you'd LOSE it all via slashing if caught!",
            "Compare to Bitcoin: Rent mining hardware temporarily for attack"
        ],
        miniLab: 'attack-cost',
        quiz: {
            question: "Why is PoS more secure than PoW against attacks?",
            options: [
                "It's faster",
                "Attackers must BUY and LOSE massive amounts of ETH",
                "It uses less electricity",
                "Smart contracts protect it"
            ],
            correct: 1
        }
    },
    {
        title: "🔄 Observe the Chain",
        category: "Hands-On",
        action: "Watch how blocks are linked together in a real blockchain.",
        details: [
            "Ethereum produces a block every ~12 seconds",
            "Each block contains many transactions",
            "Block number = blockchain 'height'",
            "Each block references the previous block's hash",
            "This creates an immutable chain - changing one block breaks all following blocks"
        ],
        miniLab: 'blockchain-visualizer'
    },
    {
        title: "🔑 Decode an Address",
        category: "Hands-On",
        action: "Learn how Ethereum addresses work and practice reading them.",
        details: [
            "Addresses start with '0x' (hexadecimal notation)",
            "42 characters total (0x + 40 hex digits)",
            "Derived from your public key using Keccak-256 hash",
            "Shorthand: 0x1234...5678 helps in class/chat",
            "Your address = your public identity on Ethereum"
        ],
        miniLab: 'address-decoder'
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
    },
    {
        id: "consensus",
        title: "Consensus: PoW vs PoS",
        content: (
            <div className="lesson-slide">
                <h3>How Does Everyone Agree?</h3>
                <p>Blockchains need a way for thousands of computers to agree on the "truth" without a central authority. This is called <strong>Consensus</strong>.</p>
                
                <div className="concept-box" style={{marginTop: '20px'}}>
                    <h4>⚡ Proof of Work (PoW) - Bitcoin's Method</h4>
                    <ul>
                        <li>Miners compete to solve complex math puzzles</li>
                        <li>First to solve gets to add the next block</li>
                        <li>Requires massive computing power & electricity</li>
                        <li><strong>Problem:</strong> Wasteful energy consumption</li>
                    </ul>
                </div>
                
                <div className="concept-box" style={{marginTop: '20px', background: '#e6f7ed'}}>
                    <h4>🌱 Proof of Stake (PoS) - Ethereum's Method</h4>
                    <ul>
                        <li>Validators "stake" their ETH as collateral</li>
                        <li>Algorithm selects validators based on stake size</li>
                        <li>Selected validator proposes the next block</li>
                        <li><strong>Benefit:</strong> 99.95% less energy than PoW!</li>
                        <li><strong>Security:</strong> Bad actors lose their staked ETH (slashing)</li>
                    </ul>
                </div>
            </div>
        )
    },
];

// --- MINI-LABS: Interactive Calculators & Simulations ---
function MiniLab_BlockchainVisualizer() {
    const [blocks, setBlocks] = useState([
        { number: 100, hash: '0x4a2b...89f3', prevHash: '0x8d91...3c2a', txCount: 145, timestamp: Date.now() - 36000 },
        { number: 101, hash: '0x7c3d...2b4e', prevHash: '0x4a2b...89f3', txCount: 198, timestamp: Date.now() - 24000 },
        { number: 102, hash: '0x9e5f...6a1c', prevHash: '0x7c3d...2b4e', txCount: 167, timestamp: Date.now() - 12000 },
        { number: 103, hash: '0x1f8a...4d7b', prevHash: '0x9e5f...6a1c', txCount: 203, timestamp: Date.now() }
    ]);
    const [highlightedBlock, setHighlightedBlock] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const addNewBlock = () => {
        setIsAnimating(true);
        const lastBlock = blocks[blocks.length - 1];
        const newBlock = {
            number: lastBlock.number + 1,
            hash: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
            prevHash: lastBlock.hash,
            txCount: Math.floor(Math.random() * 150) + 50,
            timestamp: Date.now()
        };
        
        setTimeout(() => {
            setBlocks(prev => [...prev.slice(-3), newBlock]);
            setIsAnimating(false);
        }, 500);
    };

    return (
        <div style={{background: '#0f172a', padding: '1.5rem', borderRadius: '0.75rem', marginTop: '1rem'}}>
            <h4 style={{color: '#fbbf24', marginTop: 0}}>⛓️ Live Blockchain Visualizer</h4>
            <p style={{color: '#cbd5e1', fontSize: '0.95rem'}}>
                Watch how blocks link together! Each block points to the previous one, creating an unbreakable chain.
            </p>
            
            {/* Blockchain Visual */}
            <div style={{
                marginTop: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                overflowX: 'auto',
                padding: '1rem',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '0.75rem'
            }}>
                {blocks.map((block, idx) => (
                    <div key={block.number} style={{display: 'flex', alignItems: 'center'}}>
                        {/* Block */}
                        <div
                            onMouseEnter={() => setHighlightedBlock(block.number)}
                            onMouseLeave={() => setHighlightedBlock(null)}
                            style={{
                                minWidth: '180px',
                                padding: '1rem',
                                background: highlightedBlock === block.number 
                                    ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                                    : idx === blocks.length - 1 && isAnimating
                                    ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                                    : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                border: '2px solid',
                                borderColor: highlightedBlock === block.number ? '#8b5cf6' : '#475569',
                                borderRadius: '0.75rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                transform: highlightedBlock === block.number ? 'scale(1.05)' : 'scale(1)',
                                boxShadow: highlightedBlock === block.number ? '0 8px 24px rgba(139,92,246,0.4)' : 'none'
                            }}
                        >
                            <div style={{fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem'}}>BLOCK</div>
                            <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#f8fafc', marginBottom: '0.75rem'}}>
                                #{block.number}
                            </div>
                            <div style={{fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem'}}>
                                <strong>Hash:</strong>
                            </div>
                            <div style={{
                                fontSize: '0.75rem',
                                color: '#93c5fd',
                                fontFamily: 'monospace',
                                marginBottom: '0.75rem',
                                wordBreak: 'break-all'
                            }}>
                                {block.hash}
                            </div>
                            <div style={{fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem'}}>
                                <strong>Prev Hash:</strong>
                            </div>
                            <div style={{
                                fontSize: '0.75rem',
                                color: '#f9a8d4',
                                fontFamily: 'monospace',
                                marginBottom: '0.75rem',
                                wordBreak: 'break-all'
                            }}>
                                {block.prevHash}
                            </div>
                            <div style={{fontSize: '0.75rem', color: '#94a3b8'}}>
                                {block.txCount} transactions
                            </div>
                        </div>
                        
                        {/* Arrow */}
                        {idx < blocks.length - 1 && (
                            <div style={{
                                fontSize: '2rem',
                                color: '#3b82f6',
                                margin: '0 -5px',
                                zIndex: 1
                            }}>
                                →
                            </div>
                        )}
                    </div>
                ))}
                
                {/* New Block Placeholder */}
                {!isAnimating && (
                    <div
                        onClick={addNewBlock}
                        style={{
                            minWidth: '180px',
                            padding: '1rem',
                            background: 'rgba(139,92,246,0.1)',
                            border: '2px dashed #8b5cf6',
                            borderRadius: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139,92,246,0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(139,92,246,0.1)'}
                    >
                        <div style={{fontSize: '2rem'}}>➕</div>
                        <div style={{fontSize: '0.9rem', color: '#a78bfa', textAlign: 'center'}}>
                            Mine New Block
                        </div>
                    </div>
                )}
            </div>
            
            {/* Explanation Panel */}
            {highlightedBlock && (
                <div style={{
                    marginTop: '1.5rem',
                    padding: '1.5rem',
                    background: 'rgba(59,130,246,0.15)',
                    borderRadius: '0.75rem',
                    border: '2px solid rgba(59,130,246,0.4)',
                    animation: 'fadein 0.3s'
                }}>
                    <h5 style={{color: '#93c5fd', marginTop: 0}}>🔍 Block #{highlightedBlock} Breakdown</h5>
                    <ul style={{color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.8', margin: 0, paddingLeft: '1.5rem'}}>
                        <li><strong style={{color: '#93c5fd'}}>Block Hash (blue):</strong> Unique fingerprint of this block's data</li>
                        <li><strong style={{color: '#f9a8d4'}}>Previous Hash (pink):</strong> Points to the block before it</li>
                        <li><strong>The Chain:</strong> Each block's "Prev Hash" must match the previous block's "Hash"</li>
                        <li><strong>Security:</strong> Changing block #{highlightedBlock - 1} would break the chain!</li>
                    </ul>
                </div>
            )}
            
            {!highlightedBlock && (
                <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(139,92,246,0.15)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(139,92,246,0.3)',
                    textAlign: 'center'
                }}>
                    <p style={{color: '#cbd5e1', fontSize: '0.9rem', margin: 0}}>
                        👆 <strong style={{color: '#a78bfa'}}>Hover over a block</strong> to see how it links to the previous one, or <strong style={{color: '#a78bfa'}}>click ➕</strong> to mine a new block!
                    </p>
                </div>
            )}
            
            <button
                onClick={addNewBlock}
                disabled={isAnimating}
                style={{
                    marginTop: '1rem',
                    width: '100%',
                    padding: '1rem',
                    background: isAnimating ? '#64748b' : 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: isAnimating ? 'not-allowed' : 'pointer'
                }}
            >
                {isAnimating ? '⏳ Mining Block...' : '⛏️ Mine Next Block'}
            </button>
        </div>
    );
}

function MiniLab_AddressDecoder() {
    const [sampleAddress] = useState('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4');
    const [hoveredPart, setHoveredPart] = useState(null);
    
    const prefix = sampleAddress.slice(0, 2);
    const firstFour = sampleAddress.slice(2, 6);
    const middle = sampleAddress.slice(6, -4);
    const lastFour = sampleAddress.slice(-4);
    
    return (
        <div style={{background: '#0f172a', padding: '1.5rem', borderRadius: '0.75rem', marginTop: '1rem'}}>
            <h4 style={{color: '#fbbf24', marginTop: 0}}>🔍 Address Decoder</h4>
            <p style={{color: '#cbd5e1', fontSize: '0.95rem'}}>
                Hover over different parts of the address to learn what they mean!
            </p>
            
            {/* Interactive Address Display */}
            <div style={{
                marginTop: '1.5rem',
                padding: '2rem',
                background: 'rgba(59,130,246,0.1)',
                borderRadius: '0.75rem',
                border: '2px solid rgba(59,130,246,0.3)',
                fontFamily: 'monospace',
                fontSize: '1.5rem',
                textAlign: 'center',
                wordBreak: 'break-all',
                lineHeight: '2'
            }}>
                <span 
                    onMouseEnter={() => setHoveredPart('prefix')}
                    onMouseLeave={() => setHoveredPart(null)}
                    style={{
                        background: hoveredPart === 'prefix' ? '#3b82f6' : 'transparent',
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: hoveredPart === 'prefix' ? 'white' : '#93c5fd'
                    }}
                >
                    {prefix}
                </span>
                <span 
                    onMouseEnter={() => setHoveredPart('first4')}
                    onMouseLeave={() => setHoveredPart(null)}
                    style={{
                        background: hoveredPart === 'first4' ? '#10b981' : 'transparent',
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: hoveredPart === 'first4' ? 'white' : '#86efac',
                        fontWeight: hoveredPart === 'first4' ? 'bold' : 'normal'
                    }}
                >
                    {firstFour}
                </span>
                <span 
                    onMouseEnter={() => setHoveredPart('middle')}
                    onMouseLeave={() => setHoveredPart(null)}
                    style={{
                        background: hoveredPart === 'middle' ? '#64748b' : 'transparent',
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: hoveredPart === 'middle' ? 'white' : '#94a3b8',
                        opacity: hoveredPart === 'middle' ? 1 : 0.5
                    }}
                >
                    {middle}
                </span>
                <span 
                    onMouseEnter={() => setHoveredPart('last4')}
                    onMouseLeave={() => setHoveredPart(null)}
                    style={{
                        background: hoveredPart === 'last4' ? '#ec4899' : 'transparent',
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: hoveredPart === 'last4' ? 'white' : '#f9a8d4',
                        fontWeight: hoveredPart === 'last4' ? 'bold' : 'normal'
                    }}
                >
                    {lastFour}
                </span>
            </div>
            
            {/* Explanation Panel */}
            <div style={{
                marginTop: '1.5rem',
                padding: '1.5rem',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '0.75rem',
                border: '1px solid #334155',
                minHeight: '120px'
            }}>
                {!hoveredPart && (
                    <div style={{color: '#94a3b8', textAlign: 'center', fontSize: '0.95rem'}}>
                        👆 Hover over different parts of the address to learn more
                    </div>
                )}
                
                {hoveredPart === 'prefix' && (
                    <div>
                        <h5 style={{color: '#93c5fd', marginTop: 0}}>0x — Hexadecimal Prefix</h5>
                        <p style={{color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', margin: 0}}>
                            The "0x" tells computers this is a hexadecimal number (base-16). 
                            It's like saying "this uses digits 0-9 and letters a-f". 
                            All Ethereum addresses start with 0x.
                        </p>
                    </div>
                )}
                
                {hoveredPart === 'first4' && (
                    <div>
                        <h5 style={{color: '#86efac', marginTop: 0}}>First 4 Characters — Quick Reference</h5>
                        <p style={{color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', margin: 0}}>
                            The first few characters after "0x" help you quickly identify an address. 
                            In classroom settings, you might say "I'm <strong style={{color: '#86efac'}}>0x{firstFour}</strong>" 
                            so classmates know it's you. Think of it like the first few letters of someone's name.
                        </p>
                    </div>
                )}
                
                {hoveredPart === 'middle' && (
                    <div>
                        <h5 style={{color: '#94a3b8', marginTop: 0}}>Middle Section — Full Uniqueness</h5>
                        <p style={{color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', margin: 0}}>
                            These 32 characters in the middle (plus the 8 on the ends) make your address <strong>completely unique</strong>. 
                            With 40 hex digits total, there are 2<sup>160</sup> possible addresses — more than atoms in the observable universe! 
                            We usually abbreviate this middle section with "..." in conversations.
                        </p>
                    </div>
                )}
                
                {hoveredPart === 'last4' && (
                    <div>
                        <h5 style={{color: '#f9a8d4', marginTop: 0}}>Last 4 Characters — Verification Check</h5>
                        <p style={{color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', margin: 0}}>
                            The last few characters help verify you're looking at the right address. 
                            When sharing addresses in chat, people often write "0x{firstFour}...{lastFour}" — 
                            this gives just enough info to identify the address while saving space. 
                            Always check both ends before sending money!
                        </p>
                    </div>
                )}
            </div>
            
            {/* Shorthand Example */}
            <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'rgba(139,92,246,0.15)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(139,92,246,0.3)'
            }}>
                <h5 style={{color: '#a78bfa', marginTop: 0, fontSize: '0.95rem'}}>💡 In Practice</h5>
                <p style={{color: '#cbd5e1', fontSize: '0.9rem', margin: 0}}>
                    <strong>Full Address:</strong> <code style={{background: 'rgba(0,0,0,0.3)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem'}}>{sampleAddress}</code>
                </p>
                <p style={{color: '#cbd5e1', fontSize: '0.9rem', marginTop: '0.75rem', marginBottom: 0}}>
                    <strong>Shorthand:</strong> <code style={{background: 'rgba(0,0,0,0.3)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem'}}>
                        0x<span style={{color: '#86efac'}}>{firstFour}</span>...<span style={{color: '#f9a8d4'}}>{lastFour}</span>
                    </code> ← Much easier to say in class!
                </p>
            </div>
        </div>
    );
}

function MiniLab_StakingRewards() {
    const [stakeAmount, setStakeAmount] = useState(32);
    const [stakeDuration, setStakeDuration] = useState(365);
    const [ethPrice, setEthPrice] = useState(3000);
    
    const annualRate = 0.045; // 4.5% APR
    const rewards = stakeAmount * annualRate * (stakeDuration / 365);
    const rewardsUSD = rewards * ethPrice;
    const totalETH = stakeAmount + rewards;
    const totalUSD = totalETH * ethPrice;
    
    return (
        <div style={{background: '#0f172a', padding: '1.5rem', borderRadius: '0.75rem', marginTop: '1rem'}}>
            <h4 style={{color: '#fbbf24', marginTop: 0}}>🧮 Staking Rewards Calculator</h4>
            
            <div style={{display: 'grid', gap: '1rem', marginBottom: '1.5rem'}}>
                <div>
                    <label style={{display: 'block', marginBottom: '0.5rem', color: '#cbd5e1'}}>
                        Stake Amount: {stakeAmount} ETH
                    </label>
                    <input 
                        type="range" 
                        min="1" 
                        max="1000" 
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(Number(e.target.value))}
                        style={{width: '100%'}}
                    />
                </div>
                
                <div>
                    <label style={{display: 'block', marginBottom: '0.5rem', color: '#cbd5e1'}}>
                        Duration: {stakeDuration} days
                    </label>
                    <input 
                        type="range" 
                        min="1" 
                        max="730" 
                        value={stakeDuration}
                        onChange={(e) => setStakeDuration(Number(e.target.value))}
                        style={{width: '100%'}}
                    />
                </div>
                
                <div>
                    <label style={{display: 'block', marginBottom: '0.5rem', color: '#cbd5e1'}}>
                        ETH Price: ${ethPrice}
                    </label>
                    <input 
                        type="range" 
                        min="500" 
                        max="10000" 
                        step="100"
                        value={ethPrice}
                        onChange={(e) => setEthPrice(Number(e.target.value))}
                        style={{width: '100%'}}
                    />
                </div>
            </div>
            
            <div style={{background: 'rgba(34,197,94,0.15)', padding: '1.5rem', borderRadius: '0.5rem', border: '2px solid #22c55e'}}>
                <h5 style={{margin: '0 0 1rem 0', color: '#86efac'}}>📊 Results</h5>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.95rem'}}>
                    <div>
                        <div style={{color: '#94a3b8', fontSize: '0.85rem'}}>Rewards Earned</div>
                        <div style={{fontSize: '1.3rem', fontWeight: 'bold', color: '#86efac'}}>
                            {rewards.toFixed(4)} ETH
                        </div>
                        <div style={{color: '#94a3b8', fontSize: '0.85rem'}}>${rewardsUSD.toFixed(2)}</div>
                    </div>
                    <div>
                        <div style={{color: '#94a3b8', fontSize: '0.85rem'}}>Total Value</div>
                        <div style={{fontSize: '1.3rem', fontWeight: 'bold', color: '#86efac'}}>
                            {totalETH.toFixed(4)} ETH
                        </div>
                        <div style={{color: '#94a3b8', fontSize: '0.85rem'}}>${totalUSD.toFixed(2)}</div>
                    </div>
                    <div>
                        <div style={{color: '#94a3b8', fontSize: '0.85rem'}}>APR</div>
                        <div style={{fontSize: '1.1rem', fontWeight: 'bold', color: '#86efac'}}>
                            {(annualRate * 100).toFixed(2)}%
                        </div>
                    </div>
                    <div>
                        <div style={{color: '#94a3b8', fontSize: '0.85rem'}}>Daily Income</div>
                        <div style={{fontSize: '1.1rem', fontWeight: 'bold', color: '#86efac'}}>
                            ${((rewards * ethPrice) / stakeDuration).toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>
            
            <p style={{fontSize: '0.85rem', color: '#94a3b8', marginTop: '1rem', marginBottom: 0}}>
                💡 <strong>Note:</strong> Actual rewards vary based on network participation, uptime, and validator performance.
            </p>
        </div>
    );
}

function MiniLab_ValidatorProbability() {
    const [validators, setValidators] = useState([
        { name: 'You', stake: 32, color: '#3b82f6' },
        { name: 'Validator A', stake: 64, color: '#8b5cf6' },
        { name: 'Validator B', stake: 128, color: '#ec4899' },
        { name: 'Validator C', stake: 256, color: '#10b981' }
    ]);
    
    const totalStake = validators.reduce((sum, v) => sum + v.stake, 0);
    
    const updateStake = (idx, newStake) => {
        const updated = [...validators];
        updated[idx].stake = Number(newStake);
        setValidators(updated);
    };
    
    return (
        <div style={{background: '#0f172a', padding: '1.5rem', borderRadius: '0.75rem', marginTop: '1rem'}}>
            <h4 style={{color: '#fbbf24', marginTop: 0}}>🎲 Validator Selection Probability</h4>
            <p style={{color: '#cbd5e1', fontSize: '0.95rem'}}>
                Adjust stake amounts to see how selection probability changes. Higher stake = higher chance!
            </p>
            
            <div style={{marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                {validators.map((v, idx) => {
                    const probability = (v.stake / totalStake) * 100;
                    return (
                        <div key={idx} style={{
                            background: `${v.color}20`,
                            border: `2px solid ${v.color}`,
                            borderRadius: '0.5rem',
                            padding: '1rem'
                        }}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
                                <span style={{fontWeight: 'bold', color: '#f8fafc'}}>{v.name}</span>
                                <span style={{color: v.color, fontWeight: 'bold', fontSize: '1.1rem'}}>
                                    {probability.toFixed(2)}% chance
                                </span>
                            </div>
                            
                            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                                <label style={{color: '#cbd5e1', minWidth: '80px'}}>
                                    {v.stake} ETH
                                </label>
                                <input 
                                    type="range"
                                    min="1"
                                    max="500"
                                    value={v.stake}
                                    onChange={(e) => updateStake(idx, e.target.value)}
                                    style={{flex: 1}}
                                />
                            </div>
                            
                            {/* Visual probability bar */}
                            <div style={{
                                marginTop: '0.75rem',
                                height: '8px',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '4px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${probability}%`,
                                    height: '100%',
                                    background: v.color,
                                    transition: 'width 0.3s'
                                }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div style={{marginTop: '1.5rem', padding: '1rem', background: 'rgba(59,130,246,0.15)', borderRadius: '0.5rem'}}>
                <strong style={{color: '#93c5fd'}}>Total Network Stake: {totalStake} ETH</strong>
                <p style={{fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.5rem', marginBottom: 0}}>
                    💡 In a network with {totalStake} ETH staked, a validator with 32 ETH gets selected roughly 
                    once every {Math.round(totalStake / 32)} block proposals.
                </p>
            </div>
        </div>
    );
}

function MiniLab_SlashingPenalty() {
    const [offense, setOffense] = useState('double-sign');
    const [stakeAmount, setStakeAmount] = useState(32);
    
    const penalties = {
        'double-sign': { rate: 0.01, desc: 'Proposing two conflicting blocks', severity: 'Minor' },
        'surround-vote': { rate: 0.01, desc: 'Contradictory attestations', severity: 'Minor' },
        'major-attack': { rate: 1.0, desc: 'Coordinated attack on network', severity: 'Severe' }
    };
    
    const penalty = penalties[offense];
    const ethLost = stakeAmount * penalty.rate;
    const ethRemaining = stakeAmount - ethLost;
    const usdLost = ethLost * 3000;
    
    return (
        <div style={{background: '#0f172a', padding: '1.5rem', borderRadius: '0.75rem', marginTop: '1rem'}}>
            <h4 style={{color: '#fbbf24', marginTop: 0}}>⚔️ Slashing Penalty Calculator</h4>
            <p style={{color: '#cbd5e1', fontSize: '0.95rem'}}>
                See what happens when validators misbehave. Slashing = permanent loss of staked ETH.
            </p>
            
            <div style={{marginTop: '1.5rem'}}>
                <label style={{display: 'block', marginBottom: '0.75rem', color: '#cbd5e1'}}>
                    <strong>Your Stake: {stakeAmount} ETH</strong>
                </label>
                <input 
                    type="range"
                    min="32"
                    max="2048"
                    step="32"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(Number(e.target.value))}
                    style={{width: '100%', marginBottom: '1.5rem'}}
                />
                
                <label style={{display: 'block', marginBottom: '0.75rem', color: '#cbd5e1'}}>
                    <strong>Select Offense:</strong>
                </label>
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                    {Object.entries(penalties).map(([key, p]) => (
                        <label 
                            key={key}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '1rem',
                                background: offense === key ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                                border: `2px solid ${offense === key ? '#ef4444' : 'transparent'}`,
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <input 
                                type="radio"
                                name="offense"
                                value={key}
                                checked={offense === key}
                                onChange={(e) => setOffense(e.target.value)}
                            />
                            <div style={{flex: 1}}>
                                <div style={{fontWeight: 'bold', color: '#f8fafc'}}>{p.desc}</div>
                                <div style={{fontSize: '0.85rem', color: '#94a3b8'}}>
                                    Severity: {p.severity} | Penalty: {(p.rate * 100).toFixed(1)}%
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>
            
            <div style={{
                marginTop: '1.5rem',
                padding: '1.5rem',
                background: 'rgba(239,68,68,0.2)',
                border: '2px solid #ef4444',
                borderRadius: '0.5rem'
            }}>
                <h5 style={{margin: '0 0 1rem 0', color: '#fca5a5'}}>💥 Slashing Result</h5>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                    <div>
                        <div style={{color: '#94a3b8', fontSize: '0.85rem'}}>ETH Lost</div>
                        <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#fca5a5'}}>
                            -{ethLost.toFixed(2)} ETH
                        </div>
                        <div style={{color: '#94a3b8', fontSize: '0.85rem'}}>≈ ${usdLost.toFixed(2)}</div>
                    </div>
                    <div>
                        <div style={{color: '#94a3b8', fontSize: '0.85rem'}}>Remaining Stake</div>
                        <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#fca5a5'}}>
                            {ethRemaining.toFixed(2)} ETH
                        </div>
                        <div style={{color: '#94a3b8', fontSize: '0.85rem'}}>
                            {ethRemaining < 32 ? '⚠️ Below minimum—ejected!' : '✓ Still validating'}
                        </div>
                    </div>
                </div>
            </div>
            
            <p style={{fontSize: '0.85rem', color: '#94a3b8', marginTop: '1rem', marginBottom: 0}}>
                💡 <strong>Why slashing works:</strong> Validators have real financial stake. Attacking the network 
                means losing millions of dollars, making attacks economically irrational.
            </p>
        </div>
    );
}

function MiniLab_AttackCost() {
    const [totalStaked, setTotalStaked] = useState(34000000); // 34M ETH
    const [ethPrice, setEthPrice] = useState(3000);
    
    const attackStake = totalStaked * 0.51; // Need 51% to control
    const attackCostETH = attackStake;
    const attackCostUSD = attackCostETH * ethPrice;
    const slashingLoss = attackCostETH; // You'd lose it all
    
    return (
        <div style={{background: '#0f172a', padding: '1.5rem', borderRadius: '0.75rem', marginTop: '1rem'}}>
            <h4 style={{color: '#fbbf24', marginTop: 0}}>💰 51% Attack Cost Calculator</h4>
            <p style={{color: '#cbd5e1', fontSize: '0.95rem'}}>
                How much would it cost to attack Ethereum? Let's do the math.
            </p>
            
            <div style={{marginTop: '1.5rem', display: 'grid', gap: '1rem'}}>
                <div>
                    <label style={{display: 'block', marginBottom: '0.5rem', color: '#cbd5e1'}}>
                        Total Network Stake: {(totalStaked / 1000000).toFixed(1)}M ETH
                    </label>
                    <input 
                        type="range"
                        min="10000000"
                        max="50000000"
                        step="1000000"
                        value={totalStaked}
                        onChange={(e) => setTotalStaked(Number(e.target.value))}
                        style={{width: '100%'}}
                    />
                    <div style={{fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem'}}>
                        Current Ethereum: ~34M ETH staked
                    </div>
                </div>
                
                <div>
                    <label style={{display: 'block', marginBottom: '0.5rem', color: '#cbd5e1'}}>
                        ETH Price: ${ethPrice.toLocaleString()}
                    </label>
                    <input 
                        type="range"
                        min="500"
                        max="10000"
                        step="100"
                        value={ethPrice}
                        onChange={(e) => setEthPrice(Number(e.target.value))}
                        style={{width: '100%'}}
                    />
                </div>
            </div>
            
            <div style={{
                marginTop: '1.5rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.3))',
                border: '2px solid #ef4444',
                borderRadius: '0.75rem'
            }}>
                <h5 style={{margin: '0 0 1rem 0', color: '#fca5a5', fontSize: '1.2rem'}}>
                    🎯 Attack Requirements
                </h5>
                
                <div style={{display: 'grid', gap: '1.5rem'}}>
                    <div>
                        <div style={{color: '#94a3b8', fontSize: '0.85rem'}}>ETH Needed (51% of network)</div>
                        <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#fca5a5'}}>
                            {(attackStake / 1000000).toFixed(2)}M ETH
                        </div>
                    </div>
                    
                    <div>
                        <div style={{color: '#94a3b8', fontSize: '0.85rem'}}>Cost to Acquire</div>
                        <div style={{fontSize: '2.5rem', fontWeight: 'bold', color: '#fca5a5'}}>
                            ${(attackCostUSD / 1000000000).toFixed(2)}B
                        </div>
                        <div style={{fontSize: '0.9rem', color: '#fca5a5', marginTop: '0.25rem'}}>
                            ({attackCostUSD.toLocaleString()} USD)
                        </div>
                    </div>
                    
                    <div>
                        <div style={{color: '#94a3b8', fontSize: '0.85rem'}}>What You'd Lose if Caught</div>
                        <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#fca5a5'}}>
                            ${(slashingLoss * ethPrice / 1000000000).toFixed(2)}B
                        </div>
                        <div style={{fontSize: '0.9rem', color: '#fca5a5', marginTop: '0.25rem'}}>
                            (100% slashed—all {(slashingLoss / 1000000).toFixed(2)}M ETH destroyed)
                        </div>
                    </div>
                </div>
            </div>
            
            <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'rgba(34,197,94,0.15)',
                borderRadius: '0.5rem',
                border: '1px solid #22c55e'
            }}>
                <h5 style={{margin: '0 0 0.75rem 0', color: '#86efac'}}>🛡️ Why This Makes Ethereum Secure</h5>
                <ul style={{margin: 0, paddingLeft: '1.25rem', color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6'}}>
                    <li>You must <strong>buy</strong> ${(attackCostUSD / 1000000000).toFixed(1)}B of ETH (driving price up)</li>
                    <li>If you attack, validators slash you—<strong>lose everything</strong></li>
                    <li>Compare to Bitcoin PoW: Just <em>rent</em> mining hardware temporarily</li>
                    <li>Economic incentive: Earn 4-5% honestly vs. lose 100% dishonestly</li>
                </ul>
            </div>
        </div>
    );
}

// --- COMPONENT: EXPLORE VIEW ---
function ExploreView({ missions, exploreProgress, setExploreProgress, onBack, onContinue }) {
    const [expandedMission, setExpandedMission] = useState(null);
    const [quizAnswers, setQuizAnswers] = useState({});

    const toggleMission = (idx) => {
        setExpandedMission(expandedMission === idx ? null : idx);
    };

    const handleQuizAnswer = (missionIdx, answerIdx) => {
        const mission = missions[missionIdx];
        if (!mission.quiz) return;
        
        const isCorrect = answerIdx === mission.quiz.correct;
        setQuizAnswers({ ...quizAnswers, [missionIdx]: { selected: answerIdx, correct: isCorrect } });
        
        if (isCorrect) {
            // Auto-check the mission
            const next = [...exploreProgress];
            next[missionIdx] = true;
            setExploreProgress(next);
        }
    };

    const completedCount = exploreProgress.filter(Boolean).length;
    const totalCount = missions.length;

    return (
        <div className="explore-view">
            <div className="explore-header">
                <h2>🛰 Deep Dive: Staking, Validators & DeFi</h2>
                <p style={{fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '1rem'}}>
                    Explore advanced Ethereum concepts through interactive missions
                </p>
                <div style={{
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    marginTop: '1rem'
                }}>
                    <strong style={{fontSize: '1.2rem'}}>Progress: {completedCount}/{totalCount} missions completed</strong>
                </div>
            </div>

            <div style={{marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                {missions.map((mission, idx) => {
                    const isExpanded = expandedMission === idx;
                    const isCompleted = exploreProgress[idx];
                    const quizState = quizAnswers[idx];

                    return (
                        <div 
                            key={idx}
                            style={{
                                background: isCompleted ? 'rgba(34,197,94,0.1)' : '#1e293b',
                                border: `2px solid ${isCompleted ? '#22c55e' : '#334155'}`,
                                borderRadius: '1rem',
                                overflow: 'hidden',
                                transition: 'all 0.3s'
                            }}
                        >
                            {/* Mission Header */}
                            <div 
                                onClick={() => toggleMission(idx)}
                                style={{
                                    padding: '1.5rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: isExpanded ? 'rgba(0,0,0,0.2)' : 'transparent'
                                }}
                            >
                                <div style={{flex: 1}}>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem'}}>
                                        <span style={{
                                            background: isCompleted ? '#22c55e' : '#64748b',
                                            color: 'white',
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold'
                                        }}>
                                            {isCompleted ? '✓' : idx + 1}
                                        </span>
                                        <h3 style={{margin: 0, fontSize: '1.3rem', color: '#f8fafc'}}>{mission.title}</h3>
                                    </div>
                                    {mission.category && (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            background: '#3b82f6',
                                            color: 'white',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '999px',
                                            marginLeft: '48px'
                                        }}>
                                            {mission.category}
                                        </span>
                                    )}
                                    <p style={{margin: '0.75rem 0 0 48px', color: '#94a3b8'}}>{mission.action}</p>
                                </div>
                                <span style={{fontSize: '1.5rem', transition: 'transform 0.3s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)'}}>
                                    ▼
                                </span>
                            </div>

                            {/* Mission Content (Expanded) */}
                            {isExpanded && (
                                <div style={{
                                    padding: '1.5rem',
                                    background: '#0f172a',
                                    borderTop: '1px solid #334155',
                                    animation: 'fadein 0.3s',
                                    color: '#e2e8f0'
                                }}>
                                    {mission.miniLab && (
                                        <div style={{marginBottom: '2rem'}}>
                                            {mission.miniLab === 'blockchain-visualizer' && <MiniLab_BlockchainVisualizer />}
                                            {mission.miniLab === 'address-decoder' && <MiniLab_AddressDecoder />}
                                            {mission.miniLab === 'staking-rewards' && <MiniLab_StakingRewards />}
                                            {mission.miniLab === 'validator-probability' && <MiniLab_ValidatorProbability />}
                                            {mission.miniLab === 'slashing-penalty' && <MiniLab_SlashingPenalty />}
                                            {mission.miniLab === 'attack-cost' && <MiniLab_AttackCost />}
                                        </div>
                                    )}
                                    
                                    {mission.details && (
                                        <ul style={{
                                            listStyle: 'none',
                                            padding: 0,
                                            margin: '0 0 1.5rem 0'
                                        }}>
                                            {mission.details.map((detail, dIdx) => (
                                                <li key={dIdx} style={{
                                                    padding: '0.75rem',
                                                    marginBottom: '0.5rem',
                                                    background: 'rgba(59,130,246,0.1)',
                                                    borderLeft: '3px solid #3b82f6',
                                                    borderRadius: '0.25rem',
                                                    color: '#e2e8f0',
                                                    fontSize: '1rem',
                                                    lineHeight: '1.6'
                                                }}>
                                                    💡 {detail}
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {mission.quiz && (
                                        <div style={{
                                            background: 'rgba(139,92,246,0.1)',
                                            padding: '1.5rem',
                                            borderRadius: '0.75rem',
                                            border: '1px solid rgba(139,92,246,0.3)'
                                        }}>
                                            <h4 style={{color: '#a78bfa', marginTop: 0}}>🎯 Quick Quiz</h4>
                                            <p style={{color: '#e2e8f0', fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '1rem'}}>
                                                {mission.quiz.question}
                                            </p>
                                            <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                                                {mission.quiz.options.map((option, oIdx) => {
                                                    const isSelected = quizState?.selected === oIdx;
                                                    const isCorrectAnswer = oIdx === mission.quiz.correct;
                                                    const showResult = quizState !== undefined;

                                                    let bgColor = '#1e293b';
                                                    let borderColor = '#475569';
                                                    let textColor = '#e2e8f0';

                                                    if (showResult) {
                                                        if (isCorrectAnswer) {
                                                            bgColor = 'rgba(34,197,94,0.2)';
                                                            borderColor = '#22c55e';
                                                            textColor = '#86efac';
                                                        } else if (isSelected && !isCorrectAnswer) {
                                                            bgColor = 'rgba(239,68,68,0.2)';
                                                            borderColor = '#ef4444';
                                                            textColor = '#fca5a5';
                                                        }
                                                    } else if (isSelected) {
                                                        bgColor = 'rgba(59,130,246,0.2)';
                                                        borderColor = '#3b82f6';
                                                    }

                                                    return (
                                                        <button
                                                            key={oIdx}
                                                            onClick={() => !quizState && handleQuizAnswer(idx, oIdx)}
                                                            disabled={quizState !== undefined}
                                                            style={{
                                                                padding: '1rem',
                                                                background: bgColor,
                                                                border: `2px solid ${borderColor}`,
                                                                borderRadius: '0.5rem',
                                                                color: textColor,
                                                                cursor: quizState ? 'default' : 'pointer',
                                                                textAlign: 'left',
                                                                fontSize: '1rem',
                                                                transition: 'all 0.2s',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.75rem'
                                                            }}
                                                        >
                                                            <span style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                borderRadius: '50%',
                                                                background: 'rgba(255,255,255,0.1)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: 'bold'
                                                            }}>
                                                                {String.fromCharCode(65 + oIdx)}
                                                            </span>
                                                            {option}
                                                            {showResult && isCorrectAnswer && ' ✓'}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {quizState && (
                                                <div style={{
                                                    marginTop: '1rem',
                                                    padding: '1rem',
                                                    background: quizState.correct ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                                                    borderRadius: '0.5rem',
                                                    color: quizState.correct ? '#86efac' : '#fca5a5',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {quizState.correct ? '✅ Correct! Mission completed.' : '❌ Not quite. Try again!'}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!mission.quiz && (
                                        <button
                                            onClick={() => {
                                                const next = [...exploreProgress];
                                                next[idx] = !next[idx];
                                                setExploreProgress(next);
                                            }}
                                            style={{
                                                marginTop: '1rem',
                                                padding: '0.75rem 1.5rem',
                                                background: isCompleted ? '#64748b' : '#22c55e',
                                                border: 'none',
                                                borderRadius: '0.5rem',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {isCompleted ? 'Mark Incomplete' : 'Mark Complete ✓'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="concept-actions" style={{marginTop: '2rem'}}>
                <button onClick={onBack}>← Back to Basics</button>
                <button
                    className="primary-btn"
                    onClick={onContinue}
                >
                    Continue to Learn Module →
                </button>
            </div>
        </div>
    );
}

// --- COMPONENT: PoS VALIDATOR SIMULATION ---
function PoSValidatorSim({ onComplete }) {
    const [validators, setValidators] = useState([
        { name: "Alice", stake: 32, selected: false, color: "#3b82f6" },
        { name: "Bob", stake: 64, selected: false, color: "#8b5cf6" },
        { name: "Carol", stake: 16, selected: false, color: "#ec4899" },
        { name: "Dave", stake: 128, selected: false, color: "#10b981" }
    ]);
    const [simStep, setSimStep] = useState(1);
    const [selectedValidator, setSelectedValidator] = useState(null);
    const [userGuess, setUserGuess] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);

    const totalStake = validators.reduce((sum, v) => sum + v.stake, 0);

    const selectValidator = () => {
        // Weighted random selection based on stake
        const rand = Math.random() * totalStake;
        let cumulative = 0;
        for (let v of validators) {
            cumulative += v.stake;
            if (rand <= cumulative) {
                setSelectedValidator(v.name);
                setValidators(prev => prev.map(val => 
                    val.name === v.name ? {...val, selected: true} : {...val, selected: false}
                ));
                return;
            }
        }
    };

    const handleGuess = (name) => {
        setUserGuess(name);
        setShowExplanation(true);
    };

    return (
        <div className="simulation-container" style={{maxWidth: '900px'}}>
            <div style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                padding: '2rem',
                borderRadius: '1rem',
                marginBottom: '2rem',
                textAlign: 'center',
                color: 'white'
            }}>
                <h2 style={{margin: 0, fontSize: '2rem'}}>🎲 Proof of Stake Validator Simulator</h2>
                <p style={{margin: '0.75rem 0 0 0', fontSize: '1.1rem', opacity: 0.9}}>
                    Experience how Ethereum selects validators to propose new blocks
                </p>
            </div>
            
            {simStep === 1 && (
                <div className="sim-step" style={{background: '#1e293b', border: '2px solid #8b5cf6'}}>
                    <h3 style={{color: '#a78bfa', fontSize: '1.5rem'}}>Step 1: Understanding Validator Selection</h3>
                    <p style={{color: '#cbd5e1', fontSize: '1.05rem', lineHeight: '1.7'}}>
                        In Proof of Stake, validators are chosen to propose blocks based on how much ETH they've staked.
                    </p>
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(139,92,246,0.15)',
                        borderRadius: '0.75rem',
                        border: '2px solid rgba(139,92,246,0.4)',
                        marginTop: '1rem'
                    }}>
                        <p style={{color: '#e2e8f0', fontSize: '1.05rem', margin: 0}}>
                            <strong style={{color: '#a78bfa'}}>💡 Key Concept:</strong> More stake = Higher probability of being selected (but NOT guaranteed!)
                        </p>
                    </div>
                    
                    <div style={{marginTop: '30px'}}>
                        <h4 style={{color: '#f8fafc', fontSize: '1.2rem'}}>Meet the Validators:</h4>
                        <div style={{display: 'grid', gap: '15px', marginTop: '20px'}}>
                            {validators.map(v => (
                                <div key={v.name} style={{
                                    padding: '20px',
                                    background: `linear-gradient(135deg, ${v.color}30, ${v.color}10)`,
                                    border: `3px solid ${v.color}`,
                                    borderRadius: '12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'transform 0.2s',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '50%',
                                            background: v.color,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.5rem',
                                            color: 'white',
                                            fontWeight: 'bold'
                                        }}>
                                            {v.name[0]}
                                        </div>
                                        <span style={{fontSize: '20px', fontWeight: 'bold', color: '#f8fafc'}}>{v.name}</span>
                                    </div>
                                    <div style={{textAlign: 'right'}}>
                                        <div style={{fontSize: '18px', color: '#e2e8f0'}}>
                                            Staked: <strong style={{color: v.color}}>{v.stake} ETH</strong>
                                        </div>
                                        <div style={{fontSize: '16px', color: '#94a3b8', marginTop: '4px'}}>
                                            {((v.stake / totalStake) * 100).toFixed(1)}% selection chance
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{
                            marginTop: '20px',
                            padding: '15px',
                            background: 'rgba(59,130,246,0.15)',
                            borderRadius: '8px',
                            border: '1px solid rgba(59,130,246,0.3)'
                        }}>
                            <p style={{margin: 0, fontSize: '16px', color: '#cbd5e1'}}>
                                <strong style={{color: '#93c5fd'}}>Total Network Stake:</strong> {totalStake} ETH
                            </p>
                        </div>
                    </div>
                    
                    <button className="primary-btn" onClick={() => setSimStep(2)} style={{
                        marginTop: '30px',
                        width: '100%',
                        padding: '1.25rem',
                        fontSize: '1.1rem',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(139,92,246,0.4)'
                    }}>
                        Try the Selection Process → 🎯
                    </button>
                </div>
            )}

            {simStep === 2 && (
                <div className="sim-step" style={{background: '#1e293b', border: '2px solid #8b5cf6'}}>
                    <h3 style={{color: '#a78bfa', fontSize: '1.5rem'}}>Step 2: Make Your Prediction</h3>
                    <p style={{color: '#cbd5e1', fontSize: '1.05rem'}}>Based on the stakes below, who do you think is most likely to be chosen?</p>
                    
                    <div style={{display: 'grid', gap: '15px', marginTop: '20px'}}>
                        {validators.map(v => (
                            <button
                                key={v.name}
                                onClick={() => handleGuess(v.name)}
                                disabled={userGuess !== null}
                                style={{
                                    padding: '15px',
                                    background: userGuess === v.name ? v.color : `${v.color}30`,
                                    border: `3px solid ${v.color}`,
                                    borderRadius: '8px',
                                    cursor: userGuess ? 'default' : 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    color: userGuess === v.name ? 'white' : '#e2e8f0',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {v.name} ({v.stake} ETH staked - {((v.stake / totalStake) * 100).toFixed(1)}% chance)
                            </button>
                        ))}
                    </div>

                    {showExplanation && (
                        <div style={{marginTop: '30px', padding: '20px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px'}}>
                            <h4 style={{color: '#93c5fd'}}>Good thinking! Here's what you should know:</h4>
                            <ul style={{textAlign: 'left', marginTop: '15px', color: '#cbd5e1'}}>
                                <li><strong>Dave</strong> has the highest stake (128 ETH) = {((128/totalStake)*100).toFixed(1)}% chance</li>
                                <li><strong>Bob</strong> has 64 ETH = {((64/totalStake)*100).toFixed(1)}% chance</li>
                                <li><strong>Alice</strong> has 32 ETH = {((32/totalStake)*100).toFixed(1)}% chance</li>
                                <li><strong>Carol</strong> has the least (16 ETH) = {((16/totalStake)*100).toFixed(1)}% chance</li>
                            </ul>
                            <p style={{marginTop: '15px', color: '#e2e8f0'}}>
                                <strong style={{color: '#93c5fd'}}>But remember:</strong> It's not guaranteed! The algorithm uses weighted randomness, 
                                so even Carol could be selected (just less likely).
                            </p>
                            <button className="primary-btn" onClick={() => { setSimStep(3); selectValidator(); }}>
                                Run the Selection Algorithm →
                            </button>
                        </div>
                    )}
                </div>
            )}

            {simStep === 3 && (
                <div className="sim-step">
                    <h3>🎉 Selection Result</h3>
                    <div style={{marginTop: '30px'}}>
                        {validators.map(v => (
                            <div key={v.name} style={{
                                padding: '20px',
                                marginBottom: '15px',
                                background: v.selected ? v.color : v.color + '20',
                                border: `3px solid ${v.color}`,
                                borderRadius: '8px',
                                transform: v.selected ? 'scale(1.05)' : 'scale(1)',
                                transition: 'all 0.3s',
                                color: v.selected ? 'white' : 'inherit',
                                fontSize: v.selected ? '20px' : '16px',
                                fontWeight: v.selected ? 'bold' : 'normal'
                            }}>
                                {v.selected && '✨ '}{v.name} - {v.stake} ETH{v.selected && ' ← SELECTED!'}
                            </div>
                        ))}
                    </div>
                    
                    <div style={{
                        marginTop: '30px',
                        padding: '20px',
                        background: 'rgba(34,197,94,0.15)',
                        borderRadius: '8px',
                        border: '2px solid rgba(34,197,94,0.4)'
                    }}>
                        <h4 style={{color: '#86efac', marginTop: 0}}>🎉 What Just Happened?</h4>
                        <p style={{color: '#e2e8f0', fontSize: '1.05rem'}}>
                            <strong style={{color: '#86efac'}}>{selectedValidator}</strong> was selected by the algorithm!
                        </p>
                        <p style={{marginTop: '15px', color: '#cbd5e1'}}>
                            {selectedValidator === "Dave" && "Dave had the highest probability due to the largest stake (128 ETH)."}
                            {selectedValidator === "Bob" && "Bob had a good chance with 64 ETH staked - exactly twice Alice's stake!"}
                            {selectedValidator === "Alice" && "Alice was selected even with a moderate stake of 32 ETH!"}
                            {selectedValidator === "Carol" && "Carol was selected despite having the smallest stake (16 ETH)! This shows the randomness factor."}
                        </p>
                        <p style={{marginTop: '15px', fontSize: '14px', color: '#cbd5e1'}}>
                            💰 Now <strong style={{color: '#86efac'}}>{selectedValidator}</strong> will propose the next block and earn transaction fees as reward.
                        </p>
                    </div>

                    <div style={{display: 'flex', gap: '15px', marginTop: '30px'}}>
                        <button onClick={() => { setSimStep(2); setUserGuess(null); setShowExplanation(false); setSelectedValidator(null); }}>
                            Try Again 🔄
                        </button>
                        <button className="primary-btn" onClick={() => setSimStep(4)}>
                            Continue →
                        </button>
                    </div>
                </div>
            )}

            {simStep === 4 && (
                <div className="sim-step" style={{background: '#1e293b', border: '2px solid #8b5cf6'}}>
                    <h3 style={{color: '#a78bfa', fontSize: '1.5rem'}}>✅ You Understand Proof of Stake!</h3>
                    <div style={{
                        marginTop: '30px',
                        padding: '20px',
                        background: 'rgba(59,130,246,0.15)',
                        borderRadius: '8px',
                        border: '2px solid rgba(59,130,246,0.4)'
                    }}>
                        <h4 style={{color: '#93c5fd', marginTop: 0}}>🎓 Key Takeaways:</h4>
                        <ul style={{textAlign: 'left', marginTop: '15px', fontSize: '16px', color: '#e2e8f0', lineHeight: '2'}}>
                            <li>✓ Validators stake ETH as collateral</li>
                            <li>✓ Selection is weighted by stake amount</li>
                            <li>✓ Randomness ensures fairness</li>
                            <li>✓ Selected validators earn rewards</li>
                            <li>✓ Bad behavior results in slashing (losing stake)</li>
                        </ul>
                    </div>
                    
                    <div style={{
                        marginTop: '30px',
                        padding: '20px',
                        background: 'rgba(139,92,246,0.15)',
                        borderRadius: '8px',
                        border: '2px solid rgba(139,92,246,0.4)'
                    }}>
                        <h4 style={{color: '#a78bfa', marginTop: 0}}>🚀 Ready for the Live Network?</h4>
                        <p style={{color: '#cbd5e1', fontSize: '1.05rem', margin: 0}}>
                            Now you'll connect to a real blockchain and stake your own ETH!
                        </p>
                    </div>
                    
                    <button className="primary-btn" onClick={onComplete} style={{
                        marginTop: '30px',
                        width: '100%',
                        padding: '1.25rem',
                        fontSize: '1.1rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.4)'
                    }}>
                        Go to Live Network 🌐
                    </button>
                </div>
            )}
        </div>
    )
}

// --- COMPONENT: SIMULATION MODE (Legacy wallet practice) ---
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
  
  // Staking State
  const [stakeAmount, setStakeAmount] = useState("1")
  
  // Transaction History
  const [txHistory, setTxHistory] = useState([])
  const [myStake, setMyStake] = useState({ amount: '0', reward: '0' })

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
    concepts: true, // Always unlocked
    explore: true, // Always unlocked
    learn: true, // Always unlocked
    sim: true, // Always unlocked
    live: true // Always unlocked - students can go straight to live network
  }

  const requestView = (target) => {
    setView(target)
    setNavHint('')
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

  // Real-time balance updates and transaction history
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
    
    const fetchTxHistory = async () => {
      try {
        const currentBlock = await provider.getBlockNumber()
        const history = []
        
        // Get last 100 blocks of transactions
        for (let i = Math.max(0, currentBlock - 100); i <= currentBlock; i++) {
          const block = await provider.getBlock(i, true)
          if (block && block.transactions) {
            for (const tx of block.transactions) {
              if (tx.from === wallet.address || tx.to === wallet.address) {
                history.push({
                  hash: tx.hash,
                  from: tx.from,
                  to: tx.to,
                  value: ethers.formatEther(tx.value),
                  blockNumber: i,
                  timestamp: block.timestamp,
                  type: tx.from === wallet.address ? 'sent' : 'received'
                })
              }
            }
          }
        }
        
        setTxHistory(history.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20))
      } catch (e) {
        console.error("Transaction history error:", e)
      }
    }
    
    const fetchStakeInfo = async () => {
      if (!posAddress || posAddress.length !== 42) return
      try {
        const contract = new ethers.Contract(posAddress, PoSABI, provider)
        const stake = await contract.stakes(wallet.address)
        const reward = await contract.calculateReward(wallet.address)
        setMyStake({
          amount: ethers.formatEther(stake),
          reward: ethers.formatEther(reward)
        })
      } catch (e) {
        console.error("Stake info error:", e)
      }
    }
    
    // Initial updates
    updateBalance()
    fetchTxHistory()
    fetchStakeInfo()
    
    // Listen for new blocks for real-time updates
    const blockListener = (blockNumber) => {
      updateBalance()
      fetchTxHistory()
      fetchStakeInfo()
    }
    provider.on("block", blockListener)
    
    // Poll every 3 seconds as backup
    const interval = setInterval(() => {
      updateBalance()
      fetchTxHistory()
      fetchStakeInfo()
    }, 3000)
    
    return () => {
      provider.off("block", blockListener)
      clearInterval(interval)
    }
  }, [provider, wallet.address, view, posAddress])

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
                            <h2>Welcome to the Ethereum Lab</h2>
                            <p style={{fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '1.5rem'}}>
                                You're about to interact with a real Ethereum blockchain running in your classroom. 
                                This isn't a simulation—it's the actual Ethereum protocol, just isolated from the public network.
                            </p>
                            
                            <div style={{background: 'rgba(59,130,246,0.15)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', borderLeft: '4px solid #3b82f6'}}>
                                <strong style={{color: '#93c5fd'}}>📊 Ethereum by the Numbers:</strong>
                                <ul style={{marginTop: '0.5rem', fontSize: '0.95rem'}}>
                                    <li>2nd largest cryptocurrency ($200B+ market cap)</li>
                                    <li>8,600+ validator nodes worldwide</li>
                                    <li>~1.2M transactions per day</li>
                                    <li>New block every 12 seconds</li>
                                    <li>Launched July 30, 2015 by Vitalik Buterin</li>
                                </ul>
                            </div>

                            <h3 style={{marginTop: '1.5rem', marginBottom: '0.75rem'}}>Your Learning Path:</h3>
                            <ul style={{fontSize: '1rem'}}>
                                <li>🧭 <strong>Orientation</strong> → Understand what Ethereum is and why it matters</li>
                                <li>🧱 <strong>Basics</strong> → Core concepts: wallets, gas, blocks, consensus</li>
                                <li>🛰 <strong>Explore</strong> → Deep dive into staking, validators, slashing, and DeFi</li>
                                <li>🧠 <strong>Learn</strong> → Proof-of-Work vs Proof-of-Stake comparison</li>
                                <li>🧪 <strong>Practice</strong> → Interactive validator selection simulation</li>
                                <li>🌐 <strong>Live Network</strong> → Stake real ETH, send transactions, earn rewards</li>
                            </ul>
                        </div>
                        <div className="intro-card">
                            <h3 style={{marginBottom: '1rem'}}>🎓 What Makes This Lab Special</h3>
                            <ul style={{fontSize: '0.95rem', lineHeight: '1.6'}}>
                                <li><strong>Real Protocol:</strong> Actual Ethereum node (Hardhat), not a toy</li>
                                <li><strong>Safe Environment:</strong> Test ETH has no real-world value</li>
                                <li><strong>Hands-On:</strong> You'll stake, transact, and validate</li>
                                <li><strong>Collaborative:</strong> See classmates' transactions in real-time</li>
                            </ul>
                            
                            <h3 style={{marginTop: '1.5rem', marginBottom: '0.75rem'}}>📋 Instructor Checklist</h3>
                            <ul style={{fontSize: '0.9rem'}}>
                                <li>✅ Hardhat node running (port 8545)</li>
                                <li>✅ PoS contract deployed</li>
                                <li>✅ Faucet funded with test ETH</li>
                                <li>✅ RPC endpoint accessible (local/ngrok)</li>
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
                            <div 
                                className="concept-card" 
                                key={card.title}
                                style={card.fullWidth ? {gridColumn: '1 / -1'} : {}}
                            >
                                <h3>{card.title}</h3>
                                <p>{card.description}</p>
                                <ul>
                                    {card.highlight.map(point => <li key={point}>{point}</li>)}
                                </ul>
                                {card.diagram && (
                                    <div style={{marginTop: '1.5rem', padding: '1.5rem', background: 'white', borderRadius: '0.75rem', border: '2px solid #e2e8f0'}}>
                                        <h4 style={{marginTop: 0, marginBottom: '1rem', color: '#1e293b', textAlign: 'center', fontSize: '1.3rem'}}>
                                            📊 The Validation Cycle
                                        </h4>
                                        <div style={{maxWidth: '900px', margin: '0 auto'}}>
                                            <img 
                                                src="/pos-diagram.svg" 
                                                alt="Proof of Stake Validation Flow" 
                                                style={{width: '100%', display: 'block', height: 'auto'}}
                                            />
                                        </div>
                                        <div style={{marginTop: '1.5rem', padding: '1rem', background: '#f1f5f9', borderRadius: '0.5rem', maxWidth: '900px', margin: '1.5rem auto 0'}}>
                                            <p style={{margin: 0, fontSize: '0.95rem', color: '#475569', lineHeight: '1.7'}}>
                                                <strong style={{color: '#1e293b', display: 'block', marginBottom: '0.5rem'}}>How it works:</strong>
                                                <span style={{color: '#1e293b'}}>①</span> Validator stakes ETH → 
                                                <span style={{color: '#1e293b'}}> ②</span> Algorithm selects validator → 
                                                <span style={{color: '#1e293b'}}> ③</span> Selected validator proposes block → 
                                                <span style={{color: '#1e293b'}}> ④</span> Others verify → 
                                                <span style={{color: '#1e293b'}}> ⑤</span> Block added to chain → 
                                                <span style={{color: '#1e293b'}}> ⑥</span> Validator earns rewards
                                            </p>
                                        </div>
                                    </div>
                                )}
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
                <ExploreView 
                    missions={EXPLORE_MISSIONS}
                    exploreProgress={exploreProgress}
                    setExploreProgress={setExploreProgress}
                    onBack={() => setView('concepts')}
                    onContinue={() => { saveTrail({ ...trail, explore: true }); setView('learn'); }}
                />
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
                <PoSValidatorSim onComplete={() => setView('live')} />
            )}

            {/* 3. LIVE NETWORK VIEW */}
            {view === 'live' && (
                <div className="live-dashboard">
                    {/* Wallet Header - Like MetaMask */}
                    <div style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                        padding: '2rem',
                        borderRadius: '1rem',
                        marginBottom: '1.5rem',
                        color: 'white'
                    }}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem'}}>
                            <div>
                                <div style={{fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem'}}>
                                    <span className={`dot ${nodeStatus.connected ? 'green' : 'red'}`} style={{marginRight: '0.5rem'}}></span>
                                    {nodeStatus.connected ? `Block #${nodeStatus.blockNumber}` : 'Connecting...'}
                                </div>
                                <div style={{fontSize: '0.9rem', opacity: 0.8, fontFamily: 'monospace'}}>
                                    {wallet.address ? `${wallet.address.slice(0,6)}...${wallet.address.slice(-4)}` : 'No Wallet'}
                                </div>
                            </div>
                            <button 
                                onClick={() => copyAddress(wallet.address)}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.5rem',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                📋 Copy Address
                            </button>
                        </div>
                        
                        <div style={{textAlign: 'center', padding: '2rem 0'}}>
                            <div style={{fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem'}}>
                                {parseFloat(wallet.balance || 0).toFixed(4)} ETH
                            </div>
                            <div style={{fontSize: '1.2rem', opacity: 0.9}}>
                                ≈ ${(parseFloat(wallet.balance || 0) * 3000).toFixed(2)} USD
                            </div>
                        </div>
                        
                        {parseFloat(myStake.amount) > 0 && (
                            <div style={{
                                background: 'rgba(255,255,255,0.15)',
                                padding: '1rem',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{fontSize: '0.85rem', opacity: 0.9}}>Staked</div>
                                    <div style={{fontSize: '1.3rem', fontWeight: 'bold'}}>{parseFloat(myStake.amount).toFixed(4)} ETH</div>
                                </div>
                                <div style={{textAlign: 'right'}}>
                                    <div style={{fontSize: '0.85rem', opacity: 0.9}}>Pending Rewards</div>
                                    <div style={{fontSize: '1.3rem', fontWeight: 'bold', color: '#86efac'}}>+{parseFloat(myStake.reward).toFixed(6)} ETH</div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Quick Actions */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1rem',
                        marginBottom: '1.5rem'
                    }}>
                        <button
                            onClick={requestFunds}
                            disabled={statusMsg.includes("Requesting") || statusMsg.includes("Processing")}
                            style={{
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                padding: '1.25rem',
                                borderRadius: '0.75rem',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <span style={{fontSize: '2rem'}}>🚰</span>
                            {statusMsg.includes("Requesting") || statusMsg.includes("Processing") ? "Processing..." : "Get 5 ETH"}
                        </button>
                        
                        <button
                            onClick={() => document.getElementById('send-section').scrollIntoView({behavior: 'smooth'})}
                            style={{
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                padding: '1.25rem',
                                borderRadius: '0.75rem',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <span style={{fontSize: '2rem'}}>📤</span>
                            Send
                        </button>
                        
                        <button
                            onClick={() => document.getElementById('stake-section').scrollIntoView({behavior: 'smooth'})}
                            style={{
                                background: '#8b5cf6',
                                color: 'white',
                                border: 'none',
                                padding: '1.25rem',
                                borderRadius: '0.75rem',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <span style={{fontSize: '2rem'}}>🏦</span>
                            Stake
                        </button>
                    </div>
                    
                    <div className="live-grid">
                        {/* Assets / Portfolio */}
                        <section className="card">
                            <h3>💼 Your Assets</h3>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
                                {/* ETH Balance */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    background: 'rgba(59,130,246,0.1)',
                                    borderRadius: '0.5rem',
                                    border: '1px solid rgba(59,130,246,0.3)'
                                }}>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #627eea 0%, #8a92b2 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.2rem'
                                        }}>
                                            Ξ
                                        </div>
                                        <div>
                                            <div style={{fontWeight: 'bold', color: '#f8fafc'}}>Ethereum</div>
                                            <div style={{fontSize: '0.85rem', color: '#94a3b8'}}>ETH</div>
                                        </div>
                                    </div>
                                    <div style={{textAlign: 'right'}}>
                                        <div style={{fontWeight: 'bold', color: '#f8fafc'}}>{parseFloat(wallet.balance || 0).toFixed(4)} ETH</div>
                                        <div style={{fontSize: '0.85rem', color: '#94a3b8'}}>${(parseFloat(wallet.balance || 0) * 3000).toFixed(2)}</div>
                                    </div>
                                </div>
                                
                                {/* Staked ETH */}
                                {parseFloat(myStake.amount) > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '1rem',
                                        background: 'rgba(139,92,246,0.1)',
                                        borderRadius: '0.5rem',
                                        border: '1px solid rgba(139,92,246,0.3)'
                                    }}>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.2rem'
                                            }}>
                                                🏦
                                            </div>
                                            <div>
                                                <div style={{fontWeight: 'bold', color: '#f8fafc'}}>Staked ETH</div>
                                                <div style={{fontSize: '0.85rem', color: '#94a3b8'}}>Earning rewards</div>
                                            </div>
                                        </div>
                                        <div style={{textAlign: 'right'}}>
                                            <div style={{fontWeight: 'bold', color: '#f8fafc'}}>{parseFloat(myStake.amount).toFixed(4)} ETH</div>
                                            <div style={{fontSize: '0.85rem', color: '#86efac'}}>+{parseFloat(myStake.reward).toFixed(6)} rewards</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Send Transaction */}
                        <section className="card" id="send-section">
                            <h3>📤 Send Transaction</h3>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
                                <div>
                                    <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1'}}>
                                        Recipient Address
                                    </label>
                                    <input 
                                        placeholder="0x... or click classmate in sidebar" 
                                        value={recipient}
                                        onChange={e => setRecipient(e.target.value)}
                                        style={{width: '100%'}}
                                    />
                                </div>
                                
                                <div>
                                    <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1'}}>
                                        Amount (ETH)
                                    </label>
                                    <input 
                                        placeholder="0.0" 
                                        type="number"
                                        step="0.01"
                                        value={sendAmount}
                                        onChange={e => setSendAmount(e.target.value)}
                                        style={{width: '100%'}}
                                    />
                                </div>
                                
                                <button 
                                    onClick={sendEthToPeer}
                                    disabled={statusMsg.includes("Sending ETH") || !recipient || !sendAmount}
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        background: (statusMsg.includes("Sending ETH") || !recipient || !sendAmount) ? '#64748b' : '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        cursor: (statusMsg.includes("Sending ETH") || !recipient || !sendAmount) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {statusMsg.includes("Sending ETH") ? "⏳ Sending..." : "📤 Send Transaction"}
                                </button>
                            </div>
                        </section>

                        {/* Staking Section */}
                        <section className="card" id="stake-section">
                            <h3>🏦 Proof of Stake - Become a Validator</h3>
                            <p style={{fontSize: '14px', color: '#cbd5e1', marginBottom: '15px'}}>
                                Stake your ETH to participate in block validation and earn rewards!
                            </p>
                            
                            <div style={{background: 'rgba(59,130,246,0.15)', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid rgba(59,130,246,0.3)'}}>
                                <p style={{fontSize: '13px', marginBottom: '10px', color: '#e2e8f0'}}>
                                    <strong style={{color: '#93c5fd'}}>How it works:</strong>
                                </p>
                                <ul style={{fontSize: '12px', paddingLeft: '20px', margin: 0, color: '#cbd5e1'}}>
                                    <li>Minimum stake: 1 ETH</li>
                                    <li>You earn rewards over time based on your stake</li>
                                    <li>Withdraw anytime to get your stake + rewards back</li>
                                </ul>
                            </div>
                            
                            {/* Stake Amount Input */}
                            <div style={{marginBottom: '1rem'}}>
                                <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1'}}>
                                    Stake Amount (ETH)
                                </label>
                                <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                                    <input 
                                        type="number"
                                        step="0.1"
                                        min="1"
                                        placeholder="1.0" 
                                        value={stakeAmount}
                                        onChange={e => setStakeAmount(e.target.value)}
                                        style={{flex: 1}}
                                    />
                                    <div style={{display: 'flex', gap: '0.25rem'}}>
                                        <button 
                                            onClick={() => setStakeAmount("1")}
                                            style={{
                                                padding: '0.5rem 0.75rem',
                                                background: 'rgba(59,130,246,0.2)',
                                                border: '1px solid #3b82f6',
                                                color: '#93c5fd',
                                                borderRadius: '0.25rem',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            1 ETH
                                        </button>
                                        <button 
                                            onClick={() => setStakeAmount("5")}
                                            style={{
                                                padding: '0.5rem 0.75rem',
                                                background: 'rgba(59,130,246,0.2)',
                                                border: '1px solid #3b82f6',
                                                color: '#93c5fd',
                                                borderRadius: '0.25rem',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            5 ETH
                                        </button>
                                        <button 
                                            onClick={() => setStakeAmount(wallet.balance)}
                                            style={{
                                                padding: '0.5rem 0.75rem',
                                                background: 'rgba(59,130,246,0.2)',
                                                border: '1px solid #3b82f6',
                                                color: '#93c5fd',
                                                borderRadius: '0.25rem',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            MAX
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                                <button 
                                    onClick={async () => {
                                        if (!posAddress || !wallet.signer) return setStatusMsg("Connect wallet first");
                                        if (!stakeAmount || parseFloat(stakeAmount) < 1) {
                                            return setStatusMsg("⚠️ Minimum stake is 1 ETH");
                                        }
                                        if (parseFloat(stakeAmount) > parseFloat(wallet.balance)) {
                                            return setStatusMsg("⚠️ Insufficient balance");
                                        }
                                        try {
                                            setStatusMsg(`Staking ${stakeAmount} ETH...`);
                                            const contract = new ethers.Contract(posAddress, PoSABI, wallet.signer);
                                            const tx = await contract.stake({ value: ethers.parseEther(stakeAmount) });
                                            await tx.wait();
                                            setStatusMsg(`✅ Successfully staked ${stakeAmount} ETH!`);
                                            syncBlockchainData();
                                            setTimeout(() => setStatusMsg(""), 3000);
                                        } catch (e) {
                                            setStatusMsg("Staking failed: " + (e.message || "Unknown error"));
                                        }
                                    }}
                                    style={{
                                        padding: '1rem',
                                        background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🏦 Stake {stakeAmount || '1'} ETH
                                </button>
                                <button 
                                    onClick={async () => {
                                        if (!posAddress || !wallet.signer) return setStatusMsg("Connect wallet first");
                                        try {
                                            setStatusMsg("Withdrawing stake...");
                                            const contract = new ethers.Contract(posAddress, PoSABI, wallet.signer);
                                            const tx = await contract.withdraw();
                                            await tx.wait();
                                            setStatusMsg("✅ Withdrew stake + rewards!");
                                            syncBlockchainData();
                                            setTimeout(() => setStatusMsg(""), 3000);
                                        } catch (e) {
                                            setStatusMsg("Withdraw failed: " + (e.message || "Unknown error"));
                                        }
                                    }}
                                    style={{
                                        padding: '1rem',
                                        background: '#64748b',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    💸 Withdraw Stake + Rewards
                                </button>
                            </div>
                            
                            <div style={{marginTop: '15px', fontSize: '13px'}}>
                                <button 
                                    style={{
                                        fontSize: '14px',
                                        padding: '10px 15px',
                                        width: '100%',
                                        background: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                    onClick={async () => {
                                        if (!posAddress || posAddress.length !== 42) {
                                            setStatusMsg("⚠️ Please enter a valid contract address first");
                                            return;
                                        }
                                        if (!provider) {
                                            setStatusMsg("⚠️ Not connected to blockchain");
                                            return;
                                        }
                                        if (!wallet.address) {
                                            setStatusMsg("⚠️ No wallet connected");
                                            return;
                                        }
                                        
                                        setStatusMsg("🔍 Checking your stake...");
                                        
                                        try {
                                            const contract = new ethers.Contract(posAddress, PoSABI, provider);
                                            const stake = await contract.stakes(wallet.address);
                                            const reward = await contract.calculateReward(wallet.address);
                                            
                                            const stakeETH = ethers.formatEther(stake);
                                            const rewardETH = ethers.formatEther(reward);
                                            
                                            if (parseFloat(stakeETH) === 0) {
                                                setStatusMsg("💡 You haven't staked any ETH yet. Click 'Stake 1 ETH' to become a validator!");
                                            } else {
                                                setStatusMsg(`✅ Your stake: ${parseFloat(stakeETH).toFixed(4)} ETH | Pending rewards: ${parseFloat(rewardETH).toFixed(6)} ETH`);
                                            }
                                        } catch (e) {
                                            console.error("Stake check error:", e);
                                            setStatusMsg(`❌ Error: ${e.message || "Could not fetch stake info"}`);
                                        }
                                    }}
                                >
                                    📊 Check My Stake & Rewards
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

                        {/* Transaction History */}
                        <section className="card full-width">
                            <h3>📜 Transaction History</h3>
                            <div style={{marginTop: '1rem'}}>
                                {txHistory.length === 0 ? (
                                    <div style={{textAlign: 'center', padding: '2rem', color: '#64748b'}}>
                                        No transactions yet. Send or receive ETH to see your history here.
                                    </div>
                                ) : (
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                                        {txHistory.map((tx, idx) => (
                                            <div key={idx} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '1rem',
                                                background: tx.type === 'sent' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                                                borderLeft: `4px solid ${tx.type === 'sent' ? '#ef4444' : '#22c55e'}`,
                                                borderRadius: '0.5rem'
                                            }}>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        background: tx.type === 'sent' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '1.2rem'
                                                    }}>
                                                        {tx.type === 'sent' ? '📤' : '📥'}
                                                    </div>
                                                    <div>
                                                        <div style={{fontWeight: 'bold', color: '#f8fafc'}}>
                                                            {tx.type === 'sent' ? 'Sent' : 'Received'}
                                                        </div>
                                                        <div style={{fontSize: '0.85rem', color: '#94a3b8', fontFamily: 'monospace'}}>
                                                            {tx.type === 'sent' ? `To: ${tx.to.slice(0,6)}...${tx.to.slice(-4)}` : `From: ${tx.from.slice(0,6)}...${tx.from.slice(-4)}`}
                                                        </div>
                                                        <div style={{fontSize: '0.75rem', color: '#64748b'}}>
                                                            Block #{tx.blockNumber} • {new Date(tx.timestamp * 1000).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{textAlign: 'right'}}>
                                                    <div style={{
                                                        fontWeight: 'bold',
                                                        fontSize: '1.1rem',
                                                        color: tx.type === 'sent' ? '#fca5a5' : '#86efac'
                                                    }}>
                                                        {tx.type === 'sent' ? '-' : '+'}{parseFloat(tx.value).toFixed(4)} ETH
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(tx.hash);
                                                            setStatusMsg(`Copied tx hash: ${tx.hash.slice(0,10)}...`);
                                                            setTimeout(() => setStatusMsg(''), 2000);
                                                        }}
                                                        style={{
                                                            background: 'transparent',
                                                            border: '1px solid #475569',
                                                            color: '#94a3b8',
                                                            padding: '0.25rem 0.5rem',
                                                            borderRadius: '0.25rem',
                                                            fontSize: '0.75rem',
                                                            cursor: 'pointer',
                                                            marginTop: '0.25rem'
                                                        }}
                                                    >
                                                        📋 Copy Hash
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
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
                            rpcUrl={rpcUrl}
                        />
                    )}
                </div>
            )}
        </main>
    </div>
  )
}

export default App
