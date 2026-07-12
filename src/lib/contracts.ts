import type { Address } from "viem";

/**
 * Deployed ArcPilot contract on Arc Testnet.
 * See contracts/ArcPilot.sol for the source.
 */
export const ARCPILOT_ADDRESS: Address =
  "0x4BCC55E4350dDFE4e9524988fF30b9364BEC0E06";

export const ARCPILOT_ABI = [
  {
    type: "function",
    name: "pay",
    stateMutability: "payable",
    inputs: [
      { name: "to", type: "address" },
      { name: "tag", type: "bytes32" },
      { name: "memo", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "payBatch",
    stateMutability: "payable",
    inputs: [
      { name: "recipients", type: "address[]" },
      { name: "amounts", type: "uint256[]" },
      { name: "tag", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "paused",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bool" }],
  },
  {
    type: "event",
    name: "Payment",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "tag", type: "bytes32", indexed: true },
      { name: "memo", type: "string", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "BatchPayment",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "totalAmount", type: "uint256", indexed: false },
      { name: "count", type: "uint256", indexed: false },
      { name: "tag", type: "bytes32", indexed: true },
    ],
    anonymous: false,
  },
] as const;
