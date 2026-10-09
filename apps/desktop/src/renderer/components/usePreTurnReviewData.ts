import { useEffect, useState } from "react";

import type { StrategicPriority } from "@bluewave/campaign-engine";

import type { BluewaveDesktopBridge } from "../../preload/index.js";
import { useBridge } from "../lib/bridge-context.js";
import {
  activeConstructionProjects,
  expectedConstructionCompletions,
} from "../screens/construction/construction-screen-state.js";

/** The narrow transport the review needs; injectable so the dialog can be tested headlessly. */
export type PreTurnReviewBridge = Pick<BluewaveDesktopBridge, "campaign">;

export interface PreTurnReviewData {
  readonly priorities: readonly StrategicPriority[];
  readonly constructionCount: number | null;
  readonly expectedCompletions: number | null;
  readonly researchSpend: number | null;
  readonly loading: boolean;
}

const EMPTY_PRE_TURN_REVIEW: PreTurnReviewData = {
  priorities: [],
  constructionCount: null,
  expectedCompletions: null,
  researchSpend: null,
  loading: false,
};

/**
 * Loads the pre-turn review's three read-only projections while the dialog is
 * open. Owns the bridge access and the derived construction figures so the
 * dialog stays presentational; `bridge` falls back to the bridge port.
 */
export function usePreTurnReviewData(
  sessionId: string,
  open: boolean,
  bridgeOption?: PreTurnReviewBridge,
): PreTurnReviewData {
  const contextBridge = useBridge();
  const bridge = bridgeOption ?? contextBridge;
  const [data, setData] = useState<PreTurnReviewData>(EMPTY_PRE_TURN_REVIEW);

  useEffect(() => {
    if (!open || bridge === undefined) return;
    let active = true;
    setData((current) => ({ ...current, loading: true }));

    void (async () => {
      try {
        const [campaignRes, prioritiesRes, constructionRes] = await Promise.all([
          bridge.campaign.execute("inspectCampaign", sessionId),
          bridge.campaign.execute("inspectPriorities", sessionId),
          bridge.campaign.execute("inspectConstructionScreen", sessionId),
        ]);
        if (!active) return;

        const projects =
          constructionRes.outcome === "success" ? constructionRes.value.projects : null;
        setData({
          researchSpend:
            campaignRes.outcome === "success"
              ? campaignRes.value.projection.economy.researchSpend
              : null,
          priorities: prioritiesRes.outcome === "success" ? prioritiesRes.value.priorities : [],
          constructionCount: projects === null ? null : activeConstructionProjects(projects).length,
          expectedCompletions: projects === null ? null : expectedConstructionCompletions(projects),
          loading: false,
        });
      } catch {
        if (!active) return;
        setData((current) => ({ ...current, loading: false }));
      }
    })();

    return () => {
      active = false;
    };
  }, [open, sessionId, bridge]);

  return data;
}
