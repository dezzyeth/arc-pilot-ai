import { Link, createFileRoute } from "@tanstack/react-router";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  ChevronDown,
  Cpu,
  Layers,
  LineChart,
  Lock,
  Radar,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";

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
      { property: "og:title", content: "ArcPilot.ai — AI finance copilot for Arc Testnet" },
      {
        property: "og:description",
        content: "Talk to your wallet. Simulate, verify and sign — all in one prompt.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

/* ---------------------------------------------------------------- */
/*  Data                                                             */
/* ---------------------------------------------------------------- */

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#stats", label: "Stats" },
  { href: "#faq", label: "FAQ" },
] as const;

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "Natural-language intent",
    body: "Say what you want in plain English. ArcPilot resolves it into a signed, simulated protocol call.",
    span: "md:col-span-2 md:row-span-2",
    accent: "from-[#4F46E5] to-[#8B5CF6]",
  },
  {
    icon: ShieldCheck,
    title: "Risk engine",
    body: "Every transaction is simulated. Unknown addresses, large transfers and gas spikes are flagged before you sign.",
    span: "md:col-span-2",
    accent: "from-[#8B5CF6] to-[#06B6D4]",
  },
  {
    icon: Zap,
    title: "Arc-native execution",
    body: "The copilot refuses to sign on any other network — auto-switches MetaMask to Arc Testnet.",
    span: "",
    accent: "from-[#06B6D4] to-[#4F46E5]",
  },
  {
    icon: Wallet,
    title: "Wallet-native",
    body: "MetaMask & injected EVM wallets via a lean wagmi setup. No custody, ever.",
    span: "",
    accent: "from-[#10B981] to-[#06B6D4]",
  },
  {
    icon: LineChart,
    title: "Portfolio & reports",
    body: "Every action indexed into a live portfolio, spending report and AI-drafted insights.",
    span: "md:col-span-2",
    accent: "from-[#4F46E5] to-[#06B6D4]",
  },
] as const;

const STEPS = [
  { n: "01", t: "Connect", d: "Link MetaMask on Arc Testnet." },
  { n: "02", t: "Prompt", d: "Type what you want. Plain English." },
  { n: "03", t: "Simulate", d: "Review risk, gas and impact." },
  { n: "04", t: "Sign", d: "One signature. Fully verifiable." },
];

const STATS = [
  { value: 5042002, label: "Arc chain ID", suffix: "", format: (n: number) => n.toLocaleString() },
  { value: 60, label: "FPS motion budget", suffix: "fps" },
  { value: 100, label: "Simulated before sign", suffix: "%" },
  { value: 0, label: "Custody of funds", suffix: "" },
];

const INTEGRATIONS = [
  "Arc Testnet",
  "USDC",
  "MetaMask",
  "wagmi",
  "viem",
  "Foundry",
  "Circle",
  "Gemini",
  "Malachite",
  "Sonner",
];

const FAQS = [
  {
    q: "Is ArcPilot custodial?",
    a: "No. ArcPilot never holds keys or funds. Every action is a signature from your own MetaMask.",
  },
  {
    q: "Which network is supported?",
    a: "Arc Testnet only (chain ID 5042002). The app refuses to sign on any other chain and prompts you to switch.",
  },
  {
    q: "How does the AI understand my request?",
    a: "A structured intent parser plus Gemini via the Lovable AI Gateway. Every draft is simulated locally before you see it.",
  },
  {
    q: "What if a transaction looks risky?",
    a: "The risk engine flags unknown addresses, large transfers, and gas spikes. You can always reject before signing.",
  },
];

const PRODUCT_LINKS: {
  label: string;
  desc: string;
  to:
    | "/app"
    | "/app/chat"
    | "/app/portfolio"
    | "/app/planner"
    | "/app/budgets"
    | "/app/reports"
    | "/app/docs"
    | "/app/manual";
}[] = [
  { label: "Dashboard", desc: "Live wallet overview", to: "/app" },
  { label: "AI Chat", desc: "Talk to your wallet", to: "/app/chat" },
  { label: "Portfolio", desc: "Holdings & history", to: "/app/portfolio" },
  { label: "Planner", desc: "Scheduled & conditional tx", to: "/app/planner" },
  { label: "Budgets", desc: "Guardrails & alerts", to: "/app/budgets" },
  { label: "Reports", desc: "AI spend analysis", to: "/app/reports" },
  { label: "Docs", desc: "Arc knowledge base", to: "/app/docs" },
  { label: "Manual", desc: "9-step user guide", to: "/app/manual" },
];

/* ---------------------------------------------------------------- */
/*  Micro-primitives                                                 */
/* ---------------------------------------------------------------- */

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(m.matches);
    update();
    m.addEventListener?.("change", update);
    return () => m.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

function Reveal({
  children,
  delay = 0,
  y = 24,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function MagneticButton({
  children,
  className = "",
  onClick,
  as = "button",
  href,
  to,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  as?: "button" | "a" | "link";
  href?: string;
  to?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 15, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 180, damping: 15, mass: 0.4 });

  const handleMove = (e: ReactMouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = e.clientY - rect.top - rect.height / 2;
    x.set(mx * 0.25);
    y.set(my * 0.25);
  };
  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  const inner = (
    <motion.span
      ref={ref as never}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      style={{ x: sx, y: sy }}
      className={`inline-flex items-center justify-center will-change-transform ${className}`}
    >
      {children}
    </motion.span>
  );

  if (as === "link" && to) {
    return (
      <Link to={to} className="inline-flex">
        {inner}
      </Link>
    );
  }
  if (as === "a" && href) {
    return (
      <a href={href} className="inline-flex">
        {inner}
      </a>
    );
  }
  return inner;
}

function Counter({
  to,
  duration = 1.6,
  format,
}: {
  to: number;
  duration?: number;
  format?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setVal(to);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration, reduced]);

  return <span ref={ref}>{format ? format(val) : val.toLocaleString()}</span>;
}

function TiltCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), {
    stiffness: 150,
    damping: 15,
  });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), {
    stiffness: 150,
    damping: 15,
  });

  const spotX = useMotionValue(50);
  const spotY = useMotionValue(50);

  const handleMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    mx.set(px - 0.5);
    my.set(py - 0.5);
    spotX.set(px * 100);
    spotY.set(py * 100);
  };
  const handleLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }}
      className={`group relative ${className}`}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: useTransform(
            [spotX, spotY],
            ([x, y]: number[]) =>
              `radial-gradient(400px circle at ${x}% ${y}%, rgba(139,92,246,0.18), transparent 60%)`,
          ),
        }}
      />
      {children}
    </motion.div>
  );
}

/* ---------------------------------------------------------------- */
/*  Landing                                                          */
/* ---------------------------------------------------------------- */

function Landing() {
  const spotX = useMotionValue(-1000);
  const spotY = useMotionValue(-1000);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll();
  const progressScale = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: MouseEvent) => {
      spotX.set(e.clientX);
      spotY.set(e.clientY);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduced, spotX, spotY]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#030712] text-white selection:bg-[#8B5CF6]/30 selection:text-white">
      {/* Scroll progress line */}
      <motion.div
        style={{ scaleX: progressScale, transformOrigin: "0% 50%" }}
        className="fixed left-0 right-0 top-0 z-[60] h-[2px] bg-gradient-to-r from-[#4F46E5] via-[#8B5CF6] to-[#06B6D4]"
      />

      {/* Mouse-follow spotlight */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1] hidden md:block"
        style={{
          background: useTransform(
            [spotX, spotY],
            ([x, y]: number[]) =>
              `radial-gradient(600px circle at ${x}px ${y}px, rgba(79,70,229,0.10), transparent 40%)`,
          ),
        }}
      />

      {/* Slow grid drift */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          animation: reduced ? undefined : "gridDrift 60s linear infinite",
        }}
      />

      <style>{`
        @keyframes gridDrift {
          0% { background-position: 0 0, 0 0; }
          100% { background-position: 56px 56px, 56px 56px; }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-14px); }
        }
        @keyframes blobDrift1 {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50%      { transform: translate3d(60px,-40px,0) scale(1.1); }
        }
        @keyframes blobDrift2 {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50%      { transform: translate3d(-70px,50px,0) scale(0.95); }
        }
      `}</style>

      <Nav />

      <div className="relative z-10">
        <Hero />
        <LogoMarquee />
        <Features />
        <HowItWorks />
        <Stats />
        <ProductGrid />
        <FAQ />
        <FinalCTA />
        <Footer />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Sections                                                         */
/* ---------------------------------------------------------------- */

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("#features");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(`#${e.target.id}`);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    NAV_LINKS.forEach((l) => {
      const el = document.querySelector(l.href);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`sticky top-0 z-50 flex items-center justify-between px-6 py-3 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-[#030712]/70 backdrop-blur-2xl"
          : "border-b border-transparent"
      }`}
    >
      <Link
        to="/"
        className="flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8B5CF6]"
      >
        <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#8B5CF6] shadow-[0_0_24px_rgba(139,92,246,0.35)]">
          <img src={arcLogo} alt="Arc" className="h-full w-full object-cover" draggable={false} />
        </div>
        <span className="text-[15px] font-semibold tracking-tight">ArcPilot.ai</span>
      </Link>

      <div className="relative hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.02] p-1 text-sm text-white/70 backdrop-blur-xl md:flex">
        {NAV_LINKS.map((l) => {
          const isActive = active === l.href;
          return (
            <a
              key={l.href}
              href={l.href}
              className={`relative rounded-full px-4 py-1.5 transition-colors ${
                isActive ? "text-white" : "hover:text-white"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-[#4F46E5]/25 to-[#8B5CF6]/25 ring-1 ring-white/10"
                />
              )}
              <span className="relative">{l.label}</span>
            </a>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <MagneticButton
          as="link"
          to="/app"
          className="hidden rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-white/90 sm:inline-flex"
        >
          Launch App
        </MagneticButton>
        <WalletButton />
      </div>
    </motion.nav>
  );
}

function Hero() {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -60]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.4]);

  return (
    <section className="relative flex min-h-[calc(100vh-64px)] flex-col items-center justify-center overflow-hidden px-6 pt-16">
      {/* Aurora blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute left-1/2 top-1/3 h-[560px] w-[560px] -translate-x-1/2 rounded-full opacity-60 mix-blend-screen blur-[120px]"
          style={{
            background:
              "radial-gradient(closest-side, rgba(79,70,229,0.55), transparent)",
            animation: reduced ? undefined : "blobDrift1 22s ease-in-out infinite",
          }}
        />
        <div
          className="absolute left-1/4 top-1/2 h-[480px] w-[480px] rounded-full opacity-50 mix-blend-screen blur-[120px]"
          style={{
            background:
              "radial-gradient(closest-side, rgba(139,92,246,0.45), transparent)",
            animation: reduced ? undefined : "blobDrift2 26s ease-in-out infinite",
          }}
        />
        <div
          className="absolute right-1/4 top-1/4 h-[420px] w-[420px] rounded-full opacity-40 mix-blend-screen blur-[110px]"
          style={{
            background:
              "radial-gradient(closest-side, rgba(6,182,212,0.4), transparent)",
            animation: reduced ? undefined : "blobDrift1 30s ease-in-out infinite",
          }}
        />
      </div>

      {/* Floating shapes */}
      {!reduced && (
        <>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-[8%] top-[22%] hidden h-16 w-16 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm md:block"
            style={{ animation: "floatY 8s ease-in-out infinite" }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute right-[10%] top-[30%] hidden h-10 w-10 rotate-45 rounded-lg border border-[#8B5CF6]/30 md:block"
            style={{ animation: "floatY 10s ease-in-out infinite 1s" }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-[14%] bottom-[18%] hidden h-8 w-8 rounded-full border border-[#06B6D4]/40 md:block"
            style={{ animation: "floatY 9s ease-in-out infinite 0.5s" }}
          />
        </>
      )}

      <motion.div
        style={reduced ? undefined : { y: heroY, opacity: heroOpacity }}
        className="relative z-10 flex max-w-5xl flex-col items-center text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 backdrop-blur-xl"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10B981]" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
            Live · Arc Testnet
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 text-balance text-5xl font-semibold leading-[0.95] tracking-[-0.03em] md:text-7xl lg:text-[92px]"
          style={{ fontFamily: "'Space Grotesk', Inter, sans-serif" }}
        >
          Talk to your wallet.{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(120deg, #4F46E5 0%, #8B5CF6 40%, #06B6D4 80%, #10B981 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 8s linear infinite",
            }}
          >
            Ship intent.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mb-10 max-w-2xl text-balance text-base leading-relaxed text-white/60 md:text-lg"
        >
          ArcPilot understands what you want, simulates it, explains the risk in plain English, and
          only then asks you to sign. An AI copilot native to Arc Testnet.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <MagneticButton
            as="link"
            to="/app"
            className="group relative w-full overflow-hidden rounded-full bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_40px_-10px_rgba(79,70,229,0.7)] transition-shadow hover:shadow-[0_10px_50px_-8px_rgba(139,92,246,0.8)] sm:w-auto"
          >
            <span className="relative z-10 inline-flex items-center gap-2">
              Open ArcPilot
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
            <span
              aria-hidden
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
            />
          </MagneticButton>

          <MagneticButton
            as="a"
            href="#how"
            className="w-full rounded-full border border-white/15 bg-white/[0.03] px-7 py-3.5 text-[15px] font-semibold text-white backdrop-blur-xl transition-colors hover:bg-white/[0.06] sm:w-auto"
          >
            How it works
          </MagneticButton>
        </motion.div>
      </motion.div>

      {/* Chat mockup */}
      <motion.div
        initial={{ opacity: 0, y: 60, rotateX: 12 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformPerspective: 1400 }}
        className="relative z-10 mt-16 w-full max-w-4xl"
      >
        <TiltCard className="rounded-2xl">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f1f]/80 shadow-[0_40px_120px_-20px_rgba(79,70,229,0.35)] backdrop-blur-xl">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-2xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(79,70,229,0.20), transparent 40%, rgba(6,182,212,0.15))",
                mask: "linear-gradient(#000,#000) content-box, linear-gradient(#000,#000)",
                WebkitMask:
                  "linear-gradient(#000,#000) content-box, linear-gradient(#000,#000)",
                padding: "1px",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />
            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
              </div>
              <div className="mx-auto text-[10px] font-medium uppercase tracking-[0.2em] text-white/30">
                arcpilot · prompt interface
              </div>
            </div>
            <div className="space-y-6 p-6 md:p-8">
              <div className="flex justify-end">
                <div className="max-w-md rounded-2xl rounded-tr-sm border border-white/10 bg-white/[0.05] px-4 py-3 text-sm md:text-[15px]">
                  Send 25 USDC to 0x8Ba1…c9F2 and warn me if that's a new address.
                </div>
              </div>
              <div className="flex justify-start gap-3">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#4F46E5] to-[#8B5CF6] shadow-[0_0_20px_rgba(139,92,246,0.4)]">
                  <img src={arcLogo} alt="Arc" className="h-full w-full object-cover" />
                </div>
                <div className="max-w-xl flex-1 rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.02] p-4">
                  <p className="mb-3 text-sm leading-relaxed text-white/90 md:text-[15px]">
                    Drafted on Arc Testnet. This address has no prior interactions —{" "}
                    <span className="font-medium text-[#8B5CF6]">medium risk</span>.
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-lg border border-white/5 bg-black/40 p-3">
                      <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-white/40">
                        Transfer
                      </div>
                      <div className="font-mono text-xs">25 USDC → 0x8Ba1…c9F2</div>
                    </div>
                    <div className="rounded-lg border border-white/5 bg-black/40 p-3">
                      <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-white/40">
                        Est. gas
                      </div>
                      <div className="font-mono text-xs">0.00021 USDC</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TiltCard>
      </motion.div>
    </section>
  );
}

function LogoMarquee() {
  const strip = useMemo(() => [...INTEGRATIONS, ...INTEGRATIONS], []);
  return (
    <section className="relative border-y border-white/5 py-10">
      <div className="mx-auto mb-6 max-w-6xl px-6">
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.25em] text-white/40">
          Built on & integrating with
        </p>
      </div>
      <div
        className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]"
        aria-hidden
      >
        <div
          className="flex w-max gap-14 whitespace-nowrap"
          style={{ animation: "marquee 40s linear infinite" }}
        >
          {strip.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="text-lg font-semibold tracking-tight text-white/40 transition-colors hover:text-white"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="relative px-6 py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#8B5CF6]">
            Features
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2
            className="mb-4 max-w-3xl text-4xl font-semibold tracking-[-0.02em] md:text-6xl"
            style={{ fontFamily: "'Space Grotesk', Inter, sans-serif" }}
          >
            Every guardrail, built in.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mb-16 max-w-xl text-white/50">
            A minimalist surface backed by a production-grade risk, simulation and execution stack.
          </p>
        </Reveal>

        <div className="grid auto-rows-[220px] grid-cols-1 gap-4 md:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08} className={`${f.span} h-full`}>
              <TiltCard className="h-full rounded-2xl">
                <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl transition-transform duration-500 hover:-translate-y-1">
                  {/* gradient border */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-2xl opacity-40"
                    style={{
                      background: `linear-gradient(135deg, transparent, transparent)`,
                    }}
                  />
                  <div
                    className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${f.accent} shadow-[0_0_30px_-6px_rgba(139,92,246,0.5)]`}
                  >
                    <f.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="mb-1.5 text-[15px] font-semibold tracking-tight">
                      {f.title}
                    </div>
                    <p className="text-sm leading-relaxed text-white/55">{f.body}</p>
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="relative border-t border-white/5 px-6 py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#06B6D4]">
            How it works
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2
            className="mb-16 max-w-2xl text-4xl font-semibold tracking-[-0.02em] md:text-6xl"
            style={{ fontFamily: "'Space Grotesk', Inter, sans-serif" }}
          >
            From sentence to signature.
          </h2>
        </Reveal>

        <div className="relative grid gap-4 md:grid-cols-4">
          {/* Connecting line */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-8 right-8 top-8 hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent md:block"
          />
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <div className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.04]">
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#4F46E5] to-[#8B5CF6] font-mono text-xs font-semibold shadow-[0_0_24px_-4px_rgba(139,92,246,0.6)]">
                  {s.n}
                </div>
                <div className="text-base font-semibold">{s.t}</div>
                <p className="mt-1 text-sm text-white/55">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section id="stats" className="relative border-t border-white/5 px-6 py-32">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-4 md:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-xl">
                <div
                  className="text-4xl font-semibold tracking-tight md:text-5xl"
                  style={{ fontFamily: "'Space Grotesk', Inter, sans-serif" }}
                >
                  <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    <Counter to={s.value} format={s.format} />
                    {s.suffix}
                  </span>
                </div>
                <div className="mt-2 text-sm text-white/50">{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductGrid() {
  const ICONS = [Wallet, Sparkles, BarChart3, Radar, ShieldCheck, LineChart, Layers, Cpu];
  return (
    <section className="relative border-t border-white/5 px-6 py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#10B981]">
            The app
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2
            className="mb-16 text-4xl font-semibold tracking-[-0.02em] md:text-6xl"
            style={{ fontFamily: "'Space Grotesk', Inter, sans-serif" }}
          >
            Everything inside ArcPilot.
          </h2>
        </Reveal>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {PRODUCT_LINKS.map((l, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <Reveal key={l.to} delay={i * 0.06}>
                <Link
                  to={l.to}
                  className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div className="mb-8 grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-[#4F46E5]/30 to-[#8B5CF6]/30 ring-1 ring-white/10">
                    <Icon className="h-4 w-4 text-white/80" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-semibold tracking-tight">{l.label}</span>
                      <ArrowRight className="h-4 w-4 text-white/30 transition-all group-hover:translate-x-1 group-hover:text-[#8B5CF6]" />
                    </div>
                    <p className="mt-1 text-xs text-white/50">{l.desc}</p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative border-t border-white/5 px-6 py-32">
      <div className="mx-auto grid max-w-6xl gap-16 md:grid-cols-[1fr_1.4fr]">
        <div>
          <Reveal>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#4F46E5]">
              FAQ
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2
              className="text-4xl font-semibold tracking-[-0.02em] md:text-5xl"
              style={{ fontFamily: "'Space Grotesk', Inter, sans-serif" }}
            >
              Questions,
              <br />
              answered.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 max-w-sm text-white/50">
              The essentials. For everything else, the docs and manual cover it end-to-end.
            </p>
          </Reveal>
        </div>

        <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition-colors hover:bg-white/[0.02]"
                >
                  <span className="text-[15px] font-semibold tracking-tight">{f.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid h-7 w-7 place-items-center rounded-full border border-white/10 text-white/70"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-sm leading-relaxed text-white/60">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative border-t border-white/5 px-6 py-32">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0f1f] to-[#030712] p-12 text-center md:p-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                background:
                  "radial-gradient(600px circle at 50% 0%, rgba(79,70,229,0.35), transparent 60%)",
              }}
            />
            <div className="relative z-10">
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#8B5CF6] shadow-[0_0_40px_-6px_rgba(139,92,246,0.7)]">
                <Lock className="h-5 w-5" />
              </div>
              <h3
                className="mb-4 text-4xl font-semibold tracking-[-0.02em] md:text-5xl"
                style={{ fontFamily: "'Space Grotesk', Inter, sans-serif" }}
              >
                Ready to talk to your wallet?
              </h3>
              <p className="mx-auto mb-8 max-w-xl text-white/55">
                Connect MetaMask, switch to Arc Testnet, and ArcPilot handles the rest.
              </p>
              <MagneticButton
                as="link"
                to="/app"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_40px_-10px_rgba(139,92,246,0.7)]"
              >
                Launch ArcPilot
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </MagneticButton>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-white/5 px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center overflow-hidden rounded bg-gradient-to-br from-[#4F46E5] to-[#8B5CF6]">
            <img src={arcLogo} alt="Arc" className="h-full w-full object-cover" />
          </div>
          <span className="text-sm font-semibold tracking-tight">ArcPilot.ai</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
          <Link
            to="/app/docs"
            className="story-link transition-colors hover:text-white"
          >
            Docs
          </Link>
          <Link
            to="/app/manual"
            className="story-link transition-colors hover:text-white"
          >
            Manual
          </Link>
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
        <div className="font-mono text-[11px] text-white/25">
          © {new Date().getFullYear()} ArcPilot Labs · Testnet only
        </div>
      </div>
    </footer>
  );
}
