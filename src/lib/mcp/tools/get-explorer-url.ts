import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { arcTestnet } from "@/lib/chains";

export default defineTool({
  name: "get_explorer_url",
  title: "Build Arc Testnet explorer URL",
  description:
    "Build a canonical Arc Testnet block explorer URL for an address, transaction hash, or block number.",
  inputSchema: {
    kind: z.enum(["address", "tx", "block"]).describe("What the value refers to."),
    value: z.string().describe("The address, tx hash, or block number."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ kind, value }) => {
    const base = arcTestnet.blockExplorers.default.url;
    const url = `${base}/${kind}/${value}`;
    return { content: [{ type: "text", text: url }], structuredContent: { url } };
  },
});
