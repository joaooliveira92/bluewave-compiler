import type { MonthSummary } from "../lib/month-summary.js";
import { createContext, type ReactNode, use, useMemo } from "react";
import type { BluewaveDesktopBridge } from "../../preload/index.js";
import type { useCampaignShell } from "./useCampaignShell.js";
import { useCampaignShell as useCampaignShellState } from "./useCampaignShell.js";

type CampaignShell = ReturnType<typeof useCampaignShell>;

export interface CampaignShellContextValue {
  readonly state: Pick<
    CampaignShell,
    | "campaign"
    | "loading"
    | "error"
    | "saving"
    | "saveMessage"
    | "primaryAction"
    | "committing"
    | "monthHistory"
    | "mode"
    | "screen"
    | "canGoBack"
    | "canGoForward"
  >;
  readonly actions: Pick<
    CampaignShell,
    | "openCampaign"
    | "closeCampaign"
    | "saveCampaign"
    | "copyCampaign"
    | "advanceMonth"
    | "refreshCampaign"
    | "selectScreen"
    | "setPrimaryAction"
    | "goBack"
    | "goForward"
  >;
  readonly meta: {
    readonly bridgeAvailable: boolean;
  };
}

const CampaignShellContext = createContext<CampaignShellContextValue | null>(null);

export function CampaignShellProvider({
  bridge,
  children,
}: {
  readonly bridge: BluewaveDesktopBridge | undefined;
  readonly children: ReactNode;
}) {
  const shell = useCampaignShellState(bridge);
  const value = useMemo<CampaignShellContextValue>(
    () => ({
      state: {
        campaign: shell.campaign,
        loading: shell.loading,
        error: shell.error,
        saving: shell.saving,
        saveMessage: shell.saveMessage,
        primaryAction: shell.primaryAction,
        committing: shell.committing,
        monthHistory: shell.monthHistory,
        mode: shell.mode,
        screen: shell.screen,
        canGoBack: shell.canGoBack,
        canGoForward: shell.canGoForward,
      },
      actions: {
        openCampaign: shell.openCampaign,
        closeCampaign: shell.closeCampaign,
        saveCampaign: shell.saveCampaign,
        copyCampaign: shell.copyCampaign,
        advanceMonth: shell.advanceMonth,
        refreshCampaign: shell.refreshCampaign,
        selectScreen: shell.selectScreen,
        setPrimaryAction: shell.setPrimaryAction,
        goBack: shell.goBack,
        goForward: shell.goForward,
      },
      meta: { bridgeAvailable: bridge !== undefined },
    }),
    [bridge, shell],
  );

  return <CampaignShellContext.Provider value={value}>{children}</CampaignShellContext.Provider>;
}

export function useCampaignShellContext(): CampaignShellContextValue {
  const context = use(CampaignShellContext);
  if (context === null) {
    throw new Error("useCampaignShellContext must be used within CampaignShellProvider");
  }
  return context;
}

/**
 * The active campaign's committed revision (turn number), or null when no campaign
 * is open or the hook is used outside the shell. Unlike `useCampaignShellContext` it
 * never throws, so screen hooks stay usable in isolation (tests, previews). A screen
 * passes it as `refreshKey` so it reloads when the month is advanced elsewhere.
 */
export function useCampaignRevision(): number | null {
  const context = use(CampaignShellContext);
  return context?.state.campaign?.revision ?? null;
}

const NO_MONTH_HISTORY: readonly MonthSummary[] = [];

/**
 * The months committed in this session, newest first (empty outside the shell). Non-throwing, like
 * `useCampaignRevision`, so screens can use it in isolation.
 */
export function useMonthHistory(): readonly MonthSummary[] {
  const context = use(CampaignShellContext);
  return context?.state.monthHistory ?? NO_MONTH_HISTORY;
}
