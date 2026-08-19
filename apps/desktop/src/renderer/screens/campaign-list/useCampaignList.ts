import { useCallback, useEffect, useState } from "react";
import {
  applyListLoaded,
  applyLoadFailed,
  initialCampaignListScreenState,
} from "./campaign-list-screen-state.js";

/**
 * Loads the real `SaveStore.list()` records via the `listCampaigns` command
 * (main process prompts for the package directory). Read-only over the
 * engine — no state is mutated and no session is registered here; the actual
 * load goes through `loadCampaign`.
 */
export function useCampaignList() {
  const bridge = window.bluewave;
  const [state, setState] = useState(initialCampaignListScreenState);

  const reload = useCallback(async () => {
    if (bridge === undefined) {
      setState((current) => applyLoadFailed(current, "Bluewave bridge not available"));
      return;
    }
    const result = await bridge.campaign.execute("listCampaigns", undefined);
    if (result.outcome !== "success") {
      setState((current) => applyLoadFailed(current, result.reason));
      return;
    }
    setState((current) => applyListLoaded(current, result.value));
  }, [bridge]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { state, reload };
}
