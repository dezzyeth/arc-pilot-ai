import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";

import {
  aiErrorMessage,
  createArcPilotModel,
  missingAiConfigMessage,
} from "@/lib/ai-model.server";
import { requirePayment } from "@/lib/x402.server";

type TxItem = {
  category?: string;
  direction?: "in" | "out";
  amount_usdc?: number;
  memo?: string | null;
  created_at?: string;
};

type Body = {
  wallet?: string;
  period?: string;
  transactions?: TxItem[];
};

export const Route = createFileRoute("/api/paid/reports")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const paid = await requirePayment(request, "/api/paid/reports");
        if (paid) return paid;

        let body: Body = {};
        try {
          body = (await request.json()) as Body;
        } catch {
          return new Response(JSON.stringify({ error: "invalid JSON" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const txs = Array.isArray(body.transactions) ? body.transactions.slice(0, 500) : [];
        const period = (body.period ?? "recent").toString().slice(0, 40);

        // Aggregate on the server to keep the AI prompt small.
        const byCategory: Record<string, { in: number; out: number; count: number }> = {};
        let totalIn = 0;
        let totalOut = 0;
        for (const t of txs) {
          const cat = (t.category ?? "transfer").toString();
          const amt = Number(t.amount_usdc ?? 0);
          const dir = t.direction === "in" ? "in" : "out";
          byCategory[cat] ??= { in: 0, out: 0, count: 0 };
          byCategory[cat][dir] += amt;
          byCategory[cat].count += 1;
          if (dir === "in") totalIn += amt;
          else totalOut += amt;
        }

        const summary = {
          wallet: body.wallet ?? null,
          period,
          totalIn,
          totalOut,
          net: totalIn - totalOut,
          txCount: txs.length,
          byCategory,
        };

        const model = createArcPilotModel();
        if (!model) {
          return new Response(
            JSON.stringify({ ...summary, narrative: missingAiConfigMessage() }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }

        try {
          const { text } = await generateText({
            model,
            system:
              "You write short, executive-style spending reports for Arc Testnet wallets. Use Markdown, ≤160 words, include: headline, 2–4 bullet insights, one recommendation.",
            prompt: `Summarize this wallet activity:\n\n${JSON.stringify(summary)}`,
          });
          return new Response(
            JSON.stringify({ ...summary, narrative: text }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        } catch (err) {
          return new Response(
            JSON.stringify({ ...summary, narrative: aiErrorMessage(err) }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
      },
    },
  },
});
