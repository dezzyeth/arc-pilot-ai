
# ArcPilot AI

> **An AI-powered financial copilot built exclusively for Arc Testnet.**

ArcPilot AI is a modern Web3 application that helps users interact with Arc Testnet using natural language. Instead of manually managing transactions, users can chat with an AI assistant to send funds, schedule payments, manage budgets, track their portfolio, and explore Arc documentation—all within a single platform.

---

## ✨ Features

### 🤖 AI Chat
Interact with an AI assistant that understands natural language. Ask blockchain-related questions, generate transaction plans, or get guidance on building with Arc.

### 💸 Smart Transaction Planner
Create one-time, scheduled, or conditional USDC transactions. Approved transactions can be executed automatically using secure local session keys.

### 📊 Portfolio
Monitor your wallet balance, Vault assets, and transaction history in one dashboard with real-time on-chain data.

### 💰 Budgets & Goals
Set monthly spending limits and savings goals. Receive personalized AI recommendations to help manage your finances.

### 📈 AI Reports
Generate AI-powered spending summaries, category breakdowns, and financial insights based on your transaction history.

### 📚 Arc Documentation
Browse Arc blockchain documentation with built-in AI translation, making technical resources accessible in multiple languages.

### 🔗 MCP Server
Provides public read-only tools that allow AI agents to retrieve Arc network information, balances, transactions, and documentation.

---

## 🛠 Tech Stack

**Frontend**

- React
- TanStack Start
- TypeScript
- Tailwind CSS
- Framer Motion
- Wagmi
- Viem

**Backend**

- Supabase
- Lovable Cloud
- Gemini AI

**Blockchain**

- Arc Testnet
- Solidity
- MetaMask

---

## 🌐 Arc Testnet

| Property | Value |
|----------|-------|
| **Network** | Arc Testnet |
| **Chain ID** | 5042002 |
| **Native Gas Token** | USDC |
| **RPC** | `https://rpc.testnet.arc.network` |
| **Explorer** | `https://testnet.arcscan.app` |

---

## 📂 Project Structure


src/
├── components/
├── contracts/
├── lib/
├── routes/
└── styles.css
```



## 🚀 Core Modules

| Module | Description |
|---------|-------------|
| **Dashboard** | Displays wallet information, network status, balances, and recent activity. |
| **AI Chat** | AI-powered assistant for transactions, Arc knowledge, and blockchain guidance. |
| **Planner** | Schedule and automate future transactions with session keys. |
| **Portfolio** | View wallet holdings, Vault balance, and transaction history. |
| **Budgets & Goals** | Manage spending limits and savings goals with AI assistance. |
| **Reports** | Generate AI-powered financial reports and spending analysis. |
| **Arc Docs** | Search and translate Arc documentation in multiple languages. |
| **User Manual** | Learn how every feature works through a built-in guide. |

---

## 🗄 Database

ArcPilot uses **Supabase** to securely store application data.

- **chat_quota** – AI message credits per wallet
- **tx_log** – Transaction history
- **budgets** – Monthly spending limits
- **goals** – Savings goals
- **scheduled_tx** – Scheduled transactions
- **ai_memory** – User preferences for personalized AI responses

All tables are protected using **Row Level Security (RLS)**.

---

## 🔒 Security

- MetaMask-only authentication
- Arc Testnet-only transactions
- Automatic network switching
- Secure local session keys for automation
- Smart contract-based fund management
- On-chain fee validation

---

## 🔄 Workflow

```text
Connect MetaMask
        ↓
Switch to Arc Testnet
        ↓
Use AI Chat or Planner
        ↓
Approve Transaction
        ↓
Transaction Executes On-Chain
        ↓
Portfolio & Reports Update Automatically
```

---

## 📄 License

Built for development, experimentation, and educational use on **Arc Testnet**.
````

