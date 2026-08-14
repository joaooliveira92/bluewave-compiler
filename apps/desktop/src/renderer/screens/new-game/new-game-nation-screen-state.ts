import type { CampaignConfiguration } from "@bluewave/campaign-engine";
import type { NewGameNation, NewGameOptions } from "../../../shared/new-game-contract.js";
import type { DraftPreferences } from "./new-game-preferences-screen-state.js";

export interface NewGameNationScreenState {
  readonly preferences: DraftPreferences;
  readonly options: NewGameOptions;
  readonly selectedNationId: string | null;
}

export function initialNewGameNationScreenState(
  preferences: DraftPreferences,
  options: NewGameOptions,
): NewGameNationScreenState {
  return { preferences, options, selectedNationId: null };
}

/** Nations both fielded by the chosen scenario and playable per engine-supported configuration. */
export function selectableNations(state: NewGameNationScreenState): readonly NewGameNation[] {
  const scenario = state.options.scenarios.find(
    (candidate) => candidate.id === state.preferences.scenarioId,
  );
  if (scenario === undefined) return [];

  // Two independent gates: the scenario says which slots it activates, the
  // engine says which slots it can currently run.
  const supportedPlayerSlotIds = new Set(state.options.supportedValues.playerSlotId);
  const playableIds = new Set(scenario.playableNationIds);

  return state.options.nations.filter(
    (nation) => playableIds.has(nation.id) && supportedPlayerSlotIds.has(nation.id),
  );
}

export function selectNation(
  state: NewGameNationScreenState,
  nationId: string,
): NewGameNationScreenState {
  return { ...state, selectedNationId: nationId };
}

export function isReadyToStart(state: NewGameNationScreenState): boolean {
  return state.selectedNationId !== null;
}

/**
 * `DraftPreferences`' field names are screen-local shorthand; `CampaignConfiguration`
 * (re-exported unchanged from `@bluewave/campaign`, DESIGN-03) uses the
 * canonical `*Id`-suffixed names. This maps one to the other explicitly
 * rather than spreading, since the names don't match 1:1.
 */
export function buildCampaignConfiguration(
  state: NewGameNationScreenState,
): CampaignConfiguration | null {
  if (state.selectedNationId === null) return null;
  const { preferences } = state;
  return {
    scenarioId: preferences.scenarioId as CampaignConfiguration["scenarioId"],
    playerSlotId: state.selectedNationId,
    continuityModeId: preferences.continuityMode as CampaignConfiguration["continuityModeId"],
    fleetSizeSettingId: preferences.fleetSize as CampaignConfiguration["fleetSizeSettingId"],
    researchSpeedSettingId:
      preferences.researchSpeed as CampaignConfiguration["researchSpeedSettingId"],
    technologyVariationSettingId:
      preferences.technologyVariation as CampaignConfiguration["technologyVariationSettingId"],
    historicalBudgetOptionId: preferences.historicalBudget,
    legacyFleetModeId: preferences.legacyFleetMode,
    tacticalRealismModeId: preferences.tacticalRealism,
    difficultyProfileId: preferences.difficulty,
    campaignSeed: preferences.campaignSeed,
    configurationSchemaVersion: preferences.version,
  };
}
