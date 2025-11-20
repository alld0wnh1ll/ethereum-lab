// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract PoSSimulator {
    // --- PoS Logic ---
    mapping(address => uint256) public stakes;
    mapping(address => uint256) public stakingStartTime;
    uint256 public totalStaked;
    
    uint256 public constant MIN_STAKE = 1 ether;
    uint256 public constant REWARD_RATE = 10; 
    
    event Staked(address indexed validator, uint256 amount);
    event Withdrawn(address indexed validator, uint256 amount, uint256 reward);

    // --- Chat Logic ---
    event NewMessage(address indexed sender, string message, uint256 timestamp);

    function sendMessage(string memory _msg) public {
        // Sending a message costs Gas, preventing spam!
        emit NewMessage(msg.sender, _msg, block.timestamp);
    }

    // --- PoS Functions ---
    function stake() public payable {
        require(msg.value >= MIN_STAKE, "Insufficent stake");
        require(stakes[msg.sender] == 0, "Already a validator");

        stakes[msg.sender] = msg.value;
        stakingStartTime[msg.sender] = block.timestamp;
        totalStaked += msg.value;
        
        emit Staked(msg.sender, msg.value);
    }

    function calculateReward(address validator) public view returns (uint256) {
        if (stakes[validator] == 0) return 0;
        uint256 timeStaked = block.timestamp - stakingStartTime[validator];
        uint256 reward = (stakes[validator] * timeStaked) / 1000; 
        return reward;
    }

    function withdraw() public {
        require(stakes[msg.sender] > 0, "Not a validator");
        uint256 principal = stakes[msg.sender];
        uint256 reward = calculateReward(msg.sender);
        uint256 total = principal + reward;

        stakes[msg.sender] = 0;
        stakingStartTime[msg.sender] = 0;
        totalStaked -= principal;

        (bool sent, ) = msg.sender.call{value: total}("");
        require(sent, "Failed to send ETH");

        emit Withdrawn(msg.sender, principal, reward);
    }

    receive() external payable {}
}
