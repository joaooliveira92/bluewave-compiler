import type { NewGameOptions } from "../../../shared/new-game-contract.js";

export type DraftPreferences = {
  readonly version: string;
  readonly scenarioId: string;
  readonly continuityMode: string;
  readonly fleetSize: string;
  readonly researchSpeed: string;
  readonly technologyVariation: string;
  readonly historicalBudget: string;
  readonly legacyFleetMode: string;
  readonly tacticalRealism: string;
  readonly difficulty: string;
  readonly campaignSeed: string;
};

export interface NewGamePreferencesScreenState {
  readonly options: NewGameOptions | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly preferences: DraftPreferences;
}

const CONFIGURATION_VERSION = "campaign_configuration_v1";

function emptyPreferences(): DraftPreferences {
  return {
    version: CONFIGURATION_VERSION,
    scenarioId: "",
    continuityMode: "",
    fleetSize: "",
    researchSpeed: "",
    technologyVariation: "",
    historicalBudget: "",
    legacyFleetMode: "",
    tacticalRealism: "",
    difficulty: "",
    campaignSeed: "",
  };
}

export function initialNewGamePreferencesScreenState(): NewGamePreferencesScreenState {
  return {
    options: null,
    loading: true,
    error: null,
    preferences: emptyPreferences(),
  };
}

export function applyOptionsLoaded(
  state: NewGamePreferencesScreenState,
  options: NewGameOptions,
  defaultSeed: string,
): NewGamePreferencesScreenState {
  const supported = options.supportedValues;
  return {
    options,
    loading: false,
    error: null,
    preferences: {
      version: CONFIGURATION_VERSION,
      scenarioId: options.scenarios[0]?.id ?? "",
      continuityMode: supported.continuityMode[0] ?? "",
      fleetSize: supported.fleetSize[0] ?? "",
      researchSpeed: supported.researchSpeed[0] ?? "",
      technologyVariation: supported.technologyVariation[0] ?? "",
      historicalBudget: supported.historicalBudget[0] ?? "",
      legacyFleetMode: supported.legacyFleetMode[0] ?? "",
      tacticalRealism: supported.tacticalRealism[0] ?? "",
      difficulty: supported.difficulty[0] ?? "",
      campaignSeed: defaultSeed,
    },
  };
}

export function applyOptionsFailed(
  state: NewGamePreferencesScreenState,
  error: string,
): NewGamePreferencesScreenState {
  return { ...state, loading: false, error };
}

export function updatePreference<K extends keyof DraftPreferences>(
  state: NewGamePreferencesScreenState,
  field: K,
  value: DraftPreferences[K],
): NewGamePreferencesScreenState {
  return { ...state, preferences: { ...state.preferences, [field]: value } };
}

export function isReadyToProceed(state: NewGamePreferencesScreenState): boolean {
  return (
    state.options !== null &&
    state.preferences.scenarioId.trim().length > 0 &&
    state.preferences.campaignSeed.trim().length > 0
  );
}

export function selectedScenario(state: NewGamePreferencesScreenState) {
  return (
    state.options?.scenarios.find((scenario) => scenario.id === state.preferences.scenarioId) ??
    null
  );
}
