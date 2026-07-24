import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, ShieldCheck, Wallet, Zap } from "lucide-react";

import { WalletButton } from "@/components/wallet-button";
import arcLogo from "@/assets/arc-logo.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "ArcPilot.ai — Natural-language finance on Arc Testnet" },
      {
        name: "description",
        content:
          "Send, simulate, and understand every transaction on Arc Testnet through natural language. AI copilot with risk analysis and gas estimation.",
      },
    ],
  }),
});

const steps = [
  { n: "01", t: "Connect Wallet", d: "Link MetaMask on Arc Testnet to start interacting with the copilot interface." },
  { n: "02", t: "Define Intent", d: "Type what you want in plain English. ArcPilot parses intent into precise protocol calls." },
  { n: "03", t: "Verify & Sign", d: "Review the simulation, risk and gas, then confirm in a single signature." },
];

const features = [
  { icon: BrainCircuit, title: "Natural-language intent", body: "Say “send 25 USDC to 0x…” — ArcPilot parses, validates and drafts the transaction." },
  { icon: ShieldCheck, title: "Risk engine", body: "Every transaction is simulated. Unknown addresses, big transfers and gas spikes are flagged." },
  { icon: Zap, title: "Arc Testnet only", body: "The app refuses to sign on any other network. Wallet is auto-prompted to switch chains." },
  { icon: Wallet, title: "Wallet-native", body: "MetaMask and injected EVM wallets, connected through a lean wagmi setup." },
];

const productLinks: { label: string; to: "/app" | "/app/chat" | "/app/portfolio" | "/app/planner" | "/app/budgets" | "/app/reports" | "/app/docs" | "/app/manual" }[] = [
  { label: "Dashboard", to: "/app" },
  { label: "Chat", to: "/app/chat" },
  { label: "Portfolio", to: "/app/portfolio" },
  { label: "Planner", to: "/app/planner" },
  { label: "Budgets", to: "/app/budgets" },
  { label: "Reports", to: "/app/reports" },
  { label: "Docs", to: "/app/docs" },
  { label: "Manual", to: "/app/manual" },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen w-full bg-[#050816] text-white selection:bg-[#956af7]/30 selection:text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-white/5 bg-[#050816]/80 px-6 py-4 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#956af7]">
          <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-[#956af7] to-[#4F8CFF]">
            <img src={arcLogo} alt="Arc" className="h-full w-full object-cover" draggable={false} />
          </div>
          <span className="text-xl font-bold tracking-tighter">ArcPilot.ai</span>
        </Link>
        <div className="hidden items-center gap-8 text-sm font-medium text-white/60 md:flex">
          <a href="#features" className="transition-colors hover:text-white">Features</a>
          <a href="#how" className="transition-colors hover:text-white">How it works</a>
          <Link to="/app/docs" className="transition-colors hover:text-white">Docs</Link>
          <Link to="/app/manual" className="transition-colors hover:text-white">Manual</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/app"
            className="hidden rounded-full bg-white px-5 py-2 text-sm font-bold text-black transition-all hover:bg-[#956af7] hover:text-white active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816] sm:inline-flex"
          >
            Launch App
          </Link>
          <WalletButton />
        </div>
      </nav>

      {/* Hero */}
      <main className="relative flex flex-col items-center overflow-hidden px-6 pb-32 pt-24">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-[#956af7]/10 blur-[120px]" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex max-w-4xl flex-col items-center text-center"
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#956af7]/30 bg-[#956af7]/5 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4F8CFF] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4F8CFF]" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-[#4F8CFF]">Live on Arc Testnet</span>
          </div>

          <h1 className="mb-8 text-balance text-6xl font-black leading-[0.9] tracking-tight md:text-8xl">
            Navigate the{" "}
            <span className="bg-gradient-to-r from-[#956af7] via-white to-[#4F8CFF] bg-clip-text text-transparent">
              Arc Ecosystem
            </span>{" "}
            with AI.
          </h1>

          <p className="mb-12 max-w-2xl text-lg leading-relaxed text-white/50 md:text-xl">
            ArcPilot.ai understands what you want, simulates it, explains the risk in plain English, and only then asks you to sign. ChatGPT for your Arc Testnet wallet.
          </p>

          <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/app"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#956af7] px-8 py-4 text-lg font-bold text-white transition-all hover:bg-[#8356e6] active:scale-95 focus-visible:ring-4 focus-visible:ring-[#956af7]/40 sm:w-auto"
            >
              Open ArcPilot
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#how"
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 px-8 py-4 text-lg font-bold text-white transition-all hover:bg-white/5 active:scale-95 focus-visible:ring-2 focus-visible:ring-white/40 sm:w-auto"
            >
              How it works
            </a>
          </div>
        </motion.div>

        {/* Chat demo */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="group mt-24 w-full max-w-5xl"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f24] shadow-2xl transition-transform duration-700 group-hover:scale-[1.01]">
            <div className="flex items-center gap-2 border-b border-white/5 bg-white/5 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-white/10" />
                <div className="h-3 w-3 rounded-full bg-white/10" />
                <div className="h-3 w-3 rounded-full bg-white/10" />
              </div>
              <div className="mx-auto text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                ArcPilot Prompt Interface v1.0
              </div>
            </div>
            <div className="space-y-6 p-6 md:p-8">
              <div className="flex justify-end">
                <div className="max-w-md rounded-2xl rounded-tr-none border border-[#956af7]/30 bg-[#956af7]/20 p-4">
                  <p className="text-sm md:text-base">Send 25 USDC to 0x8Ba1…c9F2 and warn me if that's a new address.</p>
                </div>
              </div>
              <div className="flex justify-start gap-4">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#956af7] to-[#4F8CFF]">
                  <img src={arcLogo} alt="Arc" className="h-full w-full object-cover" draggable={false} />
                </div>
                <div className="max-w-xl rounded-2xl rounded-tl-none border border-white/10 bg-white/5 p-5">
                  <div className="flex flex-col gap-4">
                    <p className="text-sm leading-relaxed text-white/90 md:text-base">
                      Drafted on Arc Testnet. This address has no prior interactions —{" "}
                      <span className="font-semibold text-[#956af7]">medium risk</span>. Confirm to sign.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-white/5 bg-[#050816] p-3">
                        <div className="mb-1 text-[10px] font-bold uppercase text-white/40">Transfer</div>
                        <div className="font-mono text-sm">25 USDC → 0x8Ba1…c9F2</div>
                      </div>
                      <div className="rounded-lg border border-white/5 bg-[#050816] p-3">
                        <div className="mb-1 text-[10px] font-bold uppercase text-white/40">Est. gas</div>
                        <div className="font-mono text-sm">0.00021 USDC</div>
                      </div>
                    </div>
                    <Link
                      to="/app/chat"
                      className="rounded-lg bg-white/10 py-2 text-center text-xs font-bold uppercase tracking-widest transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-[#956af7]"
                    >
                      Try it in the app
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* How it works — Editions grid */}
      <section id="how" className="border-t border-white/5 px-6 py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-20">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#956af7]">How it works</p>
            <h2 className="mb-4 text-4xl font-black tracking-tight md:text-5xl">Intelligent execution.</h2>
            <p className="max-w-md text-white/40">Three steps to automate every on-chain action with linguistic precision.</p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-3xl border border-white/5 bg-white/5 md:grid-cols-3">
            {steps.map((s, i) => {
              const accent = i === 0 ? "group-hover:text-[#956af7]/40" : i === 1 ? "group-hover:text-[#4F8CFF]/40" : "group-hover:text-white/30";
              return (
                <div key={s.n} className="group flex flex-col gap-8 bg-[#050816] p-10 transition-colors hover:bg-white/[0.02]">
                  <div className={`text-5xl font-black text-white/10 transition-colors ${accent}`}>{s.n}</div>
                  <div>
                    <h3 className="mb-3 text-xl font-bold">{s.t}</h3>
                    <p className="text-sm leading-relaxed text-white/50">{s.d}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="border-t border-white/5 px-6 py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-20">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#956af7]">Features</p>
            <h2 className="mb-4 text-4xl font-black tracking-tight md:text-5xl">Every guardrail, built in.</h2>
          </div>
          <div className="grid gap-px overflow-hidden rounded-3xl border border-white/5 bg-white/5 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="group flex flex-col gap-6 bg-[#050816] p-8 transition-colors hover:bg-white/[0.02]">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#956af7] to-[#4F8CFF]">
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="mb-2 text-base font-bold">{f.title}</div>
                  <p className="text-sm leading-relaxed text-white/50">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Everything in ArcPilot — full surface index */}
      <section className="border-t border-white/5 px-6 py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-20">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#956af7]">The app</p>
            <h2 className="mb-4 text-4xl font-black tracking-tight md:text-5xl">Everything inside ArcPilot.</h2>
            <p className="max-w-md text-white/40">Jump straight into any surface of the copilot.</p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-3xl border border-white/5 bg-white/5 sm:grid-cols-2 md:grid-cols-4">
            {productLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="group flex items-center justify-between bg-[#050816] px-6 py-8 transition-colors hover:bg-white/[0.02] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#956af7]"
              >
                <span className="text-base font-bold tracking-tight">{l.label}</span>
                <ArrowRight className="h-4 w-4 text-white/30 transition-all group-hover:translate-x-1 group-hover:text-[#956af7]" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 px-6 py-32">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <h3 className="mb-4 text-4xl font-black tracking-tight md:text-5xl">Ready to talk to your wallet?</h3>
          <p className="mb-10 max-w-xl text-white/50">Connect MetaMask, switch to Arc Testnet, and ArcPilot handles the rest.</p>
          <Link
            to="/app"
            className="group inline-flex items-center gap-2 rounded-xl bg-[#956af7] px-8 py-4 text-lg font-bold text-white transition-all hover:bg-[#8356e6] active:scale-95 focus-visible:ring-4 focus-visible:ring-[#956af7]/40"
          >
            Launch ArcPilot
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center overflow-hidden rounded bg-gradient-to-br from-[#956af7] to-[#4F8CFF]">
              <img src={arcLogo} alt="Arc" className="h-full w-full object-cover" draggable={false} />
            </div>
            <span className="text-sm font-bold tracking-tighter">ArcPilot.ai</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 text-xs font-bold uppercase tracking-widest text-white/40">
            <Link to="/app/docs" className="transition-colors hover:text-white">Docs</Link>
            <Link to="/app/manual" className="transition-colors hover:text-white">Manual</Link>
            <a
              href="https://x.com/0x_Dezzy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-white/70 transition-all hover:bg-white/5 hover:text-white"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Made by @0x_Dezzy
            </a>
          </div>
          <div className="font-mono text-xs text-white/20">
            © {new Date().getFullYear()} ArcPilot Labs · Testnet only
          </div>
        </div>
      </footer>
    </div>
  );
}
