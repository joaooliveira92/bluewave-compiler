import { describe, expect, it } from "vite-plus/test";
import type { NewGameOptions } from "../../../shared/new-game-contract.js";
import {
  buildCampaignConfiguration,
  initialNewGameNationScreenState,
  isReadyToStart,
  selectableNations,
  selectNation,
} from "./new-game-nation-screen-state.js";
import type { DraftPreferences } from "./new-game-preferences-screen-state.js";

const preferences: DraftPreferences = {
  version: "campaign_configuration_v1",
  scenarioId: "scen_1900",
  continuityMode: "historical",
  fleetSize: "standard",
  researchSpeed: "standard",
  technologyVariation: "none",
  historicalBudget: "canonical",
  legacyFleetMode: "canonical_fixture",
  tacticalRealism: "admiral",
  difficulty: "standard",
  campaignSeed: "SEED-1",
};

const options: NewGameOptions = {
  scenarios: [
    {
      id: "scen_1900",
      name: "January 1900",
      startYear: 1900,
      startMonth: 1,
      participantNationIds: ["nation_uk", "nation_germany"],
      playableNationIds: ["nation_uk", "nation_germany"],
    },
  ],
  nations: [
    {
      id: "nation_uk",
      name: "United Kingdom",
      regimeName: "Constitutional Monarchy",
      regimeType: "constitutional_monarchy",
    },
    {
      id: "nation_germany",
      name: "German Empire",
      regimeName: "Federal Monarchy",
      regimeType: "federal_monarchy",
    },
  ],
  supportedValues: {
    scenarioId: ["scen_1900"],
    playerSlotId: ["nation_uk", "nation_germany"],
    continuityMode: ["historical"],
    fleetSize: ["standard"],
    researchSpeed: ["standard"],
    technologyVariation: ["none"],
    historicalBudget: ["canonical"],
    legacyFleetMode: ["canonical_fixture"],
    tacticalRealism: ["admiral"],
    difficulty: ["standard"],
  },
};

describe("new-game-nation-screen-state", () => {
  it("lists nations that are both scenario participants and engine-supported", () => {
    const state = initialNewGameNationScreenState(preferences, options);
    const nations = selectableNations(state);
    expect(nations.map((n) => n.id)).toEqual(["nation_uk", "nation_germany"]);
  });

  it("excludes nations not yet supported as a player slot", () => {
    const restricted: NewGameOptions = {
      ...options,
      supportedValues: {
        ...options.supportedValues,
        playerSlotId: ["nation_uk"],
      },
    };
    const state = initialNewGameNationScreenState(preferences, restricted);
    expect(selectableNations(state).map((n) => n.id)).toEqual(["nation_uk"]);
  });

  it("is not ready to start until a nation is selected", () => {
    const state = initialNewGameNationScreenState(preferences, options);
    expect(isReadyToStart(state)).toBe(false);
    expect(buildCampaignConfiguration(state)).toBeNull();
  });

  it("builds the final configuration from preferences plus the selected nation", () => {
    const state = selectNation(
      initialNewGameNationScreenState(preferences, options),
      "nation_germany",
    );
    expect(isReadyToStart(state)).toBe(true);
    expect(buildCampaignConfiguration(state)).toEqual({
      ...preferences,
      playerSlotId: "nation_germany",
    });
  });
});
