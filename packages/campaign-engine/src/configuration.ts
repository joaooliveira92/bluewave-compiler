import type { CampaignConfiguration as EngineCampaignConfiguration } from "@bluewave/campaign";

/**
 * The real engine type, plus an optional `archetype` field — grounded in
 * two independent New Game screens (`new-game-nation-screen-state.ts`,
 * `NewGameNationScreen.tsx`) that both attach a serialized archetype
 * selection to the compile payload. `compileCampaign`'s implementation
 * decides whether to act on it; per ticket 07's addendum, it travels
 * through honestly rather than being silently dropped.
 */
export type CampaignConfiguration = EngineCampaignConfiguration & {
  readonly archetype?: string;
};

/**
 * Per-field valid option ids, keyed to match each screen's actual usage
 * (grounded in `RulesetOptionsSection.tsx` and `new-game-nation-screen-state.ts`
 * — the naming isn't uniform because the two screens were built against
 * different naming conventions independently: `playerSlotId` mirrors
 * `CampaignConfiguration`'s field name, the rest mirror `DraftPreferences`'
 * shorter names).
 *
 * `historicalBudget`/`legacyFleetMode`/`tacticalRealism`/`difficulty` are
 * ruleset-content-driven option catalogs (`CampaignConfiguration`'s
 * corresponding fields are untyped `string`, not fixed code enums) — their
 * values come from the compiled content pack at runtime, not from a
 * hardcoded list here.
 */
export interface SupportedConfigurationValues {
  readonly scenarioId: readonly string[];
  readonly continuityMode: readonly string[];
  readonly fleetSize: readonly string[];
  readonly researchSpeed: readonly string[];
  readonly technologyVariation: readonly string[];
  readonly historicalBudget: readonly string[];
  readonly legacyFleetMode: readonly string[];
  readonly tacticalRealism: readonly string[];
  readonly difficulty: readonly string[];
  /** Nations the engine can currently run as a player slot — excludes
   * zero-content nations per the desktop-mvp map's empty-nation-content-gap
   * decision. */
  readonly playerSlotId: readonly string[];
}
