import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { ARC_KNOWLEDGE } from "@/lib/arc-knowledge";

export default defineTool({
  name: "get_arc_knowledge",
  title: "Get Arc docs knowledge base",
  description:
    "Return the ArcPilot condensed Arc documentation (network overview, App Kit features, agentic economy protocols ERC-8004/ERC-8183, and developer references). Optionally filter to sections whose headings contain a query string.",
  inputSchema: {
    query: z
      .string()
      .optional()
      .describe("Optional case-insensitive substring to filter section headings."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query }) => {
    if (!query) {
      return { content: [{ type: "text", text: ARC_KNOWLEDGE }] };
    }
    const q = query.toLowerCase();
    // Split on markdown H1/H2 headings and keep sections whose heading matches.
    const parts = ARC_KNOWLEDGE.split(/\n(?=#{1,3}\s)/);
    const matched = parts.filter((p) => {
      const firstLine = p.split("\n", 1)[0] ?? "";
      return firstLine.toLowerCase().includes(q);
    });
    const text = matched.length > 0 ? matched.join("\n\n") : `No sections matched "${query}".`;
    return { content: [{ type: "text", text }] };
  },
});
