import { useEffect, useState } from "react";
import type { DiplomacyScreenProjection } from "../../../shared/diplomacy-contract.js";
import { useCampaignRevision } from "../../shell/CampaignShellContext.js";

export type NationRailLoad =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly projection: DiplomacyScreenProjection }
  | { readonly status: "unavailable" };

/** The Diplomacy & War inspect view, reloaded when the campaign revision changes. */
export function useNationRail(sessionId: string): NationRailLoad {
  const revision = useCampaignRevision();
  const [state, setState] = useState<NationRailLoad>({ status: "loading" });

  useEffect(() => {
    const bridge = window.bluewave;
    if (bridge === undefined) {
      setState({ status: "unavailable" });
      return;
    }
    let active = true;
    bridge.campaign
      .execute("inspectDiplomacyScreen", sessionId)
      .then((result) => {
        if (!active) return;
        setState(
          result.outcome === "success"
            ? { status: "ready", projection: result.value }
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
