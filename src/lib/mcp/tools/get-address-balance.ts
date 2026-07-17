import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createPublicClient, formatUnits, http, isAddress } from "viem";

import { arcTestnet } from "@/lib/chains";

export default defineTool({
  name: "get_address_balance",
  title: "Get address balance on Arc Testnet",
  description:
    "Return the native USDC (gas token) balance on Arc Testnet for a given 0x address. Read-only, no signing. Uses the public Arc Testnet RPC.",
  inputSchema: {
    address: z.string().describe("EVM address (0x-prefixed, 40 hex chars) to query on Arc Testnet."),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: true },
  handler: async ({ address }) => {
    if (!isAddress(address)) {
      return {
        content: [{ type: "text", text: `Invalid EVM address: ${address}` }],
        isError: true,
      };
    }
    try {
      const client = createPublicClient({ chain: arcTestnet, transport: http() });
      const [wei, blockNumber] = await Promise.all([
        client.getBalance({ address }),
        client.getBlockNumber(),
      ]);
      const result = {
        address,
        chainId: arcTestnet.id,
        network: arcTestnet.name,
        balanceRaw: wei.toString(),
        balanceUSDC: formatUnits(wei, 18),
        symbol: "USDC",
        atBlock: blockNumber.toString(),
        explorer: `${arcTestnet.blockExplorers.default.url}/address/${address}`,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "RPC error";
      return { content: [{ type: "text", text: `Balance lookup failed: ${message}` }], isError: true };
    }
  },
});
