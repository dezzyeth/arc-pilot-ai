// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ArcPilot
 * @notice Minimal on-chain companion for the ArcPilot AI Finance Copilot.
 *         Deployed EXCLUSIVELY on Arc Testnet (chainId 421614).
 *
 *         Features:
 *         - Send native ARC with an optional memo/tag (indexed for the copilot).
 *         - Batch multi-send in a single transaction.
 *         - Emergency pause by owner.
 *
 *         No admin custody: funds always flow directly from msg.sender to
 *         recipients within the same call. The contract never holds balance
 *         beyond what a caller intentionally overpays (refunded in-tx).
 */
contract ArcPilot {
    // ─────────────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────────────
    error NotOwner();
    error Paused();
    error LengthMismatch();
    error EmptyBatch();
    error ZeroRecipient();
    error ValueMismatch(uint256 sent, uint256 required);
    error TransferFailed(address to, uint256 amount);

    // ─────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────
    event Payment(
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes32 indexed tag,
        string memo
    );
    event BatchPayment(address indexed from, uint256 totalAmount, uint256 count, bytes32 indexed tag);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event PausedSet(bool paused);

    // ─────────────────────────────────────────────────────────────────────
    // Storage
    // ─────────────────────────────────────────────────────────────────────
    address public owner;
    bool public paused;

    // ─────────────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────────────
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert Paused();
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Core: send with memo
    // ─────────────────────────────────────────────────────────────────────

    /**
     * @notice Send native ARC to `to` with an optional memo/tag.
     * @param to      Recipient address.
     * @param tag     Short indexed tag (e.g. keccak of "invoice-123"); use bytes32(0) for none.
     * @param memo    Free-form human-readable memo (kept in calldata, emitted in event).
     */
    function pay(address to, bytes32 tag, string calldata memo)
        external
        payable
        whenNotPaused
    {
        if (to == address(0)) revert ZeroRecipient();
        if (msg.value == 0) revert ValueMismatch(0, 1);

        _safeSend(to, msg.value);
        emit Payment(msg.sender, to, msg.value, tag, memo);
    }

    /**
     * @notice Batch send native ARC to multiple recipients atomically.
     * @param recipients List of recipient addresses.
     * @param amounts    Matching list of amounts (wei). Sum must equal msg.value.
     * @param tag        Optional indexed batch tag.
     */
    function payBatch(
        address[] calldata recipients,
        uint256[] calldata amounts,
        bytes32 tag
    ) external payable whenNotPaused {
        uint256 len = recipients.length;
        if (len == 0) revert EmptyBatch();
        if (len != amounts.length) revert LengthMismatch();

        uint256 total;
        for (uint256 i = 0; i < len; ) {
            address to = recipients[i];
            uint256 amt = amounts[i];
            if (to == address(0)) revert ZeroRecipient();
            total += amt;
            _safeSend(to, amt);
            emit Payment(msg.sender, to, amt, tag, "");
            unchecked { ++i; }
        }

        if (total != msg.value) revert ValueMismatch(msg.value, total);
        emit BatchPayment(msg.sender, total, len, tag);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Owner controls
    // ─────────────────────────────────────────────────────────────────────

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PausedSet(_paused);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroRecipient();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Internal
    // ─────────────────────────────────────────────────────────────────────

    function _safeSend(address to, uint256 amount) internal {
        (bool ok, ) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed(to, amount);
    }

    /// @dev Reject stray transfers so funds cannot be trapped.
    receive() external payable {
        revert("Use pay()");
    }
}
