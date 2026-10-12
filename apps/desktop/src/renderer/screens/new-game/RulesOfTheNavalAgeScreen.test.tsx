/* @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { NewGameOptions } from "../../../shared/new-game-contract.js";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import type { BluewaveDesktopBridge } from "../../../preload/index.js";
import type { AdmiralPresetValues } from "./admiral-preset.js";
import type { PrimaryAction } from "../../shell/primary-action.js";
import { PRESET_DEFINITIONS } from "./rules-of-the-naval-age-presets.js";
import { RulesOfTheNavalAgeScreen } from "./RulesOfTheNavalAgeScreen.js";

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === "undefined") {
    class ResizeObserverStub {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;
  }
});

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
    { id: "nation_uk", name: "United Kingdom", regimeName: "Monarchy", regimeType: "monarchy" },
  ],
  supportedValues: {
    scenarioId: ["scen_1900"],
    playerSlotId: ["nation_uk", "nation_germany"],
    continuityMode: ["historical"],
    fleetSize: ["small", "standard", "large", "very_large"],
    researchSpeed: ["slow", "standard", "fast", "very_fast"],
    technologyVariation: ["none", "some", "considerable"],
    historicalBudget: ["standard", "historical"],
    legacyFleetMode: ["historical", "generated", "disabled"],
    tacticalRealism: ["standard", "realistic", "not_applicable"],
    difficulty: ["easy", "normal", "hard", "very_hard"],
  },
};

const execute = vi.fn(async (name: string) => {
  if (name === "listNewGameOptions") {
    return { outcome: "success" as const, value: options };
  }
  throw new Error(`unexpected command: ${name}`);
});

const bridge = { campaign: { execute } } as unknown as BluewaveDesktopBridge;

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
  window.bluewave = bridge;
});

async function setupUi(recommendedPreset: AdmiralPresetValues | null = null) {
  const onCancel = vi.fn();
  const onNext = vi.fn();
  let primary: PrimaryAction | null = null;
  const utils = render(
    <RulesOfTheNavalAgeScreen
      recommendedPreset={recommendedPreset}
      onCancel={onCancel}
      onNext={onNext}
      onPrimaryActionChange={(action) => {
        primary = action;
      }}
    />,
  );
  await screen.findByRole("heading", { name: "Rules of the Naval Age" });
  // The heading is there at once; the deck and the setting controls only render once the options
  // have loaded through the bridge. Wait for them, or the tests below race the load on a busy machine.
  await screen.findByLabelText("Fleet Size");
  await screen.findByRole("listbox", { name: "Campaign presets" });
  return { ...utils, onCancel, onNext, getPrimary: () => primary };
}

function openSelectAndPick(labelText: string, optionName: string) {
  const trigger = screen.getByLabelText(labelText);
  fireEvent.click(trigger);
  // The panel is portaled to <body>, so reach it through the trigger's aria-controls.
  const listId = trigger.getAttribute("aria-controls");
  const list = listId ? document.getElementById(listId) : null;
  const option = within(list ?? document.body).getByRole("option", { name: optionName });
  fireEvent.click(option);
}

const SETTING_LABELS = [
  "Fleet Size",
  "Research Pace",
  "Technology Variation",
  "Historical Budget",
  "Tactical Realism",
  "Difficulty",
];

function presetListbox(): HTMLElement {
  return screen.getByRole("listbox", { name: "Campaign presets" });
}

function presetOption(name: string): HTMLElement {
  return within(presetListbox()).getByRole("option", { name });
}

/** The focused-preset panel is the region named after whichever preset is previewed. */
function detailPanel(presetName: string): HTMLElement {
  return screen.getByRole("region", { name: presetName });
}

/** The name the deck reports as currently applied: a preset, or "Custom". */
function appliedSetup(): string {
  const text = screen.getByRole("status").textContent ?? "";
  return text.replace(/^Current setup:\s*/u, "");
}

describe("RulesOfTheNavalAgeScreen", () => {
  it("splits into a preset deck and a detail column that sit side by side", async () => {
    await setupUi();

    const master = presetListbox().closest("aside");
    const detail = screen.getByRole("region", { name: "Preset details" });
    expect(master).not.toBeNull();
    expect(master?.parentElement).toBe(detail.parentElement);
    expect(master?.contains(detail)).toBe(false);
    // The forms live in the detail column, not the deck.
    expect(within(detail).getByLabelText("Fleet Size")).toBeTruthy();
    expect(within(detail).getByLabelText("Difficulty")).toBeTruthy();
    expect(within(master as HTMLElement).queryByLabelText("Fleet Size")).toBeNull();
  });

  it("crowns the detail column with a decorative globe that offers nothing to pick", async () => {
    await setupUi();

    const detail = screen.getByRole("region", { name: "Preset details" });
    const globe = detail.querySelector("[data-testid='preset-globe-band']");
    expect(globe).not.toBeNull();
    // It leads the column, above the focused-preset panel and the forms.
    expect(detail.firstElementChild).toBe(globe);
    expect(globe?.getAttribute("aria-hidden")).toBe("true");
    expect(globe?.querySelector("svg")).not.toBeNull();
    // Nothing inside it is a control, a nation pin or an option.
    expect(globe?.querySelector("button, a, input, select, [role], [tabindex]")).toBeNull();
    expect(globe?.querySelector("[data-country-id]")).toBeNull();
    // The only option set on the screen is the preset deck.
    expect(within(presetListbox()).getAllByRole("option")).toHaveLength(4);
    expect(screen.queryByRole("img", { name: "World map" })).toBeNull();
  });

  it("lists exactly the four preset bundles as options of one listbox", async () => {
    await setupUi();

    expect(screen.getAllByRole("listbox")).toHaveLength(1);
    const names = within(presetListbox())
      .getAllByRole("option")
      .map((option) => option.getAttribute("aria-label"));
    expect(names).toEqual(PRESET_DEFINITIONS.map((preset) => preset.name));
    expect(names).toEqual(["Cadet", "Admiral", "Naval Historian", "Alternate History"]);
  });

  it("previews the focused preset's name, tagline and all six settings", async () => {
    await setupUi();

    const cadet = PRESET_DEFINITIONS[0];
    const panel = detailPanel("Cadet");
    expect(within(panel).getByText(cadet?.tagline ?? "")).toBeTruthy();
    expect(
      within(panel)
        .getAllByRole("term")
        .map((term) => term.textContent),
    ).toEqual(SETTING_LABELS);
    expect(
      within(panel)
        .getAllByRole("definition")
        .map((definition) => definition.textContent),
    ).toEqual(["Small", "Standard", "Historical", "Standard", "Standard", "Easy"]);
  });

  it("offers Select for a preset that is not applied, and Active once it is", async () => {
    await setupUi();

    expect(within(detailPanel("Cadet")).getByRole("button", { name: "Select Cadet" })).toBeTruthy();
    expect(within(detailPanel("Cadet")).queryByText("Active")).toBeNull();

    fireEvent.click(within(detailPanel("Cadet")).getByRole("button", { name: "Select Cadet" }));

    expect(within(detailPanel("Cadet")).getByText("Active")).toBeTruthy();
    expect(within(detailPanel("Cadet")).queryByRole("button", { name: "Select Cadet" })).toBeNull();
  });

  it("starts on Custom because the loaded defaults match no preset", async () => {
    await setupUi();

    expect(appliedSetup()).toBe("Custom");
    for (const option of within(presetListbox()).getAllByRole("option")) {
      expect(option.getAttribute("aria-selected")).toBe("false");
    }
  });

  it.each([
    ["ArrowRight", "Admiral"],
    ["ArrowDown", "Admiral"],
    ["ArrowLeft", "Alternate History"],
    ["ArrowUp", "Alternate History"],
  ])("%s moves focus from Cadet to %s, wrapping at the ends", async (key, expectedName) => {
    await setupUi();

    fireEvent.keyDown(presetListbox(), { key });

    expect(detailPanel(expectedName)).toBeTruthy();
    expect(presetListbox().getAttribute("aria-activedescendant")).toBe(
      presetOption(expectedName).id,
    );
  });

  it("previews on focus changes without committing any preference", async () => {
    await setupUi();

    fireEvent.keyDown(presetListbox(), { key: "ArrowRight" });
    fireEvent.keyDown(presetListbox(), { key: "ArrowRight" });

    expect(detailPanel("Naval Historian")).toBeTruthy();
    expect(appliedSetup()).toBe("Custom");
    expect(screen.getByLabelText("Fleet Size").textContent).toContain("Small");
    expect(screen.getByLabelText("Difficulty").textContent).toContain("Easy");
  });

  it("confirms the focused preset on Enter", async () => {
    await setupUi();

    fireEvent.keyDown(presetListbox(), { key: "ArrowRight" });
    fireEvent.keyDown(presetListbox(), { key: "Enter" });

    expect(appliedSetup()).toBe("Admiral");
    expect(screen.getByLabelText("Fleet Size").textContent).toContain("Standard");
    expect(screen.getByLabelText("Difficulty").textContent).toContain("Normal");
    expect(within(detailPanel("Admiral")).getByText("Active")).toBeTruthy();
    expect(presetOption("Admiral").getAttribute("aria-selected")).toBe("true");
  });

  it("applies a preset when any visible card, not just the top one, is tapped", async () => {
    await setupUi();

    fireEvent.pointerDown(presetOption("Naval Historian"), { button: 0, pointerId: 1 });

    expect(appliedSetup()).toBe("Naval Historian");
    expect(screen.getByLabelText("Fleet Size").textContent).toContain("Large");
    expect(screen.getByLabelText("Difficulty").textContent).toContain("Hard");
    expect(detailPanel("Naval Historian")).toBeTruthy();
  });

  it("moves focus without applying anything when a drag flings the top card away", async () => {
    await setupUi();

    fireEvent.pointerDown(presetOption("Cadet"), {
      button: 0,
      pointerId: 7,
      clientX: 0,
      clientY: 0,
    });
    fireEvent.pointerMove(window, { pointerId: 7, clientX: 40, clientY: 0 });
    fireEvent.pointerMove(window, { pointerId: 7, clientX: 220, clientY: 0 });
    fireEvent.pointerUp(window, { button: 0, pointerId: 7, clientX: 220, clientY: 0 });

    await waitFor(() => expect(detailPanel("Admiral")).toBeTruthy());
    expect(appliedSetup()).toBe("Custom");
    expect(screen.getByLabelText("Fleet Size").textContent).toContain("Small");
  });

  it("applies a preset's exact six-setting bundle, then reverts to Custom on a single edit", async () => {
    await setupUi();

    fireEvent.pointerDown(presetOption("Cadet"), { button: 0, pointerId: 1 });
    fireEvent.pointerUp(window, { button: 0, pointerId: 1 });
    expect(appliedSetup()).toBe("Cadet");
    expect(screen.getByLabelText("Fleet Size").textContent).toContain("Small");
    expect(screen.getByLabelText("Difficulty").textContent).toContain("Easy");

    openSelectAndPick("Difficulty", "Hard");

    expect(appliedSetup()).toBe("Custom");
    expect(presetOption("Cadet").getAttribute("aria-selected")).toBe("false");
  });

  it.each([
    ["Small", /faster turns, fewer ships/i],
    ["Standard", /recommended default/i],
    ["Large", /more ships to manage, slower turns/i],
    ["Very Large", /most ships to manage/i],
  ])("shows the qualitative readout for fleet size %s", async (optionName, expectedText) => {
    await setupUi();

    openSelectAndPick("Fleet Size", optionName);

    expect(screen.getByText(expectedText)).toBeTruthy();
  });

  it("presents each Era & Scale option with an icon and a secondary description", async () => {
    await setupUi();

    const scenarioTrigger = screen.getByLabelText("Starting Era");
    fireEvent.click(scenarioTrigger);
    const scenarioList = document.getElementById(
      scenarioTrigger.getAttribute("aria-controls") ?? "",
    );
    const scenarioOption = within(scenarioList ?? document.body).getByRole("option", {
      name: "January 1900",
    });
    expect(scenarioOption.querySelector("svg")).toBeTruthy();
    expect(within(scenarioOption).getByText("Begins January 1900 · 2 nations")).toBeTruthy();

    const fleetTrigger = screen.getByLabelText("Fleet Size");
    fireEvent.click(fleetTrigger);
    const fleetList = document.getElementById(fleetTrigger.getAttribute("aria-controls") ?? "");
    const fleetOption = within(fleetList ?? document.body).getByRole("option", { name: "Large" });
    expect(fleetOption.querySelector("svg")).toBeTruthy();
    expect(within(fleetOption).getByText(/more ships to manage, slower turns/)).toBeTruthy();
  });

  it("edits the campaign seed from the Era & Scale form", async () => {
    await setupUi();

    const seed = screen.getByLabelText("Campaign Seed");
    fireEvent.change(seed, { target: { value: "SEED-42" } });

    expect((screen.getByLabelText("Campaign Seed") as HTMLInputElement).value).toBe("SEED-42");
  });

  it("shows each Historical Uncertainty setting's label and updates it", async () => {
    await setupUi();

    for (const label of SETTING_LABELS.slice(1)) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
    openSelectAndPick("Research Pace", "Fast");
    expect(screen.getByLabelText("Research Pace").textContent).toContain("Fast");
  });

  it("returns to nation selection through Back", async () => {
    const { onCancel } = await setupUi();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables Next until options finish loading, then advances with the current preferences", async () => {
    const { onNext, getPrimary } = await setupUi();

    fireEvent.pointerDown(presetOption("Cadet"), { button: 0, pointerId: 1 });
    fireEvent.pointerUp(window, { button: 0, pointerId: 1 });
    await waitFor(() => expect(getPrimary()?.disabled).toBe(false));
    expect(getPrimary()?.label).toBe("Next: Choose Archetype");
    act(() => getPrimary()?.onTrigger());

    await waitFor(() => expect(onNext).toHaveBeenCalledTimes(1));
    const [preferences] = onNext.mock.calls[0] as [Record<string, string>, NewGameOptions];
    expect(preferences.fleetSize).toBe("small");
    expect(preferences.difficulty).toBe("easy");
  });
});
