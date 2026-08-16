import type { CampaignConfiguration } from "@bluewave/campaign-engine";
import type { DraftPreferences } from "./new-game-preferences-screen-state.js";

/**
 * `DraftPreferences`' field names are screen-local shorthand; `CampaignConfiguration`
 * (re-exported unchanged from `@bluewave/campaign`, DESIGN-03) uses the
 * canonical `*Id`-suffixed names. This maps one to the other explicitly
 * rather than spreading, since the names don't match 1:1.
 */
export function buildCampaignConfiguration(
  nationId: string,
  preferences: DraftPreferences,
): CampaignConfiguration {
  return {
    scenarioId: preferences.scenarioId as CampaignConfiguration["scenarioId"],
    playerSlotId: nationId,
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
