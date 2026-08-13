import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

import type { BluewaveDesktopBridge } from "../../preload/index.js";
import { emitWideEvent } from "../lib/telemetry.js";
import type { Screen } from "./AppSidebar.js";
import {
  campaignShellMode,
  currentShellScreen,
  initialCampaignShellState,
  reduceCampaignShell,
} from "./campaign-shell-state.js";
import {
  canGoBack,
  canGoForward,
  goBack,
  goForward,
} from "./navigation-history.js";
import type { PrimaryAction } from "./primary-action.js";

const SAVE_MESSAGE_DURATION_MS = 8_000;

export function useCampaignShell(bridge: BluewaveDesktopBridge | undefined) {
  const [state, dispatch] = useReducer(
    reduceCampaignShell,
    undefined,
    initialCampaignShellState,
  );
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openCampaign = useCallback(
    async (sessionId: string) => {
      if (bridge === undefined) return;
      dispatch({ type: "campaign-opening" });
      const started = performance.now();
      try {
        const result = await bridge.campaign.execute(
          "inspectCampaign",
          sessionId,
        );
        const duration = Math.round(performance.now() - started);
        if (result.outcome !== "success") {
          emitWideEvent("campaign_open", sessionId, duration, "rejected", [
            result.reason,
          ]);
          dispatch({
            type: "campaign-open-failed",
            message: `Inspection failed: ${result.reason}`,
          });
          return;
        }
        emitWideEvent("campaign_open", sessionId, duration, "success");
        const projection = result.value.projection;
        dispatch({
          type: "campaign-opened",
          campaign: {
            month: projection.month,
            treasury: projection.economy.treasury,
            sessionId,
          },
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
    const result = await bridge.campaign.execute(
      "closeCampaign",
      state.campaign.sessionId,
    );
    const duration = Math.round(performance.now() - started);
    if (result.outcome === "success" || result.reason === "SESSION_NOT_FOUND") {
      emitWideEvent(
        "campaign_close",
        state.campaign.sessionId,
        duration,
        "success",
      );
      dispatch({ type: "campaign-closed" });
      return;
    }
    emitWideEvent(
      "campaign_close",
      state.campaign.sessionId,
      duration,
      "rejected",
      [result.reason],
    );
  }, [bridge, state.campaign]);

  const saveCampaign = useCallback(async () => {
    if (bridge === undefined || state.campaign === null) return;
    dispatch({ type: "save-started" });
    if (saveTimerRef.current !== null) clearTimeout(saveTimerRef.current);
    const result = await bridge.campaign.execute(
      "saveCampaign",
      state.campaign.sessionId,
    );
    const message =
      result.outcome === "success"
        ? `Campaign saved — revision ${result.value.revision}.`
        : result.reason === "CANCELLED"
          ? null
          : `Save failed: ${result.reason}.${result.diagnostics.length > 0 ? ` ${result.diagnostics.join("; ")}` : ""}`;
    dispatch({ type: "save-finished", message });
    saveTimerRef.current = setTimeout(
      () => dispatch({ type: "save-message-cleared" }),
      SAVE_MESSAGE_DURATION_MS,
    );
  }, [bridge, state.campaign]);

  useEffect(
    () => () => {
      if (saveTimerRef.current !== null) clearTimeout(saveTimerRef.current);
    },
    [],
  );

  const selectScreen = useCallback(
    (screen: Screen) => dispatch({ type: "visit", screen }),
    [],
  );
  const setPrimaryAction = useCallback(
    (action: PrimaryAction | null) =>
      dispatch({ type: "primary-action-changed", action }),
    [],
  );
  const goBackInHistory = useCallback(
    () =>
      dispatch({ type: "history-replaced", history: goBack(state.history) }),
    [state.history],
  );
  const goForwardInHistory = useCallback(
    () =>
      dispatch({ type: "history-replaced", history: goForward(state.history) }),
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
      mode: campaignShellMode(state),
      screen: currentShellScreen(state),
      canGoBack: canGoBack(state.history),
      canGoForward: canGoForward(state.history),
      openCampaign,
      closeCampaign,
      saveCampaign,
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
      selectScreen,
      setPrimaryAction,
      goBackInHistory,
      goForwardInHistory,
    ],
  );
}
