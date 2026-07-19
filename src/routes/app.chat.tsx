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
  stringToHex,
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
  useWriteContract,
} from "wagmi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ARC_CHAIN_ID, arcTestnet } from "@/lib/chains";
import { ARCPILOT_ABI, ARCPILOT_ADDRESS } from "@/lib/contracts";
import { TREASURY_ADDRESS } from "@/lib/treasury";
import arcLogo from "@/assets/arc-logo.jpeg.asset.json";
import { ensureArcChain } from "@/lib/ensure-arc-chain";
import { cn } from "@/lib/utils";
import { ARC_CHAT_SUGGESTIONS } from "@/lib/arc-knowledge";

const FREE_MESSAGES = 0;
const FEE_USDC = "0.01";
const FEE_UNLOCKS = 5;

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

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const wrongNetwork = mounted && isConnected && chainId !== ARC_CHAIN_ID;
  const { switchChainAsync } = useSwitchChain();

  // Message quota — every FREE_MESSAGES prompts requires a small on-chain fee.
  const quotaKey = address ? `arcpilot:chat-quota:${address.toLowerCase()}` : null;
  const [used, setUsed] = useState(0);
  const [quota, setQuota] = useState(FREE_MESSAGES);

  useEffect(() => {
    if (!quotaKey) return;
    try {
      const raw = localStorage.getItem(quotaKey);
      if (raw) {
        const p = JSON.parse(raw) as { used: number; quota: number };
        setUsed(p.used ?? 0);
        setQuota(p.quota ?? FREE_MESSAGES);
      }
    } catch {
      /* noop */
    }
  }, [quotaKey]);

  useEffect(() => {
    if (!quotaKey) return;
    localStorage.setItem(quotaKey, JSON.stringify({ used, quota }));
  }, [quotaKey, used, quota]);

  const remaining = Math.max(0, quota - used);
  const needsPayment = mounted && isConnected && !wrongNetwork && remaining === 0;

  const {
    writeContract: payFee,
    data: feeTxHash,
    isPending: feeSigning,
    reset: resetFee,
  } = useWriteContract();
  const { data: feeReceipt, isLoading: feeWaiting } = useWaitForTransactionReceipt({
    hash: feeTxHash,
    chainId: ARC_CHAIN_ID,
    query: { enabled: !!feeTxHash },
  });

  useEffect(() => {
    if (feeReceipt && feeTxHash) {
      setQuota((q) => q + FEE_UNLOCKS);
      toast.success(`Unlocked ${FEE_UNLOCKS} more messages`);
      resetFee();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feeReceipt]);

  async function payChatFee() {
    if (!address) return;
    try {
      await ensureArcChain();
    } catch (e: any) {
      toast.error(
        e?.message ?? "Please switch MetaMask to Arc Testnet (chain 5042002).",
      );
      return;
    }
    payFee(
      {
        address: ARCPILOT_ADDRESS,
        abi: ARCPILOT_ABI,
        functionName: "pay",
        args: [
          TREASURY_ADDRESS,
          stringToHex("CHATFEE", { size: 32 }),
          `chat:${FEE_UNLOCKS}`,
        ],
        value: parseUnits(FEE_USDC, 18),
        chainId: ARC_CHAIN_ID,
      },
      { onError: (e) => toast.error(e.message) },
    );
  }


  useEffect(() => {
    scroller.current?.scrollTo({
      top: scroller.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const suggestions = ARC_CHAT_SUGGESTIONS;


  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    if (needsPayment) {
      toast.error("Deposit 0.01 USDC to unlock 5 messages.");
      return;
    }

    const plan = parseSendIntent(text);
    const userMsg: Message = { id: uid(), role: "user", content: text };
    setInput("");
    setUsed((u) => u + 1);

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
                  <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-xl bg-[image:var(--gradient-brand)] shadow-glow">
                    <img src={arcLogo.url} alt="Arc" className="h-full w-full object-cover" draggable={false} />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] min-w-0 break-words [overflow-wrap:anywhere] rounded-2xl px-4 py-3 text-sm",
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
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setInput(s.prompt)}
                  className="glass rounded-2xl px-3 py-3 text-left text-xs transition-colors hover:text-foreground"
                >
                  <div className="font-medium text-foreground">{s.label}</div>
                  <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                    {s.prompt}
                  </div>
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
        {needsPayment && (
          <div className="mx-auto mb-3 flex max-w-3xl flex-wrap items-center justify-between gap-2 rounded-2xl border border-[color:var(--brand-2)]/40 bg-[color:var(--brand-2)]/10 px-4 py-3 text-xs">
            <span className="text-foreground/90">
              {used === 0
                ? <>Deposit <b>{FEE_USDC} USDC</b> to unlock {FEE_UNLOCKS} messages and start chatting.</>
                : <>You've used your {FEE_UNLOCKS} messages. Deposit <b>{FEE_USDC} USDC</b> to unlock {FEE_UNLOCKS} more.</>}
            </span>
            <Button
              type="button"
              size="sm"
              onClick={payChatFee}
              disabled={feeSigning || feeWaiting}
              className="rounded-full shadow-glow"
            >
              {feeSigning || feeWaiting ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  {feeWaiting ? "Confirming…" : "Confirm…"}
                </>
              ) : (
                <>Deposit {FEE_USDC} USDC</>
              )}
            </Button>
          </div>
        )}
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <div className="glass flex-1 rounded-2xl px-3 py-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                needsPayment
                  ? "Deposit 0.01 USDC above to start chatting…"
                  : "Ask ArcPilot or type: send 0.01 USDC to 0x…"
              }
              className="border-0 bg-transparent focus-visible:ring-0"
              disabled={sending || needsPayment}
            />
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || sending || needsPayment}
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
          {isConnected && !wrongNetwork && (
            <> · {remaining} message{remaining === 1 ? "" : "s"} left</>
          )}
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
      return parseUnits(plan.amountArc, 18);
    } catch {
      return null;
    }
  }, [plan.amountArc]);

  const { data: balance } = useBalance({
    address,
    chainId: ARC_CHAIN_ID,
    query: { enabled: !!address && !wrongNetwork },
  });

  const { data: gas, isFetching: gasFetching, error: gasError } = useEstimateGas({
    to: plan.to,
    value: value ?? undefined,
    chainId: ARC_CHAIN_ID,
    query: {
      enabled: !!address && !wrongNetwork && value !== null,
      retry: 2,
      retryDelay: 500,
    },
  });

  // Fallback gas limit when RPC estimation is unavailable (Arc uses ~21k for plain transfers).
  const FALLBACK_GAS = 50_000n;
  const effectiveGas = gas ?? FALLBACK_GAS;
  const gasUnavailable = !gasFetching && !gas;


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

  // Log confirmed tx to Lovable Cloud so Portfolio / Reports / Budgets see it.
  const loggedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!receipt || !txHash || !address) return;
    if (loggedRef.current === txHash) return;
    loggedRef.current = txHash;
    supabase.from("tx_log").insert({
      wallet: address.toLowerCase(),
      hash: txHash,
      to_addr: plan.to.toLowerCase(),
      amount_usdc: Number(plan.amountArc),
      category: plan.note || "transfer",
      memo: plan.note ?? null,
      explanation: `Sent ${plan.amountArc} USDC to ${plan.to} on Arc Testnet.`,
    });
  }, [receipt, txHash, address, plan]);


  const risks: { level: "info" | "warn" | "danger"; text: string }[] = [];
  if (value === null) risks.push({ level: "danger", text: "Invalid amount." });
  if (!isConnected) risks.push({ level: "warn", text: "Wallet not connected." });
  if (wrongNetwork)
    risks.push({ level: "danger", text: "Wallet is on the wrong network." });
  if (notEnough)
    risks.push({ level: "danger", text: "Insufficient balance for value + gas." });
  if (plan.to.toLowerCase() === "0x0000000000000000000000000000000000000000")
    risks.push({ level: "warn", text: "Recipient is the zero address (burn)." });
  if (value && value > parseUnits("1", 18))
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
        <Row label="Type" value="Send USDC (native gas)" />
        <Row label="Amount" value={`${plan.amountArc} USDC`} />
        <Row label="To" value={<code className="font-mono text-xs">{plan.to}</code>} />
        <Row
          label="Est. gas"
          value={
            gasFetching
              ? "estimating…"
            : gas
                ? `${Number(formatUnits(gas, 18)).toFixed(6)} USDC (units: ${gas.toString()})`
                : "—"
          }
        />
        <Row
          label="Your balance"
          value={balance ? `${Number(formatUnits(balance.value, 18)).toFixed(4)} USDC` : "—"}
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
