/**
 * IntroView - Orientation/Introduction view
 * 
 * Displays the welcome screen and overview of the Ethereum lab
 */

import { INTRO_SECTIONS } from '../constants/content';

export function IntroView({ onNext }) {
  return (
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
      <button className="primary-btn next-btn" onClick={onNext}>
        Continue to Basics →
      </button>
    </div>
  );
}

export default IntroView;

