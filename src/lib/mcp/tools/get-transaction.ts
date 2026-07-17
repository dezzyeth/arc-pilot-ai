import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createPublicClient, formatUnits, http } from "viem";

import { arcTestnet } from "@/lib/chains";

export default defineTool({
  name: "get_transaction",
  title: "Get Arc Testnet transaction",
  description:
    "Fetch a transaction and its receipt from Arc Testnet by hash. Returns from/to, value in USDC, status, block, and gas used. Read-only.",
  inputSchema: {
    hash: z.string().describe("Transaction hash (0x-prefixed, 66 chars) on Arc Testnet."),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: true },
  handler: async ({ hash }) => {
    if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
      return { content: [{ type: "text", text: `Invalid tx hash: ${hash}` }], isError: true };
    }
    try {
      const client = createPublicClient({ chain: arcTestnet, transport: http() });
      const txHash = hash as `0x${string}`;
      const [tx, receipt] = await Promise.all([
        client.getTransaction({ hash: txHash }).catch(() => null),
        client.getTransactionReceipt({ hash: txHash }).catch(() => null),
      ]);
      if (!tx && !receipt) {
        return { content: [{ type: "text", text: `Transaction not found: ${hash}` }], isError: true };
      }
      const result = {
        hash,
        from: tx?.from ?? receipt?.from,
        to: tx?.to ?? receipt?.to,
        valueUSDC: tx ? formatUnits(tx.value, 18) : null,
        status: receipt?.status ?? "pending",
        blockNumber: (tx?.blockNumber ?? receipt?.blockNumber)?.toString() ?? null,
        gasUsed: receipt?.gasUsed?.toString() ?? null,
        explorer: `${arcTestnet.blockExplorers.default.url}/tx/${hash}`,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "RPC error";
      return { content: [{ type: "text", text: `Tx lookup failed: ${message}` }], isError: true };
    }
  },
});
