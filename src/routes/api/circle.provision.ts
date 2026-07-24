import { createFileRoute } from "@tanstack/react-router";
import { verifyMessage } from "viem";

/**
 * POST /api/circle/provision
 * Body: { evm_address, signature, message, nonce }
 * - Verifies signature -> matches evm_address
 * - Looks up existing Circle wallet in DB, returns it if present
 * - Otherwise calls Circle Developer-Controlled Wallets API, inserts row, returns it
 */
export const Route = createFileRoute("/api/circle/provision")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            evm_address?: string;
            signature?: string;
            message?: string;
            nonce?: string;
          };

          const evmRaw = body.evm_address?.toLowerCase();
          if (!evmRaw || !body.signature || !body.message) {
            return json({ error: "Missing evm_address, signature, or message" }, 400);
          }
          if (!/^0x[a-f0-9]{40}$/.test(evmRaw)) {
            return json({ error: "Invalid evm_address" }, 400);
          }

          // 1) Verify signature
          const ok = await verifyMessage({
            address: evmRaw as `0x${string}`,
            message: body.message,
            signature: body.signature as `0x${string}`,
          });
          if (!ok) return json({ error: "Signature verification failed" }, 401);

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

          // 2) Idempotent check
          const existing = await supabaseAdmin
            .from("user_wallets")
            .select("*")
            .eq("evm_address", evmRaw)
            .maybeSingle();

          if (existing.data?.circle_wallet_id) {
            return json({
              circle_wallet_id: existing.data.circle_wallet_id,
              circle_wallet_address: existing.data.circle_wallet_address,
              blockchain: existing.data.blockchain,
              existed: true,
            });
          }

          const apiKey = process.env.CIRCLE_API_KEY;
          const entitySecret = process.env.CIRCLE_ENTITY_SECRET;
          const walletSetId = process.env.CIRCLE_WALLET_SET_ID;
          if (!apiKey || !entitySecret || !walletSetId) {
            return json(
              {
                error:
                  "Circle credentials not configured (CIRCLE_API_KEY / CIRCLE_ENTITY_SECRET / CIRCLE_WALLET_SET_ID).",
              },
              500,
            );
          }

          // 3) Fetch Circle public key + encrypt entity secret (fresh per request)
          const pkRes = await fetch(
            "https://api.circle.com/v1/w3s/config/entity/publicKey",
            { headers: { Authorization: `Bearer ${apiKey}` } },
          );
          if (!pkRes.ok) {
            const t = await pkRes.text();
            console.error("[circle] publicKey error", pkRes.status, t);
            return json({ error: "Failed to fetch Circle public key" }, 502);
          }
          const pkJson = (await pkRes.json()) as {
            data?: { publicKey?: string };
          };
          const publicKeyPem = pkJson.data?.publicKey;
          if (!publicKeyPem) return json({ error: "No Circle public key" }, 502);

          const ciphertext = await encryptEntitySecret(
            entitySecret,
            publicKeyPem,
          );

          // 4) Provision wallet
          const idempotencyKey = crypto.randomUUID();
          const createRes = await fetch(
            "https://api.circle.com/v1/w3s/developer/wallets",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                idempotencyKey,
                entitySecretCiphertext: ciphertext,
                blockchains: ["ETH-SEPOLIA"],
                walletSetId,
                accountType: "SCA",
                count: 1,
                metadata: [{ name: evmRaw }],
              }),
            },
          );

          const createJson = (await createRes.json().catch(() => ({}))) as {
            data?: {
              wallets?: Array<{
                id?: string;
                address?: string;
                blockchain?: string;
                walletSetId?: string;
              }>;
            };
            code?: number;
            message?: string;
          };

          if (!createRes.ok) {
            console.error(
              "[circle] createWallet error",
              createRes.status,
              createJson,
            );
            // 409 conflict — treat as retry by re-querying DB
            if (createRes.status === 409) {
              const retry = await supabaseAdmin
                .from("user_wallets")
                .select("*")
                .eq("evm_address", evmRaw)
                .maybeSingle();
              if (retry.data?.circle_wallet_id) {
                return json({
                  circle_wallet_id: retry.data.circle_wallet_id,
                  circle_wallet_address: retry.data.circle_wallet_address,
                  blockchain: retry.data.blockchain,
                  existed: true,
                });
              }
            }
            return json(
              {
                error:
                  createJson.message ??
                  `Circle API error (${createRes.status})`,
              },
              502,
            );
          }

          const wallet = createJson.data?.wallets?.[0];
          if (!wallet?.id || !wallet.address) {
            return json({ error: "Circle returned no wallet" }, 502);
          }

          // 5) Persist
          const insert = await supabaseAdmin
            .from("user_wallets")
            .insert({
              evm_address: evmRaw,
              circle_wallet_id: wallet.id,
              circle_wallet_address: wallet.address.toLowerCase(),
              circle_wallet_set_id: wallet.walletSetId ?? walletSetId,
              blockchain: wallet.blockchain ?? "ETH-SEPOLIA",
            })
            .select()
            .single();

          if (insert.error) {
            console.error("[circle] db insert error", insert.error);
            // Race: another request just inserted -> return existing
            const retry = await supabaseAdmin
              .from("user_wallets")
              .select("*")
              .eq("evm_address", evmRaw)
              .maybeSingle();
            if (retry.data?.circle_wallet_id) {
              return json({
                circle_wallet_id: retry.data.circle_wallet_id,
                circle_wallet_address: retry.data.circle_wallet_address,
                blockchain: retry.data.blockchain,
                existed: true,
              });
            }
            return json({ error: "Failed to persist wallet" }, 500);
          }

          return json({
            circle_wallet_id: wallet.id,
            circle_wallet_address: wallet.address,
            blockchain: wallet.blockchain ?? "ETH-SEPOLIA",
            existed: false,
          });
        } catch (err) {
          console.error("[circle/provision] unexpected", err);
          return json(
            { error: err instanceof Error ? err.message : "Unknown error" },
            500,
          );
        }
      },
    },
  },
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * Encrypt the entity secret using Circle's public key (RSA-OAEP / SHA-256).
 * Circle expects base64 ciphertext, and the plaintext is the entity secret
 * decoded from hex to 32 raw bytes.
 */
async function encryptEntitySecret(
  entitySecretHex: string,
  publicKeyPem: string,
): Promise<string> {
  const clean = entitySecretHex.trim();
  if (!/^[0-9a-fA-F]{64}$/.test(clean)) {
    throw new Error("CIRCLE_ENTITY_SECRET must be 64 hex chars");
  }
  const secretBytes = hexToBytes(clean);

  const spki = pemToArrayBuffer(publicKeyPem);
  const key = await crypto.subtle.importKey(
    "spki",
    spki,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );
  const encrypted = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    key,
    secretBytes,
  );
  return arrayBufferToBase64(encrypted);
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
