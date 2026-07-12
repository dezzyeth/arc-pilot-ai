// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ArcPilotVault
 * @notice Custody contract for ArcPilot AI Copilot on Arc Testnet (chainId 5042002).
 *         Native currency = USDC (gas token).
 *
 *         - stake(): locks msg.value for 24h. unstake() returns it after lock expires.
 *         - payChatFee(): non-refundable fee that accrues to `treasury`.
 *         - Owner can rotate treasury and sweep accrued fees.
 *
 *         Unlike the previous ArcPilot contract, this one actually HOLDS funds,
 *         so your wallet balance decreases when you stake / pay fees.
 */
contract ArcPilotVault {
    // ── Errors ──────────────────────────────────────────────────────────
    error NotOwner();
    error ZeroValue();
    error NoStake();
    error StillLocked(uint256 unlocksAt);
    error TransferFailed();
    error AlreadyStaked();

    // ── Events ──────────────────────────────────────────────────────────
    event Staked(address indexed user, uint256 amount, uint256 unlocksAt);
    event Unstaked(address indexed user, uint256 amount);
    event ChatFeePaid(address indexed user, uint256 amount, uint256 messagesUnlocked);
    event TreasurySet(address indexed treasury);
    event FeesSwept(address indexed to, uint256 amount);

    // ── Storage ─────────────────────────────────────────────────────────
    struct StakePosition {
        uint128 amount;
        uint64  unlocksAt;
    }

    uint256 public constant LOCK_PERIOD = 24 hours;
    uint256 public constant CHAT_FEE = 0.01 ether; // 0.01 USDC (18-dec native)
    uint256 public constant MESSAGES_PER_FEE = 5;

    address public owner;
    address public treasury;
    uint256 public accruedFees;

    mapping(address => StakePosition) public stakes;
    mapping(address => uint256) public messagesRemaining;

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _treasury) {
        owner = msg.sender;
        treasury = _treasury == address(0) ? msg.sender : _treasury;
        emit TreasurySet(treasury);
    }

    // ── Staking ─────────────────────────────────────────────────────────
    function stake() external payable {
        if (msg.value == 0) revert ZeroValue();
        StakePosition memory p = stakes[msg.sender];
        if (p.amount != 0) revert AlreadyStaked();

        uint64 unlocksAt = uint64(block.timestamp + LOCK_PERIOD);
        stakes[msg.sender] = StakePosition({
            amount: uint128(msg.value),
            unlocksAt: unlocksAt
        });
        emit Staked(msg.sender, msg.value, unlocksAt);
    }

    function unstake() external {
        StakePosition memory p = stakes[msg.sender];
        if (p.amount == 0) revert NoStake();
        if (block.timestamp < p.unlocksAt) revert StillLocked(p.unlocksAt);

        delete stakes[msg.sender];
        (bool ok, ) = payable(msg.sender).call{value: p.amount}("");
        if (!ok) revert TransferFailed();
        emit Unstaked(msg.sender, p.amount);
    }

    function stakeOf(address user) external view returns (uint256 amount, uint256 unlocksAt) {
        StakePosition memory p = stakes[user];
        return (p.amount, p.unlocksAt);
    }

    // ── Chat fee ────────────────────────────────────────────────────────
    function payChatFee() external payable {
        if (msg.value != CHAT_FEE) revert ZeroValue();
        accruedFees += msg.value;
        messagesRemaining[msg.sender] += MESSAGES_PER_FEE;
        emit ChatFeePaid(msg.sender, msg.value, MESSAGES_PER_FEE);
    }

    function consumeMessage() external {
        // Optional on-chain accounting; the app can also track locally.
        uint256 left = messagesRemaining[msg.sender];
        if (left == 0) revert ZeroValue();
        unchecked { messagesRemaining[msg.sender] = left - 1; }
    }

    // ── Owner ───────────────────────────────────────────────────────────
    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroValue();
        treasury = _treasury;
        emit TreasurySet(_treasury);
    }

    function sweepFees() external onlyOwner {
        uint256 amt = accruedFees;
        if (amt == 0) revert ZeroValue();
        accruedFees = 0;
        (bool ok, ) = payable(treasury).call{value: amt}("");
        if (!ok) revert TransferFailed();
        emit FeesSwept(treasury, amt);
    }

    receive() external payable {
        // Accept idle deposits into fees so no funds get stuck.
        accruedFees += msg.value;
    }
}
