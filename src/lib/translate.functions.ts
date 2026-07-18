import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import { ARC_KNOWLEDGE } from "@/lib/arc-knowledge";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const Input = z.object({
  language: z.string().min(2).max(40),
});

export const translateArcDocs = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    if (data.language.toLowerCase() === "english") {
      return { markdown: ARC_KNOWLEDGE };
    }
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system:
        "You are a professional technical translator. Translate the given Markdown into the target language. Preserve ALL Markdown formatting, code blocks, URLs, addresses, numbers, and technical identifiers exactly. Do not add commentary. Output only the translated Markdown.",
      prompt: `Target language: ${data.language}\n\n---\n\n${ARC_KNOWLEDGE}`,
    });
    return { markdown: text };
  });
