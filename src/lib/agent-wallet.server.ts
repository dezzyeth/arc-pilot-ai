// Server-only helpers for the Nanopayments Agent Wallet.
//
// The agent private key is generated server-side, sealed with
// AGENT_WALLET_ENCRYPTION_KEY (AES-GCM) and stored in
// `nanopayments_agent_wallet.agent_privkey_ciphertext`. The runner
// unseals it just-in-time to sign x402 payment payloads.

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

function getKey(): Uint8Array {
  const raw = process.env.AGENT_WALLET_ENCRYPTION_KEY;
  if (!raw) throw new Error("AGENT_WALLET_ENCRYPTION_KEY not configured");
  // Derive 32 bytes deterministically from the secret string via SHA-256.
  // Using WebCrypto so it works in the Worker runtime.
  return new TextEncoder().encode(raw);
}

async function deriveAesKey(): Promise<CryptoKey> {
  const raw = getKey();
  const hash = await crypto.subtle.digest("SHA-256", raw);
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

function b64encode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function b64decode(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function sealPrivateKey(pk: `0x${string}`): Promise<string> {
  const key = await deriveAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(pk),
    ),
  );
  return `${b64encode(iv)}.${b64encode(ct)}`;
}

export async function openPrivateKey(cipher: string): Promise<`0x${string}`> {
  const [ivB, ctB] = cipher.split(".");
  if (!ivB || !ctB) throw new Error("Malformed agent key ciphertext");
  const key = await deriveAesKey();
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64decode(ivB) },
    key,
    b64decode(ctB),
  );
  return new TextDecoder().decode(pt) as `0x${string}`;
}

export function newAgentPrivateKey(): `0x${string}` {
  return generatePrivateKey();
}

export function addressForPrivateKey(pk: `0x${string}`): `0x${string}` {
  return privateKeyToAccount(pk).address;
}
