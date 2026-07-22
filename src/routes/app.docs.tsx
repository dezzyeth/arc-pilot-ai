import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Blocks,
  BookOpen,
  Building2,
  Check,
  ChevronDown,
  Clock,
  Coins,
  Copy,
  Database,
  DollarSign,
  ExternalLink,
  Eye,
  Gauge,
  Globe,
  Languages,
  Layers,
  Link2,
  Loader2,
  Lock,
  Network,
  Search,
  Shield,
  Sparkles,
  Timer,
  Users,
  Wallet,
  Workflow,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { translateArcDocs } from "@/lib/translate.functions";

export const Route = createFileRoute("/app/docs")({
  component: DocsPage,
  head: () => ({
    meta: [
      { title: "ArcPilot · Arc Documentation" },
      {
        name: "description",
        content:
          "The complete Arc knowledge base covering the network, agentic economy, and builder resources in one focused documentation experience.",
      },
    ],
  }),
});

const LANGUAGES: { code: string; label: string; native: string }[] = [
  { code: "English", label: "English", native: "English" },
  { code: "Chinese (Simplified)", label: "Chinese", native: "中文" },
  { code: "Hindi", label: "Hindi", native: "हिन्दी" },
  { code: "Spanish", label: "Spanish", native: "Español" },
  { code: "Arabic", label: "Arabic", native: "العربية" },
  { code: "French", label: "French", native: "Français" },
  { code: "Portuguese", label: "Portuguese", native: "Português" },
  { code: "Russian", label: "Russian", native: "Русский" },
  { code: "Japanese", label: "Japanese", native: "日本語" },
  { code: "Korean", label: "Korean", native: "한국어" },
  { code: "German", label: "German", native: "Deutsch" },
  { code: "Vietnamese", label: "Vietnamese", native: "Tiếng Việt" },
  { code: "Malay", label: "Malaysian", native: "Bahasa Melayu" },
  { code: "Indonesian", label: "Indonesian", native: "Bahasa Indonesia" },
  { code: "Thai", label: "Thai", native: "ไทย" },
  { code: "Turkish", label: "Turkish", native: "Türkçe" },
  { code: "Urdu", label: "Urdu", native: "اردو" },
  { code: "Persian", label: "Persian", native: "فارسی" },
];

const RTL = new Set(["Arabic", "Urdu", "Persian"]);

// ---------- Structured content (verbatim facts, restructured presentation) ----------

const TOC: { id: string; label: string }[] = [
  { id: "overview", label: "Arc Overview" },
  { id: "what-is", label: "What is Arc?" },
  { id: "highlights", label: "Key Highlights" },
  { id: "why", label: "Why Arc Exists" },
  { id: "solution", label: "How Arc Solves This" },
  { id: "network", label: "Network Information" },
  { id: "timeline", label: "Timeline" },
  { id: "ecosystem", label: "Circle Ecosystem" },
  { id: "founders", label: "Founders & Backers" },
  { id: "resources", label: "Builder Resources" },
  { id: "properties", label: "Technical Properties" },
  { id: "use-cases", label: "Use Cases" },
];

const HIGHLIGHTS = [
  {
    icon: Coins,
    title: "USDC Native Gas",
    desc: "No ETH. No volatile gas token. Fees are stable and dollar-denominated, typically well under a cent on testnet.",
  },
  {
    icon: Gauge,
    title: "Deterministic Finality",
    desc: "Sub-second settlement with no confirmation guessing. Once a transaction lands, it is final.",
  },
  {
    icon: DollarSign,
    title: "Built-in FX Engine",
    desc: "Onchain foreign exchange with transparent pricing, instant settlement, and predictable dollar fees.",
  },
  {
    icon: Blocks,
    title: "EVM Compatible",
    desc: "Ship Solidity with Foundry, Hardhat, or Remix. Build frontends with wagmi and viem or ethers. Same tools, new economics.",
  },
  {
    icon: Network,
    title: "Deep Circle Integration",
    desc: "Native USDC and EURC, CCTP for cross-chain USDC, Gateway, Circle Wallets, and institutional on and off ramps.",
  },
  {
    icon: Eye,
    title: "Privacy Controls",
    desc: "Opt-in configurable privacy hides balances and history while staying auditable for compliance. Post-quantum security is on the roadmap.",
  },
];

const PROBLEMS = [
  { icon: Zap, text: "Volatile gas tokens like ETH and SOL make fees unpredictable." },
  { icon: Layers, text: "Liquidity is fragmented across L1s and L2s." },
  { icon: Shield, text: "Institutions face weak compliance tooling and hard privacy trade-offs." },
  { icon: Timer, text: "Probabilistic finality leaves no clear settled moment." },
];

const NETWORK_ROWS: { label: string; value: string; copy?: string }[] = [
  { label: "Network Name", value: "Arc Testnet" },
  { label: "RPC URL", value: "https://rpc.testnet.arc.network" },
  { label: "Chain ID", value: "5042002" },
  { label: "Currency Symbol", value: "USDC (native gas token)" },
  { label: "Block Explorer", value: "https://testnet.arcscan.app" },
  { label: "Faucet", value: "https://faucet.circle.com" },
];

const TIMELINE = [
  { title: "Public Testnet Live", desc: "Millions of transactions per week. The testnet is active and growing.", status: "done" as const },
  { title: "Builder Programs", desc: "Arc House, the Architects program, and Circle x Arc hackathons are driving adoption.", status: "done" as const },
  { title: "Mainnet Launch", desc: "Targeted for 2026. The initial validator set is permissioned at launch.", status: "current" as const },
  { title: "Open PoS Roadmap", desc: "Progressive decentralization toward an open, staked validator set.", status: "future" as const },
];

const ECOSYSTEM = ["USDC", "EURC", "CCTP", "Gateway", "Circle Wallets", "On/Off Ramps", "App Kit", "Unified Balance"];

const FOUNDERS = [
  { name: "Jeremy Allaire", role: "Co-founder, Chairman & CEO", org: "Circle", note: "The main visionary behind Arc. Has been pushing internet-native money for over a decade." },
  { name: "Nikhil Chandhok", role: "Chief Product & Technology Officer", org: "Circle", note: "Deeply involved in Arc's product and technology direction." },
  { name: "Sean Neville", role: "Co-founder", org: "Circle / Catena Labs", note: "Focused on AI-native finance at Catena Labs." },
  { name: "Malachite Team", role: "BFT Consensus Engineers", org: "ex-Informal Systems", note: "Joined Circle to build Arc's high-performance consensus in the Tendermint lineage." },
];

const BACKERS = ["a16z crypto", "BlackRock", "Apollo", "NYSE (ICE)", "ARK Invest"];

const RESOURCES = [
  { title: "Explorer", desc: "Arc Testnet block explorer", href: "https://testnet.arcscan.app", icon: Search },
  { title: "RPC Endpoint", desc: "https://rpc.testnet.arc.network", href: "https://rpc.testnet.arc.network", icon: Network },
  { title: "Faucet", desc: "Claim testnet USDC & EURC", href: "https://faucet.circle.com", icon: Wallet },
  { title: "Documentation", desc: "Official Arc developer docs", href: "https://docs.arc.io", icon: BookOpen },
  { title: "Overview", desc: "Arc chain overview", href: "https://docs.arc.io/arc-chain", icon: Globe },
  { title: "App Kit", desc: "Payment & liquidity primitives", href: "https://docs.arc.io/app-kit", icon: Blocks },
  { title: "Contract Addresses", desc: "Canonical USDC, EURC, CCTP", href: "https://docs.arc.io/arc/references/contract-addresses", icon: Database },
  { title: "Agentic Economy", desc: "ERC-8004 & ERC-8183", href: "https://docs.arc.io/build/agentic-economy", icon: Workflow },
];

const PROPERTIES = [
  {
    icon: Activity,
    title: "Consensus",
    body: "Malachite is a BFT consensus engine built by former Informal Systems engineers, in the Tendermint lineage. It is optimized for high throughput and deterministic ordering. The initial validator set is permissioned, with a roadmap toward open PoS.",
  },
  {
    icon: Gauge,
    title: "Finality",
    body: "Sub-second deterministic finality. Every included transaction is settled once it lands, with no need to wait for extra confirmations. That is what makes real-time payments, FX, and capital markets settlement viable.",
  },
  {
    icon: Eye,
    title: "Privacy",
    body: "Opt-in configurable privacy lets applications hide balances and history while remaining auditable for compliance. It is designed for institutions and regulated flows.",
  },
  {
    icon: Lock,
    title: "Security",
    body: "Enterprise-grade BFT security today, with post-quantum cryptography on the roadmap. Backed by Circle's compliance and legal infrastructure.",
  },
  {
    icon: Link2,
    title: "Composability",
    body: "Full EVM compatibility means Solidity, Foundry, Hardhat, Remix, wagmi, viem, and ethers all work out of the box. Cross-chain composability is handled through CCTP and the rest of Circle's stack.",
  },
  {
    icon: DollarSign,
    title: "FX Engine",
    body: "Built-in onchain FX with transparent pricing, instant settlement, and predictable dollar-denominated fees. Stablecoin foreign exchange is a first-class primitive.",
  },
];

const USE_CASES = [
  { icon: Wallet, title: "Peer-to-Peer Payments", desc: "Instant, low-cost stablecoin transfers with deterministic settlement." },
  { icon: Building2, title: "eCommerce Checkout", desc: "Accept stablecoin payments with fast settlement and built-in compliance." },
  { icon: DollarSign, title: "Stablecoin FX", desc: "Onchain FX with transparent pricing and predictable fees." },
  { icon: Database, title: "RWAs & Tokenization", desc: "Issuance, settlement, FX, and compliance-ready privacy for real-world assets." },
  { icon: Layers, title: "Lending & Prediction Markets", desc: "Stablecoin-native financial primitives with instant settlement." },
  { icon: Sparkles, title: "Agentic Economy", desc: "AI agents with onchain identity (ERC-8004) that can contract (ERC-8183) and settle 24/7 in USDC." },
];

// ---------- Small UI atoms ----------

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1400);
        } catch {}
      }}
      className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-slate-300 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
      title="Copy"
    >
      {ok ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {ok ? "Copied" : "Copy"}
    </button>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="group flex items-center gap-3">
      <h2 id={id} className="scroll-mt-28 text-[22px] font-bold tracking-tight text-white">
        {children}
      </h2>
      <button
        onClick={async () => {
          const url = `${window.location.origin}${window.location.pathname}#${id}`;
          try {
            await navigator.clipboard.writeText(url);
            setOk(true);
            setTimeout(() => setOk(false), 1400);
          } catch {}
        }}
        className="opacity-0 transition-opacity group-hover:opacity-100"
        title="Copy link to section"
      >
        {ok ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Link2 className="h-3.5 w-3.5 text-slate-400 hover:text-white" />}
      </button>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-[#101B31]/70 backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

function Accordion({ icon: Icon, title, body, open, onToggle }: {
  icon: React.ElementType;
  title: string;
  body: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.03]"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#3B82F6]/15 text-[#60A5FA]">
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-[15px] font-semibold text-white">{title}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-4 pl-16 text-[15px] leading-[1.7] text-slate-300">{body}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Main page ----------

function DocsPage() {
  const translate = useServerFn(translateArcDocs);
  const [lang, setLang] = useState("English");
  const [translation, setTranslation] = useState<string | null>(null);
  const [loadingLang, setLoadingLang] = useState(false);
  const [langError, setLangError] = useState<string | null>(null);
  const cache = useRef<Record<string, string>>({});

  const [activeId, setActiveId] = useState<string>("overview");
  const [progress, setProgress] = useState(0);
  const [query, setQuery] = useState("");
  const [openAcc, setOpenAcc] = useState<Record<string, boolean>>({ Consensus: true });

  const isRTL = useMemo(() => RTL.has(lang), [lang]);

  useEffect(() => {
    if (lang === "English") {
      setTranslation(null);
      setLangError(null);
      return;
    }
    if (cache.current[lang]) {
      setTranslation(cache.current[lang]);
      return;
    }
    let cancelled = false;
    setLoadingLang(true);
    setLangError(null);
    translate({ data: { language: lang } })
      .then((res) => {
        if (cancelled) return;
        cache.current[lang] = res.markdown;
        setTranslation(res.markdown);
      })
      .catch((e) => !cancelled && setLangError(e?.message ?? "Translation failed"))
      .finally(() => !cancelled && setLoadingLang(false));
    return () => {
      cancelled = true;
    };
  }, [lang, translate]);

  // Scroll spy + progress
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(height > 0 ? Math.min(100, (scrollTop / height) * 100) : 0);

      let current = TOC[0].id;
      for (const t of TOC) {
        const el = document.getElementById(t.id);
        if (el && el.getBoundingClientRect().top < 140) current = t.id;
      }
      setActiveId(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filteredTOC = useMemo(() => {
    if (!query.trim()) return TOC;
    const q = query.toLowerCase();
    return TOC.filter((t) => t.label.toLowerCase().includes(q));
  }, [query]);

  const toggleAll = (open: boolean) => {
    const next: Record<string, boolean> = {};
    PROPERTIES.forEach((p) => (next[p.title] = open));
    setOpenAcc(next);
  };

  return (
    <div
      className="relative min-h-screen"
      style={{
        background:
          "radial-gradient(1200px 700px at 15% -10%, rgba(59,130,246,0.18), transparent 60%), radial-gradient(900px 500px at 100% 20%, rgba(96,165,250,0.12), transparent 60%), #08111F",
      }}
    >
      {/* Reading progress bar */}
      <div className="fixed left-0 right-0 top-0 z-50 h-[3px] bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-[#93C5FD] transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mx-auto flex max-w-[1200px] gap-8 px-4 py-10 lg:px-6">
        {/* Sticky TOC */}
        <aside className="hidden lg:block lg:w-64 lg:shrink-0">
          <div className="sticky top-6">
            <Card className="p-4">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                <BookOpen className="h-3.5 w-3.5" />
                On this page
              </div>
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search sections…"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-1.5 pl-8 pr-2 text-[12px] text-white placeholder:text-slate-500 focus:border-[#3B82F6]/50 focus:outline-none"
                />
              </div>
              <nav className="flex flex-col gap-0.5">
                {filteredTOC.map((t) => {
                  const active = activeId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => scrollTo(t.id)}
                      className={`group relative rounded-md px-3 py-1.5 text-left text-[13px] transition-colors ${
                        active
                          ? "bg-[#3B82F6]/12 text-white"
                          : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
                      }`}
                    >
                      <span
                        className={`absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r ${
                          active ? "bg-[#60A5FA]" : "bg-transparent"
                        }`}
                      />
                      {t.label}
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>
        </aside>

        {/* Main content */}
        <main className="mx-auto w-full max-w-[900px] min-w-0">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-300">
              <Sparkles className="h-3 w-3 text-[#60A5FA]" />
              Knowledge base
            </div>
            <h1 className="text-[32px] font-bold leading-tight tracking-tight text-white sm:text-[36px]">
              Arc Documentation
            </h1>
            <p className="mt-3 max-w-2xl text-[18px] leading-[1.6] text-slate-400">
              Everything ArcPilot knows about <span className="font-semibold text-white">Arc</span>, Circle's
              Layer-1 for programmable money. Ask the AI Chat anything from these topics.
            </p>

            {/* Language + controls */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                <Languages className="h-4 w-4 text-[#60A5FA]" />
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  disabled={loadingLang}
                  className="bg-transparent text-sm text-white outline-none disabled:opacity-60"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-[#101B31]">
                      {l.native} · {l.label}
                    </option>
                  ))}
                </select>
                {loadingLang && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
              </div>
              <button
                onClick={() => toggleAll(true)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-slate-300 transition-colors hover:border-white/20 hover:text-white"
              >
                Expand all
              </button>
              <button
                onClick={() => toggleAll(false)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-slate-300 transition-colors hover:border-white/20 hover:text-white"
              >
                Collapse all
              </button>
            </div>

            {langError && (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {langError}
              </div>
            )}

            {translation && (
              <Card className="mt-6 p-5" >
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#60A5FA]">
                  <Languages className="h-3.5 w-3.5" />
                  {lang} translation
                </div>
                <div
                  dir={isRTL ? "rtl" : "ltr"}
                  className="whitespace-pre-wrap text-[14px] leading-[1.75] text-slate-300"
                >
                  {translation}
                </div>
              </Card>
            )}
          </motion.header>

          {/* SECTION: Overview */}
          <Section>
            <SectionHeading id="overview">Arc Overview</SectionHeading>
            <Card className="mt-4 p-6">
              <p className="text-[16px] leading-[1.7] text-slate-300">
                Arc is an <b className="text-white">open, EVM-compatible Layer-1 blockchain</b> purpose-built for{" "}
                <b className="text-white">stablecoin-native economic activity</b> — payments, FX, capital markets,
                tokenized assets (RWAs), lending, and the agentic (AI) economy. Unlike general-purpose chains, Arc
                is optimized for real-world money movement with <b className="text-white">USDC as the native gas token</b>.
              </p>
              <p className="mt-3 text-[15px] italic text-slate-400">
                "The Economic OS for the internet." — Built by <b className="text-white not-italic">Circle</b>, the issuer of USDC.
              </p>
            </Card>
          </Section>

          {/* SECTION: What is Arc */}
          <Section>
            <SectionHeading id="what-is">What is Arc?</SectionHeading>
            <div className="mt-4 space-y-4 text-[16px] leading-[1.7] text-slate-300">
              <p>
                Arc is a stablecoin-native Layer-1 that turns dollars into a first-class primitive. USDC is not
                just a token on the chain — it's the fuel. Every transaction, every contract deployment, every
                agent action pays for itself in stable, dollar-denominated value.
              </p>
              <p>
                Where general-purpose chains treat payments as one workload among many, Arc treats them as the
                workload. Consensus, gas mechanics, FX, and privacy are all designed around the assumption that
                money is moving — and that it needs to settle deterministically, cheaply, and compliantly.
              </p>
              <p>
                The chain is <b className="text-white">EVM-compatible</b>, so existing Solidity contracts, Foundry
                pipelines, and wagmi/viem frontends work today. What's new is what surrounds them: native USDC
                gas, sub-second finality, an onchain FX engine, opt-in privacy, and deep integration with Circle's
                CCTP and Gateway.
              </p>
            </div>
          </Section>

          {/* SECTION: Highlights */}
          <Section>
            <SectionHeading id="highlights">Key Highlights</SectionHeading>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {HIGHLIGHTS.map((h, i) => (
                <motion.div
                  key={h.title}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                >
                  <Card className="group h-full p-5 transition-all hover:-translate-y-0.5 hover:border-[#3B82F6]/40 hover:bg-[#101B31]">
                    <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-[#3B82F6]/15 text-[#60A5FA] transition-colors group-hover:bg-[#3B82F6]/25">
                      <h.icon className="h-5 w-5" />
                    </div>
                    <div className="text-[15px] font-semibold text-white">{h.title}</div>
                    <p className="mt-1.5 text-[14px] leading-[1.65] text-slate-400">{h.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </Section>

          {/* SECTION: Why */}
          <Section>
            <SectionHeading id="why">Why Arc Exists</SectionHeading>
            <p className="mt-3 text-[16px] leading-[1.7] text-slate-400">
              Enterprises and builders on existing chains struggle with fundamental frictions:
            </p>
            <ul className="mt-4 space-y-2.5">
              {PROBLEMS.map((p) => (
                <li
                  key={p.text}
                  className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                >
                  <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-300">
                    <p.icon className="h-4 w-4" />
                  </div>
                  <span className="text-[15px] leading-[1.6] text-slate-300">{p.text}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* SECTION: Solution */}
          <Section>
            <SectionHeading id="solution">How Arc Solves This</SectionHeading>
            <div className="mt-4 overflow-hidden rounded-2xl border border-[#3B82F6]/30 bg-gradient-to-br from-[#3B82F6]/10 via-[#60A5FA]/[0.06] to-transparent p-6">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#60A5FA]">
                <Sparkles className="h-3.5 w-3.5" />
                The Arc Answer
              </div>
              <p className="text-[16px] leading-[1.7] text-slate-200">
                Arc makes <b className="text-white">stablecoins the native medium</b> and gives builders
                enterprise-grade reliability plus composability across chains via Circle's stack. Predictable
                USDC-denominated fees, deterministic sub-second finality, native cross-chain USDC through CCTP,
                and opt-in configurable privacy — all on an EVM-compatible base that ships with Solidity today.
              </p>
            </div>
          </Section>

          {/* SECTION: Network */}
          <Section>
            <SectionHeading id="network">Network Information</SectionHeading>
            <Card className="mt-4 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] uppercase tracking-[0.14em] text-slate-400">
                    <th className="px-5 py-3 font-semibold">Field</th>
                    <th className="px-5 py-3 font-semibold">Value</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {NETWORK_ROWS.map((r, i) => (
                    <tr
                      key={r.label}
                      className={`transition-colors hover:bg-white/[0.02] ${
                        i !== NETWORK_ROWS.length - 1 ? "border-b border-white/[0.06]" : ""
                      }`}
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-300">{r.label}</td>
                      <td className="px-5 py-3.5 font-mono text-[13px] text-white">{r.value}</td>
                      <td className="px-5 py-3.5 text-right">
                        <CopyBtn text={r.value} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </Section>

          {/* SECTION: Timeline */}
          <Section>
            <SectionHeading id="timeline">Timeline</SectionHeading>
            <div className="mt-4 relative pl-6">
              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gradient-to-b from-[#3B82F6] via-[#60A5FA]/40 to-white/[0.08]" />
              <div className="space-y-5">
                {TIMELINE.map((t) => (
                  <div key={t.title} className="relative">
                    <div
                      className={`absolute -left-[22px] top-1.5 grid h-4 w-4 place-items-center rounded-full border-2 ${
                        t.status === "done"
                          ? "border-[#60A5FA] bg-[#3B82F6]"
                          : t.status === "current"
                          ? "border-[#60A5FA] bg-[#08111F]"
                          : "border-white/20 bg-[#08111F]"
                      }`}
                    >
                      {t.status === "current" && (
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#60A5FA]" />
                      )}
                    </div>
                    <Card className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-semibold text-white">{t.title}</span>
                        {t.status === "current" && (
                          <span className="rounded-full border border-[#60A5FA]/40 bg-[#3B82F6]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#93C5FD]">
                            Next
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[14px] leading-[1.6] text-slate-400">{t.desc}</p>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* SECTION: Ecosystem */}
          <Section>
            <SectionHeading id="ecosystem">Circle Ecosystem</SectionHeading>
            <p className="mt-3 text-[16px] leading-[1.7] text-slate-400">
              Arc is deeply integrated with Circle's product stack. These primitives ship out of the box:
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {ECOSYSTEM.map((b) => (
                <span
                  key={b}
                  className="rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-3.5 py-1.5 text-[13px] font-medium text-[#93C5FD] transition-colors hover:border-[#60A5FA]/60 hover:bg-[#3B82F6]/20"
                >
                  {b}
                </span>
              ))}
            </div>
          </Section>

          {/* SECTION: Founders */}
          <Section>
            <SectionHeading id="founders">Founders & Backers</SectionHeading>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FOUNDERS.map((f) => (
                <Card key={f.name} className="p-5 transition-all hover:border-white/20">
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] text-sm font-bold text-white">
                      {f.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-semibold text-white">{f.name}</div>
                      <div className="text-[13px] text-[#60A5FA]">{f.role}</div>
                      <div className="text-[12px] text-slate-500">{f.org}</div>
                    </div>
                  </div>
                  <p className="mt-3 text-[13px] leading-[1.6] text-slate-400">{f.note}</p>
                </Card>
              ))}
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                <Users className="h-3.5 w-3.5" />
                Backers & Partners
              </div>
              <div className="flex flex-wrap gap-2">
                {BACKERS.map((b) => (
                  <span
                    key={b}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[13px] text-slate-300"
                  >
                    {b}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[13px] text-slate-500">
                <b className="text-slate-300">Presale (May 2026)</b>: raised $222M at a $3B FDV, led by a16z crypto.
              </p>
            </div>
          </Section>

          {/* SECTION: Resources */}
          <Section>
            <SectionHeading id="resources">Builder Resources</SectionHeading>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {RESOURCES.map((r) => (
                <a
                  key={r.title}
                  href={r.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group"
                >
                  <Card className="flex items-center justify-between gap-3 p-4 transition-all group-hover:-translate-y-0.5 group-hover:border-[#3B82F6]/40">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#3B82F6]/15 text-[#60A5FA]">
                        <r.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-semibold text-white">{r.title}</div>
                        <div className="truncate text-[12px] text-slate-500">{r.desc}</div>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-[#60A5FA]" />
                  </Card>
                </a>
              ))}
            </div>
          </Section>

          {/* SECTION: Technical Properties (accordions) */}
          <Section>
            <SectionHeading id="properties">Technical Properties</SectionHeading>
            <div className="mt-4 space-y-2">
              {PROPERTIES.map((p) => (
                <Accordion
                  key={p.title}
                  icon={p.icon}
                  title={p.title}
                  body={p.body}
                  open={!!openAcc[p.title]}
                  onToggle={() => setOpenAcc((s) => ({ ...s, [p.title]: !s[p.title] }))}
                />
              ))}
            </div>
          </Section>

          {/* SECTION: Use cases */}
          <Section>
            <SectionHeading id="use-cases">Use Cases</SectionHeading>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {USE_CASES.map((u) => (
                <Card key={u.title} className="p-5 transition-all hover:-translate-y-0.5 hover:border-[#3B82F6]/40">
                  <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-[#60A5FA]/15 text-[#60A5FA]">
                    <u.icon className="h-5 w-5" />
                  </div>
                  <div className="text-[15px] font-semibold text-white">{u.title}</div>
                  <p className="mt-1.5 text-[14px] leading-[1.6] text-slate-400">{u.desc}</p>
                </Card>
              ))}
            </div>
          </Section>

          <div className="mt-14 border-t border-white/[0.06] pt-6 text-center">
            <p className="text-[12px] text-slate-500">
              Sourced from{" "}
              <a
                href="https://docs.arc.io"
                target="_blank"
                rel="noreferrer"
                className="text-[#60A5FA] underline-offset-2 hover:underline"
              >
                docs.arc.io
              </a>
              . Translations by AI — technical terms preserved. Testnet only — no real value.
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-slate-600">
              <Clock className="h-3 w-3" />
              Reading progress {Math.round(progress)}%
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4 }}
      className="mt-10"
    >
      {children}
    </motion.section>
  );
}
