import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen, CalendarClock, FileBarChart, LayoutDashboard, LifeBuoy, MessageSquare, PieChart, Target,
} from "lucide-react";

import arcLogo from "@/assets/arc-logo.jpg";

import { WalletButton } from "@/components/wallet-button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app")({
  component: AppLayout,
  head: () => ({
    meta: [
      { title: "ArcPilot · Dashboard" },
      { name: "description", content: "Your AI finance copilot for Arc Testnet." },
    ],
  }),
});

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/chat", label: "AI Chat", icon: MessageSquare, exact: false },
  { to: "/app/portfolio", label: "Portfolio", icon: PieChart, exact: false },
  { to: "/app/planner", label: "Planner", icon: CalendarClock, exact: false },
  { to: "/app/budgets", label: "Budgets & Goals", icon: Target, exact: false },
  { to: "/app/reports", label: "Reports", icon: FileBarChart, exact: false },
  { to: "/app/docs", label: "Arc Docs", icon: BookOpen, exact: false },
  { to: "/app/manual", label: "How it works", icon: LifeBuoy, exact: false },
] as const;

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeLabel = nav.find((n) => (n.exact ? pathname === n.to : pathname.startsWith(n.to)))?.label ?? "";

  return (
    <div className="relative flex min-h-screen bg-[#030712] text-white selection:bg-[#8B5CF6]/30">
      <aside className="hidden w-64 shrink-0 border-r border-white/5 bg-[#030712]/60 backdrop-blur-2xl md:flex md:flex-col">
        <Link to="/" className="flex h-16 items-center gap-2.5 border-b border-white/5 px-6 focus-visible:outline-none">
          <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#8B5CF6] shadow-[0_0_24px_rgba(139,92,246,0.35)]">
            <img src={arcLogo} alt="Arc" className="h-full w-full object-cover" draggable={false} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight" style={{ fontFamily: "'Space Grotesk', Inter, sans-serif" }}>
            ArcPilot.ai
          </span>
        </Link>
        <div className="px-6 pt-6 pb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/30">
          Navigate
        </div>
        <nav className="flex flex-col gap-px px-3">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-gradient-to-r from-[#4F46E5]/15 to-[#8B5CF6]/10 text-white ring-1 ring-white/10"
                    : "text-white/55 hover:bg-white/[0.03] hover:text-white",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-bar"
                    className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-gradient-to-b from-[#4F46E5] to-[#8B5CF6] shadow-[0_0_10px_rgba(139,92,246,0.7)]"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <n.icon className={cn("h-4 w-4 transition-colors", active ? "text-[#8B5CF6]" : "text-white/40 group-hover:text-white")} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-4">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-xl">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                background:
                  "radial-gradient(200px circle at 20% 0%, rgba(79,70,229,0.18), transparent 70%)",
              }}
            />
            <div className="relative text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">
              Network
            </div>
            <div className="relative mt-2 flex items-center gap-2 text-sm font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10B981]" />
              </span>
              Arc Testnet
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/5 bg-[#030712]/60 px-6 backdrop-blur-2xl">
          <div className="flex items-center gap-2.5 md:hidden">
            <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#8B5CF6]">
              <img src={arcLogo} alt="Arc" className="h-full w-full object-cover" draggable={false} />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">ArcPilot.ai</span>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/30">ArcPilot</span>
            <span className="text-white/20">/</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={activeLabel}
                initial={{ opacity: 0, y: 4, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
                transition={{ duration: 0.25 }}
                className="text-sm font-semibold text-white"
              >
                {activeLabel}
              </motion.span>
            </AnimatePresence>
          </div>
          <WalletButton />
        </header>
        <main className="relative min-w-0 flex-1 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
