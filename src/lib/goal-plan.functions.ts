import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const Input = z.object({
  name: z.string().min(1).max(120),
  target: z.number().positive(),
  saved: z.number().min(0),
  deadline: z.string().nullable().optional(),
  monthlyBudgets: z
    .array(z.object({ category: z.string(), limit: z.number() }))
    .optional(),
});

export const generateGoalPlan = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const remaining = Math.max(0, data.target - data.saved);
    const deadline = data.deadline ?? "no deadline set";
    const budgets =
      data.monthlyBudgets && data.monthlyBudgets.length > 0
        ? data.monthlyBudgets
            .map((b) => `- ${b.category}: ${b.limit} USDC/mo cap`)
            .join("\n")
        : "None set yet.";

    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system:
        "You are ArcPilot AI, a friendly finance copilot for Arc Testnet. Produce a concise, actionable savings plan in Markdown. Use short bullet lists and one small table if useful. Testnet USDC has no real value — mention this once at the end. No preamble.",
      prompt: `Build a personalized savings plan for this goal.

Goal name: ${data.name}
Target: ${data.target} USDC
Already saved: ${data.saved} USDC
Remaining: ${remaining} USDC
Deadline: ${deadline}

Existing monthly budgets:
${budgets}

Return:
1. **Snapshot** — one line summary.
2. **Weekly / monthly contribution** needed to hit the deadline (calculate from today).
3. **3–5 concrete steps** the user can take on Arc Testnet (schedule a recurring send, add a budget cap, top up faucet, etc.).
4. **Risk / watch-outs** (1–2 bullets).
5. Close with a single reminder that testnet USDC has no real value.`,
    });
    return { plan: text };
  });
