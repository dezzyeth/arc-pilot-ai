import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";

import { arcTestnet } from "./chains";

/**
 * Wagmi config — MetaMask ONLY, Arc Testnet ONLY.
 * No WalletConnect, no RainbowKit modal. A single injected connector
 * targeted at MetaMask keeps the connect flow simple and reliable.
 */
export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [
    injected({
      target: "metaMask",
      shimDisconnect: true,
    }),
  ],
  transports: {
    [arcTestnet.id]: http(),
  },
  ssr: true,
});
