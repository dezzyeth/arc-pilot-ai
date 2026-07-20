import { useState } from "react";
import { toast } from "sonner";
import { parseUnits, stringToHex, type Hex } from "viem";
import { useAccount, useWriteContract } from "wagmi";

import { ARC_CHAIN_ID } from "./chains";
import { ARCPILOT_ABI, ARCPILOT_ADDRESS } from "./contracts";
import { ensureArcChain } from "./ensure-arc-chain";
import { TREASURY_ADDRESS } from "./treasury";

/**
 * One-transaction gate used by every mutating feature in ArcPilot.
 *
 * Every "create" / "generate" action fires a single 0.01 USDC on-chain
 * transaction through the ArcPilot contract, tagged so the tx-log &
 * MCP tooling can distinguish the intent.
 */
export const ACTION_FEE_USDC = "0.01";

export function useActionFee() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [paying, setPaying] = useState(false);

  async function payFee(tag: string, memo: string): Promise<Hex | null> {
    if (!address) {
      toast.error("Connect your wallet first");
      return null;
    }
    try {
      setPaying(true);
      await ensureArcChain();
      const hash = await writeContractAsync({
        address: ARCPILOT_ADDRESS,
        abi: ARCPILOT_ABI,
        functionName: "pay",
        args: [
          TREASURY_ADDRESS,
          stringToHex(tag.slice(0, 31), { size: 32 }),
          memo.slice(0, 120),
        ],
        value: parseUnits(ACTION_FEE_USDC, 18),
        chainId: ARC_CHAIN_ID,
      });
      toast.success("Transaction confirmed");
      return hash;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Transaction rejected");
      return null;
    } finally {
      setPaying(false);
    }
  }

  return { payFee, paying };
}
