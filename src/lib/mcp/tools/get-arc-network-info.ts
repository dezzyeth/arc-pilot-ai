import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "get_arc_network_info",
  title: "Get Arc Testnet network info",
  description:
    "Return Arc Testnet connection parameters: chain ID, RPC URL, block explorer, native gas token (USDC), and faucet guidance. Use this whenever a caller asks how to connect a wallet or client to Arc Testnet.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const info = {
      networkName: "Arc Testnet",
      chainId: 5042002,
      chainIdHex: "0x4CE4D2",
      rpcUrl: "https://rpc.testnet.arc.network",
      blockExplorer: "https://testnet.arcscan.app",
      nativeCurrency: {
        name: "USD Coin",
        symbol: "USDC",
        decimals: 18,
        note: "USDC is the native gas token on Arc. MetaMask displays it as 18 decimals; contract-level USDC amounts are 6 decimals.",
      },
      docs: "https://docs.arc.io",
      testnet: true,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
      structuredContent: info,
    };
  },
});
