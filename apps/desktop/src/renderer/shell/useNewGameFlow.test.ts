/* @vitest-environment jsdom */

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
import { defaultFleetMethod } from "../screens/new-game/new-game-fleet-method-screen-state.js";
import { defaultCampaignIdentity } from "../screens/new-game/new-game-identity-screen-state.js";
import type { DraftPreferences } from "../screens/new-game/new-game-preferences-screen-state.js";
import { useNewGameFlow } from "./useNewGameFlow.js";

const preferences = {
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
  campaignSeed: "TEST",
} as DraftPreferences;
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

/** Drives the flow forward to (but not through) the fleet-method step. */
function advanceToFleetMethod(actions: ReturnType<typeof setup>["result"]["current"]["actions"]) {
  act(() => actions.confirmNation("nation_uk"));
  act(() => actions.acceptPreferences(preferences, options));
  act(() => actions.acceptArchetype(preferenceArchetype));
  act(() => actions.acceptIdentity(defaultCampaignIdentity()));
}

describe("useNewGameFlow", () => {
  it("moves nation first, then through preferences, archetype, identity, and fleet method", () => {
    const { result, selectScreen } = setup();

    act(() => result.current.actions.start());
    expect(selectScreen).toHaveBeenLastCalledWith("new-game-nation");

    act(() => result.current.actions.confirmNation("nation_uk"));
    expect(result.current.state.draft).toEqual({
      nationId: "nation_uk",
      preferences: null,
      options: null,
      archetype: null,
      identity: null,
      fleetMethod: null,
      recommendedPreset: null,
    });
    expect(selectScreen).toHaveBeenLastCalledWith("new-game-preferences");

    act(() => result.current.actions.acceptPreferences(preferences, options));
    expect(result.current.state.draft?.preferences).toEqual(preferences);
    expect(selectScreen).toHaveBeenLastCalledWith("new-game-archetype");

    act(() => result.current.actions.acceptArchetype(preferenceArchetype));
    expect(result.current.state.draft?.archetype).toEqual(preferenceArchetype);
    expect(selectScreen).toHaveBeenLastCalledWith("new-game-identity");

    const identity = defaultCampaignIdentity();
    act(() => result.current.actions.acceptIdentity(identity));
    expect(result.current.state.draft?.identity).toEqual(identity);
    expect(selectScreen).toHaveBeenLastCalledWith("new-game-fleet-method");
  });

  it("applies the recommended setup into the draft without navigating away", () => {
    const { result, selectScreen } = setup();

    act(() => result.current.actions.applyRecommendedSetup("nation_uk"));

    expect(result.current.state.draft).toEqual({
      nationId: "nation_uk",
      preferences: null,
      options: null,
      archetype: null,
      identity: null,
      fleetMethod: { legacyFleetModeId: "generated" },
      recommendedPreset: {
        fleetSize: "standard",
        researchSpeed: "standard",
        technologyVariation: "some",
        historicalBudget: "standard",
        tacticalRealism: "standard",
        difficulty: "normal",
      },
    });
    expect(selectScreen).not.toHaveBeenCalled();
  });

  it("preserves the archetype and nation when navigating backward and forward", () => {
    const { result, selectScreen } = setup();

    act(() => result.current.actions.confirmNation("nation_uk"));
    act(() => result.current.actions.acceptPreferences(preferences, options));
    act(() => result.current.actions.acceptArchetype(preferenceArchetype));
    expect(result.current.state.draft?.archetype).toEqual(preferenceArchetype);

    act(() => result.current.actions.backToArchetype());
    expect(selectScreen).toHaveBeenLastCalledWith("new-game-archetype");
    act(() => result.current.actions.backToPreferences());
    expect(selectScreen).toHaveBeenLastCalledWith("new-game-preferences");
    act(() => result.current.actions.backToNation());
    expect(selectScreen).toHaveBeenLastCalledWith("new-game-nation");

    // Moving forward again keeps the already-chosen nation and archetype.
    act(() => result.current.actions.acceptPreferences(preferences, options));
    expect(result.current.state.draft?.nationId).toBe("nation_uk");
    expect(result.current.state.draft?.archetype).toEqual(preferenceArchetype);
  });

  it("opens the compiled campaign and clears the completed draft", async () => {
    const { result, execute, openCampaign } = setup();
    advanceToFleetMethod(result.current.actions);

    await act(() => result.current.actions.launch(defaultFleetMethod()));

    expect(execute).toHaveBeenCalledWith(
      "compileCampaign",
      expect.objectContaining({
        scenarioId: preferences.scenarioId,
        playerSlotId: "nation_uk",
      }),
    );
    expect(openCampaign).toHaveBeenCalledWith("ses-created");
    expect(result.current.state.draft).toBeNull();
    expect(result.current.state.error).toBeNull();
    expect(result.current.state.status).toBe("ready");
  });

  it("sends the fleet-method screen's selected legacyFleetModeId, not the preferences default", async () => {
    const { result, execute } = setup();
    advanceToFleetMethod(result.current.actions);

    await act(() => result.current.actions.launch({ legacyFleetModeId: "disabled" }));

    expect(execute).toHaveBeenCalledWith(
      "compileCampaign",
      expect.objectContaining({ legacyFleetModeId: "disabled" }),
    );
  });

  it("keeps navigation outside the workflow and reports compilation rejection", async () => {
    const execute = (async () => ({
      outcome: "rejected" as const,
      reason: "UNSUPPORTED_CONFIGURATION",
      diagnostics: ["difficulty is invalid"],
    })) as unknown as CampaignExecute;
    const { result, openCampaign, selectScreen } = setup(execute);
    advanceToFleetMethod(result.current.actions);

    await act(() => result.current.actions.launch(defaultFleetMethod()));

    expect(openCampaign).not.toHaveBeenCalled();
    expect(result.current.state.error).toBe("UNSUPPORTED_CONFIGURATION. difficulty is invalid");
    expect(result.current.state.status).toBe("ready");

    act(() => result.current.actions.backToIdentity());
    expect(selectScreen).toHaveBeenLastCalledWith("new-game-identity");
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
    advanceToFleetMethod(result.current.actions);

    let launchPromise: Promise<void> = Promise.resolve();
    act(() => {
      launchPromise = result.current.actions.launch(defaultFleetMethod());
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
