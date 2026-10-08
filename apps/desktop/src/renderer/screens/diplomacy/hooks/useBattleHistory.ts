import type { BattleHistoryView } from "@bluewave/campaign-engine";
import { useEffect, useState } from "react";

export type BattleHistoryState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly history: BattleHistoryView }
  | { readonly status: "error"; readonly message: string };

/**
 * Loads the read-only battle history for the session. Reloads when `revision`
 * changes (a committed month may have resolved new battles).
 */
export function useBattleHistory(sessionId: string, revision: number): BattleHistoryState {
  const [state, setState] = useState<BattleHistoryState>({ status: "loading" });

  useEffect(() => {
    const bridge = window.bluewave;
    if (bridge === undefined) {
      setState({ status: "error", message: "The desktop bridge is unavailable." });
      return;
    }
    let active = true;
    bridge.campaign
      .execute("inspectBattleHistory", sessionId)
      .then((result) => {
        if (!active) return;
        setState(
          result.outcome === "success"
            ? { status: "ready", history: result.value.history }
            : { status: "error", message: result.reason },
        );
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Battle history failed to load.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [sessionId, revision]);

  return state;
}
