import { createFileRoute } from "@tanstack/react-router";

/**
 * GET /api/circle/balance?evm_address=0x...
 * Looks up Circle wallet id for the EVM address, then queries Circle for balances.
 */
export const Route = createFileRoute("/api/circle/balance")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const evmRaw = url.searchParams.get("evm_address")?.toLowerCase();
          if (!evmRaw || !/^0x[a-f0-9]{40}$/.test(evmRaw)) {
            return json({ error: "Missing or invalid evm_address" }, 400);
          }

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const row = await supabaseAdmin
            .from("user_wallets")
            .select("*")
            .eq("evm_address", evmRaw)
            .maybeSingle();

          if (!row.data?.circle_wallet_id) {
            return json({ error: "No Circle wallet for this address" }, 404);
          }

          const apiKey = process.env.CIRCLE_API_KEY;
          if (!apiKey) return json({ error: "Circle not configured" }, 500);

          const res = await fetch(
            `https://api.circle.com/v1/w3s/wallets/${row.data.circle_wallet_id}/balances`,
            { headers: { Authorization: `Bearer ${apiKey}` } },
          );
          const data = (await res.json().catch(() => ({}))) as {
            data?: {
              tokenBalances?: Array<{
                token?: { symbol?: string; name?: string; decimals?: number };
                amount?: string;
              }>;
            };
            message?: string;
          };
          if (!res.ok) {
            console.error("[circle/balance]", res.status, data);
            return json(
              { error: data.message ?? `Circle error (${res.status})` },
              502,
            );
          }

          return json({
            circle_wallet_id: row.data.circle_wallet_id,
            circle_wallet_address: row.data.circle_wallet_address,
            blockchain: row.data.blockchain,
            tokenBalances: data.data?.tokenBalances ?? [],
          });
        } catch (err) {
          console.error("[circle/balance] unexpected", err);
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
