import { createWalletClient, createPublicClient, http, type Address, type Hex } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

import { arcTestnet } from "./chains";

/**
 * Session key — an ephemeral EOA stored in localStorage that can sign
 * scheduled/conditional transactions on the user's behalf without a
 * MetaMask popup. The user funds it once from their main wallet; the app
 * uses it to auto-execute plans when they become due.
 *
 * This is intentionally scoped to Arc Testnet demo flows. Do NOT reuse
 * this pattern for mainnet without hardware-backed key storage.
 */
const storageKey = (owner: string) => `arcpilot:session-key:${owner.toLowerCase()}`;

export function getSessionKey(owner: Address): Hex | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(storageKey(owner));
  return (v as Hex) ?? null;
}

export function createSessionKey(owner: Address): Hex {
  const pk = generatePrivateKey();
  window.localStorage.setItem(storageKey(owner), pk);
  return pk;
}

export function clearSessionKey(owner: Address) {
  window.localStorage.removeItem(storageKey(owner));
}

export function sessionAccount(pk: Hex) {
  return privateKeyToAccount(pk);
}

export const arcPublicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

export function sessionWalletClient(pk: Hex) {
  return createWalletClient({
    account: privateKeyToAccount(pk),
    chain: arcTestnet,
    transport: http(),
  });
}
