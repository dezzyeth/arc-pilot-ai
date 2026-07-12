import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";

import { arcTestnet } from "./chains";

/**
 * Wagmi config — Arc Testnet ONLY.
 * We intentionally restrict `chains` to `[arcTestnet]` so wagmi/RainbowKit
 * can never propose a switch to any other network.
 */
export const wagmiConfig = getDefaultConfig({
  appName: "ArcPilot AI",
  projectId: "arcpilot-ai-demo", // WalletConnect Cloud project id placeholder — user can replace.
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(),
  },
  ssr: true,
});
