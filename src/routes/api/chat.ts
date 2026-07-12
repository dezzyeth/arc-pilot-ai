import { createFileRoute } from "@tanstack/react-router";
import { streamText, type ModelMessage } from "ai";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type ChatRequestBody = {
  messages?: { role: "user" | "assistant" | "system"; content: string }[];
};

const SYSTEM_PROMPT = `You are ArcPilot AI, a friendly finance copilot for **Arc Testnet only**.

Rules you must follow:
- You only support Arc Testnet. If a user mentions Ethereum, Sepolia, Polygon, Base, BNB, Solana, Avalanche, Arbitrum, Optimism, or any other network, politely refuse and remind them that ArcPilot operates exclusively on Arc Testnet.
- Never claim to execute a transaction — the app UI handles signing after user confirmation.
- When users describe a send in natural language, explain what will happen in plain English (amount, recipient, network, estimated gas) but do NOT ask them to paste seed phrases or private keys.
- Be concise. Use Markdown. Prefer short paragraphs and small bullet lists.
- Testnet USDC has no real value — remind users when relevant.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: ChatRequestBody;
        try {
          body = (await request.json()) as ChatRequestBody;
        } catch {
          return new Response("Invalid JSON body", { status: 400 });
        }
        const messages = Array.isArray(body.messages) ? body.messages : [];
        if (messages.length === 0) {
          return new Response("messages are required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-2.5-flash");

        const modelMessages: ModelMessage[] = [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m) => ({
            role: m.role,
            content: m.content,
          })) as ModelMessage[],
        ];

        try {
          const result = streamText({
            model,
            messages: modelMessages,
          });

          return result.toTextStreamResponse({
            headers: { "content-type": "text/plain; charset=utf-8" },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "AI gateway error";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});
