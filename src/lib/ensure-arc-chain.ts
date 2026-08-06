import { arcTestnet, ARC_CHAIN_ID } from "./chains";

/**
 * Ensures the injected wallet (MetaMask) is on Arc Testnet.
 * - Calls `wallet_switchEthereumChain`
 * - Falls back to `wallet_addEthereumChain` if the chain is unknown (4902)
 * - Polls `eth_chainId` until it reports the target chain (or times out)
 *
 * Throws on user rejection / timeout so callers can bail out of a tx.
 */
export async function ensureArcChain(): Promise<void> {
  if (typeof window === "undefined") throw new Error("No window");
  const eth = (window as unknown as { ethereum?: any }).ethereum;
  if (!eth?.request) throw new Error("MetaMask not detected");

  // MetaMask can be locked or have the site's account permission revoked even
  // though wagmi still shows a cached address. Signing then fails with
  // "wallet must has at least one account". Re-request access first.
  await ensureArcAccount(eth);

  const targetHex = `0x${ARC_CHAIN_ID.toString(16)}`;

  const current: string = await eth.request({ method: "eth_chainId" });
  if (current?.toLowerCase() === targetHex.toLowerCase()) return;

  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: targetHex }],
    });
  } catch (err: any) {
    // 4902 = chain not added yet. Some wallets also return -32603 with inner 4902.
    const code = err?.code ?? err?.data?.originalError?.code;
    if (code === 4902 || code === -32603) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: targetHex,
            chainName: arcTestnet.name,
            nativeCurrency: arcTestnet.nativeCurrency,
            rpcUrls: [arcTestnet.rpcUrls.default.http[0]],
            blockExplorerUrls: [arcTestnet.blockExplorers.default.url],
          },
        ],
      });
    } else {
      throw err;
    }
  }

  // Poll until the wallet actually reports the target chain.
  for (let i = 0; i < 40; i++) {
    const now: string = await eth.request({ method: "eth_chainId" });
    if (now?.toLowerCase() === targetHex.toLowerCase()) return;
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("Timed out switching to Arc Testnet");
}
