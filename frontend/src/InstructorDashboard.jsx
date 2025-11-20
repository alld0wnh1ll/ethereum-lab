import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

const InstructorDashboard = ({ provider, posAddress }) => {
    const [students, setStudents] = useState([])
    const [contractBalance, setContractBalance] = useState('0')
    const [totalStaked, setTotalStaked] = useState('0')
    const [recentActivity, setRecentActivity] = useState([])
    
    useEffect(() => {
        if (!provider || !posAddress || posAddress.length !== 42) {
            console.log("Waiting for valid contract address...")
            return
        }
        
        const fetchData = async () => {
            try {
                // Get contract instance
                const posContract = new ethers.Contract(
                    posAddress,
                    [
                        "function totalStaked() view returns (uint256)",
                        "function stakes(address) view returns (uint256)",
                        "event Staked(address indexed user, uint256 amount)",
                        "event Withdrawn(address indexed user, uint256 amount, uint256 reward)",
                        "event NewMessage(address indexed sender, string message, uint256 timestamp)"
                    ],
                    provider
                )
                
                // Get total staked
                const total = await posContract.totalStaked()
                setTotalStaked(ethers.formatEther(total))
                
                // Get contract balance
                const balance = await provider.getBalance(posAddress)
                setContractBalance(ethers.formatEther(balance))
                
                // Get all events to identify unique students
                const [stakeEvents, withdrawEvents, messageEvents] = await Promise.all([
                    posContract.queryFilter(posContract.filters.Staked()),
                    posContract.queryFilter(posContract.filters.Withdrawn()),
                    posContract.queryFilter(posContract.filters.NewMessage())
                ])
                
                // Collect unique addresses
                const addressSet = new Set()
                const activityMap = new Map()
                
                stakeEvents.forEach(e => {
                    addressSet.add(e.args.user)
                    if (!activityMap.has(e.args.user)) {
                        activityMap.set(e.args.user, { stakes: 0, messages: 0, withdrawals: 0 })
                    }
                    activityMap.get(e.args.user).stakes++
                })
                
                withdrawEvents.forEach(e => {
                    addressSet.add(e.args.user)
                    if (!activityMap.has(e.args.user)) {
                        activityMap.set(e.args.user, { stakes: 0, messages: 0, withdrawals: 0 })
                    }
                    activityMap.get(e.args.user).withdrawals++
                })
                
                messageEvents.forEach(e => {
                    addressSet.add(e.args.sender)
                    if (!activityMap.has(e.args.sender)) {
                        activityMap.set(e.args.sender, { stakes: 0, messages: 0, withdrawals: 0 })
                    }
                    activityMap.get(e.args.sender).messages++
                })
                
                // Get current balance and stake for each student
                const studentData = await Promise.all(
                    Array.from(addressSet).map(async (address) => {
                        const [balance, stake] = await Promise.all([
                            provider.getBalance(address),
                            posContract.stakes(address)
                        ])
                        
                        const activity = activityMap.get(address) || { stakes: 0, messages: 0, withdrawals: 0 }
                        
                        return {
                            address,
                            balance: ethers.formatEther(balance),
                            stake: ethers.formatEther(stake),
                            ...activity
                        }
                    })
                )
                
                // Sort by activity (most active first)
                studentData.sort((a, b) => {
                    const aTotal = a.stakes + a.messages + a.withdrawals
                    const bTotal = b.stakes + b.messages + b.withdrawals
                    return bTotal - aTotal
                })
                
                setStudents(studentData)
                
                // Collect recent activity (last 10 events)
                const allEvents = [
                    ...stakeEvents.map(e => ({ type: 'stake', address: e.args.user, amount: ethers.formatEther(e.args.amount), block: e.blockNumber })),
                    ...withdrawEvents.map(e => ({ type: 'withdraw', address: e.args.user, amount: ethers.formatEther(e.args.amount), reward: ethers.formatEther(e.args.reward), block: e.blockNumber })),
                    ...messageEvents.map(e => ({ type: 'message', address: e.args.sender, message: e.args.message, block: e.blockNumber }))
                ]
                
                allEvents.sort((a, b) => b.block - a.block)
                setRecentActivity(allEvents.slice(0, 10))
                
            } catch (error) {
                console.error("Error fetching instructor data:", error)
            }
        }
        
        // Initial fetch
        fetchData()
        
        // Refresh every 3 seconds
        const interval = setInterval(fetchData, 3000)
        
        return () => clearInterval(interval)
    }, [provider, posAddress])
    
    const formatAddress = (addr) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`
    }
    
    const getActivityIcon = (type) => {
        switch(type) {
            case 'stake': return '💰'
            case 'withdraw': return '🏦'
            case 'message': return '💬'
            default: return '📝'
        }
    }
    
    return (
        <div className="instructor-dashboard">
            <h2>🎓 Instructor Dashboard</h2>
            
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
    )
}

export default InstructorDashboard
