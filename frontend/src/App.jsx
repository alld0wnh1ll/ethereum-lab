import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { connectWallet, checkNodeStatus, getGuestWallet } from './web3'
import PoSABI from './PoS.json'
import { InstructorView } from './views/InstructorView'
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

// --- COMPONENT: CLI LABS VIEW ---
function CLILabsView() {
    const [selectedLab, setSelectedLab] = useState(null);
    const [completedSteps, setCompletedSteps] = useState({});
    const [os, setOS] = useState('bash'); // 'bash' or 'powershell'

    const labs = [
        {
            id: 1,
            title: "Local Blockchain Setup",
            duration: "15 min",
            description: "Start your own Ethereum node and explore the blockchain",
            color: "#10b981",
            steps: [
                {
                    title: "Start Hardhat Node",
                    why: "This creates a local Ethereum blockchain on your computer. It's like running your own mini-Ethereum network!",
                    bash: "npx hardhat node",
                    powershell: "npx hardhat node",
                    expectedOutput: `Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...`,
                    explanation: "You now have 20 pre-funded accounts, each with 10,000 test ETH. The node is listening on port 8545.",
                    deepDive: {
                        title: "🔬 What's Actually Happening:",
                        points: [
                            {
                                icon: "⚙️",
                                label: "EVM Instance",
                                text: "Hardhat spins up a full Ethereum Virtual Machine - the same code that runs on mainnet. Your computer is now a validator node!"
                            },
                            {
                                icon: "🌐",
                                label: "JSON-RPC Server",
                                text: "Port 8545 exposes an HTTP API using JSON-RPC 2.0 protocol. This is how MetaMask, web3.js, and ethers.js talk to Ethereum."
                            },
                            {
                                icon: "💰",
                                label: "Pre-funded Accounts",
                                text: "These are deterministic accounts generated from a known mnemonic. Same mnemonic = same addresses. That's why everyone gets the same Account #0."
                            },
                            {
                                icon: "🔐",
                                label: "Private Keys Shown",
                                text: "NEVER share private keys in production! These are test keys that everyone knows. On mainnet, your private key = your money."
                            },
                            {
                                icon: "⛏️",
                                label: "Auto-mining",
                                text: "Hardhat auto-mines blocks when transactions arrive. Real Ethereum waits ~12 seconds. You can configure this in hardhat.config.js."
                            }
                        ]
                    },
                    whyItMatters: "Understanding how nodes work is crucial. Every Ethereum app needs to connect to a node (yours, Infura, Alchemy). This is YOUR node!"
                },
                {
                    title: "Explore the Blockchain",
                    why: "This script queries your blockchain to show blocks, transactions, and account balances.",
                    bash: "npx hardhat run scripts/cli-labs/1-explore-blockchain.js --network localhost",
                    powershell: "npx hardhat run scripts/cli-labs/1-explore-blockchain.js --network localhost",
                    expectedOutput: `📊 Current Block Number: 0

--- Block Details ---
Hash: 0x1234...
Transactions: 0
Gas Used: 0

--- Pre-funded Accounts ---
Account 0: 0xf39F... (10000 ETH)`,
                    explanation: "Block 0 is the genesis block. As you send transactions, new blocks will be created every 12 seconds.",
                    tryNext: {
                        title: "🎯 Now Try This:",
                        tasks: [
                            {
                                task: "Send a transaction between accounts",
                                bash: `# Open Hardhat console
npx hardhat console --network localhost

# In the console, run:
const [sender, receiver] = await ethers.getSigners();
await sender.sendTransaction({
  to: receiver.address,
  value: ethers.parseEther("1.0")
});`,
                                powershell: `# Open Hardhat console
npx hardhat console --network localhost

# In the console, run:
const [sender, receiver] = await ethers.getSigners();
await sender.sendTransaction({
  to: receiver.address,
  value: ethers.parseEther("1.0")
});`,
                                result: "You just sent 1 ETH! The node will mine a new block."
                            },
                            {
                                task: "Run the explore script again and watch the block number increase",
                                bash: "npx hardhat run scripts/cli-labs/1-explore-blockchain.js --network localhost",
                                powershell: "npx hardhat run scripts/cli-labs/1-explore-blockchain.js --network localhost",
                                result: "Block number should now be 1 (or higher). Account 0's balance decreased by ~1.0 ETH + gas!"
                            },
                            {
                                task: "Check a specific account's balance",
                                bash: `# In console
const balance = await ethers.provider.getBalance("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
console.log(ethers.formatEther(balance), "ETH");`,
                                powershell: `# In console
const balance = await ethers.provider.getBalance("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
console.log(ethers.formatEther(balance), "ETH");`,
                                result: "You'll see the balance has changed from the original 10000 ETH."
                            }
                        ]
                    }
                },
                {
                    title: "Check Node Status (HTTP Request)",
                    why: "Learn how applications communicate with Ethereum nodes using JSON-RPC protocol.",
                    bash: `curl -X POST http://localhost:8545 \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`,
                    powershell: `Invoke-RestMethod -Uri http://localhost:8545 -Method POST -ContentType "application/json" -Body '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`,
                    expectedOutput: `{"jsonrpc":"2.0","id":1,"result":"0x0"}`,
                    explanation: "The result '0x0' is hexadecimal for 0. This is how your web browser talks to the blockchain!"
                }
            ]
        },
        {
            id: 2,
            title: "Manual Transaction Signing",
            duration: "20 min",
            description: "Sign and send transactions to understand how wallets work",
            color: "#3b82f6",
            steps: [
                {
                    title: "Send ETH Between Accounts",
                    why: "Every transaction must be signed with a private key. This proves you own the account and authorize the transfer.",
                    bash: "npx hardhat run scripts/cli-labs/2-sign-transaction.js --network localhost",
                    powershell: "npx hardhat run scripts/cli-labs/2-sign-transaction.js --network localhost",
                    expectedOutput: `--- Before Transaction ---
Sender: 10000.0 ETH
Receiver: 10000.0 ETH

--- Signing & Broadcasting ---
Transaction Hash: 0xabc123...
✓ Confirmed in block: 1

--- After Transaction ---
Sender: 9998.499958 ETH
Receiver: 10001.5 ETH

--- Cost Breakdown ---
Amount sent: 1.5 ETH
Gas cost: 0.000042 ETH
Total deducted: 1.500042 ETH`,
                    explanation: "Notice the sender lost MORE than 1.5 ETH? That's because they paid gas fees. The receiver got exactly 1.5 ETH.",
                    deepDive: {
                        title: "🔬 Transaction Anatomy:",
                        points: [
                            {
                                icon: "✍️",
                                label: "Digital Signature",
                                text: "Your private key creates a cryptographic signature. This proves: (1) You own the account, (2) You authorized THIS specific transaction, (3) The transaction hasn't been tampered with."
                            },
                            {
                                icon: "🔢",
                                label: "Nonce (Number Used Once)",
                                text: "Each account has a transaction counter. Nonce prevents replay attacks - you can't copy someone's transaction and submit it again. Transactions must be processed in nonce order."
                            },
                            {
                                icon: "⛽",
                                label: "Gas Mechanics",
                                text: "Gas limit = max gas you'll pay. Gas price = how much per unit. Simple transfers use exactly 21,000 gas. Unused gas is refunded. Higher gas price = faster inclusion."
                            },
                            {
                                icon: "📝",
                                label: "Transaction Hash",
                                text: "The hash uniquely identifies this transaction. It's like a receipt. You can look it up on any block explorer to see its status and details."
                            },
                            {
                                icon: "⏱️",
                                label: "Confirmation",
                                text: "Transaction goes: Signed → Broadcast → Mempool → Mined into Block → Confirmed. On Hardhat it's instant. On mainnet, wait ~12 seconds for first confirmation."
                            }
                        ]
                    },
                    whyItMatters: "Every action on Ethereum is a transaction. Sending ETH, calling contracts, deploying code - all transactions. Understanding signing, gas, and nonces is essential for building any blockchain app!"
                },
                {
                    title: "Understanding the Transaction Object",
                    why: "Transactions contain: to, value, gasLimit, nonce, and signature. Understanding these fields is crucial.",
                    bash: "# Open Hardhat console\nnpx hardhat console --network localhost",
                    powershell: "# Open Hardhat console\nnpx hardhat console --network localhost",
                    expectedOutput: `Welcome to Node.js v20.18.1.
Type ".help" for more information.
>`,
                    explanation: "The console lets you interact with Ethereum using JavaScript. Try: await ethers.provider.getBlockNumber()",
                    tryNext: {
                        title: "🎯 Practice in the Console:",
                        tasks: [
                            {
                                task: "Get current block number",
                                bash: "await ethers.provider.getBlockNumber();",
                                powershell: "await ethers.provider.getBlockNumber();",
                                result: "Returns the latest block number (increases as transactions are mined)"
                            },
                            {
                                task: "Check your balance",
                                bash: `const [me] = await ethers.getSigners();
const bal = await ethers.provider.getBalance(me.address);
console.log(ethers.formatEther(bal), "ETH");`,
                                powershell: `const [me] = await ethers.getSigners();
const bal = await ethers.provider.getBalance(me.address);
console.log(ethers.formatEther(bal), "ETH");`,
                                result: "Shows your current ETH balance"
                            },
                            {
                                task: "Send ETH to another account",
                                bash: `const [me, friend] = await ethers.getSigners();
await me.sendTransaction({
  to: friend.address,
  value: ethers.parseEther("0.5")
});`,
                                powershell: `const [me, friend] = await ethers.getSigners();
await me.sendTransaction({
  to: friend.address,
  value: ethers.parseEther("0.5")
});`,
                                result: "Transaction sent! Check balances again to see the change."
                            }
                        ]
                    }
                }
            ]
        },
        {
            id: 3,
            title: "Smart Contract Deployment",
            duration: "30 min",
            description: "Deploy your own contracts and interact with them",
            color: "#8b5cf6",
            steps: [
                {
                    title: "Create SimpleStorage Contract",
                    why: "Before deploying, you need to write the smart contract code. This is a simple contract that stores and retrieves a number.",
                    bash: `# The contract already exists in contracts/SimpleStorage.sol
# View it with:
cat contracts/SimpleStorage.sol`,
                    powershell: `# The contract already exists in contracts/SimpleStorage.sol
# View it with:
Get-Content contracts/SimpleStorage.sol`,
                    expectedOutput: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleStorage {
    uint256 private storedValue;
    address public owner;
    
    event ValueChanged(uint256 oldValue, uint256 newValue, address changedBy);
    
    constructor() {
        owner = msg.sender;
    }
    
    function set(uint256 _value) public {
        uint256 oldValue = storedValue;
        storedValue = _value;
        emit ValueChanged(oldValue, _value, msg.sender);
    }
    
    function get() public view returns (uint256) {
        return storedValue;
    }
}`,
                    explanation: "This contract has a private variable (storedValue), a public variable (owner), and two functions (set/get). The event logs every change.",
                    deepDive: {
                        title: "🔬 Understanding the Contract:",
                        points: [
                            {
                                icon: "📦",
                                label: "State Variables",
                                text: "storedValue and owner are stored permanently on the blockchain. Reading is free, writing costs gas."
                            },
                            {
                                icon: "🔧",
                                label: "Functions",
                                text: "set() modifies state (costs gas). get() only reads (free). Public functions can be called by anyone."
                            },
                            {
                                icon: "📡",
                                label: "Events",
                                text: "ValueChanged event creates a log entry on the blockchain. Apps listen to events to track what happened without storing everything in expensive contract storage."
                            },
                            {
                                icon: "👤",
                                label: "Constructor",
                                text: "Runs once when deployed. Sets msg.sender (the deployer) as owner. This pattern is common for access control."
                            },
                            {
                                icon: "🔒",
                                label: "Immutability",
                                text: "Once deployed, the code CANNOT be changed. If there's a bug, you must deploy a new contract. This is why testing is critical!"
                            }
                        ]
                    },
                    whyItMatters: "Smart contracts are the 'programs' that run on Ethereum. Understanding how they store data, emit events, and handle access control is fundamental to blockchain development."
                },
                {
                    title: "Compile Contracts",
                    why: "Solidity code must be compiled to EVM bytecode before deployment. This creates the ABI (interface) and bytecode.",
                    bash: "npx hardhat compile",
                    powershell: "npx hardhat compile",
                    expectedOutput: `Compiled 3 Solidity files successfully (evm target: paris).`,
                    explanation: "Check artifacts/contracts/ to see the compiled JSON files with ABI and bytecode.",
                    deepDive: {
                        title: "🔬 The Compilation Process:",
                        points: [
                            {
                                icon: "📝",
                                label: "Solidity → Bytecode",
                                text: "The Solidity compiler (solc) converts human-readable code into EVM bytecode - the machine code that runs on Ethereum."
                            },
                            {
                                icon: "🔌",
                                label: "ABI (Application Binary Interface)",
                                text: "The ABI is like an instruction manual. It tells your app how to call functions, what parameters they need, and what they return. Without the ABI, you can't interact with the contract!"
                            },
                            {
                                icon: "🎯",
                                label: "Artifacts Folder",
                                text: "artifacts/contracts/SimpleStorage.sol/SimpleStorage.json contains both ABI and bytecode. Your frontend imports this to interact with deployed contracts."
                            },
                            {
                                icon: "⚡",
                                label: "EVM Target",
                                text: "'paris' is the Ethereum hard fork version. Different versions have different opcodes (instructions). Hardhat uses the latest stable version."
                            }
                        ]
                    },
                    whyItMatters: "Compilation is the bridge between human code and machine code. The ABI is what makes blockchain apps possible - it's how your React app talks to Solidity contracts!"
                },
                {
                    title: "Deploy SimpleStorage Contract",
                    why: "Deployment is just a special transaction that creates a new contract on the blockchain.",
                    bash: "npx hardhat run scripts/cli-labs/3-deploy-contract.js --network localhost",
                    powershell: "npx hardhat run scripts/cli-labs/3-deploy-contract.js --network localhost",
                    expectedOutput: `--- Deploying Contract ---
Transaction Hash: 0x789def...
✓ Contract deployed!
Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3

--- Deployment Details ---
Gas Used: 463893
Deployment Cost: 0.000463893 ETH`,
                    explanation: "The contract now lives at that address forever. Anyone can interact with it using the ABI.",
                    deepDive: {
                        title: "🔬 What Happens During Deployment:",
                        points: [
                            {
                                icon: "📤",
                                label: "Special Transaction",
                                text: "Deployment is a transaction with NO 'to' address. The bytecode goes in the 'data' field. The EVM creates a new contract and assigns it an address."
                            },
                            {
                                icon: "🏠",
                                label: "Contract Address",
                                text: "The address is deterministic - calculated from your address + your nonce. Same deployer + same nonce = same address (on different chains)."
                            },
                            {
                                icon: "⛽",
                                label: "Gas Cost",
                                text: "Deployment is expensive! ~463k gas for SimpleStorage. Complex contracts like Uniswap cost millions of gas. That's why gas optimization matters."
                            },
                            {
                                icon: "💾",
                                label: "Permanent Storage",
                                text: "The contract's bytecode is stored on EVERY Ethereum node worldwide. That's ~8,600 computers storing your code forever!"
                            },
                            {
                                icon: "🔄",
                                label: "Constructor Execution",
                                text: "The constructor runs once during deployment. It set owner = msg.sender (you). After deployment, the constructor code is discarded."
                            }
                        ]
                    },
                    whyItMatters: "Deployment is irreversible and expensive. In production, you'd deploy to a testnet first, audit the code, then deploy to mainnet. One bug = permanent vulnerability!"
                },
                {
                    title: "Open Hardhat Console",
                    why: "The console gives you an interactive JavaScript environment connected to your blockchain. Perfect for testing!",
                    bash: "npx hardhat console --network localhost",
                    powershell: "npx hardhat console --network localhost",
                    expectedOutput: `Welcome to Node.js v20.18.1.
Type ".help" for more information.
>`,
                    explanation: "You're now in an interactive JavaScript REPL connected to your blockchain. Ethers.js is pre-loaded!",
                    tryNext: {
                        title: "🎯 Deploy and Interact in Console:",
                        tasks: [
                            {
                                task: "Deploy SimpleStorage contract",
                                bash: `const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
const contract = await SimpleStorage.deploy();
await contract.waitForDeployment();
const address = await contract.getAddress();
console.log("Contract deployed at:", address);`,
                                powershell: `const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
const contract = await SimpleStorage.deploy();
await contract.waitForDeployment();
const address = await contract.getAddress();
console.log("Contract deployed at:", address);`,
                                result: "Contract is now live on the blockchain! Copy the address for next steps."
                            },
                            {
                                task: "Set a value in the contract",
                                bash: `await contract.set(42);
console.log("Value set to 42!");`,
                                powershell: `await contract.set(42);
console.log("Value set to 42!");`,
                                result: "This creates a transaction that changes the contract's state. Costs gas!"
                            },
                            {
                                task: "Read the value back (free!)",
                                bash: `const value = await contract.get();
console.log("Stored value:", value.toString());`,
                                powershell: `const value = await contract.get();
console.log("Stored value:", value.toString());`,
                                result: "Returns 42. Reading is free - no transaction needed!"
                            },
                            {
                                task: "Check who owns the contract",
                                bash: `const owner = await contract.owner();
const [me] = await ethers.getSigners();
console.log("Owner:", owner);
console.log("Am I the owner?", owner === me.address);`,
                                powershell: `const owner = await contract.owner();
const [me] = await ethers.getSigners();
console.log("Owner:", owner);
console.log("Am I the owner?", owner === me.address);`,
                                result: "Should return true - you deployed it, so you own it!"
                            }
                        ]
                    }
                },
                {
                    title: "Listen for Contract Events",
                    why: "Events are how smart contracts communicate what happened. They're stored on-chain and can be queried anytime.",
                    bash: `# In console (after deploying and using the contract)
const filter = contract.filters.ValueChanged();
const events = await contract.queryFilter(filter);
events.forEach(e => {
  console.log("Old:", e.args.oldValue.toString());
  console.log("New:", e.args.newValue.toString());
  console.log("Changed by:", e.args.changedBy);
});`,
                    powershell: `# In console (after deploying and using the contract)
const filter = contract.filters.ValueChanged();
const events = await contract.queryFilter(filter);
events.forEach(e => {
  console.log("Old:", e.args.oldValue.toString());
  console.log("New:", e.args.newValue.toString());
  console.log("Changed by:", e.args.changedBy);
});`,
                    expectedOutput: `Old: 0
New: 42
Changed by: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`,
                    explanation: "Events are like a permanent log. Apps use them to track what happened in contracts without storing everything in expensive contract storage.",
                    tryNext: {
                        title: "🎯 Practice Event Queries:",
                        tasks: [
                            {
                                task: "Filter events by a specific address",
                                bash: `const [me] = await ethers.getSigners();
const filter = contract.filters.ValueChanged(null, null, me.address);
const myEvents = await contract.queryFilter(filter);
console.log("Changes I made:", myEvents.length);`,
                                powershell: `const [me] = await ethers.getSigners();
const filter = contract.filters.ValueChanged(null, null, me.address);
const myEvents = await contract.queryFilter(filter);
console.log("Changes I made:", myEvents.length);`,
                                result: "Shows only the ValueChanged events where YOU were the one who changed it"
                            }
                        ]
                    }
                }
            ]
        },
        {
            id: 4,
            title: "Blockchain Data Queries",
            duration: "25 min",
            description: "Query blocks, transactions, balances, and gas prices",
            color: "#ec4899",
            steps: [
                {
                    title: "Run Data Query Script",
                    why: "Learn how to extract information from the blockchain - essential for building apps and analyzing network activity.",
                    bash: "npx hardhat run scripts/cli-labs/4-query-data.js --network localhost",
                    powershell: "npx hardhat run scripts/cli-labs/4-query-data.js --network localhost",
                    expectedOutput: `--- Network Information ---
Chain ID: 31337
Latest Block: 5

--- Gas Price Data ---
Gas Price: 1.5 Gwei

--- Recent Blocks ---
Block 1: 1 txs | 11:30:15 AM
Block 2: 2 txs | 11:30:27 AM
Block 3: 0 txs | 11:30:39 AM

--- Account Analysis ---
Balance: 9998.5 ETH
Transaction Count (Nonce): 2`,
                    explanation: "Nonce = number of transactions sent. Each transaction increments it. This prevents replay attacks.",
                    deepDive: {
                        title: "🔬 Blockchain Data Structure:",
                        points: [
                            {
                                icon: "🆔",
                                label: "Chain ID",
                                text: "31337 is Hardhat's default. Mainnet = 1, Sepolia testnet = 11155111. Chain ID prevents replay attacks across different networks."
                            },
                            {
                                icon: "📊",
                                label: "Block Height",
                                text: "Block number = total blocks since genesis. Ethereum mainnet is at ~20 million blocks. Each block is ~12 seconds, so you can calculate the blockchain's age!"
                            },
                            {
                                icon: "⛽",
                                label: "Gas Price (Gwei)",
                                text: "1 Gwei = 0.000000001 ETH. Gas prices fluctuate based on network demand. High demand = high prices. Check etherscan.io/gastracker for real-time mainnet prices."
                            },
                            {
                                icon: "🔢",
                                label: "Nonce Tracking",
                                text: "Your nonce = how many transactions you've sent. If you send tx with nonce 5 before nonce 4 confirms, it will wait. Nonces must be sequential!"
                            },
                            {
                                icon: "💾",
                                label: "State vs History",
                                text: "Ethereum stores current state (balances, contract storage) and full history (all transactions, all blocks). Archive nodes store everything; full nodes prune old data."
                            }
                        ]
                    },
                    whyItMatters: "Querying blockchain data is how you build dashboards, wallets, and analytics tools. Understanding what data is available and how to get it efficiently is key to app performance!"
                },
                {
                    title: "Query Specific Block",
                    why: "Blocks are the fundamental unit of blockchain. Understanding their structure is key.",
                    bash: `# In console
const block = await ethers.provider.getBlock(1);
console.log(block);`,
                    powershell: `# In console
const block = await ethers.provider.getBlock(1);
console.log(block);`,
                    expectedOutput: `{
  hash: '0x...',
  parentHash: '0x...',
  number: 1,
  timestamp: 1700000000,
  transactions: ['0x...'],
  gasUsed: 21000n,
  ...
}`,
                    explanation: "Every block contains: hash (fingerprint), parentHash (link to previous), transactions, and metadata.",
                    tryNext: {
                        title: "🎯 Explore Block Data:",
                        tasks: [
                            {
                                task: "Get a transaction from the block",
                                bash: `const block = await ethers.provider.getBlock(1);
const txHash = block.transactions[0];
const tx = await ethers.provider.getTransaction(txHash);
console.log("From:", tx.from);
console.log("To:", tx.to);
console.log("Value:", ethers.formatEther(tx.value), "ETH");`,
                                powershell: `const block = await ethers.provider.getBlock(1);
const txHash = block.transactions[0];
const tx = await ethers.provider.getTransaction(txHash);
console.log("From:", tx.from);
console.log("To:", tx.to);
console.log("Value:", ethers.formatEther(tx.value), "ETH");`,
                                result: "Shows details of the first transaction in block 1"
                            },
                            {
                                task: "Calculate time between blocks",
                                bash: `const block1 = await ethers.provider.getBlock(1);
const block2 = await ethers.provider.getBlock(2);
const timeDiff = block2.timestamp - block1.timestamp;
console.log("Time between blocks:", timeDiff, "seconds");`,
                                powershell: `const block1 = await ethers.provider.getBlock(1);
const block2 = await ethers.provider.getBlock(2);
const timeDiff = block2.timestamp - block1.timestamp;
console.log("Time between blocks:", timeDiff, "seconds");`,
                                result: "On Hardhat, blocks are instant. On real Ethereum, ~12 seconds."
                            }
                        ]
                    }
                }
            ]
        },
        {
            id: 5,
            title: "PoS Validator Simulation",
            duration: "30 min",
            description: "Simulate Ethereum's validator selection algorithm",
            color: "#f59e0b",
            steps: [
                {
                    title: "Stake ETH to Become a Validator",
                    why: "Before running the simulation, you need validators in the pool. Staking locks your ETH as collateral.",
                    bash: `# In console
const contract = await ethers.getContractAt("PoSSimulator", "0xe7f1...");
await contract.stake({ value: ethers.parseEther("2.0") });`,
                    powershell: `# In console
const contract = await ethers.getContractAt("PoSSimulator", "0xe7f1...");
await contract.stake({ value: ethers.parseEther("2.0") });`,
                    expectedOutput: `Transaction sent, waiting for confirmation...
✓ Staked 2.0 ETH`,
                    explanation: "You're now a validator! Your 2 ETH is locked, and you'll earn rewards over time."
                },
                {
                    title: "Run Validator Selection Simulation",
                    why: "See how Ethereum's weighted random selection works. Higher stake = higher probability of being chosen.",
                    bash: "npx hardhat run scripts/cli-labs/5-validator-simulation.js --network localhost",
                    powershell: "npx hardhat run scripts/cli-labs/5-validator-simulation.js --network localhost",
                    expectedOutput: `--- Validator Pool ---
1. 0xf39F...
   Stake: 2.0 ETH
   Selection Probability: 40.00%
2. 0x7099...
   Stake: 3.0 ETH
   Selection Probability: 60.00%

--- Running 100 Block Proposals ---
--- Selection Results ---
0xf39F...
   Expected: 40.0% | Actual: 38%
   Selected: 38 times
0x7099...
   Expected: 60.0% | Actual: 62%
   Selected: 62 times`,
                    explanation: "Over 100 selections, the results match the stake proportions! This is how Ethereum achieves fair, energy-efficient consensus.",
                    deepDive: {
                        title: "🔬 How Validator Selection Works:",
                        points: [
                            {
                                icon: "🎲",
                                label: "Weighted Randomness",
                                text: "It's NOT purely random! If you stake 32 ETH and someone else stakes 64 ETH, they're twice as likely to be selected. But randomness ensures even small stakers get a chance."
                            },
                            {
                                icon: "🔐",
                                label: "RANDAO (Random Number)",
                                text: "Ethereum uses RANDAO - validators contribute randomness each epoch. No single validator can predict or manipulate who gets selected next."
                            },
                            {
                                icon: "⏰",
                                label: "Epochs and Slots",
                                text: "Real Ethereum: 1 epoch = 32 slots, 1 slot = 12 seconds. Validators are assigned to slots in advance. Our simulation simplifies this to show the core concept."
                            },
                            {
                                icon: "💰",
                                label: "Economic Security",
                                text: "To control 51% of block proposals, you need 51% of ALL staked ETH. That's ~$51 billion. And you'd lose it all if caught (slashing)!"
                            },
                            {
                                icon: "🌱",
                                label: "Energy Efficiency",
                                text: "Unlike Proof-of-Work (Bitcoin), no energy-intensive mining. Selection is pure math. This cut Ethereum's energy use by 99.95%!"
                            }
                        ]
                    },
                    whyItMatters: "This is THE innovation that makes Ethereum sustainable. Understanding PoS selection is understanding how modern blockchains achieve consensus without destroying the planet!"
                }
            ]
        },
        {
            id: 6,
            title: "Collaborative Network",
            duration: "45 min",
            description: "Connect to instructor's blockchain and collaborate",
            color: "#ef4444",
            steps: [
                {
                    title: "Configure Connection to Instructor",
                    why: "Instead of running your own node, connect to the instructor's shared blockchain. Everyone sees the same state!",
                    bash: `# Edit hardhat.config.js, add:
networks: {
  classroom: {
    url: "http://INSTRUCTOR_IP:8545",
    chainId: 31337
  }
}`,
                    powershell: `# Edit hardhat.config.js, add:
networks: {
  classroom: {
    url: "http://INSTRUCTOR_IP:8545",
    chainId: 31337
  }
}`,
                    expectedOutput: `(No output - just edit the file)`,
                    explanation: "Replace INSTRUCTOR_IP with the actual IP address shared by your instructor.",
                    deepDive: {
                        title: "🔬 How Shared Networks Work:",
                        points: [
                            {
                                icon: "🌐",
                                label: "RPC Endpoint",
                                text: "The URL points to the instructor's Hardhat node. Your computer sends JSON-RPC requests over HTTP. The instructor's node processes them and returns results."
                            },
                            {
                                icon: "🔗",
                                label: "Shared State",
                                text: "Everyone connects to the SAME blockchain. When you send a transaction, all classmates see it immediately. When someone deploys a contract, everyone can interact with it."
                            },
                            {
                                icon: "🆔",
                                label: "Chain ID Verification",
                                text: "Your wallet checks the chain ID before signing. This prevents you from accidentally sending a mainnet transaction on a testnet (or vice versa)."
                            },
                            {
                                icon: "👥",
                                label: "Multi-User Coordination",
                                text: "Multiple people can send transactions simultaneously. The node orders them by gas price and nonce. This is exactly how public Ethereum works!"
                            },
                            {
                                icon: "🔐",
                                label: "Your Keys, Your Coins",
                                text: "Even though you're connected to instructor's node, YOUR private keys stay on YOUR computer. The node never sees them - only signed transactions."
                            }
                        ]
                    },
                    whyItMatters: "This simulates the real Ethereum experience. On mainnet, you connect to Infura/Alchemy nodes the same way. Understanding client-server architecture is crucial for decentralized apps!"
                },
                {
                    title: "Send Transaction to Classmate",
                    why: "Practice sending real transactions on a shared network. Your classmates will see this!",
                    bash: `# In console connected to classroom network
const [me] = await ethers.getSigners();
await me.sendTransaction({
  to: "0xCLASSMATE_ADDRESS",
  value: ethers.parseEther("0.5")
});`,
                    powershell: `# In console connected to classroom network
const [me] = await ethers.getSigners();
await me.sendTransaction({
  to: "0xCLASSMATE_ADDRESS",
  value: ethers.parseEther("0.5")
});`,
                    expectedOutput: `{
  hash: '0xabc...',
  from: '0xYourAddress...',
  to: '0xClassmateAddress...',
  value: 500000000000000000n
}`,
                    explanation: "Your classmate's balance just increased! Check the instructor dashboard to see all transactions."
                }
            ]
        }
    ];

    const selectedLabData = labs.find(l => l.id === selectedLab);

    return (
        <div className="cli-labs-view" style={{maxWidth: '1200px', margin: '0 auto'}}>
            <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                padding: '2rem',
                borderRadius: '1rem',
                marginBottom: '2rem',
                color: 'white'
            }}>
                <h2 style={{margin: 0, fontSize: '2rem'}}>🖥️ Command Line Labs</h2>
                <p style={{margin: '0.75rem 0 0 0', fontSize: '1.1rem', opacity: 0.9}}>
                    Follow along step-by-step. Copy commands, run them, and learn what happens!
                </p>
            </div>

            {/* OS Selector */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem',
                justifyContent: 'center'
            }}>
                <button
                    onClick={() => setOS('bash')}
                    style={{
                        padding: '0.75rem 2rem',
                        background: os === 'bash' ? '#10b981' : '#334155',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                    }}
                >
                    🐧 Linux/Mac/Bash
                </button>
                <button
                    onClick={() => setOS('powershell')}
                    style={{
                        padding: '0.75rem 2rem',
                        background: os === 'powershell' ? '#3b82f6' : '#334155',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                    }}
                >
                    🪟 Windows/PowerShell
                </button>
            </div>

            {!selectedLab ? (
                /* Lab Selection Grid */
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem'}}>
                    {labs.map(lab => (
                        <div
                            key={lab.id}
                            onClick={() => setSelectedLab(lab.id)}
                            style={{
                                background: '#1e293b',
                                border: `3px solid ${lab.color}`,
                                borderRadius: '1rem',
                                padding: '1.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-8px)';
                                e.currentTarget.style.boxShadow = `0 12px 24px ${lab.color}40`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                background: lab.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                color: 'white',
                                marginBottom: '1rem'
                            }}>
                                {lab.id}
                            </div>
                            <h3 style={{color: '#f8fafc', margin: '0 0 0.5rem 0', fontSize: '1.2rem'}}>{lab.title}</h3>
                            <p style={{color: '#cbd5e1', fontSize: '0.95rem', marginBottom: '1rem'}}>{lab.description}</p>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '999px',
                                    fontSize: '0.85rem',
                                    color: '#94a3b8'
                                }}>
                                    ⏱️ {lab.duration}
                                </span>
                                <span style={{color: lab.color, fontWeight: 'bold'}}>
                                    Start Lab →
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Lab Detail View */
                <div>
                    <button
                        onClick={() => setSelectedLab(null)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#334155',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            marginBottom: '1.5rem',
                            fontWeight: 'bold'
                        }}
                    >
                        ← Back to Lab List
                    </button>

                    <div style={{
                        background: `linear-gradient(135deg, ${selectedLabData.color}40, ${selectedLabData.color}20)`,
                        border: `2px solid ${selectedLabData.color}`,
                        borderRadius: '1rem',
                        padding: '2rem',
                        marginBottom: '2rem'
                    }}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem'}}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: selectedLabData.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem',
                                fontWeight: 'bold',
                                color: 'white'
                            }}>
                                {selectedLabData.id}
                            </div>
                            <div>
                                <h2 style={{margin: 0, color: '#f8fafc', fontSize: '1.8rem'}}>{selectedLabData.title}</h2>
                                <p style={{margin: '0.5rem 0 0 0', color: '#cbd5e1', fontSize: '1.05rem'}}>{selectedLabData.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Steps */}
                    <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
                        {selectedLabData.steps.map((step, idx) => {
                            const stepKey = `${selectedLab}-${idx}`;
                            const isCompleted = completedSteps[stepKey];

                            return (
                                <div key={idx} style={{
                                    background: '#1e293b',
                                    border: `2px solid ${isCompleted ? '#22c55e' : '#334155'}`,
                                    borderRadius: '1rem',
                                    padding: '2rem',
                                    position: 'relative'
                                }}>
                                    {/* Step Header */}
                                    <div style={{display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1.5rem'}}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: isCompleted ? '#22c55e' : selectedLabData.color,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.2rem',
                                            fontWeight: 'bold',
                                            color: 'white',
                                            flexShrink: 0
                                        }}>
                                            {isCompleted ? '✓' : idx + 1}
                                        </div>
                                        <div style={{flex: 1}}>
                                            <h3 style={{margin: 0, color: '#f8fafc', fontSize: '1.3rem'}}>{step.title}</h3>
                                        </div>
                                    </div>

                                    {/* Why Section */}
                                    <div style={{
                                        background: 'rgba(59,130,246,0.1)',
                                        padding: '1rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid rgba(59,130,246,0.3)',
                                        marginBottom: '1.5rem'
                                    }}>
                                        <div style={{color: '#93c5fd', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem'}}>
                                            💡 WHY ARE WE DOING THIS?
                                        </div>
                                        <p style={{color: '#cbd5e1', margin: 0, lineHeight: '1.6'}}>{step.why}</p>
                                    </div>

                                    {/* Command */}
                                    <div style={{marginBottom: '1.5rem'}}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '0.75rem'
                                        }}>
                                            <div style={{color: '#86efac', fontWeight: 'bold', fontSize: '0.9rem'}}>
                                                📝 COMMAND TO RUN:
                                            </div>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(os === 'bash' ? step.bash : step.powershell);
                                                    alert('Copied to clipboard!');
                                                }}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    background: '#3b82f6',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '0.25rem',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                📋 Copy Command
                                            </button>
                                        </div>
                                        <pre style={{
                                            background: '#0f172a',
                                            padding: '1.5rem',
                                            borderRadius: '0.5rem',
                                            overflow: 'auto',
                                            margin: 0,
                                            border: '1px solid #334155'
                                        }}>
                                            <code style={{color: '#86efac', fontFamily: 'monospace', fontSize: '0.95rem', whiteSpace: 'pre-wrap'}}>
                                                {os === 'bash' ? step.bash : step.powershell}
                                            </code>
                                        </pre>
                                    </div>

                                    {/* Expected Output */}
                                    <div style={{marginBottom: '1.5rem'}}>
                                        <div style={{color: '#f9a8d4', fontWeight: 'bold', marginBottom: '0.75rem', fontSize: '0.9rem'}}>
                                            📺 EXPECTED OUTPUT:
                                        </div>
                                        <pre style={{
                                            background: '#0f172a',
                                            padding: '1.5rem',
                                            borderRadius: '0.5rem',
                                            overflow: 'auto',
                                            margin: 0,
                                            border: '1px solid #334155'
                                        }}>
                                            <code style={{color: '#cbd5e1', fontFamily: 'monospace', fontSize: '0.9rem', whiteSpace: 'pre-wrap'}}>
                                                {step.expectedOutput}
                                            </code>
                                        </pre>
                                    </div>

                                    {/* Explanation */}
                                    <div style={{
                                        background: 'rgba(139,92,246,0.1)',
                                        padding: '1rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid rgba(139,92,246,0.3)',
                                        marginBottom: '1rem'
                                    }}>
                                        <div style={{color: '#a78bfa', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem'}}>
                                            🎓 WHAT JUST HAPPENED?
                                        </div>
                                        <p style={{color: '#e2e8f0', margin: 0, lineHeight: '1.6'}}>{step.explanation}</p>
                                    </div>

                                    {/* Deep Dive Section */}
                                    {step.deepDive && (
                                        <div style={{
                                            background: 'rgba(59,130,246,0.1)',
                                            padding: '1.5rem',
                                            borderRadius: '0.75rem',
                                            border: '2px solid rgba(59,130,246,0.4)',
                                            marginBottom: '1rem'
                                        }}>
                                            <h5 style={{color: '#93c5fd', marginTop: 0, marginBottom: '1rem', fontSize: '1.05rem'}}>
                                                {step.deepDive.title}
                                            </h5>
                                            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                                                {step.deepDive.points.map((point, pIdx) => (
                                                    <div key={pIdx} style={{display: 'flex', gap: '1rem', alignItems: 'start'}}>
                                                        <div style={{
                                                            fontSize: '1.5rem',
                                                            flexShrink: 0,
                                                            width: '35px',
                                                            textAlign: 'center'
                                                        }}>
                                                            {point.icon}
                                                        </div>
                                                        <div style={{flex: 1}}>
                                                            <div style={{
                                                                fontWeight: 'bold',
                                                                color: '#93c5fd',
                                                                marginBottom: '0.25rem',
                                                                fontSize: '0.95rem'
                                                            }}>
                                                                {point.label}
                                                            </div>
                                                            <div style={{color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6'}}>
                                                                {point.text}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Why It Matters */}
                                    {step.whyItMatters && (
                                        <div style={{
                                            background: 'rgba(245,158,11,0.1)',
                                            padding: '1rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid rgba(245,158,11,0.3)',
                                            marginBottom: '1rem'
                                        }}>
                                            <div style={{color: '#fbbf24', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem'}}>
                                                ⭐ WHY THIS MATTERS:
                                            </div>
                                            <p style={{color: '#e2e8f0', margin: 0, lineHeight: '1.6', fontSize: '0.95rem'}}>
                                                {step.whyItMatters}
                                            </p>
                                        </div>
                                    )}

                                    {/* Try Next Section */}
                                    {step.tryNext && (
                                        <div style={{
                                            background: 'rgba(16,185,129,0.1)',
                                            padding: '1.5rem',
                                            borderRadius: '0.75rem',
                                            border: '2px solid rgba(16,185,129,0.4)',
                                            marginBottom: '1.5rem'
                                        }}>
                                            <h4 style={{color: '#86efac', marginTop: 0, marginBottom: '1rem'}}>
                                                {step.tryNext.title}
                                            </h4>
                                            <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                                                {step.tryNext.tasks.map((task, tIdx) => (
                                                    <div key={tIdx}>
                                                        <div style={{
                                                            color: '#cbd5e1',
                                                            fontWeight: 'bold',
                                                            marginBottom: '0.75rem',
                                                            fontSize: '1rem'
                                                        }}>
                                                            {tIdx + 1}. {task.task}
                                                        </div>
                                                        <div style={{position: 'relative'}}>
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(os === 'bash' ? task.bash : task.powershell);
                                                                    alert('Copied to clipboard!');
                                                                }}
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '0.5rem',
                                                                    right: '0.5rem',
                                                                    padding: '0.5rem 1rem',
                                                                    background: '#10b981',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '0.25rem',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.85rem',
                                                                    fontWeight: 'bold',
                                                                    zIndex: 1
                                                                }}
                                                            >
                                                                📋 Copy
                                                            </button>
                                                            <pre style={{
                                                                background: '#0f172a',
                                                                padding: '1rem',
                                                                paddingRight: '6rem',
                                                                borderRadius: '0.5rem',
                                                                overflow: 'auto',
                                                                margin: '0 0 0.75rem 0',
                                                                border: '1px solid #334155'
                                                            }}>
                                                                <code style={{color: '#86efac', fontFamily: 'monospace', fontSize: '0.9rem', whiteSpace: 'pre-wrap'}}>
                                                                    {os === 'bash' ? task.bash : task.powershell}
                                                                </code>
                                                            </pre>
                                                        </div>
                                                        <div style={{
                                                            padding: '0.75rem',
                                                            background: 'rgba(34,197,94,0.2)',
                                                            borderRadius: '0.5rem',
                                                            fontSize: '0.9rem',
                                                            color: '#cbd5e1'
                                                        }}>
                                                            <strong style={{color: '#86efac'}}>Expected Result:</strong> {task.result}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Mark Complete */}
                                    <button
                                        onClick={() => {
                                            setCompletedSteps({...completedSteps, [stepKey]: !isCompleted});
                                        }}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            background: isCompleted ? '#64748b' : '#22c55e',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        {isCompleted ? '✓ Completed' : 'Mark as Complete'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Next Lab Button */}
                    {selectedLab < labs.length && (
                        <div style={{marginTop: '2rem', textAlign: 'center'}}>
                            <button
                                onClick={() => setSelectedLab(selectedLab + 1)}
                                style={{
                                    padding: '1.25rem 2.5rem',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.75rem',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '1.1rem',
                                    boxShadow: '0 4px 12px rgba(139,92,246,0.4)'
                                }}
                            >
                                Next Lab: {labs[selectedLab]?.title} →
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Codespaces CTA */}
            {!selectedLab && (
                <>
                    <div style={{
                        marginTop: '2rem',
                        padding: '2rem',
                        background: 'linear-gradient(135deg, #2ea043 0%, #1f883d 100%)',
                        borderRadius: '1rem',
                        textAlign: 'center',
                        color: 'white',
                        boxShadow: '0 8px 24px rgba(46,160,67,0.3)'
                    }}>
                        <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🚀</div>
                        <h3 style={{margin: '0 0 1rem 0', fontSize: '1.8rem'}}>Ready to Start?</h3>
                        <p style={{fontSize: '1.1rem', marginBottom: '1.5rem', opacity: 0.95}}>
                            Get a full development environment with terminal in your browser - no installation required!
                        </p>
                        <a 
                            href="https://codespaces.new/alld0wnh1ll/ethereum-lab"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-block',
                                padding: '1.25rem 2.5rem',
                                background: 'white',
                                color: '#1f883d',
                                textDecoration: 'none',
                                borderRadius: '0.75rem',
                                fontWeight: 'bold',
                                fontSize: '1.2rem',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            🖥️ Open in GitHub Codespaces
                        </a>
                        <p style={{fontSize: '0.9rem', marginTop: '1rem', opacity: 0.9}}>
                            ✨ Free with GitHub Student Pack | Includes VS Code + Terminal + All Dependencies
                        </p>
                    </div>

                    <div style={{
                        marginTop: '2rem',
                        padding: '1.5rem',
                        background: 'rgba(59,130,246,0.15)',
                        borderRadius: '1rem',
                        border: '2px solid rgba(59,130,246,0.4)',
                        textAlign: 'center'
                    }}>
                        <h3 style={{color: '#93c5fd', marginTop: 0}}>📚 Full Documentation</h3>
                        <p style={{color: '#cbd5e1', marginBottom: '1rem'}}>
                            For complete documentation with all 7 labs, testing guides, and advanced exercises:
                        </p>
                        <a 
                            href="https://github.com/alld0wnh1ll/ethereum-lab/blob/main/CLI_LABS.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-block',
                                padding: '1rem 2rem',
                                background: '#3b82f6',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '0.5rem',
                                fontWeight: 'bold',
                                fontSize: '1.05rem'
                            }}
                        >
                            📖 View CLI_LABS.md on GitHub
                        </a>
                    </div>
                </>
            )}
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
  
  const [view, setView] = useState(isInstructor ? 'instructor' : 'intro'); // intro -> concepts -> explore -> learn -> sim -> live -> cli | instructor
  
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
  const [myStake, setMyStake] = useState({ 
    amount: '0', 
    reward: '0',
    slashCount: 0,
    blocksProposed: 0,
    missedAttestations: 0,
    unbondingTime: 0,
    minStakeDuration: 0,
    hasAttestedThisEpoch: false
  })
  
  // Enhanced PoS State
  const [currentEpoch, setCurrentEpoch] = useState(1)
  const [timeUntilNextEpoch, setTimeUntilNextEpoch] = useState(0)
  const [currentAPY, setCurrentAPY] = useState(5)
  const [withdrawalRequested, setWithdrawalRequested] = useState(false)

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
    live: true, // Always unlocked - students can go straight to live network
    cli: true // Always unlocked - CLI labs
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
        
        // Get comprehensive validator stats
        const [stats, epoch, epochTime, apy, hasAttested, minDuration, unbonding] = await Promise.all([
          contract.getValidatorStats(wallet.address),
          contract.currentEpoch(),
          contract.getTimeUntilNextEpoch(),
          contract.getCurrentAPY(),
          contract.hasAttestedThisEpoch(wallet.address),
          contract.getMinStakeDurationRemaining(wallet.address),
          contract.withdrawalRequestTime(wallet.address)
        ])
        
        setMyStake({
          amount: ethers.formatEther(stats.stakeAmount),
          reward: ethers.formatEther(stats.rewardAmount),
          slashCount: Number(stats.slashes),
          blocksProposed: Number(stats.blocks),
          missedAttestations: Number(stats.attestations),
          unbondingTime: Number(stats.unbondingTime),
          minStakeDuration: Number(minDuration),
          hasAttestedThisEpoch: hasAttested
        })
        
        setCurrentEpoch(Number(epoch))
        setTimeUntilNextEpoch(Number(epochTime))
        setCurrentAPY(Number(apy) / 100) // Convert from 500 to 5.00
        setWithdrawalRequested(Number(unbonding) > 0)
        
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
                    <button className={`roadmap-step ${view === 'cli' ? 'active' : ''} ${!unlocks.cli ? 'locked' : ''}`} onClick={() => requestView('cli')}>
                        <span>7</span> CLI Labs
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

                        {/* Staking Section - Enhanced */}
                        <section className="card" id="stake-section">
                            <h3>🏦 Proof of Stake - Become a Validator</h3>
                            <p style={{fontSize: '14px', color: '#cbd5e1', marginBottom: '15px'}}>
                                Stake your ETH to participate in block validation and earn rewards!
                            </p>
                            
                            {/* Network Stats Bar */}
                            <div style={{
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(3, 1fr)', 
                                gap: '10px', 
                                marginBottom: '15px',
                                padding: '12px',
                                background: 'rgba(139, 92, 246, 0.15)',
                                borderRadius: '8px',
                                border: '1px solid rgba(139, 92, 246, 0.3)'
                            }}>
                                <div style={{textAlign: 'center'}}>
                                    <div style={{fontSize: '0.75rem', color: '#a78bfa'}}>Current APY</div>
                                    <div style={{fontSize: '1.1rem', fontWeight: 'bold', color: '#fbbf24'}}>{currentAPY.toFixed(2)}%</div>
                                </div>
                                <div style={{textAlign: 'center'}}>
                                    <div style={{fontSize: '0.75rem', color: '#a78bfa'}}>Epoch</div>
                                    <div style={{fontSize: '1.1rem', fontWeight: 'bold', color: '#22d3ee'}}>{currentEpoch}</div>
                                </div>
                                <div style={{textAlign: 'center'}}>
                                    <div style={{fontSize: '0.75rem', color: '#a78bfa'}}>Next Epoch</div>
                                    <div style={{fontSize: '1.1rem', fontWeight: 'bold', color: '#34d399'}}>{timeUntilNextEpoch}s</div>
                                </div>
                            </div>
                            
                            <div style={{background: 'rgba(59,130,246,0.15)', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid rgba(59,130,246,0.3)'}}>
                                <p style={{fontSize: '13px', marginBottom: '10px', color: '#e2e8f0'}}>
                                    <strong style={{color: '#93c5fd'}}>How it works:</strong>
                                </p>
                                <ul style={{fontSize: '12px', paddingLeft: '20px', margin: 0, color: '#cbd5e1'}}>
                                    <li>Minimum stake: 1 ETH | Unbonding: 60 seconds</li>
                                    <li>Rewards decrease as more validators join (dilution)</li>
                                    <li>Must attest each epoch or face small penalties</li>
                                    <li>Misbehavior = slashing (5% stake penalty)</li>
                                </ul>
                            </div>
                            
                            {/* Validator Stats (if staking) */}
                            {parseFloat(myStake.amount) > 0 && (
                                <div style={{
                                    background: 'rgba(34, 211, 238, 0.1)',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    marginBottom: '15px',
                                    border: '1px solid rgba(34, 211, 238, 0.3)'
                                }}>
                                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px'}}>
                                        <div>
                                            <div style={{fontSize: '0.75rem', color: '#94a3b8'}}>Your Stake</div>
                                            <div style={{fontSize: '1.1rem', fontWeight: 'bold', color: '#a78bfa'}}>
                                                {parseFloat(myStake.amount).toFixed(4)} ETH
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{fontSize: '0.75rem', color: '#94a3b8'}}>Pending Rewards</div>
                                            <div style={{fontSize: '1.1rem', fontWeight: 'bold', color: '#34d399'}}>
                                                +{parseFloat(myStake.reward).toFixed(6)} ETH
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{fontSize: '0.75rem', color: '#94a3b8'}}>Blocks Proposed</div>
                                            <div style={{fontSize: '1.1rem', fontWeight: 'bold', color: '#8b5cf6'}}>
                                                {myStake.blocksProposed}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{fontSize: '0.75rem', color: '#94a3b8'}}>Slashes</div>
                                            <div style={{fontSize: '1.1rem', fontWeight: 'bold', color: myStake.slashCount > 0 ? '#ef4444' : '#64748b'}}>
                                                {myStake.slashCount}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Attestation Status */}
                                    <div style={{
                                        marginTop: '12px',
                                        padding: '10px',
                                        background: myStake.hasAttestedThisEpoch ? 'rgba(34, 197, 94, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{fontSize: '0.85rem', color: myStake.hasAttestedThisEpoch ? '#34d399' : '#fbbf24'}}>
                                            {myStake.hasAttestedThisEpoch ? '✅ Attested this epoch' : '⚠️ Attestation needed!'}
                                        </span>
                                        {!myStake.hasAttestedThisEpoch && (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        setStatusMsg('📝 Submitting attestation...');
                                                        const contract = new ethers.Contract(posAddress, PoSABI, wallet.signer);
                                                        const tx = await contract.attest();
                                                        await tx.wait();
                                                        setStatusMsg('✅ Attestation submitted!');
                                                        setTimeout(() => setStatusMsg(''), 3000);
                                                    } catch (e) {
                                                        setStatusMsg('❌ Attestation failed: ' + (e.reason || e.message));
                                                    }
                                                }}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#fbbf24',
                                                    color: '#1e293b',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                📝 Attest Now
                                            </button>
                                        )}
                                    </div>
                                    
                                    {/* Unbonding Timer */}
                                    {withdrawalRequested && myStake.unbondingTime > 0 && myStake.unbondingTime < 9999999999 && (
                                        <div style={{
                                            marginTop: '12px',
                                            padding: '10px',
                                            background: 'rgba(59, 130, 246, 0.2)',
                                            borderRadius: '6px',
                                            textAlign: 'center'
                                        }}>
                                            <span style={{fontSize: '0.85rem', color: '#93c5fd'}}>
                                                ⏳ Unbonding: {myStake.unbondingTime} seconds remaining
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                            
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
                                {/* Two-Step Withdrawal Process */}
                                {!withdrawalRequested ? (
                                    <button 
                                        onClick={async () => {
                                            if (!posAddress || !wallet.signer) return setStatusMsg("Connect wallet first");
                                            if (parseFloat(myStake.amount) === 0) return setStatusMsg("No stake to withdraw");
                                            
                                            // Check minimum stake duration
                                            if (myStake.minStakeDuration > 0) {
                                                return setStatusMsg(`⏳ Must wait ${myStake.minStakeDuration}s more (min stake duration)`);
                                            }
                                            
                                            try {
                                                setStatusMsg("📝 Requesting withdrawal (starts 60s unbonding)...");
                                                const contract = new ethers.Contract(posAddress, PoSABI, wallet.signer);
                                                const tx = await contract.requestWithdrawal();
                                                await tx.wait();
                                                setStatusMsg("✅ Withdrawal requested! Wait 60 seconds to complete.");
                                                setWithdrawalRequested(true);
                                                syncBlockchainData();
                                            } catch (e) {
                                                const reason = e.reason || e.message || "Unknown error";
                                                setStatusMsg("❌ Request failed: " + reason);
                                            }
                                        }}
                                        disabled={parseFloat(myStake.amount) === 0}
                                        style={{
                                            padding: '1rem',
                                            background: parseFloat(myStake.amount) === 0 ? '#374151' : 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            fontSize: '1rem',
                                            fontWeight: 'bold',
                                            cursor: parseFloat(myStake.amount) === 0 ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        ⏳ Request Withdrawal (Start Unbonding)
                                    </button>
                                ) : (
                                    <div style={{display: 'flex', gap: '0.5rem'}}>
                                        <button 
                                            onClick={async () => {
                                                if (!posAddress || !wallet.signer) return setStatusMsg("Connect wallet first");
                                                
                                                if (myStake.unbondingTime > 0 && myStake.unbondingTime < 9999999999) {
                                                    return setStatusMsg(`⏳ Wait ${myStake.unbondingTime}s more to withdraw`);
                                                }
                                                
                                                try {
                                                    setStatusMsg("💸 Completing withdrawal...");
                                                    const contract = new ethers.Contract(posAddress, PoSABI, wallet.signer);
                                                    const tx = await contract.withdraw();
                                                    await tx.wait();
                                                    setStatusMsg("✅ Withdrew stake + rewards!");
                                                    setWithdrawalRequested(false);
                                                    syncBlockchainData();
                                                    setTimeout(() => setStatusMsg(""), 3000);
                                                } catch (e) {
                                                    const reason = e.reason || e.message || "Unknown error";
                                                    setStatusMsg("❌ Withdraw failed: " + reason);
                                                }
                                            }}
                                            disabled={myStake.unbondingTime > 0 && myStake.unbondingTime < 9999999999}
                                            style={{
                                                flex: 1,
                                                padding: '1rem',
                                                background: (myStake.unbondingTime > 0 && myStake.unbondingTime < 9999999999) 
                                                    ? '#374151' 
                                                    : 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '0.5rem',
                                                fontSize: '1rem',
                                                fontWeight: 'bold',
                                                cursor: (myStake.unbondingTime > 0 && myStake.unbondingTime < 9999999999) ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            {(myStake.unbondingTime > 0 && myStake.unbondingTime < 9999999999) 
                                                ? `⏳ ${myStake.unbondingTime}s remaining` 
                                                : '💸 Complete Withdrawal'}
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    setStatusMsg("❌ Cancelling withdrawal...");
                                                    const contract = new ethers.Contract(posAddress, PoSABI, wallet.signer);
                                                    const tx = await contract.cancelWithdrawal();
                                                    await tx.wait();
                                                    setStatusMsg("✅ Withdrawal cancelled");
                                                    setWithdrawalRequested(false);
                                                    syncBlockchainData();
                                                } catch (e) {
                                                    setStatusMsg("❌ Cancel failed: " + (e.reason || e.message));
                                                }
                                            }}
                                            style={{
                                                padding: '1rem',
                                                background: '#64748b',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '0.5rem',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
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
            
            {/* CLI LABS VIEW */}
            {view === 'cli' && (
                <CLILabsView />
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
                        <InstructorView 
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
