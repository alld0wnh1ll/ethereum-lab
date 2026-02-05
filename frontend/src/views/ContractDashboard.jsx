/**
 * Contract Dashboard - Live display of deployed contracts and their status
 * 
 * Perfect for instructors to project during class to show:
 * - Deployed contracts
 * - Live voting results
 * - Contract states
 */

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// Contract ABIs for different types
const ABIS = {
  classroomVote: [
    'function getResults() view returns (string, string, uint256, string, uint256, uint256, bool)',
    'function votesForA() view returns (uint256)',
    'function votesForB() view returns (uint256)',
    'function votingOpen() view returns (bool)',
    'function question() view returns (string)',
    'function optionA() view returns (string)',
    'function optionB() view returns (string)',
  ],
  voting: [
    'function getAllResults() view returns (string[] memory, uint256[] memory)',
    'function votingTitle() view returns (string)',
    'function votingClosed() view returns (bool)',
    'function getTotalVotes() view returns (uint256)',
  ],
  crowdfunding: [
    'function getCampaignStatus() view returns (string, uint256, uint256, uint256, uint256, bool, bool)',
    'function campaignName() view returns (string)',
    'function goalAmount() view returns (uint256)',
    'function totalRaised() view returns (uint256)',
    'function goalReached() view returns (bool)',
  ],
  houseSale: [
    'function currentState() view returns (uint8)',
    'function propertyAddress() view returns (string)',
    'function salePrice() view returns (uint256)',
    'function seller() view returns (address)',
    'function buyer() view returns (address)',
  ],
  vehicleTitle: [
    'function getVehicleInfo() view returns (string, string, string, uint256, address, uint8)',
    'function vin() view returns (string)',
    'function currentOwner() view returns (address)',
  ],
  eventTickets: [
    'function getEventInfo() view returns (string, string, uint256, uint256, uint256, bool)',
    'function eventName() view returns (string)',
    'function ticketsSold() view returns (uint256)',
    'function maxSupply() view returns (uint256)',
  ],
};

// Template icons
const ICONS = {
  classroomVote: '🎓',
  voting: '🗳️',
  crowdfunding: '💰',
  houseSale: '🏠',
  vehicleTitle: '🚗',
  eventTickets: '🎟️',
};

// State labels for House Sale
const HOUSE_STATES = ['Listed', 'Deposit Paid', 'Inspection Passed', 'Completed', 'Cancelled'];

export default function ContractDashboard({ rpcUrl }) {
  const [provider, setProvider] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [contractData, setContractData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Initialize provider
  useEffect(() => {
    if (rpcUrl) {
      try {
        const p = new ethers.JsonRpcProvider(rpcUrl);
        setProvider(p);
        setError(null);
      } catch (e) {
        setError(`Failed to connect: ${e.message}`);
      }
    }
  }, [rpcUrl]);

  // Fetch deployments from API or localStorage
  const fetchDeployments = useCallback(async () => {
    try {
      // Try to fetch from backend API first
      const response = await fetch('/api/deployments');
      if (response.ok) {
        const data = await response.json();
        setDeployments(data);
        return;
      }
    } catch (e) {
      // API not available, try localStorage
    }

    // Fallback: check localStorage for manually entered deployments
    const stored = localStorage.getItem('contract-deployments');
    if (stored) {
      setDeployments(JSON.parse(stored));
    }
  }, []);

  // Fetch contract data
  const fetchContractData = useCallback(async () => {
    if (!provider || deployments.length === 0) return;

    const data = {};

    for (const deployment of deployments) {
      const { address, template } = deployment;
      const abi = ABIS[template];

      if (!abi) continue;

      try {
        const contract = new ethers.Contract(address, abi, provider);
        
        // Check if contract exists
        const code = await provider.getCode(address);
        if (code === '0x') {
          data[address] = { error: 'Contract not found (node may have restarted)' };
          continue;
        }

        // Fetch data based on template type
        switch (template) {
          case 'classroomVote': {
            const results = await contract.getResults();
            data[address] = {
              type: 'classroomVote',
              question: results[0],
              optionA: results[1],
              votesA: Number(results[2]),
              optionB: results[3],
              votesB: Number(results[4]),
              totalVoters: Number(results[5]),
              votingOpen: results[6],
            };
            break;
          }
          case 'voting': {
            const [names, votes] = await contract.getAllResults();
            const title = await contract.votingTitle();
            const closed = await contract.votingClosed();
            data[address] = {
              type: 'voting',
              title,
              options: names.map((name, i) => ({ name, votes: Number(votes[i]) })),
              closed,
            };
            break;
          }
          case 'crowdfunding': {
            const status = await contract.getCampaignStatus();
            data[address] = {
              type: 'crowdfunding',
              name: status[0],
              goal: ethers.formatEther(status[1]),
              raised: ethers.formatEther(status[2]),
              contributors: Number(status[4]),
              goalReached: status[5],
              withdrawn: status[6],
            };
            break;
          }
          case 'houseSale': {
            const state = await contract.currentState();
            const propertyAddress = await contract.propertyAddress();
            const price = await contract.salePrice();
            data[address] = {
              type: 'houseSale',
              propertyAddress,
              price: ethers.formatEther(price),
              state: HOUSE_STATES[Number(state)] || 'Unknown',
            };
            break;
          }
          case 'vehicleTitle': {
            const info = await contract.getVehicleInfo();
            data[address] = {
              type: 'vehicleTitle',
              vin: info[0],
              make: info[1],
              model: info[2],
              year: Number(info[3]),
              owner: info[4],
            };
            break;
          }
          case 'eventTickets': {
            const info = await contract.getEventInfo();
            data[address] = {
              type: 'eventTickets',
              name: info[0],
              date: info[1],
              price: ethers.formatEther(info[2]),
              sold: Number(info[3]),
              remaining: Number(info[4]),
              cancelled: info[5],
            };
            break;
          }
        }
      } catch (e) {
        data[address] = { error: e.message };
      }
    }

    setContractData(data);
    setLastUpdate(new Date());
    setLoading(false);
  }, [provider, deployments]);

  // Initial load
  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  // Fetch data when deployments change
  useEffect(() => {
    if (deployments.length > 0) {
      fetchContractData();
    } else {
      setLoading(false);
    }
  }, [deployments, fetchContractData]);

  // Auto-refresh every 3 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchContractData, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchContractData]);

  // Manual add deployment
  const addDeployment = () => {
    const address = prompt('Enter contract address (0x...):');
    if (!address || !address.startsWith('0x')) return;

    const template = prompt('Enter template type (classroomVote, voting, crowdfunding, houseSale, vehicleTitle, eventTickets):');
    if (!template || !ABIS[template]) {
      alert('Invalid template type');
      return;
    }

    const name = prompt('Enter a name for this contract:') || template;

    const newDeployment = {
      contractName: name,
      address,
      template,
      timestamp: new Date().toISOString(),
    };

    const updated = [...deployments, newDeployment];
    setDeployments(updated);
    localStorage.setItem('contract-deployments', JSON.stringify(updated));
  };

  // Render contract card based on type
  const renderContractCard = (deployment) => {
    const data = contractData[deployment.address];
    const icon = ICONS[deployment.template] || '📜';

    return (
      <div key={deployment.address} style={styles.card}>
        <div style={styles.cardHeader}>
          <span style={styles.icon}>{icon}</span>
          <div>
            <h3 style={styles.cardTitle}>{deployment.contractName}</h3>
            <code style={styles.address}>{deployment.address}</code>
          </div>
        </div>

        {!data ? (
          <div style={styles.loading}>Loading...</div>
        ) : data.error ? (
          <div style={styles.error}>⚠️ {data.error}</div>
        ) : (
          renderContractData(data)
        )}
      </div>
    );
  };

  // Render data based on contract type
  const renderContractData = (data) => {
    switch (data.type) {
      case 'classroomVote':
        return (
          <div style={styles.voteContainer}>
            <div style={styles.question}>{data.question}</div>
            <div style={styles.statusBadge(data.votingOpen)}>
              {data.votingOpen ? '🟢 VOTING OPEN' : '🔴 VOTING CLOSED'}
            </div>
            <div style={styles.voteResults}>
              <div style={styles.voteOption}>
                <div style={styles.optionLabel}>{data.optionA}</div>
                <div style={styles.voteBar}>
                  <div 
                    style={styles.voteBarFill(data.votesA, data.votesA + data.votesB, '#4CAF50')} 
                  />
                </div>
                <div style={styles.voteCount}>{data.votesA} votes</div>
              </div>
              <div style={styles.voteOption}>
                <div style={styles.optionLabel}>{data.optionB}</div>
                <div style={styles.voteBar}>
                  <div 
                    style={styles.voteBarFill(data.votesB, data.votesA + data.votesB, '#2196F3')} 
                  />
                </div>
                <div style={styles.voteCount}>{data.votesB} votes</div>
              </div>
            </div>
            <div style={styles.totalVoters}>
              Total Voters: <strong>{data.totalVoters}</strong>
            </div>
          </div>
        );

      case 'voting':
        return (
          <div>
            <div style={styles.question}>{data.title}</div>
            <div style={styles.statusBadge(!data.closed)}>
              {data.closed ? '🔴 CLOSED' : '🟢 OPEN'}
            </div>
            {data.options.map((opt, i) => (
              <div key={i} style={styles.voteOption}>
                <div style={styles.optionLabel}>{opt.name}</div>
                <div style={styles.voteCount}>{opt.votes} votes</div>
              </div>
            ))}
          </div>
        );

      case 'crowdfunding':
        const progress = data.goal > 0 ? (parseFloat(data.raised) / parseFloat(data.goal)) * 100 : 0;
        return (
          <div>
            <div style={styles.question}>{data.name}</div>
            <div style={styles.progressContainer}>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${Math.min(progress, 100)}%` }} />
              </div>
              <div style={styles.progressText}>
                {data.raised} / {data.goal} ETH ({progress.toFixed(1)}%)
              </div>
            </div>
            <div>{data.contributors} contributors</div>
            {data.goalReached && <div style={styles.success}>✅ Goal Reached!</div>}
          </div>
        );

      case 'houseSale':
        return (
          <div>
            <div style={styles.question}>{data.propertyAddress}</div>
            <div style={styles.stat}>Price: <strong>{data.price} ETH</strong></div>
            <div style={styles.statusBadge(data.state !== 'Cancelled')}>
              {data.state}
            </div>
          </div>
        );

      case 'vehicleTitle':
        return (
          <div>
            <div style={styles.stat}>{data.year} {data.make} {data.model}</div>
            <div style={styles.stat}>VIN: <code>{data.vin}</code></div>
            <div style={styles.stat}>Owner: <code style={styles.address}>{data.owner}</code></div>
          </div>
        );

      case 'eventTickets':
        return (
          <div>
            <div style={styles.question}>{data.name}</div>
            <div style={styles.stat}>Date: {data.date}</div>
            <div style={styles.stat}>Price: {data.price} ETH</div>
            <div style={styles.stat}>Sold: {data.sold} / {data.sold + data.remaining}</div>
            {data.cancelled && <div style={styles.error}>❌ Event Cancelled</div>}
          </div>
        );

      default:
        return <div>Unknown contract type</div>;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📊 Contract Dashboard</h1>
        <div style={styles.controls}>
          <label style={styles.checkbox}>
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={(e) => setAutoRefresh(e.target.checked)} 
            />
            Auto-refresh
          </label>
          <button onClick={fetchContractData} style={styles.button}>
            🔄 Refresh Now
          </button>
          <button onClick={addDeployment} style={styles.button}>
            ➕ Add Contract
          </button>
        </div>
        {lastUpdate && (
          <div style={styles.lastUpdate}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>Loading contracts...</div>
      ) : deployments.length === 0 ? (
        <div style={styles.empty}>
          <h2>No contracts found</h2>
          <p>Deploy a contract using the CLI, or click "Add Contract" to track an existing one.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {deployments.map(renderContractCard)}
        </div>
      )}
    </div>
  );
}

// Styles
const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    marginBottom: '30px',
    borderBottom: '2px solid #eee',
    paddingBottom: '20px',
  },
  title: {
    margin: '0 0 15px 0',
    fontSize: '2rem',
  },
  controls: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    cursor: 'pointer',
  },
  button: {
    padding: '8px 16px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
  },
  lastUpdate: {
    marginTop: '10px',
    color: '#666',
    fontSize: '14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '20px',
  },
  card: {
    border: '1px solid #ddd',
    borderRadius: '12px',
    padding: '20px',
    background: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid #eee',
  },
  icon: {
    fontSize: '2rem',
  },
  cardTitle: {
    margin: '0 0 5px 0',
    fontSize: '1.2rem',
  },
  address: {
    fontSize: '11px',
    color: '#666',
    wordBreak: 'break-all',
  },
  question: {
    fontSize: '1.1rem',
    fontWeight: '500',
    marginBottom: '15px',
  },
  statusBadge: (isActive) => ({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    background: isActive ? '#e8f5e9' : '#ffebee',
    color: isActive ? '#2e7d32' : '#c62828',
    marginBottom: '15px',
  }),
  voteContainer: {},
  voteResults: {
    marginTop: '10px',
  },
  voteOption: {
    marginBottom: '15px',
  },
  optionLabel: {
    fontWeight: '500',
    marginBottom: '5px',
  },
  voteBar: {
    height: '24px',
    background: '#eee',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '5px',
  },
  voteBarFill: (votes, total, color) => ({
    height: '100%',
    width: total > 0 ? `${(votes / total) * 100}%` : '0%',
    background: color,
    borderRadius: '12px',
    transition: 'width 0.5s ease',
    minWidth: votes > 0 ? '20px' : '0',
  }),
  voteCount: {
    fontSize: '14px',
    color: '#666',
  },
  totalVoters: {
    marginTop: '15px',
    padding: '10px',
    background: '#f5f5f5',
    borderRadius: '8px',
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: '15px',
  },
  progressBar: {
    height: '20px',
    background: '#eee',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
    transition: 'width 0.5s ease',
  },
  progressText: {
    marginTop: '5px',
    fontSize: '14px',
  },
  stat: {
    marginBottom: '8px',
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#666',
  },
  empty: {
    padding: '60px',
    textAlign: 'center',
    color: '#666',
  },
  error: {
    color: '#c62828',
    padding: '10px',
    background: '#ffebee',
    borderRadius: '8px',
  },
  errorBanner: {
    padding: '15px',
    background: '#ffebee',
    color: '#c62828',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  success: {
    color: '#2e7d32',
    fontWeight: '600',
    marginTop: '10px',
  },
};
