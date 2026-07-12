// Arc knowledge base — condensed from https://docs.arc.io
// Used by the AI system prompt and the in-app Docs page.

export const ARC_KNOWLEDGE = `
# Arc — Programmable Money Layer-1

Arc is an open Layer-1 blockchain purpose-built for programmable money, built by
Circle. USDC is the **native gas token**. It has sub-second deterministic
finality, is fully EVM compatible, offers opt-in privacy, and integrates
directly with Circle's full-stack platform (USDC, EURC, CCTP, Gateway,
Wallets).

## Core properties
- **USDC as gas** — no ETH, no volatile fee token. Fees are stable and
  predictable, denominated in USDC.
- **Deterministic finality** — transactions are final in under 1 second, no
  confirmation waiting.
- **EVM compatible** — deploy Solidity contracts with Hardhat, Foundry, Viem,
  or Ethers with minimal changes.
- **Opt-in privacy** — confidential transactions with selective disclosure
  for compliance.
- **Post-quantum security** — roadmap for quantum-resilient cryptography.
- **Testnet-only today.** Mainnet not yet available.

## Arc Testnet quick reference
- Network name: **Arc Testnet**
- RPC URL: **https://rpc.testnet.arc.network**
- Chain ID: **5042002**
- Currency symbol: **USDC** (native gas token)
- Explorer: **https://testnet.arcscan.app**
- Faucet: **https://faucet.circle.com**

## Use cases Arc is designed for
1. **Peer-to-peer payments** — instant, low-cost stablecoin transfers with
   deterministic settlement.
2. **eCommerce checkout** — accept stablecoin payments online with fast
   settlement and built-in compliance.
3. **Stablecoin FX** — real-time onchain FX with transparent pricing,
   instant settlement, predictable fees.
4. **Agentic economy** — AI agents with onchain identity (ERC-8004) that can
   coordinate, contract (ERC-8183 jobs), and settle value autonomously.

## App Kit — payment & liquidity primitives
App Kit wraps Circle CCTP and provides ready-made capabilities:
- **Bridge** — move USDC across chains (EVM, Solana, Circle Wallets).
- **Swap** — same-chain and crosschain token swaps.
- **Send** — wallet-to-wallet transfers on the same chain.
- **Unified Balance** — one spendable USDC balance aggregated across many
  chains; spend on any supported chain without manual bridging.

## AI & Agents
- **Arc MCP Server** — connect AI tools directly to Arc documentation.
- **Register an AI Agent** — give agents an onchain identity and reputation
  via ERC-8004.
- **ERC-8183 Jobs** — escrow, deliverables, and settlement primitive for
  agent-to-agent work.

## Contracts on Arc
- Standard Solidity, EVM compatible. See EVM differences page for edge cases.
- Circle publishes canonical addresses for **USDC**, **EURC**, **CCTP**, and
  **Gateway** contracts — always check the Contract Addresses reference
  before hard-coding.
- Deploy via Foundry / Hardhat / Remix targeting the Arc Testnet RPC.

## Tools & infrastructure
- Node providers, data indexers, oracles (price feeds), account abstraction
  / paymaster providers, and compliance / screening vendors are all
  supported via ecosystem partners.

## Reference links
- Overview: https://docs.arc.io/arc-chain
- Connect to Arc: https://docs.arc.io/arc/references/connect-to-arc
- Contract addresses: https://docs.arc.io/arc/references/contract-addresses
- EVM differences: https://docs.arc.io/arc/references/evm-differences
- Gas & fees: https://docs.arc.io/arc/references/gas-and-fees
- App Kit: https://docs.arc.io/app-kit
- Unified Balance: https://docs.arc.io/app-kit/unified-balance
- Agentic economy: https://docs.arc.io/build/agentic-economy
- Faucet: https://faucet.circle.com
- Explorer: https://testnet.arcscan.app
`.trim();

export const ARC_CHAT_SUGGESTIONS: { label: string; prompt: string }[] = [
  { label: "What is Arc?", prompt: "What is Arc and why is USDC the native gas token?" },
  { label: "Connect to Arc Testnet", prompt: "How do I connect my wallet to Arc Testnet? Give me the RPC, chain ID, and explorer." },
  { label: "Get testnet USDC", prompt: "How do I get testnet USDC on Arc? Walk me through the faucet." },
  { label: "Deploy a contract", prompt: "How do I deploy a Solidity contract to Arc Testnet with Foundry?" },
  { label: "Gas & fees", prompt: "Explain Arc's stable fee design and how gas is paid in USDC." },
  { label: "Deterministic finality", prompt: "What does sub-second deterministic finality mean on Arc?" },
  { label: "App Kit: Bridge", prompt: "How does App Kit Bridge work for moving USDC across chains?" },
  { label: "Unified Balance", prompt: "Explain App Kit Unified Balance and how I'd spend one USDC balance across chains." },
  { label: "Agentic economy", prompt: "How do AI agents settle jobs on Arc using ERC-8004 identity and ERC-8183 jobs?" },
  { label: "EVM differences", prompt: "What are the main EVM differences developers should know about on Arc?" },
  { label: "Contract addresses", prompt: "Where do I find canonical USDC, EURC, CCTP, and Gateway addresses on Arc?" },
  { label: "Send 0.01 USDC", prompt: "Send 0.01 USDC to 0x0000000000000000000000000000000000000000" },
];
