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
  // MetaMask requires nativeCurrency.decimals === 18 when adding a chain,
  // even though Arc's USDC gas token is 6-decimal on-chain. Wallet-side
  // display uses 18; contract-level USDC amounts remain 6 decimals.
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arc Testnet Explorer",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,
});
