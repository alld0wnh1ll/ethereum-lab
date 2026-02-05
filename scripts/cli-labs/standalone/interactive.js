#!/usr/bin/env node
/**
 * Interactive Blockchain CLI
 * 
 * A menu-driven CLI for students to explore blockchain concepts
 * Run: node interactive.js
 */

import { ethers } from 'ethers';
import * as readline from 'readline';
import 'dotenv/config';
import { builderWizard } from './5-contract-builder.js';
import { accountManager } from './account-manager.js';

// Configuration
const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';

// Hardhat's default test accounts
const TEST_ACCOUNTS = [
  { name: 'Account 0', address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', key: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' },
  { name: 'Account 1', address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', key: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' },
  { name: 'Account 2', address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', key: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a' },
  { name: 'Account 3', address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', key: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6' },
  { name: 'Account 4', address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', key: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a' },
];

// PoS Contract ABI (minimal)
const POS_ABI = [
  'function totalStaked() view returns (uint256)',
  'function getValidatorCount() view returns (uint256)',
  'function currentEpoch() view returns (uint256)',
  'function stakes(address) view returns (uint256)',
  'function MIN_STAKE() view returns (uint256)',
  'function getValidatorStats(address) view returns (uint256, uint256, uint256, uint256, uint256, uint256)',
  'function calculateReward(address) view returns (uint256)',
  'function stake() payable',
  'function requestWithdrawal()',
  'function withdraw()',
  'function attest()',
  'function sendMessage(string)',
  'event Staked(address indexed validator, uint256 amount)',
  'event NewMessage(address indexed sender, string message, uint256 timestamp)',
];

// Global state
let provider = null;
let selectedAccount = TEST_ACCOUNTS[0];
let wallet = null;
let contract = null;

// Readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (question) => new Promise(resolve => rl.question(question, resolve));

// Utility functions
const clear = () => console.log('\x1Bc');
const pause = () => ask('\nPress Enter to continue...');
const formatEth = (wei) => ethers.formatEther(wei);

// Color helpers (ANSI codes)
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const c = (color, text) => `${colors[color]}${text}${colors.reset}`;

// ============================================================================
// MENU ACTIONS
// ============================================================================

async function showNetworkInfo() {
  console.log(c('cyan', '\n📊 Network Information\n'));
  console.log('─'.repeat(50));
  
  const [blockNumber, network, feeData] = await Promise.all([
    provider.getBlockNumber(),
    provider.getNetwork(),
    provider.getFeeData()
  ]);
  
  console.log(`Chain ID:      ${network.chainId}`);
  console.log(`Block Number:  ${blockNumber}`);
  console.log(`Gas Price:     ${ethers.formatUnits(feeData.gasPrice, 'gwei')} Gwei`);
  
  if (CONTRACT_ADDRESS) {
    const code = await provider.getCode(CONTRACT_ADDRESS);
    console.log(`\nContract:      ${CONTRACT_ADDRESS}`);
    console.log(`Status:        ${code !== '0x' ? c('green', 'Deployed ✓') : c('red', 'Not Found')}`);
  }
}

async function showBlockDetails() {
  console.log(c('cyan', '\n🧱 Block Explorer\n'));
  console.log('─'.repeat(50));
  
  const latestBlock = await provider.getBlockNumber();
  const blockInput = await ask(`Enter block number (or 'latest') [${latestBlock}]: `);
  const blockNum = blockInput.trim() || latestBlock;
  
  const block = await provider.getBlock(blockNum === 'latest' ? latestBlock : parseInt(blockNum));
  
  if (!block) {
    console.log(c('red', 'Block not found'));
    return;
  }
  
  console.log(`\n${c('bright', 'Block #' + block.number)}`);
  console.log('─'.repeat(50));
  console.log(`Hash:          ${block.hash}`);
  console.log(`Parent:        ${block.parentHash}`);
  console.log(`Timestamp:     ${new Date(block.timestamp * 1000).toLocaleString()}`);
  console.log(`Transactions:  ${block.transactions.length}`);
  console.log(`Gas Used:      ${block.gasUsed.toString()}`);
  console.log(`Gas Limit:     ${block.gasLimit.toString()}`);
  console.log(`Miner:         ${block.miner}`);
  
  if (block.transactions.length > 0) {
    console.log(`\n${c('yellow', 'Transactions in this block:')}`);
    for (let i = 0; i < Math.min(5, block.transactions.length); i++) {
      console.log(`  ${i + 1}. ${block.transactions[i]}`);
    }
    if (block.transactions.length > 5) {
      console.log(`  ... and ${block.transactions.length - 5} more`);
    }
  }
}

async function showAccountBalances() {
  console.log(c('cyan', '\n💰 Account Balances\n'));
  console.log('─'.repeat(50));
  
  for (const acc of TEST_ACCOUNTS) {
    const balance = await provider.getBalance(acc.address);
    const marker = acc.address === selectedAccount.address ? c('green', ' ◀ SELECTED') : '';
    console.log(`${acc.name}: ${formatEth(balance)} ETH${marker}`);
    console.log(`  ${c('dim', acc.address)}`);
  }
}

async function selectAccount() {
  console.log(c('cyan', '\n👤 Select Account\n'));
  console.log('─'.repeat(50));
  
  // Show test accounts
  console.log(c('dim', 'Test Accounts:'));
  for (let i = 0; i < TEST_ACCOUNTS.length; i++) {
    const acc = TEST_ACCOUNTS[i];
    const balance = await provider.getBalance(acc.address);
    const marker = acc.address === selectedAccount.address ? c('green', ' ◀') : '';
    console.log(`  ${i + 1}. ${acc.name} - ${formatEth(balance)} ETH${marker}`);
  }
  
  // Custom import option
  console.log(c('dim', '\nCustom Account:'));
  console.log(`  p. Import with Private Key (your own wallet)`);
  
  const choice = await ask('\nSelect account (1-5, or p): ');
  
  if (choice.toLowerCase() === 'p') {
    // Import custom private key
    const privateKey = await ask('Enter private key (0x...): ');
    
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
      console.log(c('red', 'Invalid private key format.'));
      return;
    }
    
    try {
      wallet = new ethers.Wallet(privateKey, provider);
      selectedAccount = {
        name: 'My Wallet',
        address: wallet.address,
        key: privateKey
      };
      
      if (CONTRACT_ADDRESS) {
        contract = new ethers.Contract(CONTRACT_ADDRESS, POS_ABI, wallet);
      }
      
      const balance = await provider.getBalance(wallet.address);
      console.log(c('green', `\n✓ Imported wallet: ${wallet.address}`));
      console.log(c('dim', `  Balance: ${formatEth(balance)} ETH`));
      
    } catch (error) {
      console.log(c('red', `Invalid private key: ${error.message}`));
    }
    return;
  }
  
  const index = parseInt(choice) - 1;
  
  if (index >= 0 && index < TEST_ACCOUNTS.length) {
    selectedAccount = TEST_ACCOUNTS[index];
    wallet = new ethers.Wallet(selectedAccount.key, provider);
    if (CONTRACT_ADDRESS) {
      contract = new ethers.Contract(CONTRACT_ADDRESS, POS_ABI, wallet);
    }
    console.log(c('green', `\n✓ Selected: ${selectedAccount.name}`));
  } else {
    console.log(c('red', 'Invalid selection'));
  }
}

async function sendTransaction() {
  console.log(c('cyan', '\n💸 Send Transaction\n'));
  console.log('─'.repeat(50));
  console.log(`From: ${selectedAccount.name} (${selectedAccount.address})`);
  
  const balance = await provider.getBalance(selectedAccount.address);
  console.log(`Balance: ${formatEth(balance)} ETH\n`);
  
  // Show recipient options
  console.log('Recipients:');
  const others = TEST_ACCOUNTS.filter(a => a.address !== selectedAccount.address);
  for (let i = 0; i < others.length; i++) {
    console.log(`  ${i + 1}. ${others[i].name} (${others[i].address.slice(0, 10)}...)`);
  }
  console.log(`  ${others.length + 1}. Enter custom address`);
  
  const recipientChoice = await ask('\nSelect recipient: ');
  let toAddress;
  
  const idx = parseInt(recipientChoice) - 1;
  if (idx >= 0 && idx < others.length) {
    toAddress = others[idx].address;
  } else if (idx === others.length) {
    toAddress = await ask('Enter address (0x...): ');
  } else {
    console.log(c('red', 'Invalid selection'));
    return;
  }
  
  const amountStr = await ask('Amount in ETH: ');
  const amount = parseFloat(amountStr);
  
  if (isNaN(amount) || amount <= 0) {
    console.log(c('red', 'Invalid amount'));
    return;
  }
  
  console.log(`\n${c('yellow', 'Transaction Details:')}`);
  console.log(`  To:     ${toAddress}`);
  console.log(`  Amount: ${amount} ETH`);
  
  const confirm = await ask('\nConfirm? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('Cancelled');
    return;
  }
  
  console.log('\n⏳ Sending transaction...');
  
  try {
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: ethers.parseEther(amount.toString())
    });
    
    console.log(`Transaction hash: ${tx.hash}`);
    console.log('Waiting for confirmation...');
    
    const receipt = await tx.wait();
    
    console.log(c('green', '\n✓ Transaction confirmed!'));
    console.log(`  Block:    ${receipt.blockNumber}`);
    console.log(`  Gas used: ${receipt.gasUsed.toString()}`);
    console.log(`  Gas cost: ${formatEth(receipt.gasUsed * receipt.gasPrice)} ETH`);
  } catch (error) {
    console.log(c('red', `\n✗ Error: ${error.message}`));
  }
}

async function lookupTransaction() {
  console.log(c('cyan', '\n🔍 Transaction Lookup\n'));
  console.log('─'.repeat(50));
  
  const hash = await ask('Enter transaction hash: ');
  
  if (!hash.startsWith('0x') || hash.length !== 66) {
    console.log(c('red', 'Invalid transaction hash'));
    return;
  }
  
  const tx = await provider.getTransaction(hash);
  
  if (!tx) {
    console.log(c('red', 'Transaction not found'));
    return;
  }
  
  const receipt = await provider.getTransactionReceipt(hash);
  
  console.log(`\n${c('bright', 'Transaction Details')}`);
  console.log('─'.repeat(50));
  console.log(`Hash:       ${tx.hash}`);
  console.log(`From:       ${tx.from}`);
  console.log(`To:         ${tx.to || 'Contract Creation'}`);
  console.log(`Value:      ${formatEth(tx.value)} ETH`);
  console.log(`Gas Limit:  ${tx.gasLimit.toString()}`);
  console.log(`Gas Price:  ${ethers.formatUnits(tx.gasPrice, 'gwei')} Gwei`);
  console.log(`Nonce:      ${tx.nonce}`);
  
  if (receipt) {
    console.log(`\n${c('bright', 'Receipt')}`);
    console.log(`Status:     ${receipt.status === 1 ? c('green', 'Success ✓') : c('red', 'Failed ✗')}`);
    console.log(`Block:      ${receipt.blockNumber}`);
    console.log(`Gas Used:   ${receipt.gasUsed.toString()}`);
    console.log(`Logs:       ${receipt.logs.length} events`);
  }
}

async function contractInteraction() {
  if (!CONTRACT_ADDRESS) {
    console.log(c('red', '\n✗ CONTRACT_ADDRESS not set'));
    console.log('Set it with: export CONTRACT_ADDRESS="0x..."');
    return;
  }
  
  console.log(c('cyan', '\n📜 Contract Interaction\n'));
  console.log('─'.repeat(50));
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`Account:  ${selectedAccount.name}\n`);
  
  console.log('Actions:');
  console.log('  1. View contract state');
  console.log('  2. View my validator stats');
  console.log('  3. Stake ETH (become validator)');
  console.log('  4. Send chat message');
  console.log('  5. Attest (validator duty)');
  console.log('  6. Request withdrawal');
  console.log('  0. Back');
  
  const choice = await ask('\nSelect action: ');
  
  try {
    switch (choice) {
      case '1':
        await viewContractState();
        break;
      case '2':
        await viewMyStats();
        break;
      case '3':
        await stakeEth();
        break;
      case '4':
        await sendChatMessage();
        break;
      case '5':
        await attestEpoch();
        break;
      case '6':
        await requestWithdrawal();
        break;
    }
  } catch (error) {
    console.log(c('red', `\n✗ Error: ${error.reason || error.message}`));
  }
}

async function viewContractState() {
  console.log(c('yellow', '\n📊 Contract State\n'));
  
  const readContract = new ethers.Contract(CONTRACT_ADDRESS, POS_ABI, provider);
  
  const [totalStaked, validatorCount, currentEpoch, minStake] = await Promise.all([
    readContract.totalStaked(),
    readContract.getValidatorCount(),
    readContract.currentEpoch(),
    readContract.MIN_STAKE()
  ]);
  
  console.log(`Total Staked:     ${formatEth(totalStaked)} ETH`);
  console.log(`Validator Count:  ${validatorCount.toString()}`);
  console.log(`Current Epoch:    ${currentEpoch.toString()}`);
  console.log(`Minimum Stake:    ${formatEth(minStake)} ETH`);
}

async function viewMyStats() {
  console.log(c('yellow', '\n👤 My Validator Stats\n'));
  
  const readContract = new ethers.Contract(CONTRACT_ADDRESS, POS_ABI, provider);
  const myStake = await readContract.stakes(selectedAccount.address);
  
  if (myStake === 0n) {
    console.log('You are not currently staking.');
    console.log('Use "Stake ETH" to become a validator.');
    return;
  }
  
  const stats = await readContract.getValidatorStats(selectedAccount.address);
  const reward = await readContract.calculateReward(selectedAccount.address);
  
  console.log(`Stake Amount:        ${formatEth(stats[0])} ETH`);
  console.log(`Pending Rewards:     ${formatEth(reward)} ETH`);
  console.log(`Times Slashed:       ${stats[2].toString()}`);
  console.log(`Blocks Proposed:     ${stats[3].toString()}`);
  console.log(`Missed Attestations: ${stats[4].toString()}`);
}

async function stakeEth() {
  console.log(c('yellow', '\n🏦 Stake ETH\n'));
  
  const balance = await provider.getBalance(selectedAccount.address);
  const readContract = new ethers.Contract(CONTRACT_ADDRESS, POS_ABI, provider);
  const minStake = await readContract.MIN_STAKE();
  const currentStake = await readContract.stakes(selectedAccount.address);
  
  console.log(`Your balance:   ${formatEth(balance)} ETH`);
  console.log(`Minimum stake:  ${formatEth(minStake)} ETH`);
  console.log(`Current stake:  ${formatEth(currentStake)} ETH`);
  
  if (currentStake > 0n) {
    console.log(c('yellow', '\nYou are already staking. Withdraw first to stake again.'));
    return;
  }
  
  const amountStr = await ask('\nAmount to stake (ETH): ');
  const amount = parseFloat(amountStr);
  
  if (isNaN(amount) || amount < parseFloat(formatEth(minStake))) {
    console.log(c('red', `Invalid amount. Minimum is ${formatEth(minStake)} ETH`));
    return;
  }
  
  const confirm = await ask(`Stake ${amount} ETH? (y/n): `);
  if (confirm.toLowerCase() !== 'y') return;
  
  console.log('\n⏳ Staking...');
  const tx = await contract.stake({ value: ethers.parseEther(amount.toString()) });
  console.log(`Transaction: ${tx.hash}`);
  await tx.wait();
  console.log(c('green', '✓ Successfully staked! You are now a validator.'));
}

async function sendChatMessage() {
  console.log(c('yellow', '\n💬 Send Chat Message\n'));
  
  const message = await ask('Enter message: ');
  if (!message.trim()) return;
  
  console.log('\n⏳ Sending...');
  const tx = await contract.sendMessage(message);
  console.log(`Transaction: ${tx.hash}`);
  await tx.wait();
  console.log(c('green', '✓ Message sent!'));
}

async function attestEpoch() {
  console.log(c('yellow', '\n✅ Attest to Epoch\n'));
  
  const readContract = new ethers.Contract(CONTRACT_ADDRESS, POS_ABI, provider);
  const myStake = await readContract.stakes(selectedAccount.address);
  
  if (myStake === 0n) {
    console.log(c('red', 'You must be a validator to attest. Stake ETH first.'));
    return;
  }
  
  console.log('⏳ Attesting...');
  const tx = await contract.attest();
  console.log(`Transaction: ${tx.hash}`);
  await tx.wait();
  console.log(c('green', '✓ Attestation recorded!'));
}

async function requestWithdrawal() {
  console.log(c('yellow', '\n📤 Request Withdrawal\n'));
  
  const readContract = new ethers.Contract(CONTRACT_ADDRESS, POS_ABI, provider);
  const myStake = await readContract.stakes(selectedAccount.address);
  
  if (myStake === 0n) {
    console.log(c('red', 'You have no stake to withdraw.'));
    return;
  }
  
  console.log(`Current stake: ${formatEth(myStake)} ETH`);
  console.log(c('yellow', 'Note: There is a 60-second unbonding period.'));
  
  const confirm = await ask('\nRequest withdrawal? (y/n): ');
  if (confirm.toLowerCase() !== 'y') return;
  
  console.log('\n⏳ Requesting withdrawal...');
  const tx = await contract.requestWithdrawal();
  console.log(`Transaction: ${tx.hash}`);
  await tx.wait();
  console.log(c('green', '✓ Withdrawal requested! Wait 60 seconds, then withdraw.'));
}

function showPlaygroundHelp(topic = '') {
  const examples = {
    blocks: `
${c('cyan', '📦 BLOCKS')}
${'─'.repeat(40)}
${c('yellow', 'Get current block number:')}
  await provider.getBlockNumber()

${c('yellow', 'Get block details:')}
  const block = await provider.getBlock('latest')
  console.log('Block:', block.number, 'Txs:', block.transactions.length)

${c('yellow', 'Get specific block:')}
  const block = await provider.getBlock(5)

${c('yellow', 'Watch for new blocks:')}
  provider.on('block', n => console.log('New block:', n))
`,
    balances: `
${c('cyan', '💰 BALANCES')}
${'─'.repeat(40)}
${c('yellow', 'Check your balance:')}
  const bal = await provider.getBalance(wallet.address)
  console.log(ethers.formatEther(bal), 'ETH')

${c('yellow', 'Check any address:')}
  const bal = await provider.getBalance('0xf39F...')
  console.log(ethers.formatEther(bal), 'ETH')
`,
    transactions: `
${c('cyan', '💸 TRANSACTIONS')}
${'─'.repeat(40)}
${c('yellow', 'Send ETH:')}
  const tx = await wallet.sendTransaction({
    to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    value: ethers.parseEther('0.5')
  })
  await tx.wait()

${c('yellow', 'Look up transaction:')}
  const tx = await provider.getTransaction('0x...')
  console.log('From:', tx.from, 'Value:', ethers.formatEther(tx.value))

${c('yellow', 'Get receipt:')}
  const receipt = await provider.getTransactionReceipt('0x...')
  console.log('Status:', receipt.status === 1 ? 'Success' : 'Failed')
`,
    contract: `
${c('cyan', '📜 CONTRACT')}
${'─'.repeat(40)}
${c('yellow', 'Read contract state:')}
  const staked = await contract.totalStaked()
  console.log(ethers.formatEther(staked), 'ETH staked')

${c('yellow', 'Get validator count:')}
  const count = await contract.getValidatorCount()

${c('yellow', 'Check your stake:')}
  const stake = await contract.stakes(wallet.address)
  console.log(ethers.formatEther(stake), 'ETH')

${c('yellow', 'Stake ETH:')}
  const tx = await contract.stake({ value: ethers.parseEther('1.0') })
  await tx.wait()

${c('yellow', 'Send chat:')}
  await contract.sendMessage('Hello!')
`,
    events: `
${c('cyan', '📡 EVENTS')}
${'─'.repeat(40)}
${c('yellow', 'Get all stakes:')}
  const events = await contract.queryFilter('Staked', 0)
  events.forEach(e => console.log(e.args[0], ethers.formatEther(e.args[1])))

${c('yellow', 'Get chat messages:')}
  const msgs = await contract.queryFilter('NewMessage', 0)
  msgs.forEach(m => console.log(m.args[1]))

${c('yellow', 'Listen live:')}
  contract.on('Staked', (addr, amt) => console.log('New stake!', addr))
`,
    utils: `
${c('cyan', '🧮 UTILITIES')}
${'─'.repeat(40)}
${c('yellow', 'ETH to Wei:')}
  ethers.parseEther('1.5')

${c('yellow', 'Wei to ETH:')}
  ethers.formatEther(1500000000000000000n)

${c('yellow', 'Gwei conversions:')}
  ethers.parseUnits('10', 'gwei')
  ethers.formatUnits(wei, 'gwei')

${c('yellow', 'Check if contract:')}
  const code = await provider.getCode('0x...')
  console.log(code === '0x' ? 'EOA' : 'Contract')
`,
    forensics: `
${c('cyan', '🔍 BLOCKCHAIN FORENSICS')}
${'─'.repeat(40)}
${c('yellow', 'Analyze an address:')}
  ctx.addr = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  ctx.bal = await provider.getBalance(ctx.addr)
  ctx.code = await provider.getCode(ctx.addr)
  console.log('Balance:', formatEth(ctx.bal), 'ETH')
  console.log('Type:', ctx.code === '0x' ? 'Wallet (EOA)' : 'Contract')

${c('yellow', 'Look up a transaction:')}
  ctx.tx = await provider.getTransaction('0x...')
  console.log('From:', ctx.tx.from)
  console.log('To:', ctx.tx.to)
  console.log('Value:', formatEth(ctx.tx.value), 'ETH')

${c('yellow', 'Get transaction receipt:')}
  ctx.receipt = await provider.getTransactionReceipt('0x...')
  console.log('Status:', ctx.receipt.status === 1 ? 'Success' : 'Failed')
  console.log('Gas Used:', ctx.receipt.gasUsed.toString())

${c('yellow', 'Scan blocks for transactions:')}
  ctx.latest = await provider.getBlockNumber()
  for (let i = 0; i <= ctx.latest; i++) {
    const b = await provider.getBlock(i, true)
    b.prefetchedTransactions?.forEach(tx => 
      console.log(\`Block \${i}: \${formatAddr(tx.from)} → \${formatAddr(tx.to)}: \${formatEth(tx.value)} ETH\`)
    )
  }

${c('yellow', 'Query staking events (requires contract):')}
  ctx.events = await contract.queryFilter('Staked', 0)
  ctx.events.forEach(e => console.log(formatAddr(e.args[0]), 'staked', formatEth(e.args[1]), 'ETH'))
`,
    investigate: `
${c('cyan', '🕵️ INVESTIGATION WORKFLOWS')}
${'─'.repeat(40)}
${c('yellow', '1. Full address investigation:')}
  ctx.target = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  ctx.code = await provider.getCode(ctx.target)
  ctx.bal = await provider.getBalance(ctx.target)
  ctx.nonce = await provider.getTransactionCount(ctx.target)
  console.log('Address:', ctx.target)
  console.log('Type:', ctx.code === '0x' ? 'Wallet (EOA)' : 'Contract')
  console.log('Balance:', formatEth(ctx.bal), 'ETH')
  console.log('Tx Count:', ctx.nonce)

${c('yellow', '2. Find all transactions for an address:')}
  ctx.target = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  ctx.found = []
  ctx.latest = await provider.getBlockNumber()
  for (let i = 0; i <= ctx.latest; i++) {
    const b = await provider.getBlock(i, true)
    b.prefetchedTransactions?.filter(tx => 
      tx.from === ctx.target || tx.to === ctx.target
    ).forEach(tx => ctx.found.push({
      block: i, 
      dir: tx.from === ctx.target ? 'OUT' : 'IN',
      value: formatEth(tx.value)
    }))
  }
  console.table(ctx.found)

${c('yellow', '3. Find high-value transactions:')}
  ctx.threshold = ethers.parseEther('1')
  ctx.highValue = []
  ctx.latest = await provider.getBlockNumber()
  for (let i = 0; i <= ctx.latest; i++) {
    const b = await provider.getBlock(i, true)
    b.prefetchedTransactions?.filter(tx => tx.value >= ctx.threshold)
      .forEach(tx => ctx.highValue.push({
        block: i, 
        from: formatAddr(tx.from), 
        to: formatAddr(tx.to), 
        value: formatEth(tx.value)
      }))
  }
  console.table(ctx.highValue)
`
  };

  if (topic && examples[topic]) {
    console.log(examples[topic]);
  } else {
    console.log(`
${c('cyan', '🎮 PLAYGROUND HELP')}
${'─'.repeat(40)}
${c('bright', 'Available variables:')}
  provider  - Read blockchain data
  wallet    - Your account (can send tx)
  contract  - PoS contract instance
  ethers    - ethers.js library

${c('bright', 'Commands:')}
  help              - Show this message
  help blocks       - Block examples
  help balances     - Balance examples  
  help transactions - Transaction examples
  help contract     - Contract examples
  help events       - Event examples
  help utils        - Utility functions
  ${c('cyan', 'help forensics    - Blockchain forensics/analysis')}
  ${c('cyan', 'help investigate  - Investigation workflows')}
  vars              - Show stored variables
  clear             - Clear stored variables
  exit              - Return to menu

${c('bright', 'Quick examples:')}
  await provider.getBlockNumber()
  await provider.getBalance(wallet.address)
  await contract.totalStaked()

${c('bright', 'Storing variables:')}
  ctx.target = '0xf39F...'           // Store a variable
  ctx.balance = await provider.getBalance(ctx.target)
  console.log(formatEth(ctx.balance))

${c('dim', 'See PLAYGROUND_TUTORIAL.md for full documentation')}
`);
  }
}

async function playground() {
  console.log(c('cyan', '\n🎮 Playground Mode (Analyst Console)\n'));
  console.log('─'.repeat(50));
  console.log('Interactive JavaScript console with blockchain access');
  console.log('Variables persist between commands!');
  console.log(`Type ${c('yellow', 'help')} for examples, ${c('yellow', 'help forensics')} for analyst tools`);
  console.log(`Type ${c('yellow', 'vars')} to see stored variables, ${c('yellow', 'clear')} to reset`);
  console.log(`Type ${c('yellow', 'exit')} to quit\n`);
  
  // Show contract status
  if (!contract) {
    console.log(c('yellow', '⚠ Note: contract is null (CONTRACT_ADDRESS not set or contract not found)'));
    console.log(c('dim', '  Set it with: export CONTRACT_ADDRESS="0x..."\n'));
  }
  
  // Persistent context - using globalThis for true persistence
  const builtIns = ['provider', 'wallet', 'contract', 'ethers', 'formatEth', 'parseEth', 'formatAddr', 'toDate', 'console', 'ctx'];
  
  // Create a simple context object that we'll use with `with` statement alternative
  globalThis.ctx = globalThis.ctx || {};
  const ctx = globalThis.ctx;
  
  // Set up built-in references
  ctx.provider = provider;
  ctx.wallet = wallet;
  ctx.contract = contract;
  ctx.ethers = ethers;
  ctx.formatEth = (wei) => ethers.formatEther(wei);
  ctx.parseEth = (eth) => ethers.parseEther(eth);
  ctx.formatAddr = (addr) => addr ? `${addr.slice(0,6)}...${addr.slice(-4)}` : 'null';
  ctx.toDate = (ts) => new Date(Number(ts) * 1000).toLocaleString();
  
  while (true) {
    const code = await ask(c('green', '> '));
    
    if (code.toLowerCase() === 'exit') break;
    if (!code.trim()) continue;
    
    // Handle special commands
    if (code.toLowerCase() === 'help') {
      showPlaygroundHelp();
      continue;
    }
    if (code.toLowerCase().startsWith('help ')) {
      showPlaygroundHelp(code.slice(5).trim().toLowerCase());
      continue;
    }
    if (code.toLowerCase() === 'vars') {
      const userVars = Object.keys(ctx).filter(k => !builtIns.includes(k));
      if (userVars.length === 0) {
        console.log(c('dim', 'No user variables defined yet.'));
        console.log(c('dim', 'Try: ctx.target = "0x..." or use let/const'));
      } else {
        console.log(c('cyan', 'Stored variables (access via ctx.name):'));
        userVars.forEach(k => {
          const v = ctx[k];
          const type = typeof v;
          const preview = type === 'object' ? (Array.isArray(v) ? `Array(${v.length})` : 'Object') : 
                         type === 'bigint' ? v.toString() + 'n' : String(v).slice(0, 50);
          console.log(`  ${c('yellow', 'ctx.' + k)}: ${preview}`);
        });
      }
      continue;
    }
    if (code.toLowerCase() === 'clear') {
      Object.keys(ctx).forEach(k => {
        if (!builtIns.includes(k)) delete ctx[k];
      });
      console.log(c('green', 'Variables cleared.'));
      continue;
    }
    
    try {
      // Simple approach: execute code with ctx available
      // Users store persistent vars with ctx.varName = value
      const result = await eval(`(async () => {
        const { provider, wallet, contract, ethers, formatEth, parseEth, formatAddr, toDate } = ctx;
        return ${code};
      })()`);
      
      if (result !== undefined) {
        console.log(formatResult(result));
      }
    } catch (exprError) {
      // If expression failed, try as statement
      try {
        await eval(`(async () => {
          const { provider, wallet, contract, ethers, formatEth, parseEth, formatAddr, toDate } = ctx;
          ${code};
        })()`);
      } catch (stmtError) {
        console.log(c('red', `Error: ${exprError.message}`));
      }
    }
  }
}

function formatResult(result) {
  if (result === undefined) return c('dim', 'undefined');
  if (result === null) return c('dim', 'null');
  if (typeof result === 'bigint') return c('yellow', result.toString() + 'n');
  if (typeof result === 'string') return c('green', `"${result}"`);
  if (typeof result === 'number') return c('yellow', result.toString());
  if (typeof result === 'boolean') return c('magenta', result.toString());
  if (Array.isArray(result)) {
    if (result.length === 0) return '[]';
    if (result.length <= 5) {
      return '[\n  ' + result.map(formatResult).join(',\n  ') + '\n]';
    }
    return `Array(${result.length}) [${formatResult(result[0])}, ...]`;
  }
  if (typeof result === 'object') {
    try {
      return JSON.stringify(result, (k, v) => typeof v === 'bigint' ? v.toString() + 'n' : v, 2);
    } catch {
      return result.toString();
    }
  }
  return String(result);
}

// ============================================================================
// MAIN MENU
// ============================================================================

async function mainMenu() {
  while (true) {
    clear();
    console.log(c('bright', '╔════════════════════════════════════════════════╗'));
    console.log(c('bright', '║     🔗 Interactive Blockchain CLI              ║'));
    console.log(c('bright', '╚════════════════════════════════════════════════╝'));
    console.log(`\n${c('dim', `Connected to: ${RPC_URL}`)}`);
    console.log(`${c('dim', `Account: ${selectedAccount.name} (${selectedAccount.address.slice(0, 10)}...)`)}`);
    
    console.log(c('cyan', '\n📊 Explore'));
    console.log('  1. Network info');
    console.log('  2. Block details');
    console.log('  3. Account balances');
    console.log('  4. Transaction lookup');
    
    console.log(c('cyan', '\n💸 Transact'));
    console.log('  5. Select account');
    console.log('  6. Send ETH');
    
    if (CONTRACT_ADDRESS) {
      console.log(c('cyan', '\n📜 Contract'));
      console.log('  7. Contract interaction');
    }
    
    console.log(c('cyan', '\n🧪 Advanced'));
    console.log('  8. Playground (JS console)');
    console.log('  9. Contract Builder Lab');
    
    console.log(c('cyan', '\n👤 Identity'));
    console.log('  10. Account Manager (generate/import wallet)');
    
    console.log(c('dim', '\n  0. Exit'));
    
    const choice = await ask('\nSelect option: ');
    
    switch (choice) {
      case '1': await showNetworkInfo(); await pause(); break;
      case '2': await showBlockDetails(); await pause(); break;
      case '3': await showAccountBalances(); await pause(); break;
      case '4': await lookupTransaction(); await pause(); break;
      case '5': await selectAccount(); await pause(); break;
      case '6': await sendTransaction(); await pause(); break;
      case '7': await contractInteraction(); await pause(); break;
      case '8': await playground(); break;
      case '9': await builderWizard(rl); await pause(); break;
      case '10': await accountManager(rl); break;
      case '0':
      case 'exit':
      case 'quit':
        console.log('\nGoodbye! 👋\n');
        rl.close();
        process.exit(0);
    }
  }
}

// ============================================================================
// STARTUP
// ============================================================================

async function init() {
  console.log(c('cyan', '\n🔗 Connecting to blockchain...\n'));
  
  try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    await provider.getBlockNumber(); // Test connection
    
    wallet = new ethers.Wallet(selectedAccount.key, provider);
    
    if (CONTRACT_ADDRESS && CONTRACT_ADDRESS.length === 42) {
      const code = await provider.getCode(CONTRACT_ADDRESS);
      if (code !== '0x') {
        contract = new ethers.Contract(CONTRACT_ADDRESS, POS_ABI, wallet);
        console.log(c('green', '✓ Contract connected'));
      }
    }
    
    console.log(c('green', '✓ Connected to blockchain'));
    await new Promise(r => setTimeout(r, 1000));
    
    await mainMenu();
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(c('red', '✗ Could not connect to blockchain'));
      console.log(`\n  Make sure the node is running at: ${RPC_URL}`);
      console.log('  Set a different URL with: export RPC_URL="http://..."');
    } else {
      console.log(c('red', `✗ Error: ${error.message}`));
    }
    process.exit(1);
  }
}

init();
