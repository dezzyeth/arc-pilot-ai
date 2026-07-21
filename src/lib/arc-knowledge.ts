// Arc knowledge base — condensed from https://docs.arc.io + community/whitepaper context
// Used by the AI system prompt and the in-app Docs page.

export const ARC_KNOWLEDGE = `
# Arc by Circle — The Economic OS for the Internet

Arc is an open, EVM-compatible **Layer-1 blockchain purpose-built for stablecoin-native economic activity** — payments, FX, capital markets, tokenized assets (RWAs), lending, and the agentic (AI) economy. Unlike general-purpose chains, Arc is optimized for real-world money movement with **USDC as the native gas token**.

Positioning: "The Economic OS for the internet." Built by **Circle** (issuer of USDC).

## Status (mid-2026)
- **Public testnet: live and active** — millions of transactions per week.
- **Mainnet: targeted for 2026** (not live yet).
- Strong builder adoption via **Arc House**, hackathons, and the **Architects program**.
- Initial validator set is permissioned; roadmap moves toward open PoS.

## Why Arc exists
Enterprises and builders on existing chains struggle with:
- Volatile gas tokens (ETH, SOL) making fees unpredictable.
- Probabilistic finality — no true "settled" moment.
- Fragmented liquidity across L1s and L2s.
- Weak compliance / privacy trade-offs for institutions.

Arc solves this by making **stablecoins the native medium** and giving builders enterprise-grade reliability plus composability across chains via Circle's stack.

## Core properties
- **USDC as native gas** — no ETH, no volatile token. Fees are stable, low, and dollar-denominated (often < $0.01–0.05 per tx on testnet).
- **Deterministic sub-second finality** — true settlement in < 1s, not "probably safe."
- **EVM compatible** — deploy Solidity with Foundry / Hardhat / Remix; frontend with wagmi + viem or ethers.
- **Built-in FX engine** — real-time onchain FX with transparent pricing.
- **Opt-in configurable privacy** — hide balances/history while staying auditable for compliance.
- **Post-quantum security** on the roadmap.
- **Deep Circle integration** — USDC, EURC, **CCTP** (native cross-chain USDC), **Gateway**, Circle Wallets, institutional on/off-ramps.
- **Multichain hub** — anchor flows on Arc, stay interoperable everywhere via CCTP.

## Arc Testnet quick reference
- Network name: **Arc Testnet**
- RPC URL: **https://rpc.testnet.arc.network** (alternatives: Blockdaemon, dRPC, QuickNode)
- Chain ID: **5042002**
- Currency symbol: **USDC** (native gas token)
- Explorer: **https://testnet.arcscan.app**
- Faucet: **https://faucet.circle.com** (claim testnet USDC + EURC)

## Founders, team & backers
This is a **Circle-led** project, not an indie startup.
- **Jeremy Allaire** — Co-founder, Chairman & CEO of Circle. Main visionary; has pushed internet-native money for a decade (Circle founded 2013, USDC launched 2018).
- **Nikhil Chandhok** — Chief Product & Technology Officer at Circle. Deeply involved in Arc's product and tech decisions.
- **Sean Neville** — Co-founder of Circle (stepped back from co-CEO role); now focused on AI-native finance at Catena Labs.
- **Malachite team** (from Informal Systems) — joined Circle to build Arc's high-performance **BFT consensus engine** (Tendermint lineage).
- Circle's full engineering, product, legal, and compliance orgs, plus a growing validator and builder ecosystem.

Backers / partners: **a16z crypto** (lead, $75M), **BlackRock, Apollo, NYSE parent (ICE), ARK Invest**, and others.

## ARC token
- Native coordination asset of the network.
- Utility: **staking** (future PoS transition), **governance**, **protocol fee mechanics**, platform utility.
- **Presale (May 2026): raised $222M at a $3B FDV**, led by a16z crypto.
- Not yet launched on mainnet — see the official ARC whitepaper for full details.

## Community & builder programs
- **Arc House** — education, discussions, hackathons, meetups.
- **Architects program** — tiered recognition; earn points for building, content, and events. Top contributors get visibility and roles.
- **Hackathons** — including large Circle × Arc agent hackathons with prizes and open-sourced winners.
- Vibe: enterprise + serious-builder focused, not pure degen — but growing fast.

## Use cases Arc is designed for
1. **Peer-to-peer payments** — instant, low-cost stablecoin transfers with deterministic settlement.
2. **eCommerce checkout** — accept stablecoin payments with fast settlement and built-in compliance.
3. **Stablecoin FX** — real-time onchain FX, transparent pricing, instant settlement, predictable fees.
4. **Capital markets, RWAs, tokenization** — issuance, settlement, FX, and compliance-ready privacy.
5. **Lending & prediction markets** — stablecoin-native financial primitives.
6. **Agentic economy** — AI agents with onchain identity (**ERC-8004**) that coordinate, contract (**ERC-8183** jobs), and settle value autonomously — natively paying gas in USDC.

## App Kit — payment & liquidity primitives
App Kit wraps Circle CCTP and provides ready-made building blocks:
- **Bridge** — move USDC across chains (EVM, Solana, Circle Wallets).
- **Swap** — same-chain and crosschain token swaps.
- **Send** — wallet-to-wallet transfers on the same chain.
- **Unified Balance** — one spendable USDC balance aggregated across many chains; spend on any supported chain without manual bridging.

## AI & agents on Arc
- **Arc MCP Server** — connect AI tools directly to Arc documentation and onchain reads.
- **Register an AI Agent** — give agents an onchain identity and reputation via **ERC-8004**.
- **ERC-8183 Jobs** — escrow, deliverables, and settlement primitive for agent-to-agent work.
- Agents can hold USDC, pay gas natively, execute trades, enter contracts, and settle 24/7.

## Contracts on Arc
- Standard Solidity, EVM compatible. Review the **EVM differences** page for edge cases (gas mechanics, etc.) before shipping.
- Circle publishes canonical addresses for **USDC**, **EURC**, **CCTP**, and **Gateway** — always check the **Contract Addresses** reference before hard-coding anything.
- Deploy via **Foundry** (recommended), Hardhat, or Remix targeting the Arc Testnet RPC.

## Tools & infrastructure
- **Node providers**: Blockdaemon, dRPC, QuickNode, plus the public RPC.
- **Indexers**: The Graph, Envio, Goldsky.
- **Oracles**: price feed partners.
- **Account abstraction / paymasters**: ecosystem AA providers.
- **Compliance / screening**: Elliptic, TRM, and other vendors.

---

# A → Z: Building on Arc Testnet

Arc is EVM-compatible, so most Ethereum tooling works. Main differences: **gas is USDC**, the RPC/Chain ID is Arc-specific, and Circle's tools (App Kit, CCTP, Gateway) are first-class.

## Step 1 — Wallet setup
- Use **MetaMask** (or Rabby, etc.).
- Add Arc Testnet manually:
  - Network Name: \`Arc Testnet\`
  - RPC URL: \`https://rpc.testnet.arc.network\`
  - Chain ID: \`5042002\`
  - Currency Symbol: \`USDC\`
  - Block Explorer: \`https://testnet.arcscan.app\`
- Switch the wallet to Arc Testnet.

## Step 2 — Get test funds
1. Go to \`faucet.circle.com\`.
2. Select **Arc Testnet**.
3. Paste your wallet address → claim test **USDC** (and **EURC** if needed).
4. USDC is your gas token — you need it to deploy contracts and send txs.

## Step 3 — Development environment
Recommended stack:
- **Foundry** (fastest for deploy/test; official Counter.sol example in docs).
- **Hardhat** or **Remix** also fine.
- Frontend: **wagmi + viem** (or ethers.js).

Install Foundry:
\`\`\`bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
\`\`\`

## Step 4 — Create & deploy a contract (Foundry)
\`\`\`bash
forge init my-arc-project
\`\`\`

Create \`.env\`:
\`\`\`
ARC_TESTNET_RPC_URL="https://rpc.testnet.arc.network"
PRIVATE_KEY=your_private_key_here
\`\`\`

Deploy (example Counter contract):
\`\`\`bash
forge create src/Counter.sol:Counter \\
  --rpc-url $ARC_TESTNET_RPC_URL \\
  --private-key $PRIVATE_KEY \\
  --broadcast
\`\`\`

Verify on the explorer if needed. Interact with \`cast\`:
\`\`\`bash
cast call <ADDRESS> "number()(uint256)" --rpc-url $ARC_TESTNET_RPC_URL
cast send <ADDRESS> "increment()" --rpc-url $ARC_TESTNET_RPC_URL --private-key $PRIVATE_KEY
\`\`\`

Review the **EVM differences** doc before mainnet.

## Step 5 — Use Circle's App Kits & tools (the superpowers)
- **App Kits** — unified balances, bridging, swapping, token flows across EVM + Solana + Circle Wallets.
- **CCTP** — native cross-chain USDC (burn on one chain, mint on another; fast, secure).
- **Account abstraction** tooling and paymasters.
- **Indexers**: The Graph, Envio, Goldsky.
- **Compliance**: Elliptic, TRM.
- Built-in support for prediction markets, lending, FX products.

## Step 6 — Frontend integration
Use **wagmi + viem** with the Arc Testnet config (Chain ID **5042002**). Many dApps already support Arc or can add it in minutes.

## Step 7 — Advanced building
- **Privacy** — use opt-in privacy features for sensitive flows.
- **FX & financial primitives** — leverage the built-in FX engine and stablecoin-native design.
- **AI agents** — build agents that hold USDC, pay gas natively, and execute complex actions autonomously (ERC-8004 identity + ERC-8183 jobs).
- **RWA / tokenization** — issue and manage tokenized assets with compliance tooling.
- **Monitoring** — use the explorer + webhooks for event streams.

## Step 8 — Testing, iteration, mainnet prep
- Test thoroughly on testnet (it's active).
- Monitor gas — usually **< $0.01–0.05 per tx**.
- Join **Arc House** for docs, discussions, events.
- Enter hackathons for prizes, recognition, and feedback.

## Step 9 — Get recognized & scale
- Build in public → share on X, tag **@arc**.
- Earn points in the **Architects program**.
- Deploy real projects, open-source them, publish content.
- When mainnet launches → migrate and go live.

## Step 10 — Resources (bookmark these)
- Official site: \`arc.io\` / \`arc.network\`
- Docs: \`docs.arc.io\` (also served at \`docs.arc.network\`)
- Explorer: \`https://testnet.arcscan.app\`
- Faucet: \`https://faucet.circle.com\`
- Community: **Arc House** + **@arc** on X
- Whitepaper / litepaper: on \`arc.network\`
- Deploy tutorial: official "Deploy on Arc" guide (Foundry-focused)

## Pro tips from builders
- **Real activity beats farming spam** — send payments with memos, deploy small contracts, use dApps.
- **Native + ERC-20 USDC balances interact** in interesting ways on Arc — test both.
- **Lean on CCTP + Circle liquidity** rather than reinventing bridges.
- Keep gas budgeting simple: it's USDC, and it's cheap and stable.

## Risks / real talk
- Still **early** — testnet only, mainnet not live yet.
- Initial validator set is **permissioned**.
- Success is tied to Circle's execution and regulatory path.
- The backing, team, and product focus are unusually strong for the stage.

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
  { label: "Who built Arc?", prompt: "Who are the founders and team behind Arc, and who are the main backers?" },
  { label: "ARC token", prompt: "Explain the ARC token — utility, presale, valuation, and current status." },
  { label: "Connect to Arc Testnet", prompt: "How do I connect MetaMask to Arc Testnet? Give me the RPC, chain ID, and explorer." },
  { label: "Get testnet USDC", prompt: "How do I claim testnet USDC from the Circle faucet on Arc?" },
  { label: "Deploy with Foundry", prompt: "Walk me through deploying a Solidity contract to Arc Testnet with Foundry, step by step." },
  { label: "Gas & fees", prompt: "Explain Arc's stable fee design and how gas is paid in USDC, with typical costs." },
  { label: "Deterministic finality", prompt: "What does sub-second deterministic finality mean on Arc and why does it matter?" },
  { label: "App Kit: Bridge", prompt: "How does App Kit Bridge work for moving USDC across chains?" },
  { label: "Unified Balance", prompt: "Explain App Kit Unified Balance and how I'd spend one USDC balance across chains." },
  { label: "CCTP", prompt: "How does Circle CCTP work and how does Arc use it for cross-chain USDC?" },
  { label: "Agentic economy", prompt: "How do AI agents settle jobs on Arc using ERC-8004 identity and ERC-8183 jobs?" },
  { label: "RWA on Arc", prompt: "How would I tokenize a real-world asset on Arc using its compliance and privacy features?" },
  { label: "Privacy features", prompt: "Explain Arc's opt-in configurable privacy and when I should use it." },
  { label: "EVM differences", prompt: "What are the main EVM differences developers should know about on Arc?" },
  { label: "Contract addresses", prompt: "Where do I find canonical USDC, EURC, CCTP, and Gateway addresses on Arc?" },
  { label: "Architects program", prompt: "What is the Arc Architects program and how do I earn points?" },
  { label: "Mainnet timeline", prompt: "When is Arc mainnet launching and what's the current testnet status?" },
  { label: "What should I build on Arc?", prompt: "Suggest 5 concrete project ideas I could build on Arc Testnet right now, ranked by difficulty. For each: what it does, which Arc features it uses (USDC gas, CCTP, App Kit, FX, agents, privacy), and a rough tech stack." },
  { label: "Beginner build ideas", prompt: "I'm new to Arc. Give me 3 beginner-friendly project ideas I can ship on Arc Testnet in a weekend, with step-by-step build outlines." },
  { label: "AI agent project ideas", prompt: "Suggest project ideas that use Arc's agentic economy (ERC-8004 identity + ERC-8183 jobs) with USDC-native settlement. Give me 3 concrete ideas with example flows." },
  { label: "Payments app ideas", prompt: "What kinds of stablecoin payment apps make sense on Arc Testnet? Suggest 4 ideas (P2P, ecommerce, payroll, subscriptions) with the core contracts and UX I'd need." },
  { label: "RWA / tokenization ideas", prompt: "Give me 3 real-world-asset tokenization project ideas that fit Arc's compliance + privacy features, with the primitives I'd use for each." },
  { label: "Hackathon-winning idea", prompt: "Suggest a hackathon-winning ArcPilot-style idea I can build on Arc Testnet this week. Include the pitch, key Arc features used, MVP scope, and a build plan." },
];
