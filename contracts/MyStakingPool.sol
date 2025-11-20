// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MyStakingPool {
    mapping(address => uint256) public stakes;
    mapping(address => uint256) public stakingTime;
    uint256 public totalStaked;
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);
    
    function stake() external payable {
        require(msg.value >= 1 ether, "Minimum 1 ETH");
        require(stakes[msg.sender] == 0, "Already staking");
        
        stakes[msg.sender] = msg.value;
        stakingTime[msg.sender] = block.timestamp;
        totalStaked += msg.value;
        
        emit Staked(msg.sender, msg.value);
    }
    
    function calculateReward(address user) public view returns (uint256) {
        if (stakes[user] == 0) return 0;
        
        uint256 duration = block.timestamp - stakingTime[user];
        // 5% APR = 0.05 / 365 days / 86400 seconds
        uint256 reward = (stakes[user] * duration * 5) / (365 * 86400 * 100);
        return reward;
    }
    
    function unstake() external {
        require(stakes[msg.sender] > 0, "Not staking");
        
        uint256 principal = stakes[msg.sender];
        uint256 reward = calculateReward(msg.sender);
        uint256 total = principal + reward;
        
        stakes[msg.sender] = 0;
        stakingTime[msg.sender] = 0;
        totalStaked -= principal;
        
        (bool sent, ) = msg.sender.call{value: total}("");
        require(sent, "Transfer failed");
        
        emit Unstaked(msg.sender, principal, reward);
    }
    
    receive() external payable {}
}

