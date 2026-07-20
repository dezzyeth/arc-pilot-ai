import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  Coins,
  FileBarChart,
  MessageSquare,
  PieChart,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";

export const Route = createFileRoute("/app/manual")({
  component: ManualPage,
  head: () => ({
    meta: [
      { title: "ArcPilot · How it works" },
      {
        name: "description",
        content:
          "Step-by-step manual for using ArcPilot AI on Arc Testnet — wallet, chat, budgets, goals, planner, reports.",
      },
    ],
  }),
});

type Step = { title: string; body: string; icon: React.ComponentType<{ className?: string }> };

const STEPS: Step[] = [
  {
    title: "1 · Connect MetaMask on Arc Testnet",
    icon: Wallet,
    body:
      "Click Connect wallet (top-right). ArcPilot will add or switch MetaMask to Arc Testnet (chainId 5042002, RPC https://rpc.testnet.arc.network). USDC is the native gas token on Arc — no ETH required.",
  },
  {
    title: "2 · Fund your wallet from the faucet",
    icon: Coins,
    body:
      "Go to faucet.circle.com, pick Arc Testnet, paste your address and request testnet USDC. It arrives in seconds and covers both gas and transfers. Testnet USDC has no real value.",
  },
  {
    title: "3 · Ask the AI chat",
    icon: MessageSquare,
    body:
      "Open AI Chat and type in plain English — “send 0.1 USDC to 0x… as rent”, “what is unified balance?”, “explain Malachite consensus”. ArcPilot builds a transaction plan, simulates gas, and only signs after you confirm.",
  },
  {
    title: "4 · Every action is 1 on-chain transaction (0.01 USDC)",
    icon: ShieldCheck,
    body:
      "Creating a budget, saving a goal, updating a goal, scheduling a transaction, or generating an AI report each costs one on-chain tx of 0.01 USDC routed through the ArcPilot contract. That single tx is what puts the item on-chain, tags it, and logs it to your history.",
  },
  {
    title: "5 · Portfolio & Dashboard",
    icon: PieChart,
    body:
      "The Portfolio page shows your live USDC balance, category breakdown of spend this month, and every tx ArcPilot has logged for you — with the AI's plain-English explanation of what happened.",
  },
  {
    title: "6 · Budgets & Goals",
    icon: Target,
    body:
      "Open Budgets & Goals. Add a monthly cap per category (gaming, coffee, rent…) — ArcPilot warns you before you break it. Create a savings goal with a target and optional deadline, then tap Get AI plan on that goal to receive a personalized weekly/monthly contribution plan.",
  },
  {
    title: "7 · Planner — schedule & condition",
    icon: CalendarClock,
    body:
      "Use Planner to queue a transaction for a future date, or make it conditional (e.g. “only when balance > 100 USDC”). ArcPilot tracks the queue and marks each tx as pending / done in your log.",
  },
  {
    title: "8 · Reports",
    icon: FileBarChart,
    body:
      "The Reports page uses all of your logged activity to generate a signed monthly summary: total in/out, category split, savings progress, and AI recommendations — all in one 0.01 USDC on-chain report.",
  },
  {
    title: "9 · Arc Docs — 25 languages",
    icon: BookOpen,
    body:
      "The Arc Docs page holds every fact ArcPilot knows about Arc (RPC, chainId, App Kit, Unified Balance, agentic economy). Pick your language from the dropdown and it re-translates on the fly.",
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Why does every action cost 0.01 USDC?",
    a: "That single on-chain transaction is what stores the intent on Arc, tags it (BUDGET / GOAL / PLAN / REPORT), and gives you a verifiable receipt. It's not a service fee — it's the write itself.",
  },
  {
    q: "Does ArcPilot ever ask for my seed phrase or private key?",
    a: "Never. All signing happens inside MetaMask. ArcPilot only reads your public address and builds transactions for you to approve.",
  },
  {
    q: "Which networks does ArcPilot support?",
    a: "Arc Testnet only (chainId 5042002). Any prompt referencing Ethereum, Polygon, Base, Solana, etc. is politely refused — this app is Arc-native by design.",
  },
  {
    q: "Where does the AI knowledge come from?",
    a: "docs.arc.io plus the Arc Foundry tutorials, distilled into the Arc Docs page. The same knowledge base powers every chat answer.",
  },
];

function ManualPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          User manual
        </div>
        <h1 className="mt-1 text-3xl font-semibold">How ArcPilot works</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          A 9-step guide to using ArcPilot AI on Arc Testnet — from connecting a wallet
          to letting the AI plan your goals.
        </p>
      </motion.div>

      <div className="grid gap-3">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass flex gap-4 rounded-2xl p-5"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-brand)] shadow-glow">
              <s.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">{s.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-[color:var(--brand-2)]" /> FAQ
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {FAQ.map((f) => (
            <div key={f.q} className="glass rounded-2xl p-4">
              <div className="text-sm font-medium">{f.q}</div>
              <p className="mt-1 text-xs text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        <Link
          to="/app/chat"
          className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm hover:shadow-glow"
        >
          Try the AI chat <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          to="/app/budgets"
          className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm hover:shadow-glow"
        >
          Set a goal <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          to="/app/docs"
          className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm hover:shadow-glow"
        >
          Arc docs <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <p className="mt-8 text-center text-[11px] text-muted-foreground">
        Testnet only — no real value. ArcPilot never asks for your seed phrase.
      </p>
    </div>
  );
}
