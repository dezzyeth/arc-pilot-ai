import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";

import {
  aiErrorMessage,
  createArcPilotModel,
  missingAiConfigMessage,
} from "@/lib/ai-model.server";
import { requirePayment } from "@/lib/x402.server";

type Body = { prompt?: string; context?: string };

export const Route = createFileRoute("/api/public/paid/insight")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const paid = await requirePayment(request, "/api/public/paid/insight");
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

        const prompt = (body.prompt ?? "").toString().slice(0, 2000);
        if (!prompt) {
          return new Response(JSON.stringify({ error: "prompt is required" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const model = createArcPilotModel();
        if (!model) {
          return new Response(JSON.stringify({ error: missingAiConfigMessage() }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        try {
          const { text } = await generateText({
            model,
            system:
              "You are ArcPilot AI producing concise, actionable financial insights for wallets on Arc Testnet. Reply in ≤180 words, Markdown, no fluff.",
            prompt: body.context ? `${prompt}\n\nContext:\n${body.context}` : prompt,
          });
          return new Response(JSON.stringify({ insight: text }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: aiErrorMessage(err) }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});