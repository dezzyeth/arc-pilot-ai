import { createFileRoute } from "@tanstack/react-router";
import { streamText, type ModelMessage } from "ai";

import {
  aiErrorMessage,
  createArcPilotModel,
  missingAiConfigMessage,
  proxyChatToLovable,
} from "@/lib/ai-model.server";
import { ARC_KNOWLEDGE } from "@/lib/arc-knowledge";

type ChatRequestBody = {
  messages?: { role: "user" | "assistant" | "system"; content: string }[];
};

const SYSTEM_PROMPT = `You are ArcPilot AI, a friendly finance copilot for **Arc Testnet only**.

You have deep knowledge of Arc (Circle's Layer-1 for programmable money). Use the reference below to answer questions accurately, cite the exact RPC / chain ID / explorer / faucet when relevant, and link to the docs pages listed inside it when helpful.

Rules you must follow:
- You only support Arc Testnet. If a user mentions Ethereum, Sepolia, Polygon, Base, BNB, Solana, Avalanche, Arbitrum, Optimism, or any other network as a destination, politely refuse and remind them that ArcPilot operates exclusively on Arc Testnet. (You may still explain App Kit Bridge / Unified Balance conceptually.)
- Never claim to execute a transaction — the app UI handles signing after user confirmation.
- When users describe a send in natural language, explain what will happen in plain English (amount, recipient, network, estimated gas) but do NOT ask them to paste seed phrases or private keys.
- Be concise. Use Markdown. Prefer short paragraphs and small bullet lists.
- You are also a **build coach**: proactively suggest concrete project ideas to build on Arc Testnet when the user asks "what should I build", "give me ideas", "hackathon", "project idea", or seems unsure what to do next. For each idea give: (a) one-line pitch, (b) which Arc features it uses (USDC-as-gas, CCTP, App Kit Bridge/Swap/Send/Unified Balance, FX engine, ERC-8004 agent identity, ERC-8183 jobs, opt-in privacy, RWAs), (c) MVP scope, and (d) suggested stack (Foundry + wagmi/viem by default). Rank by difficulty when giving multiple.
- Testnet USDC has no real value — remind users when relevant.

---
# Arc reference knowledge
${ARC_KNOWLEDGE}
`;


export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        let body: ChatRequestBody;
        try {
          body = JSON.parse(rawBody) as ChatRequestBody;
        } catch {
          return new Response("Invalid JSON body", { status: 400 });
        }
        const messages = Array.isArray(body.messages) ? body.messages : [];
        if (messages.length === 0) {
          return new Response("messages are required", { status: 400 });
        }

        const model = createArcPilotModel();
        if (!model) {
          try {
            const proxied = await proxyChatToLovable(request, rawBody);
            if (proxied) return proxied;
          } catch (error) {
            console.error("ArcPilot chat proxy failed", error);
          }
          return new Response(missingAiConfigMessage(), { status: 500 });
        }

        const modelMessages: ModelMessage[] = messages.map((m) => ({
          role: m.role,
          content: m.content,
        })) as ModelMessage[];

        try {
          const result = streamText({
            model,
            system: SYSTEM_PROMPT,
            messages: modelMessages,
            abortSignal: request.signal,
          });


          return result.toTextStreamResponse({
            headers: { "content-type": "text/plain; charset=utf-8" },
          });
        } catch (err) {
          console.error("ArcPilot chat failed", err);
          return new Response(aiErrorMessage(err), { status: 500 });
        }
      },
    },
  },
});
