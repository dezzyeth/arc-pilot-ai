import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";

import { WalletButton } from "@/components/wallet-button";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "ArcPilot AI — Natural-language finance on Arc Testnet" },
      {
        name: "description",
        content:
          "Send, simulate, and understand every transaction on Arc Testnet through natural language. AI copilot with risk analysis and gas estimation.",
      },
    ],
  }),
});

const features = [
  {
    icon: BrainCircuit,
    title: "Natural-language intent",
    body: "Say “send 25 ARC to 0x…” — ArcPilot parses, validates, and drafts the transaction for you.",
  },
  {
    icon: ShieldCheck,
    title: "Risk engine",
    body: "Every transaction is simulated. Unknown addresses, big transfers and gas spikes are flagged.",
  },
  {
    icon: Zap,
    title: "Arc Testnet only",
    body: "The app refuses to sign on any other network. Wallet is auto-prompted to switch chains.",
  },
  {
    icon: Wallet,
    title: "Wallet-native",
    body: "MetaMask, WalletConnect, Rainbow and injected wallets — all through RainbowKit.",
  },
];

const steps = [
  { n: "01", t: "Describe", d: "Type what you want in plain English." },
  { n: "02", t: "Simulate", d: "ArcPilot estimates gas, checks balance & analyzes risk." },
  { n: "03", t: "Confirm", d: "Review a plain-English summary and sign in your wallet." },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 hero-bg" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-[image:var(--gradient-brand)] shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">ArcPilot AI</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/app"
            className="hidden text-sm text-muted-foreground hover:text-foreground sm:block"
          >
            Launch app
          </Link>
          <WalletButton />
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-16 sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="glass mx-auto inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--success)]" />
            Live on Arc Testnet
          </div>
          <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
            Your <span className="gradient-text">AI finance copilot</span> for Arc Testnet.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            ArcPilot understands what you want, simulates it, explains the risk in plain
            English — and only then asks you to sign. ChatGPT meets your wallet.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full shadow-glow">
              <Link to="/app">
                Open ArcPilot <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="rounded-full">
              <a href="#how">How it works</a>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="glass mx-auto mt-20 max-w-4xl rounded-3xl p-3 shadow-glow"
        >
          <div className="rounded-2xl bg-card/70 p-6">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--danger)]/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--warning)]/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--success)]/70" />
              </div>
              <span className="ml-2 text-xs text-muted-foreground">ArcPilot · Chat</span>
            </div>
            <div className="mt-6 space-y-4 text-left text-sm">
              <div className="glass w-fit rounded-2xl rounded-tl-md px-4 py-2.5">
                Send 25 ARC to 0x8Ba1…c9F2 and warn me if that's a new address.
              </div>
              <div className="w-fit rounded-2xl rounded-tr-md bg-[image:var(--gradient-brand)] px-4 py-2.5 text-primary-foreground">
                Drafted: 25 ARC → 0x8Ba1…c9F2 on Arc Testnet. Est. gas 0.00021 ARC.
                This address has no prior interactions — <b>medium risk</b>. Confirm to sign.
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="how" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <div className="mb-14 max-w-2xl">
          <p className="text-sm text-[color:var(--brand-2)]">How it works</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight">
            From sentence to signed transaction.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6"
            >
              <div className="text-xs text-muted-foreground">{s.n}</div>
              <div className="mt-2 text-lg font-medium">{s.t}</div>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass group rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-glow"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[image:var(--gradient-brand)]">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="mt-4 font-medium">{f.title}</div>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center">
        <div className="glass rounded-3xl p-10 shadow-glow">
          <h3 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to talk to your wallet?
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Connect any EVM wallet and switch to Arc Testnet. ArcPilot handles the rest.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full shadow-glow">
              <Link to="/app">
                Launch ArcPilot <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} ArcPilot AI · Testnet only, no real value.</div>
          <div>Built for Arc Testnet</div>
        </div>
      </footer>
    </div>
  );
}
