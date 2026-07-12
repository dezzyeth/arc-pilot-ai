import { defineChain } from "viem";

/**
 * Arc Testnet (Circle Arc Sepolia).
 *
 * These values follow the user's confirmed "421614-like" configuration.
 * When official Arc Sepolia parameters change, update ONLY this file — every
 * other module in the app reads Arc network info from here.
 */
export const ARC_CHAIN_ID = 421614 as const;

export const arcTestnet = defineChain({
  id: ARC_CHAIN_ID,
  name: "Arc Sepolia",
  nativeCurrency: { name: "Arc", symbol: "ARC", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://sepolia-rollup.arbitrum.io/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arc Explorer",
      url: "https://sepolia.arbiscan.io",
    },
  },
  testnet: true,
});
