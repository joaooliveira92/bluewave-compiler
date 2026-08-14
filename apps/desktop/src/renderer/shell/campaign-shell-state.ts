import type { PrimaryAction } from "./primary-action.js";
import type { NavigationHistory } from "./navigation-history.js";
import { currentEntry, initialHistory, visit } from "./navigation-history.js";
import type { Screen } from "./AppSidebar.js";

export interface CampaignOverview {
  readonly month: { readonly year: number; readonly month: number };
  readonly treasury: number;
  readonly sessionId: string;
}

export interface CampaignShellState {
  readonly campaign: CampaignOverview | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly history: NavigationHistory<Screen>;
  readonly saving: boolean;
  readonly saveMessage: string | null;
  readonly primaryAction: PrimaryAction | null;
}

export type CampaignShellMode =
  | { readonly kind: "file"; readonly screen: "file" }
  | {
      readonly kind: "new-game-preferences";
      readonly screen: "new-game-preferences";
    }
  | {
      readonly kind: "new-game-archetype";
      readonly screen: "new-game-archetype";
    }
  | { readonly kind: "new-game-nation"; readonly screen: "new-game-nation" }
  | { readonly kind: "opening"; readonly screen: Screen }
  | {
      readonly kind: "open-error";
      readonly screen: Screen;
      readonly message: string;
    }
  | {
      readonly kind: "campaign";
      readonly screen: Screen;
      readonly campaign: CampaignOverview;
    };

export type CampaignShellEvent =
  | { readonly type: "campaign-opening" }
  | { readonly type: "campaign-opened"; readonly campaign: CampaignOverview }
  | { readonly type: "campaign-open-failed"; readonly message: string }
  | { readonly type: "campaign-closed" }
  | { readonly type: "visit"; readonly screen: Screen }
  | {
      readonly type: "history-replaced";
      readonly history: NavigationHistory<Screen>;
    }
  | { readonly type: "save-started" }
  | { readonly type: "save-finished"; readonly message: string | null }
  | { readonly type: "save-message-cleared" }
  | {
      readonly type: "primary-action-changed";
      readonly action: PrimaryAction | null;
    };

export function initialCampaignShellState(): CampaignShellState {
  return {
    campaign: null,
    loading: false,
    error: null,
    history: initialHistory<Screen>("file"),
    saving: false,
    saveMessage: null,
    primaryAction: null,
  };
}

/**
 * One state transition interface for the campaign shell. Related invariants
 * move together: opening a campaign clears errors and enters Overview; closing
 * it clears campaign-specific navigation, notices, and primary actions.
 */
export function reduceCampaignShell(
  state: CampaignShellState,
  event: CampaignShellEvent,
): CampaignShellState {
  switch (event.type) {
    case "campaign-opening":
      return { ...state, loading: true, error: null };
    case "campaign-opened":
      return {
        ...state,
        campaign: event.campaign,
        loading: false,
        error: null,
        history: visit(state.history, "overview"),
      };
    case "campaign-open-failed":
      return { ...state, loading: false, error: event.message };
    case "campaign-closed":
      return initialCampaignShellState();
    case "visit":
      return { ...state, history: visit(state.history, event.screen) };
    case "history-replaced":
      return { ...state, history: event.history };
    case "save-started":
      return { ...state, saving: true, saveMessage: null };
    case "save-finished":
      return { ...state, saving: false, saveMessage: event.message };
    case "save-message-cleared":
      return { ...state, saveMessage: null };
    case "primary-action-changed": {
      const current = state.primaryAction;
      const next = event.action;
      if (
        current !== null &&
        next !== null &&
        current.label === next.label &&
        current.disabled === next.disabled &&
        current.onTrigger === next.onTrigger
      ) {
        return state;
      }
      return { ...state, primaryAction: next };
    }
  }
}

export function currentShellScreen(state: CampaignShellState): Screen {
  return currentEntry(state.history);
}

/**
 * Collapses the shell's related fields into one explicit UI variant. Consumers
 * switch on `kind` instead of interpreting combinations of campaign, loading,
 * error, and route state independently.
 */
export function campaignShellMode(state: CampaignShellState): CampaignShellMode {
  const screen = currentShellScreen(state);
  if (state.loading) return { kind: "opening", screen };
  if (state.error !== null) {
    return { kind: "open-error", screen, message: state.error };
  }
  if (state.campaign !== null) {
    return { kind: "campaign", screen, campaign: state.campaign };
  }
  if (screen === "new-game-preferences") {
    return { kind: "new-game-preferences", screen };
  }
  if (screen === "new-game-archetype") {
    return { kind: "new-game-archetype", screen };
  }
  if (screen === "new-game-nation") {
    return { kind: "new-game-nation", screen };
  }
  return { kind: "file", screen: "file" };
}
