import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import { createArcPilotModel, missingAiConfigMessage } from "@/lib/ai-model.server";

const Input = z.object({
  kind: z.enum(["scheduled", "conditional"]),
  to: z.string().optional().default(""),
  amount: z.string().optional().default(""),
  memo: z.string().optional().default(""),
  runAt: z.string().optional().default(""),
  condition: z.string().optional().default(""),
  balanceUsdc: z.number().optional().default(0),
  budgets: z
    .array(z.object({ category: z.string(), limit: z.number() }))
    .optional()
    .default([]),
  goals: z
    .array(
      z.object({
        name: z.string(),
        target: z.number(),
        saved: z.number(),
        deadline: z.string().nullable().optional(),
      }),
    )
    .optional()
    .default([]),
});

export const generatePlannerSuggestion = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const model = createArcPilotModel();
    if (!model) throw new Error(missingAiConfigMessage());

    const budgets =
      data.budgets.length > 0
        ? data.budgets.map((b) => `- ${b.category}: ${b.limit} USDC/mo`).join("\n")
        : "None set.";
    const goals =
      data.goals.length > 0
        ? data.goals
            .map(
              (g) =>
                `- ${g.name}: ${g.saved}/${g.target} USDC${g.deadline ? ` by ${g.deadline}` : ""}`,
            )
            .join("\n")
        : "None set.";

    const { text } = await generateText({
      model,
      system:
        "You are ArcPilot AI, a friendly finance copilot for Arc Testnet. Output concise Markdown (no preamble). Use short bullets and one small table if useful. Testnet USDC has no real value — mention this once at the end.",
      prompt: `The user is drafting a ${data.kind} transaction plan on Arc Testnet.

Draft:
- Recipient: ${data.to || "(empty)"}
- Amount: ${data.amount || "(empty)"} USDC
- Memo: ${data.memo || "(none)"}
- ${data.kind === "scheduled" ? `Run at: ${data.runAt || "(empty)"}` : `Condition: ${data.condition || "(empty)"}`}

Wallet balance: ${data.balanceUsdc} USDC

Monthly budgets:
${budgets}

Financial goals:
${goals}

Return:
1. **Suggested plan** — recommended amount, timing/condition, and memo that fits the user's budgets & goals. If a field is empty, propose one.
2. **Why** — 2–3 short bullets connecting the suggestion to budgets/goals/balance.
3. **Watch-outs** — 1–2 risks (over-budget, insufficient balance, unreachable condition, etc.).
4. Close with a single reminder that testnet USDC has no real value.`,
    });
    return { plan: text };
  });
