# Ethereum Lab Requirements Checklist

## ✅ COMPLETED FEATURES

### Smart Contract Features (`contracts/PoS.sol`)
- [x] Slashing Penalties - `slash()` function, 5% penalty, `slashCount` tracking
- [x] Unbonding Period - 60 second waiting period via `requestWithdrawal()`
- [x] Minimum Stake Duration - 30 second minimum stake time
- [x] Realistic Reward Formula - Participation-based with dilution effect
- [x] Validator Selection Simulation - `simulateBlockProposal()` with weighted random
- [x] Attestation Duties - `attest()` function with epoch-based tracking
- [x] Epoch Management - `advanceEpoch()` for instructor control

### UI Features (`frontend/src/App.jsx`)
- [x] Mode Switcher - Separate tabs for Learning, Live, CLI, Instructor
- [x] Two-step withdrawal UI (Request → Wait → Withdraw)
- [x] Real-time countdown timers (epoch, unbonding, min stake)
- [x] Attestation status and "Attest Now" button
- [x] Slash count display in validator stats
- [x] Blocks proposed count
- [x] Current APY display
- [x] Connection status bar with visual indicators
- [x] Wallet persistence with localStorage

### Learning Modules
- [x] Orientation (Intro) View
- [x] Core Concepts View with 6 concept cards
- [x] Explore View with 8 interactive missions
- [x] Learn View (PoW vs PoS)
- [x] Practice View (Validator Selection Sim)

### Mini Labs (Interactive)
- [x] Blockchain Visualizer
- [x] Address Decoder
- [x] Staking Rewards Calculator
- [x] Validator Probability Simulator
- [x] Slashing Penalty Calculator
- [x] Attack Cost Calculator

### Instructor Dashboard
- [x] Student activity table with all validator stats
- [x] "Simulate Block" button
- [x] "Check Attestations" button
- [x] "Advance Epoch" button
- [x] Slash button per student with reason input
- [x] "Fund All Students" button
- [x] Network stats display

---

## 🎬 VIDEO PLACEHOLDERS (Ready for URLs)

To add a video, replace `video: null` with a YouTube embed URL like:
`video: "https://www.youtube.com/embed/VIDEO_ID"`

### CONCEPT_CARDS (in App.jsx ~line 54):
| Card | Priority | Suggested Topic |
|------|----------|-----------------|
| 🔐 Wallet Anatomy | Medium | "What is a crypto wallet?" |
| ⛽ Gas & Transaction Fees | Medium | "Ethereum gas fees explained" |
| 🧱 Blocks & Finality | Medium | "How blockchain blocks work" |
| 🤝 Proof-of-Stake Consensus | **HIGH** | "Proof of Stake explained" |
| 💎 Ether (ETH) | Low | "What is Ethereum?" |
| 📜 Smart Contracts | Medium | "Smart contracts explained" |

### EXPLORE_MISSIONS (in App.jsx ~line 136):
| Mission | Priority | Suggested Topic |
|---------|----------|-----------------|
| 🔗 Understanding Staking | **HIGH** | "Ethereum staking tutorial" |
| 👮 Validator Responsibilities | Medium | "What do validators do?" |
| ⚔️ Slashing: Penalty System | **HIGH** | "Ethereum slashing explained" |
| 🏦 DeFi: Liquid Staking | Medium | "Liquid staking (Lido, Rocket Pool)" |
| 💰 Staking Rewards Economics | Low | "Staking APY and rewards" |
| 🎯 Attack Cost Scenario | Medium | "51% attack economics" |

---

## 📋 PENDING ITEMS (From Research Paper Recommendations)

### High Priority:
- [ ] Hypothesis/prediction prompts before experiments
- [ ] Experiment logging/journaling for data collection
- [ ] Progress tracking with quiz scores persistence

### Medium Priority:
- [ ] Guided inquiry scaffolding with pre/post reflection
- [ ] Save experiment results to localStorage or server
- [ ] Summary report generation at end of lab session

### Low Priority:
- [ ] Downloadable experiment data (CSV export)
- [ ] Comparison view for multiple experiment runs
- [ ] Social features (share results with classmates)

---

## 🧪 TEST CHECKLIST

### Smart Contract Tests:
- [ ] Stake 1 ETH successfully
- [ ] Cannot withdraw before minimum stake duration
- [ ] Request withdrawal starts unbonding period
- [ ] Cannot complete withdrawal during unbonding
- [ ] Withdrawal returns stake + rewards after unbonding
- [ ] Attestation works once per epoch
- [ ] Instructor can slash validators
- [ ] Block proposal selects validator by stake weight

### Frontend Tests:
- [ ] Mode switcher changes views correctly
- [ ] Learning modules progress sequentially
- [ ] Mini-labs calculate correctly
- [ ] Quizzes track correct/incorrect answers
- [ ] Live network connects to blockchain
- [ ] Countdown timers update in real-time
- [ ] Wallet persists across browser refresh

---

*Last Updated: Dec 11, 2025*

