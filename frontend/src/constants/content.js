/**
 * Content Constants - Static content for the Ethereum Lab
 * 
 * This file contains all the static educational content used throughout
 * the application, including orientation sections, concept cards,
 * exploration missions, and lesson data.
 */

// --- ORIENTATION CONTENT ---
export const INTRO_SECTIONS = [
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
];

// --- CORE CONCEPT CARDS ---
export const CONCEPT_CARDS = [
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
];

// --- EXPLORATION MISSIONS ---
export const EXPLORE_MISSIONS = [
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
];

// --- LESSON DATA (content rendered in component) ---
export const LESSONS = [
  {
    id: "intro",
    title: "What is Ethereum?",
    contentType: "intro"
  },
  {
    id: "account",
    title: "Accounts & Keys",
    contentType: "account"
  },
  {
    id: "tx",
    title: "Transactions & Gas",
    contentType: "tx"
  },
  {
    id: "consensus",
    title: "Consensus: PoW vs PoS",
    contentType: "consensus"
  }
];

// Helper to get lesson content component by type
export function getLessonContent(contentType) {
  const contentMap = {
    intro: {
      title: "The World Computer",
      description: "Ethereum is not just money. It is a global, shared computer that no one owns.",
      points: [
        { label: "Decentralized", text: "Runs on thousands of computers (Nodes) at once." },
        { label: "Immutable", text: "Once data is written, it cannot be erased." },
        { label: "Programmable", text: "You can write code (Smart Contracts) that runs on it." }
      ]
    },
    account: {
      title: "Your Digital Identity",
      description: "To use Ethereum, you need a Key Pair:",
      concepts: [
        { icon: "🔑", label: "Private Key", text: "Like your Password. NEVER share this. It signs transactions.", example: "bad64...91a2" },
        { icon: "📬", label: "Public Address", text: "Like your Email. Share this to receive money.", example: "0x71C...9A21" }
      ]
    },
    tx: {
      title: "Moving Data",
      description: "Every time you want to change the blockchain (send money, post chat), you must send a Transaction.",
      note: "Miners/Validators do the work to process it. You pay them a fee called Gas (in ETH)."
    },
    consensus: {
      title: "How Does Everyone Agree?",
      description: "Blockchains need a way for thousands of computers to agree on the 'truth' without a central authority. This is called Consensus.",
      methods: [
        {
          name: "Proof of Work (PoW)",
          icon: "⚡",
          subtitle: "Bitcoin's Method",
          points: [
            "Miners compete to solve complex math puzzles",
            "First to solve gets to add the next block",
            "Requires massive computing power & electricity",
            "Problem: Wasteful energy consumption"
          ],
          style: "default"
        },
        {
          name: "Proof of Stake (PoS)",
          icon: "🌱",
          subtitle: "Ethereum's Method",
          points: [
            "Validators 'stake' their ETH as collateral",
            "Algorithm selects validators based on stake size",
            "Selected validator proposes the next block",
            "Benefit: 99.95% less energy than PoW!",
            "Security: Bad actors lose their staked ETH (slashing)"
          ],
          style: "highlight"
        }
      ]
    }
  };
  
  return contentMap[contentType] || null;
}

