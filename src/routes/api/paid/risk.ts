import { createFileRoute } from "@tanstack/react-router";
import { isAddress } from "viem";

import { requirePayment } from "@/lib/x402.server";

type Body = {
  to?: string;
  amountUsdc?: number | string;
  memo?: string;
  senderBalanceUsdc?: number;
};

export const Route = createFileRoute("/api/paid/risk")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const paid = await requirePayment(request, "/api/paid/risk");
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

        const to = (body.to ?? "").toString();
        const amount = Number(body.amountUsdc ?? 0);
        const bal = Number(body.senderBalanceUsdc ?? 0);

        const reasons: string[] = [];
        let score = 0; // 0 safe, 100 dangerous

        if (!isAddress(to)) {
          reasons.push("Recipient is not a valid EVM address.");
          score += 60;
        }
        if (!Number.isFinite(amount) || amount <= 0) {
          reasons.push("Amount must be a positive number.");
          score += 40;
        }
        if (bal > 0 && amount > bal) {
          reasons.push(`Amount exceeds sender balance (${bal} USDC).`);
          score += 40;
        } else if (bal > 0 && amount > bal * 0.5) {
          reasons.push("Amount is more than 50% of sender balance.");
          score += 20;
        }
        if (/dead|null|0x0000/i.test(to)) {
          reasons.push("Recipient looks like a burn / null address.");
          score += 25;
        }
        if (amount >= 100) {
          reasons.push("Large transfer on testnet — double check the recipient.");
          score += 10;
        }
        score = Math.min(100, score);

        const verdict =
          score >= 60 ? "block" : score >= 30 ? "review" : "ok";

        return new Response(
          JSON.stringify({
            verdict,
            score,
            reasons,
            network: "arc-testnet",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
    },
  },
});
