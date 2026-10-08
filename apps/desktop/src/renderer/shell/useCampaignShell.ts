import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

import type { PlayerProjection } from "@bluewave/campaign-engine";
import type { BluewaveDesktopBridge } from "../../preload/index.js";
import { countActiveAlerts } from "../lib/priorities.js";
import { summarizeMonth } from "../lib/month-summary.js";
import { emitWideEvent } from "../lib/telemetry.js";
import type { Screen } from "./AppSidebar.js";
import {
  campaignShellMode,
  currentShellScreen,
  initialCampaignShellState,
  reduceCampaignShell,
} from "./campaign-shell-state.js";
import type { CampaignOverview } from "./campaign-shell-state.js";
import { canGoBack, canGoForward, goBack, goForward } from "./navigation-history.js";
import type { PrimaryAction } from "./primary-action.js";
import { formatCampaignMonth } from "./site-header-state.js";

const SAVE_MESSAGE_DURATION_MS = 8_000;

/** Builds the shell's campaign summary from an `inspectCampaign` projection. */
function overviewFromProjection(
  sessionId: string,
  projection: PlayerProjection,
  activeAlertsCount: number | null,
): CampaignOverview {
  return {
    month: projection.month,
    treasury: projection.economy.treasury,
    revision: projection.revision,
    sessionId,
    nationName: projection.nationName,
    projectedSurplusDeficit: projection.projectedSurplusDeficit,
    atWar: projection.knownEnemyNations.length > 0,
    // Real count from the engine's priorities projection; null only when that
    // projection could not be read, so the header omits the slot rather than
    // showing a made-up number.
    activeAlertsCount,
  };
}

function diagnosticsSuffix(diagnostics: readonly string[]): string {
  return diagnostics.length > 0 ? ` ${diagnostics.join("; ")}` : "";
}

/** The number of warnings/criticals the engine reports, or null if unavailable. */
async function loadActiveAlertsCount(
  bridge: BluewaveDesktopBridge,
  sessionId: string,
): Promise<number | null> {
  try {
    const result = await bridge.campaign.execute("inspectPriorities", sessionId);
    return result.outcome === "success" ? countActiveAlerts(result.value.priorities) : null;
  } catch {
    return null;
  }
}

export function useCampaignShell(bridge: BluewaveDesktopBridge | undefined) {
  const [state, dispatch] = useReducer(reduceCampaignShell, undefined, initialCampaignShellState);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Bumped whenever the campaign is closed or a newer refresh starts, so a response that
  // arrives late (out of order, or after Close) is dropped instead of overwriting newer state.
  const refreshGenerationRef = useRef(0);

  /** Show a transient status message in the header; null just ends the "saving" state silently. */
  const collectMessage = (message: string | null): void => {
    dispatch({ type: "save-finished", message });
    if (saveTimerRef.current !== null) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(
      () => dispatch({ type: "save-message-cleared" }),
      SAVE_MESSAGE_DURATION_MS,
    );
  };

  const openCampaign = useCallback(
    async (sessionId: string) => {
      if (bridge === undefined) return;
      dispatch({ type: "campaign-opening" });
      const started = performance.now();
      try {
        const result = await bridge.campaign.execute("inspectCampaign", sessionId);
        const duration = Math.round(performance.now() - started);
        if (result.outcome !== "success") {
          emitWideEvent("campaign_open", sessionId, duration, "rejected", [result.reason]);
          dispatch({
            type: "campaign-open-failed",
            message: `Inspection failed: ${result.reason}`,
          });
          return;
        }
        emitWideEvent("campaign_open", sessionId, duration, "success");
        const alerts = await loadActiveAlertsCount(bridge, sessionId);
        dispatch({
          type: "campaign-opened",
          campaign: overviewFromProjection(sessionId, result.value.projection, alerts),
        });
      } catch (error) {
        dispatch({
          type: "campaign-open-failed",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [bridge],
  );

  const closeCampaign = useCallback(async () => {
    if (bridge === undefined || state.campaign === null) return;
    const started = performance.now();
    const result = await bridge.campaign.execute("closeCampaign", state.campaign.sessionId);
    const duration = Math.round(performance.now() - started);
    if (result.outcome === "success" || result.reason === "SESSION_NOT_FOUND") {
      emitWideEvent("campaign_close", state.campaign.sessionId, duration, "success");
      refreshGenerationRef.current += 1;
      dispatch({ type: "campaign-closed" });
      return;
    }
    emitWideEvent("campaign_close", state.campaign.sessionId, duration, "rejected", [
      result.reason,
    ]);
    collectMessage(`Could not close the campaign: ${result.reason}.`);
  }, [bridge, state.campaign]);

  const saveCampaign = useCallback(async () => {
    if (bridge === undefined || state.campaign === null) return;
    dispatch({ type: "save-started" });
    const result = await bridge.campaign.execute("saveCampaign", state.campaign.sessionId);
    collectMessage(
      result.outcome === "success"
        ? `Campaign saved — revision ${result.value.revision}.`
        : result.reason === "CANCELLED"
          ? null
          : `Save failed: ${result.reason}.${diagnosticsSuffix(result.diagnostics)}`,
    );
  }, [bridge, state.campaign]);

  /** "Save a copy…": the player picks a location; cancelling is silent, never an error. */
  const copyCampaign = useCallback(async () => {
    if (bridge === undefined || state.campaign === null) return;
    dispatch({ type: "save-started" });
    const result = await bridge.campaign.execute("copyCampaign", state.campaign.sessionId);
    collectMessage(
      result.outcome === "success"
        ? `Copy saved to ${result.value.location}.`
        : result.reason === "SAVE_LOCATION_CANCELLED"
          ? null
          : `Copy failed: ${result.reason}.${diagnosticsSuffix(result.diagnostics)}`,
    );
  }, [bridge, state.campaign]);

  useEffect(
    () => () => {
      if (saveTimerRef.current !== null) clearTimeout(saveTimerRef.current);
    },
    [],
  );

  const selectScreen = useCallback((screen: Screen) => dispatch({ type: "visit", screen }), []);

  /**
   * Re-reads the header's campaign summary (month, treasury, revision,
   * projected balance, war status) from the engine. Called after every month
   * advance — from the header or from the Simulation screen — so the header
   * never shows a stale month or "Armed peace" during a war.
   */
  const refreshCampaign = useCallback(
    async (sessionIdOverride?: string) => {
      const sessionId = sessionIdOverride ?? state.campaign?.sessionId;
      if (bridge === undefined || sessionId === undefined) return;
      const generation = ++refreshGenerationRef.current;
      const result = await bridge.campaign.execute("inspectCampaign", sessionId);
      if (result.outcome !== "success") return;
      const alerts = await loadActiveAlertsCount(bridge, sessionId);
      // A newer refresh started, or the campaign was closed, while we waited: drop this one.
      if (generation !== refreshGenerationRef.current) return;
      dispatch({
        type: "campaign-refreshed",
        campaign: overviewFromProjection(sessionId, result.value.projection, alerts),
      });
    },
    [bridge, state.campaign?.sessionId],
  );

  const advanceMonth = useCallback(async () => {
    if (bridge === undefined || state.campaign === null) return;
    dispatch({ type: "month-commit-started" });
    const sessionId = state.campaign.sessionId;
    const started = performance.now();
    try {
      const result = await bridge.campaign.execute("commitMonth", {
        sessionId,
        expectedRevision: state.campaign.revision,
        transportRequestId: crypto.randomUUID(),
      });
      const duration = Math.round(performance.now() - started);
      if (result.outcome === "success") {
        emitWideEvent("campaign_month_advance", sessionId, duration, "success");
        const { value } = result;
        const nextCampaign: CampaignOverview = {
          month: value.closingSnapshot.month,
          treasury: value.report.closingTreasury,
          revision: value.closingSnapshot.revision,
          sessionId,
          // The commit response carries no projection surface (no
          // nationName/projectedSurplusDeficit on ClosingSnapshotSummary), so
          // the shell keeps the stable nation identity and the last-known
          // projected balance until the next inspectCampaign refreshes them.
          nationName: state.campaign.nationName,
          projectedSurplusDeficit: state.campaign.projectedSurplusDeficit,
          atWar: state.campaign.atWar,
          // Last month's count would be wrong for this month; the refresh below fills it in.
          activeAlertsCount: null,
        };
        dispatch({
          type: "month-committed",
          campaign: nextCampaign,
          summary: summarizeMonth(value),
        });
        // The commit response carries no projection surface; refresh the rest.
        void refreshCampaign(sessionId);
        collectMessage(`Month advanced to ${formatCampaignMonth(value.closingSnapshot.month)}.`);
        return;
      }
      emitWideEvent("campaign_month_advance", sessionId, duration, "rejected", [result.reason]);
      dispatch({
        type: "month-commit-failed",
        message: `Could not advance month: ${result.reason}.${result.diagnostics.length > 0 ? ` ${result.diagnostics.join("; ")}` : ""}`,
      });
    } catch (error) {
      emitWideEvent("campaign_month_advance", sessionId, 0, "rejected", [
        error instanceof Error ? error.message : "Unknown error",
      ]);
      dispatch({
        type: "month-commit-failed",
        message: error instanceof Error ? error.message : "Could not advance month.",
      });
    }
  }, [bridge, state.campaign, collectMessage, refreshCampaign]);

  const setPrimaryAction = useCallback(
    (action: PrimaryAction | null) => dispatch({ type: "primary-action-changed", action }),
    [],
  );
  const goBackInHistory = useCallback(
    () => dispatch({ type: "history-replaced", history: goBack(state.history) }),
    [state.history],
  );
  const goForwardInHistory = useCallback(
    () => dispatch({ type: "history-replaced", history: goForward(state.history) }),
    [state.history],
  );

  return useMemo(
    () => ({
      campaign: state.campaign,
      loading: state.loading,
      error: state.error,
      saving: state.saving,
      saveMessage: state.saveMessage,
      primaryAction: state.primaryAction,
      committing: state.committing,
      monthHistory: state.monthHistory,
      mode: campaignShellMode(state),
      screen: currentShellScreen(state),
      canGoBack: canGoBack(state.history),
      canGoForward: canGoForward(state.history),
      openCampaign,
      closeCampaign,
      saveCampaign,
      copyCampaign,
      advanceMonth,
      refreshCampaign,
      selectScreen,
      setPrimaryAction,
      goBack: goBackInHistory,
      goForward: goForwardInHistory,
    }),
    [
      state,
      openCampaign,
      closeCampaign,
      saveCampaign,
      copyCampaign,
      advanceMonth,
      refreshCampaign,
      selectScreen,
      setPrimaryAction,
      goBackInHistory,
      goForwardInHistory,
    ],
  );
}
