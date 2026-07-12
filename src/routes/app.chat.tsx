import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowUp, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import {
  formatUnits,
  isAddress,
  parseUnits,
  type Address,
} from "viem";
import {
  useAccount,
  useBalance,
  useChainId,
  useEstimateGas,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from "wagmi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ARC_CHAIN_ID, arcTestnet } from "@/lib/chains";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/chat")({
  component: ChatPage,
  head: () => ({
    meta: [
      { title: "ArcPilot · AI Chat" },
      { name: "description", content: "Chat with your Arc Testnet wallet." },
    ],
  }),
});

type Role = "user" | "assistant";

type TxPlan = {
  kind: "send_native";
  to: Address;
  amountArc: string;
  note?: string;
};

type Message = {
  id: string;
  role: Role;
  content: string;
  plan?: TxPlan;
  streaming?: boolean;
};

const uid = () => Math.random().toString(36).slice(2);

/**
 * Deterministic client-side intent parser.
 * We do this on the client so we can guarantee no transaction is ever
 * proposed for anything other than Arc Testnet.
 * Grammar: "send <amount> arc to <0x...>"
 */
function parseSendIntent(text: string): TxPlan | null {
  const re =
    /send\s+([\d.]+)\s*(?:usdc|arc)?\s+to\s+(0x[a-fA-F0-9]{40})/i;
  const m = text.match(re);
  if (!m) return null;
  const amount = m[1];
  const to = m[2] as Address;
  if (!isAddress(to)) return null;
  if (!/^\d+(\.\d+)?$/.test(amount)) return null;
  return { kind: "send_native", to, amountArc: amount };
}

function ChatPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      role: "assistant",
      content:
        "Hi — I'm **ArcPilot**. I can help you send USDC, explain transactions, and analyze risk on **Arc Testnet only**. Try: `Send 0.01 USDC to 0x0000000000000000000000000000000000000000`.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({
      top: scroller.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const suggestions = useMemo(
    () => [
      "What can you help me do on Arc Testnet?",
      "Send 0.01 USDC to 0x0000000000000000000000000000000000000000",
      "Explain gas on Arc Testnet",
    ],
    [],
  );

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const plan = parseSendIntent(text);
    const userMsg: Message = { id: uid(), role: "user", content: text };
    setInput("");

    if (plan) {
      const assistant: Message = {
        id: uid(),
        role: "assistant",
        content: `I'll help you send **${plan.amountArc} USDC** to \`${plan.to}\` on **Arc Testnet**. Review the simulation below and confirm to sign.`,
        plan,
      };
      setMessages((m) => [...m, userMsg, assistant]);
      return;
    }

    const assistantId = uid();
    setMessages((m) => [
      ...m,
      userMsg,
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ]);
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      if (!res.ok || !res.body) {
        throw new Error(`Chat failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId ? { ...msg, content: acc } : msg,
          ),
        );
      }
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId ? { ...msg, streaming: false } : msg,
        ),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content: `Sorry — I couldn't reach the AI: ${message}`,
                streaming: false,
              }
            : msg,
        ),
      );
      toast.error(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div ref={scroller} className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={cn("flex gap-3", m.role === "user" && "justify-end")}
              >
                {m.role === "assistant" && (
                  <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-brand)] shadow-glow">
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                    m.role === "user"
                      ? "rounded-tr-md bg-[image:var(--gradient-brand)] text-primary-foreground"
                      : "glass rounded-tl-md",
                  )}
                >
                  {m.content ? (
                    <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-code:rounded prose-code:bg-black/30 prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-[0.85em]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ) : m.streaming ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TypingDots />
                    </div>
                  ) : null}
                  {m.plan && mounted && <TxPlanCard plan={m.plan} />}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {messages.length <= 1 && (
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="glass rounded-2xl px-3 py-3 text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-border/60 bg-background/60 px-4 py-4 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <div className="glass flex-1 rounded-2xl px-3 py-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask ArcPilot or type: send 0.01 USDC to 0x…"
              className="border-0 bg-transparent focus-visible:ring-0"
              disabled={sending}
            />
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || sending}
            className="h-11 w-11 rounded-2xl p-0 shadow-glow"
            aria-label="Send"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-muted-foreground">
          ArcPilot only signs on Arc Testnet · always simulates · never auto-signs.
        </p>
      </form>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </span>
  );
}

function TxPlanCard({ plan }: { plan: TxPlan }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const wrongNetwork = isConnected && chainId !== ARC_CHAIN_ID;
  const { switchChain, isPending: switching } = useSwitchChain();

  const value = useMemo(() => {
    try {
      return parseUnits(plan.amountArc, 6);
    } catch {
      return null;
    }
  }, [plan.amountArc]);

  const { data: balance } = useBalance({
    address,
    chainId: ARC_CHAIN_ID,
    query: { enabled: !!address && !wrongNetwork },
  });

  const { data: gas, isFetching: gasFetching } = useEstimateGas({
    to: plan.to,
    value: value ?? undefined,
    chainId: ARC_CHAIN_ID,
    query: {
      enabled: !!address && !wrongNetwork && value !== null,
    },
  });

  const {
    sendTransaction,
    data: txHash,
    isPending: signing,
    error: sendError,
    reset,
  } = useSendTransaction();

  const {
    data: receipt,
    isLoading: waiting,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: ARC_CHAIN_ID,
    query: { enabled: !!txHash },
  });

  const notEnough =
    balance && value ? balance.value < value + (gas ?? 0n) : false;

  const risks: { level: "info" | "warn" | "danger"; text: string }[] = [];
  if (value === null) risks.push({ level: "danger", text: "Invalid amount." });
  if (!isConnected) risks.push({ level: "warn", text: "Wallet not connected." });
  if (wrongNetwork)
    risks.push({ level: "danger", text: "Wallet is on the wrong network." });
  if (notEnough)
    risks.push({ level: "danger", text: "Insufficient balance for value + gas." });
  if (plan.to.toLowerCase() === "0x0000000000000000000000000000000000000000")
    risks.push({ level: "warn", text: "Recipient is the zero address (burn)." });
  if (value && value > parseUnits("1", 6))
    risks.push({ level: "warn", text: "Amount is larger than 1 USDC — double-check." });

  const canSign = isConnected && !wrongNetwork && value !== null && !notEnough;

  function confirm() {
    if (!value) return;
    sendTransaction(
      {
        to: plan.to,
        value,
        chainId: ARC_CHAIN_ID,
      },
      {
        onSuccess: () => toast.success("Transaction submitted"),
        onError: (e) => toast.error(e.message),
      },
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-background/50 p-4 text-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-muted-foreground">
          Transaction preview · Arc Testnet
        </div>
        <div className="text-[10px] text-muted-foreground">Simulated</div>
      </div>

      <div className="mt-3 grid gap-2">
        <Row label="Type" value="Send native ARC" />
        <Row label="Amount" value={`${plan.amountArc} ARC`} />
        <Row label="To" value={<code className="font-mono text-xs">{plan.to}</code>} />
        <Row
          label="Est. gas"
          value={
            gasFetching
              ? "estimating…"
              : gas
                ? `${Number(formatEther(gas)).toFixed(6)} ARC (units: ${gas.toString()})`
                : "—"
          }
        />
        <Row
          label="Your balance"
          value={balance ? `${Number(formatEther(balance.value)).toFixed(4)} ARC` : "—"}
        />
      </div>

      {risks.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {risks.map((r, i) => (
            <li
              key={i}
              className={cn(
                "flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs",
                r.level === "danger" && "bg-[color:var(--danger)]/15 text-[color:var(--danger)]",
                r.level === "warn" && "bg-[color:var(--warning)]/10 text-[color:var(--warning)]",
                r.level === "info" && "bg-muted/50 text-muted-foreground",
              )}
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {r.text}
            </li>
          ))}
        </ul>
      )}

      {sendError && (
        <div className="mt-3 rounded-lg bg-[color:var(--danger)]/15 px-2 py-1.5 text-xs text-[color:var(--danger)]">
          {sendError.message}
        </div>
      )}

      {receipt && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-[color:var(--success)]/15 px-2 py-1.5 text-xs text-[color:var(--success)]">
          <CheckCircle2 className="h-4 w-4" />
          Confirmed in block {receipt.blockNumber.toString()}.
          <a
            href={`${arcTestnet.blockExplorers.default.url}/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="ml-auto underline"
          >
            View
          </a>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {wrongNetwork ? (
          <Button
            onClick={() => switchChain({ chainId: ARC_CHAIN_ID })}
            disabled={switching}
            variant="destructive"
            className="rounded-full"
          >
            {switching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="mr-2 h-4 w-4" />
            )}
            Switch to Arc Testnet
          </Button>
        ) : txHash ? (
          <Button
            onClick={() => reset()}
            variant="secondary"
            className="rounded-full"
          >
            {waiting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Waiting for confirmation…
              </>
            ) : (
              "Done"
            )}
          </Button>
        ) : (
          <Button
            onClick={confirm}
            disabled={!canSign || signing}
            className="rounded-full shadow-glow"
          >
            {signing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirm in wallet…
              </>
            ) : (
              "Confirm & sign"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-xs">{value}</span>
    </div>
  );
}
