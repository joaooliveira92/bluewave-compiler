/* @vitest-environment jsdom */

import type { CampaignConfiguration } from "@bluewave/campaign-engine";
import { ARCHETYPE_PRESETS } from "@bluewave/campaign-engine";
import type { ArchetypeSelection } from "@bluewave/campaign-engine";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import type { BluewaveDesktopBridge } from "../../preload/index.js";
import type {
  CampaignCommandClient,
  CompileCampaignResult,
} from "../../shared/campaign-command-contract.js";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type { NewGameOptions } from "../../shared/new-game-contract.js";
import type { DraftPreferences } from "../screens/new-game/new-game-preferences-screen-state.js";
import { useNewGameFlow } from "./useNewGameFlow.js";

const config = {
  version: "campaign_configuration_v1",
  scenarioId: "scen_1900",
  playerSlotId: "nation_uk",
  continuityMode: "historical",
  fleetSize: "standard",
  researchSpeed: "standard",
  technologyVariation: "none",
  historicalBudget: "canonical",
  legacyFleetMode: "canonical_fixture",
  tacticalRealism: "admiral",
  difficulty: "standard",
  campaignSeed: "TEST",
} as unknown as CampaignConfiguration;

const preferences = { scenarioId: "scen_1900" } as DraftPreferences;
const options = {
  scenarios: [],
  nations: [],
  supportedValues: {},
} as unknown as NewGameOptions;

type CampaignExecute = CampaignCommandClient["execute"];

const compiledSuccess = vi.fn(async () => ({
  outcome: "success" as const,
  value: { sessionId: "ses-created" },
})) as unknown as CampaignExecute;

function setup(execute: CampaignExecute = compiledSuccess) {
  const selectScreen = vi.fn();
  const openCampaign = vi.fn(async () => undefined);
  const bridge = { campaign: { execute } } as Pick<BluewaveDesktopBridge, "campaign">;
  const rendered = renderHook(() => useNewGameFlow(bridge, { selectScreen, openCampaign }));
  return { ...rendered, selectScreen, openCampaign, execute };
}

const preferenceArchetype: ArchetypeSelection = {
  kind: "preset",
  id: ARCHETYPE_PRESETS[0]!.id,
  allocation: { ...ARCHETYPE_PRESETS[0]!.allocation },
};

describe("useNewGameFlow", () => {
  it("moves from preferences to archetype to nation while retaining the draft", () => {
    const { result, selectScreen } = setup();

    act(() => result.current.actions.start());
    expect(selectScreen).toHaveBeenLastCalledWith("new-game-preferences");

    act(() => result.current.actions.acceptPreferences(preferences, options));
    expect(result.current.state.draft).toEqual({
      preferences,
      options,
      archetype: null,
    });
    expect(selectScreen).toHaveBeenLastCalledWith("new-game-archetype");

    act(() => result.current.actions.acceptArchetype(preferenceArchetype));
    expect(result.current.state.draft?.archetype).toEqual(preferenceArchetype);
    expect(selectScreen).toHaveBeenLastCalledWith("new-game-nation");
  });

  it("preserves the archetype when navigating backward and forward", () => {
    const { result, selectScreen } = setup();

    act(() => result.current.actions.acceptPreferences(preferences, options));
    act(() => result.current.actions.acceptArchetype(preferenceArchetype));
    expect(result.current.state.draft?.archetype).toEqual(preferenceArchetype);

    act(() => result.current.actions.backToArchetype());
    expect(selectScreen).toHaveBeenLastCalledWith("new-game-archetype");
    act(() => result.current.actions.backToPreferences());
    expect(selectScreen).toHaveBeenLastCalledWith("new-game-preferences");

    // Moving forward again keeps the already-chosen archetype in the draft.
    act(() => result.current.actions.acceptPreferences(preferences, options));
    expect(result.current.state.draft?.archetype).toEqual(preferenceArchetype);
  });

  it("opens the compiled campaign and clears the completed draft", async () => {
    const { result, execute, openCampaign } = setup();
    act(() => result.current.actions.acceptPreferences(preferences, options));

    await act(() => result.current.actions.launch(config));

    expect(execute).toHaveBeenCalledWith("compileCampaign", config);
    expect(openCampaign).toHaveBeenCalledWith("ses-created");
    expect(result.current.state.draft).toBeNull();
    expect(result.current.state.error).toBeNull();
    expect(result.current.state.status).toBe("ready");
  });

  it("keeps navigation outside the workflow and reports compilation rejection", async () => {
    const execute = (async () => ({
      outcome: "rejected" as const,
      reason: "UNSUPPORTED_CONFIGURATION",
      diagnostics: ["difficulty is invalid"],
    })) as unknown as CampaignExecute;
    const { result, openCampaign, selectScreen } = setup(execute);

    await act(() => result.current.actions.launch(config));

    expect(openCampaign).not.toHaveBeenCalled();
    expect(result.current.state.error).toBe("UNSUPPORTED_CONFIGURATION. difficulty is invalid");
    expect(result.current.state.status).toBe("ready");

    act(() => result.current.actions.backToPreferences());
    expect(selectScreen).toHaveBeenLastCalledWith("new-game-preferences");
    act(() => result.current.actions.cancel());
    expect(selectScreen).toHaveBeenLastCalledWith("file");
  });

  it("exposes starting state while compilation is unresolved", async () => {
    let resolveCompilation: (value: BridgeResult<CompileCampaignResult>) => void = () => undefined;
    const execute = (() =>
      new Promise<BridgeResult<CompileCampaignResult>>((resolve) => {
        resolveCompilation = resolve;
      })) as unknown as CampaignExecute;
    const { result } = setup(execute);

    let launchPromise: Promise<void> = Promise.resolve();
    act(() => {
      launchPromise = result.current.actions.launch(config);
    });
    await waitFor(() => expect(result.current.state.status).toBe("launching"));

    resolveCompilation({
      outcome: "success",
      value: { sessionId: "ses-created" },
      diagnostics: [],
    });
    await act(() => launchPromise);
    expect(result.current.state.status).toBe("ready");
  });
});
