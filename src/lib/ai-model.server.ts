import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const GEMINI_DIRECT_MODEL = "gemini-3.1-flash-lite";
const LOVABLE_GATEWAY_MODEL = "google/gemini-3.1-flash-lite";
const LOVABLE_CHAT_PROXY_ORIGIN = "https://arcpilotai.lovable.app";

function readEnv(names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

export function createArcPilotModel() {
  const geminiKey = readEnv([
    "GEMINI_API_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "GOOGLE_API_KEY",
  ]);

  if (geminiKey) {
    const google = createOpenAICompatible({
      name: "google",
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
      headers: { Authorization: `Bearer ${geminiKey}` },
    });
    return google(GEMINI_DIRECT_MODEL);
  }

  const lovableKey = readEnv(["LOVABLE_API_KEY"]);
  if (lovableKey) {
    return createLovableAiGatewayProvider(lovableKey)(LOVABLE_GATEWAY_MODEL);
  }

  return null;
}

export function missingAiConfigMessage() {
  return "AI is not configured on this deployment. Add GEMINI_API_KEY in Vercel Environment Variables and redeploy.";
}

export function aiErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "AI request failed";
  return message.slice(0, 700);
}

export async function proxyChatToLovable(request: Request, body: string) {
  const currentOrigin = new URL(request.url).origin;
  if (currentOrigin === LOVABLE_CHAT_PROXY_ORIGIN) return null;

  const upstream = await fetch(`${LOVABLE_CHAT_PROXY_ORIGIN}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    signal: request.signal,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "text/plain; charset=utf-8",
    },
  });
}