// x402 / Circle Nanopayments configuration (seller side).
//
// Arc Testnet uses USDC as its native gas token, so payments are sent
// as native-value transfers to the seller wallet (no ERC-20 hop).
//
// EDIT `SELLER_WALLET` below to your own Circle Gateway seller wallet
// address on Arc Testnet, OR override via the `X402_SELLER_WALLET`
// environment variable in production.

export const X402_NETWORK = "arc-testnet";
export const X402_VERSION = 1;

// Placeholder — replace with your Circle Gateway seller wallet.
const DEFAULT_SELLER_WALLET =
  "0x000000000000000000000000000000000000dEaD";

export function getSellerWallet(): string {
  const fromEnv =
    (typeof process !== "undefined" && process.env?.X402_SELLER_WALLET?.trim()) || "";
  return (fromEnv || DEFAULT_SELLER_WALLET).toLowerCase();
}

// Optional Circle x402 facilitator/verifier endpoint. If unset, the
// paywall runs in DEV mode: accepts any well-formed X-Payment header
// whose payTo matches the seller and amount >= route price. Set
// `X402_VERIFIER_URL` in your environment to enable real verification.
export function getVerifierUrl(): string | undefined {
  const v =
    (typeof process !== "undefined" && process.env?.X402_VERIFIER_URL?.trim()) || "";
  return v || undefined;
}

// Route price catalog. Prices in USDC (whole units, e.g. 0.003 = 0.003 USDC).
export const PAID_ROUTES = {
  "/api/paid/insight": {
    priceUsdc: 0.003,
    description: "AI-drafted financial insight for a wallet or scenario.",
  },
  "/api/public/paid/insight": {
    priceUsdc: 0.003,
    description: "AI-drafted financial insight for a wallet or scenario.",
  },
  "/api/paid/risk": {
    priceUsdc: 0.001,
    description: "Risk-engine simulation for a proposed transaction.",
  },
  "/api/public/paid/risk": {
    priceUsdc: 0.001,
    description: "Risk-engine simulation for a proposed transaction.",
  },
  "/api/paid/reports": {
    priceUsdc: 0.01,
    description: "AI-generated spending & activity report summary.",
  },
  "/api/public/paid/reports": {
    priceUsdc: 0.01,
    description: "AI-generated spending & activity report summary.",
  },
} as const;

export type PaidRoute = keyof typeof PAID_ROUTES;
