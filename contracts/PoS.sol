// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

/**
 * @title PoSSimulator - Enhanced Educational Proof-of-Stake Simulator
 * @notice Teaches PoS concepts including staking, slashing, unbonding, attestations, and validator selection
 * @dev For educational purposes only - not production ready
 */
contract PoSSimulator {
    // ==================== STATE VARIABLES ====================
    
    // --- Instructor (deployer has special privileges) ---
    address public instructor;
    
    // --- Staking State ---
    mapping(address => uint256) public stakes;
    mapping(address => uint256) public stakingStartTime;
    uint256 public totalStaked;
    
    // --- Validator List (for weighted selection) ---
    address[] public validatorList;
    mapping(address => uint256) public validatorIndex; // 1-indexed (0 means not in list)
    mapping(address => uint256) public blocksProposed;
    
    // --- Unbonding State ---
    mapping(address => uint256) public withdrawalRequestTime;
    
    // --- Slashing State ---
    mapping(address => uint256) public slashCount;
    
    // --- Attestation State ---
    uint256 public currentEpoch;
    uint256 public lastEpochTime;
    mapping(address => uint256) public lastAttestationEpoch;
    mapping(address => uint256) public missedAttestations;
    
    // ==================== CONSTANTS ====================
    
    uint256 public constant MIN_STAKE = 1 ether;
    uint256 public constant UNBONDING_PERIOD = 60; // 60 seconds for demo (real: ~27 hours)
    uint256 public constant MIN_STAKE_DURATION = 30; // 30 seconds minimum stake time
    uint256 public constant EPOCH_DURATION = 30; // 30 seconds per epoch
    uint256 public constant SLASH_PENALTY_PERCENT = 5; // 5% slash per offense
    uint256 public constant ATTESTATION_PENALTY_PERCENT = 1; // 0.1% = 1/1000 for missed attestation
    uint256 public constant BLOCK_REWARD = 0.01 ether; // Reward for proposing a block
    
    // APY targeting ~5% annually (adjusted for demo speed)
    // In demo: rewards accumulate faster so students see results quickly
    uint256 public constant SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    uint256 public constant TARGET_APY = 5; // 5%
    
    // ==================== EVENTS ====================
    
    // --- Staking Events ---
    event Staked(address indexed validator, uint256 amount);
    event Withdrawn(address indexed validator, uint256 amount, uint256 reward);
    event WithdrawalRequested(address indexed validator, uint256 unlockTime);
    
    // --- Slashing Events ---
    event Slashed(address indexed validator, uint256 amount, string reason);
    
    // --- Attestation Events ---
    event Attestation(address indexed validator, uint256 epoch);
    event AttestationMissed(address indexed validator, uint256 epoch, uint256 penalty);
    event EpochAdvanced(uint256 newEpoch, uint256 timestamp);
    
    // --- Block Proposal Events ---
    event BlockProposed(address indexed proposer, uint256 blockNumber, uint256 reward);
    
    // --- Chat Event ---
    event NewMessage(address indexed sender, string message, uint256 timestamp);

    // ==================== MODIFIERS ====================
    
    modifier onlyInstructor() {
        require(msg.sender == instructor, "Only instructor can call this");
        _;
    }
    
    modifier onlyValidator() {
        require(stakes[msg.sender] > 0, "Not a validator");
        _;
    }

    // ==================== CONSTRUCTOR ====================
    
    constructor() {
        instructor = msg.sender;
        lastEpochTime = block.timestamp;
        currentEpoch = 1;
    }

    // ==================== CHAT FUNCTION ====================
    
    function sendMessage(string memory _msg) public {
        // Sending a message costs Gas, preventing spam!
        emit NewMessage(msg.sender, _msg, block.timestamp);
    }

    // ==================== STAKING FUNCTIONS ====================
    
    /**
     * @notice Stake ETH to become a validator
     * @dev Minimum stake is 1 ETH, can only stake once (no topping up)
     */
    function stake() public payable {
        require(msg.value >= MIN_STAKE, "Minimum stake is 1 ETH");
        require(stakes[msg.sender] == 0, "Already a validator - withdraw first");

        stakes[msg.sender] = msg.value;
        stakingStartTime[msg.sender] = block.timestamp;
        totalStaked += msg.value;
        
        // Add to validator list
        validatorList.push(msg.sender);
        validatorIndex[msg.sender] = validatorList.length; // 1-indexed
        
        emit Staked(msg.sender, msg.value);
    }

    /**
     * @notice Calculate pending rewards with dilution effect
     * @param validator Address of the validator
     * @return Pending reward amount in wei
     */
    function calculateReward(address validator) public view returns (uint256) {
        if (stakes[validator] == 0) return 0;
        
        uint256 timeStaked = block.timestamp - stakingStartTime[validator];
        uint256 stakeAmount = stakes[validator];
        
        // Base reward: proportional to stake and time
        // Formula: (stake * APY * time) / (100 * SECONDS_PER_YEAR)
        // Adjusted for demo: multiply by 1000 to make rewards visible quickly
        uint256 baseReward = (stakeAmount * TARGET_APY * timeStaked * 1000) / (100 * SECONDS_PER_YEAR);
        
        // Dilution effect: if more is staked, individual rewards decrease
        // This simulates real PoS where rewards are split among all validators
        if (totalStaked > 0 && totalStaked > stakeAmount) {
            uint256 validatorShare = (stakeAmount * 1e18) / totalStaked;
            baseReward = (baseReward * validatorShare) / 1e18;
        }
        
        return baseReward;
    }
    
    /**
     * @notice Get current APY estimate based on network state
     * @return Current APY percentage (multiplied by 100 for precision)
     */
    function getCurrentAPY() public view returns (uint256) {
        if (totalStaked == 0) return TARGET_APY * 100; // 500 = 5.00%
        
        // More validators = lower individual APY (dilution)
        uint256 validatorCount = validatorList.length;
        if (validatorCount == 0) return TARGET_APY * 100;
        
        // Simple dilution: APY decreases as more validators join
        // Base 5% divided by sqrt of validator count (approximated)
        uint256 dilutedAPY = (TARGET_APY * 100) / (1 + validatorCount / 5);
        return dilutedAPY > 50 ? dilutedAPY : 50; // Minimum 0.5% APY
    }

    /**
     * @notice Request to withdraw stake (starts unbonding period)
     */
    function requestWithdrawal() public onlyValidator {
        require(withdrawalRequestTime[msg.sender] == 0, "Withdrawal already requested");
        require(
            block.timestamp >= stakingStartTime[msg.sender] + MIN_STAKE_DURATION,
            "Must stake for minimum duration (30 seconds)"
        );
        
        withdrawalRequestTime[msg.sender] = block.timestamp;
        emit WithdrawalRequested(msg.sender, block.timestamp + UNBONDING_PERIOD);
    }
    
    /**
     * @notice Get time remaining until withdrawal is allowed
     * @param validator Address to check
     * @return Seconds remaining (0 if ready)
     */
    function getUnbondingTimeRemaining(address validator) public view returns (uint256) {
        if (withdrawalRequestTime[validator] == 0) return type(uint256).max; // Not requested
        
        uint256 unlockTime = withdrawalRequestTime[validator] + UNBONDING_PERIOD;
        if (block.timestamp >= unlockTime) return 0;
        return unlockTime - block.timestamp;
    }
    
    /**
     * @notice Get time remaining until minimum stake duration is met
     * @param validator Address to check
     * @return Seconds remaining (0 if eligible)
     */
    function getMinStakeDurationRemaining(address validator) public view returns (uint256) {
        if (stakes[validator] == 0) return 0;
        
        uint256 eligibleTime = stakingStartTime[validator] + MIN_STAKE_DURATION;
        if (block.timestamp >= eligibleTime) return 0;
        return eligibleTime - block.timestamp;
    }

    /**
     * @notice Complete withdrawal after unbonding period
     */
    function withdraw() public onlyValidator {
        require(withdrawalRequestTime[msg.sender] > 0, "Must request withdrawal first");
        require(
            block.timestamp >= withdrawalRequestTime[msg.sender] + UNBONDING_PERIOD,
            "Unbonding period not complete (60 seconds)"
        );
        
        uint256 principal = stakes[msg.sender];
        uint256 reward = calculateReward(msg.sender);
        uint256 total = principal + reward;

        // Clear state
        stakes[msg.sender] = 0;
        stakingStartTime[msg.sender] = 0;
        withdrawalRequestTime[msg.sender] = 0;
        totalStaked -= principal;
        
        // Remove from validator list
        _removeFromValidatorList(msg.sender);

        // Transfer funds
        (bool sent, ) = msg.sender.call{value: total}("");
        require(sent, "Failed to send ETH");

        emit Withdrawn(msg.sender, principal, reward);
    }
    
    /**
     * @notice Cancel a pending withdrawal request
     */
    function cancelWithdrawal() public onlyValidator {
        require(withdrawalRequestTime[msg.sender] > 0, "No withdrawal requested");
        withdrawalRequestTime[msg.sender] = 0;
    }

    // ==================== SLASHING FUNCTIONS ====================
    
    /**
     * @notice Slash a validator for misbehavior (instructor only)
     * @param validator Address of the validator to slash
     * @param reason Reason for slashing
     */
    function slash(address validator, string memory reason) public onlyInstructor {
        require(stakes[validator] > 0, "Address is not a validator");
        
        uint256 penalty = (stakes[validator] * SLASH_PENALTY_PERCENT) / 100;
        stakes[validator] -= penalty;
        totalStaked -= penalty;
        slashCount[validator]++;
        
        emit Slashed(validator, penalty, reason);
    }

    // ==================== ATTESTATION FUNCTIONS ====================
    
    /**
     * @notice Advance to next epoch (instructor or automatic)
     */
    function advanceEpoch() public {
        require(
            block.timestamp >= lastEpochTime + EPOCH_DURATION,
            "Epoch duration not elapsed (30 seconds)"
        );
        
        currentEpoch++;
        lastEpochTime = block.timestamp;
        emit EpochAdvanced(currentEpoch, block.timestamp);
    }
    
    /**
     * @notice Get time until next epoch
     * @return Seconds remaining
     */
    function getTimeUntilNextEpoch() public view returns (uint256) {
        uint256 nextEpochTime = lastEpochTime + EPOCH_DURATION;
        if (block.timestamp >= nextEpochTime) return 0;
        return nextEpochTime - block.timestamp;
    }
    
    /**
     * @notice Validators must attest each epoch to avoid penalties
     */
    function attest() public onlyValidator {
        // Auto-advance epoch if needed
        if (block.timestamp >= lastEpochTime + EPOCH_DURATION) {
            advanceEpoch();
        }
        
        require(
            lastAttestationEpoch[msg.sender] < currentEpoch,
            "Already attested this epoch"
        );
        
        lastAttestationEpoch[msg.sender] = currentEpoch;
        emit Attestation(msg.sender, currentEpoch);
    }
    
    /**
     * @notice Check if a validator has attested in the current epoch
     * @param validator Address to check
     * @return True if attested
     */
    function hasAttestedThisEpoch(address validator) public view returns (bool) {
        return lastAttestationEpoch[validator] >= currentEpoch;
    }
    
    /**
     * @notice Check for missed attestations and penalize (instructor only)
     */
    function checkMissedAttestations() public onlyInstructor {
        // Auto-advance epoch if needed
        if (block.timestamp >= lastEpochTime + EPOCH_DURATION) {
            advanceEpoch();
        }
        
        for (uint256 i = 0; i < validatorList.length; i++) {
            address validator = validatorList[i];
            
            // Check if they missed the previous epoch
            if (stakes[validator] > 0 && lastAttestationEpoch[validator] < currentEpoch - 1) {
                uint256 penalty = (stakes[validator] * ATTESTATION_PENALTY_PERCENT) / 1000;
                if (penalty > 0) {
                    stakes[validator] -= penalty;
                    totalStaked -= penalty;
                    missedAttestations[validator]++;
                    emit AttestationMissed(validator, currentEpoch - 1, penalty);
                }
            }
        }
    }

    // ==================== VALIDATOR SELECTION (BLOCK PROPOSAL) ====================
    
    /**
     * @notice Simulate a block proposal with weighted random selection
     * @dev Uses stake weight to determine probability of selection
     * @return Selected validator address
     */
    function simulateBlockProposal() public onlyInstructor returns (address) {
        require(totalStaked > 0, "No validators staking");
        require(validatorList.length > 0, "No validators in list");
        
        // Generate pseudo-random number based on block data
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            totalStaked,
            validatorList.length
        ))) % totalStaked;
        
        // Weighted selection: iterate through validators
        uint256 cumulative = 0;
        address selectedValidator = validatorList[0]; // Default to first
        
        for (uint256 i = 0; i < validatorList.length; i++) {
            cumulative += stakes[validatorList[i]];
            if (random < cumulative) {
                selectedValidator = validatorList[i];
                break;
            }
        }
        
        // Record the proposal
        blocksProposed[selectedValidator]++;
        
        emit BlockProposed(selectedValidator, block.number, BLOCK_REWARD);
        
        return selectedValidator;
    }
    
    /**
     * @notice Get the number of active validators
     * @return Count of validators with stake > 0
     */
    function getValidatorCount() public view returns (uint256) {
        return validatorList.length;
    }
    
    /**
     * @notice Get validator address by index
     * @param index Index in the validator list
     * @return Validator address
     */
    function getValidator(uint256 index) public view returns (address) {
        require(index < validatorList.length, "Index out of bounds");
        return validatorList[index];
    }
    
    /**
     * @notice Get all validator stats for a given address
     * @param validator Address to query
     * @return stakeAmount Current stake
     * @return rewardAmount Pending rewards
     * @return slashes Number of times slashed
     * @return blocks Number of blocks proposed
     * @return attestations Missed attestation count
     * @return unbondingTime Time remaining in unbonding (max if not requested)
     */
    function getValidatorStats(address validator) public view returns (
        uint256 stakeAmount,
        uint256 rewardAmount,
        uint256 slashes,
        uint256 blocks,
        uint256 attestations,
        uint256 unbondingTime
    ) {
        return (
            stakes[validator],
            calculateReward(validator),
            slashCount[validator],
            blocksProposed[validator],
            missedAttestations[validator],
            getUnbondingTimeRemaining(validator)
        );
    }

    // ==================== INTERNAL FUNCTIONS ====================
    
    /**
     * @dev Remove a validator from the list when they withdraw
     */
    function _removeFromValidatorList(address validator) internal {
        uint256 index = validatorIndex[validator];
        if (index == 0) return; // Not in list
        
        uint256 arrayIndex = index - 1; // Convert to 0-indexed
        uint256 lastIndex = validatorList.length - 1;
        
        if (arrayIndex != lastIndex) {
            // Swap with last element
            address lastValidator = validatorList[lastIndex];
            validatorList[arrayIndex] = lastValidator;
            validatorIndex[lastValidator] = index;
        }
        
        validatorList.pop();
        validatorIndex[validator] = 0;
    }

    // ==================== ADMIN FUNCTIONS ====================
    
    /**
     * @notice Transfer instructor role
     * @param newInstructor Address of new instructor
     */
    function transferInstructor(address newInstructor) public onlyInstructor {
        require(newInstructor != address(0), "Invalid address");
        instructor = newInstructor;
    }

    // ==================== RECEIVE ETH ====================
    
    receive() external payable {}
}
