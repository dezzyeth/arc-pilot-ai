import type { Address } from "viem";

/**
 * Treasury sink for testnet demo flows (chat fee, stake commitment).
 *
 * Because the deployed ArcPilot contract is a pass-through (`pay` forwards
 * value straight to `to`), sending to your own address routes funds right
 * back to you. Routing to this sink address instead makes the wallet balance
 * actually decrease, which matches user expectation for a paid fee / stake.
 *
 * NOTE: this address does not custody funds — a real refundable stake needs
 * ArcPilotVault.sol to be deployed. For the testnet demo this is intentional.
 */
export const TREASURY_ADDRESS =
  "0x000000000000000000000000000000000000dEaD" as Address;
