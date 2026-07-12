import { defineChain } from "viem";

/**
 * Arc Testnet — Circle's Arc network testnet.
 *
 * USDC is the native gas token on Arc (6 decimals).
 * Update ONLY this file when Arc network parameters change — every
 * other module in the app reads Arc network info from here.
 */
export const ARC_CHAIN_ID = 5042002 as const;

export const arcTestnet = defineChain({
  id: ARC_CHAIN_ID,
  name: "Arc Testnet",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 6 },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arc Testnet Explorer",
      url: "https://explorer.testnet.arc.network",
    },
  },
  testnet: true,
});
