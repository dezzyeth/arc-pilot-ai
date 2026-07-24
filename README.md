
# ArcPilot AI

# ArcPilot AI

> **An AI-powered financial copilot built exclusively for Arc Testnet.**

ArcPilot AI is a modern Web3 application that combines AI, automation, and on-chain finance into one platform. Users can interact with Arc Testnet using natural language to send USDC, schedule transactions, manage budgets and savings goals, track their portfolio, generate AI-powered reports, and explore Arc documentation—all through a clean and intuitive interface.

---

## ✨ Features

### 🤖 AI Chat
Interact with an AI assistant that understands natural language. Ask questions about Arc, generate transaction plans, receive blockchain guidance, and get AI-powered financial insights.

### 💸 Smart Transaction Planner
Create one-time, scheduled, or conditional USDC transactions. Once approved, transactions can be executed automatically using secure local session keys without repeated MetaMask confirmations.

### 💳 Nanopayments (x402 Protocol)
ArcPilot uses the **x402 protocol** to power pay-per-use AI services instead of subscriptions.

Users create a **Nanopayments Agent Wallet**, fund it with USDC, and set spending limits. When a premium AI endpoint is requested, the server responds with a **402 Payment Required** challenge. The agent wallet automatically signs a small USDC payment, retries the request with the payment proof, and receives the AI response.

Premium endpoints include:

- `/api/paid/insight`
- `/api/paid/risk`
- `/api/paid/reports`

**Benefits**
- Pay only for the AI features you use.
- Automate recurring AI requests without manual approvals.
- Protect spending with daily, weekly, or monthly budgets.
- Track every payment as user spending and application revenue.

### 📊 Portfolio
View your wallet balance, Vault assets, transaction history, and spending overview with real-time on-chain data.

### 💰 Budgets & Goals
Create monthly spending limits and savings goals. Receive personalized AI-generated financial plans based on your spending habits.

### 📈 AI Reports
Generate AI-powered spending summaries, category analysis, and financial insights from your transaction history.

### 📚 Arc Documentation
Browse Arc blockchain documentation with built-in AI translation, making technical resources available in multiple languages.

### 🔗 MCP Server
Provides public read-only tools for AI agents to access Arc network information, documentation, wallet balances, transactions, and explorer links.

---

## 🛠 Tech Stack

### Frontend
- React
- TanStack Start
- TypeScript
- Tailwind CSS
- Framer Motion
- Wagmi
- Viem

### Backend
- Supabase
- Lovable Cloud
- Gemini AI

### Blockchain
- Arc Testnet
- Solidity
- MetaMask
- x402 Protocol

---

## 🌐 Arc Testnet

| Property | Value |
|----------|-------|
| Network | Arc Testnet |
| Chain ID | **5042002** |
| Native Gas Token | **USDC** |
| RPC | `https://rpc.testnet.arc.network` |
| Explorer | `https://testnet.arcscan.app` |

---

## 📂 Project Structure

```text
src/
├── components/
├── contracts/
├── lib/
├── routes/
└── styles.css
```

---

## 🚀 Core Modules

| Module | Description |
|---------|-------------|
| **Dashboard** | Displays wallet balances, network status, earnings, and recent activity. |
| **AI Chat** | AI-powered assistant for Arc knowledge, transactions, and financial guidance. |
| **Planner** | Schedule and automate transactions using secure session keys. |
| **Portfolio** | Monitor wallet assets, Vault balance, and transaction history. |
| **Budgets & Goals** | Manage spending limits and savings goals with AI assistance. |
| **Reports** | Generate AI-powered spending analysis and financial summaries. |
| **Arc Docs** | Search, read, and translate Arc documentation. |
| **User Manual** | Learn how every feature works through an in-app guide. |

---

## 🗄 Database

ArcPilot uses **Supabase** with **Row Level Security (RLS)** to securely manage user data.

- `chat_quota` – AI message credits
- `tx_log` – Transaction history
- `budgets` – Monthly budgets
- `goals` – Savings goals
- `scheduled_tx` – Scheduled transactions
- `ai_memory` – AI preferences and personalization

---

## 🔒 Security

- MetaMask-only authentication
- Arc Testnet-only transactions
- Automatic network switching
- Secure local Session Keys
- Smart contract-based fund management
- On-chain fee validation
- User-defined spending limits for nanopayments

---

## 🔄 Workflow

```text
Connect MetaMask
        │
        ▼
Switch to Arc Testnet
        │
        ▼
Fund Agent Wallet (Optional)
        │
        ▼
Chat with AI / Create Planner / Generate Reports
        │
        ▼
If Premium AI → x402 Nanopayment
        │
        ▼
AI Response or Transaction Execution
        │
        ▼
Portfolio, Reports & Dashboard Update Automatically
```

---

## 📄 License

Built for development, experimentation, and educational use on **Arc Testnet**.
## if u are having any issue in Arcpilotai 
fill this form 

https://docs.google.com/forms/d/e/1FAIpQLSfgFPBVQEnYHANNIhmGRIbOPkgvy94HNJnj947O7k3YpY4igg/viewform?usp=publish-editor
