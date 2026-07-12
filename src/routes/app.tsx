import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Lock, MessageSquare, Sparkles } from "lucide-react";

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
  { to: "/app/stake", label: "Stake", icon: Lock, exact: false },
];

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-card/40 backdrop-blur-xl md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 px-6">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-[image:var(--gradient-brand)] shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold">ArcPilot</span>
        </div>
        <nav className="flex flex-col gap-1 px-3 py-2">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors",
                  active
                    ? "bg-accent text-foreground shadow-glow"
                    : "hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-4">
          <div className="glass rounded-2xl p-4">
            <div className="text-xs text-muted-foreground">Network</div>
            <div className="mt-1 flex items-center gap-2 text-sm font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--success)]" />
              Arc Testnet
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/60 bg-background/70 px-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 md:hidden">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-[image:var(--gradient-brand)]">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">ArcPilot</span>
          </div>
          <div className="hidden text-sm text-muted-foreground md:block">
            {pathname === "/app" ? "Dashboard" : pathname === "/app/chat" ? "AI Chat" : ""}
          </div>
          <WalletButton />
        </header>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
