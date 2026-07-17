import { defineMcp } from "@lovable.dev/mcp-js";

import getAddressBalance from "./tools/get-address-balance";
import getArcKnowledge from "./tools/get-arc-knowledge";
import getArcNetworkInfo from "./tools/get-arc-network-info";
import getExplorerUrl from "./tools/get-explorer-url";
import getTransaction from "./tools/get-transaction";

export default defineMcp({
  name: "arcpilot-mcp",
  title: "ArcPilot AI · Arc Testnet MCP",
  version: "0.1.0",
  instructions:
    "Public, read-only tools for exploring Circle's Arc Testnet. Use `get_arc_network_info` for chain/RPC/explorer parameters, `get_arc_knowledge` for the Arc documentation summary (optionally filtered by heading), `get_address_balance` and `get_transaction` for on-chain reads via the public Arc RPC, and `get_explorer_url` to build canonical explorer links. All tools operate on public Arc Testnet data — no signing, no per-user state.",
  tools: [
    getArcNetworkInfo,
    getArcKnowledge,
    getAddressBalance,
    getTransaction,
    getExplorerUrl,
  ],
});
