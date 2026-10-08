import type { StrategicPriority } from "@bluewave/campaign-engine";
import { useEffect, useState } from "react";
import { useCampaignRevision } from "../../shell/CampaignShellContext.js";

export type PrioritiesState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly priorities: readonly StrategicPriority[] }
  | { readonly status: "unavailable" };

/**
 * The engine's strategic priorities for the player, severity-sorted by the engine.
 * Reloads when the campaign revision changes (the month advanced elsewhere).
 */
export function usePriorities(sessionId: string): PrioritiesState {
  const revision = useCampaignRevision();
  const [state, setState] = useState<PrioritiesState>({ status: "loading" });

  useEffect(() => {
    const bridge = window.bluewave;
    if (bridge === undefined) {
      setState({ status: "unavailable" });
      return;
    }
    let active = true;
    bridge.campaign
      .execute("inspectPriorities", sessionId)
      .then((result) => {
        if (!active) return;
        setState(
          result.outcome === "success"
            ? { status: "ready", priorities: result.value.priorities }
            : { status: "unavailable" },
        );
      })
      .catch(() => {
        if (active) setState({ status: "unavailable" });
      });
    return () => {
      active = false;
    };
  }, [sessionId, revision]);

  return state;
}
