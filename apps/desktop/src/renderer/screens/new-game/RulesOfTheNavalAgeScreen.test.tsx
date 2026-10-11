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
  await screen.findByText("Rules of the Naval Age");
  // The heading is there at once; the setting controls only render once the options have loaded
  // through the bridge. Wait for them, or the tests below race the load on a busy machine.
  await screen.findByLabelText("Fleet Size");
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

describe("RulesOfTheNavalAgeScreen", () => {
  it("applies a preset's exact six-setting bundle when its pill is clicked", async () => {
    await setupUi();

    fireEvent.click(screen.getByRole("button", { name: /Cadet/ }));

    expect(screen.getByRole("button", { name: /Cadet/ }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByLabelText("Fleet Size").textContent).toContain("Small");
    expect(screen.getByLabelText("Difficulty").textContent).toContain("Easy");
  });

  it("lists every preset's name and tagline before one is chosen", async () => {
    await setupUi();

    const list = screen.getByRole("list", { name: "Preset comparison" });
    for (const preset of PRESET_DEFINITIONS) {
      expect(within(list).getByText(preset.name)).toBeTruthy();
      expect(within(list).getByText(preset.tagline)).toBeTruthy();
    }
  });

  it("shows each preset's name and select state on its own card", async () => {
    await setupUi();

    const admiralCard = screen.getByRole("button", { name: /Admiral/ });
    expect(admiralCard.textContent).toContain("Admiral");
    expect(admiralCard.textContent).toContain("Select");
  });

  it("previews a card on hover/focus without committing the preset", async () => {
    await setupUi();

    const cadetCard = screen.getByRole("button", { name: /Cadet/ });
    expect(cadetCard.getAttribute("aria-pressed")).toBe("false");

    fireEvent.focusIn(cadetCard);

    const status = screen.getByRole("status");
    expect(within(status).getByText("Cadet")).toBeTruthy();
    expect(within(status).getByText(/more information, manageable fleets/i)).toBeTruthy();
    expect(cadetCard.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("button", { name: /Custom/ }).getAttribute("aria-pressed")).toBe(
      "true",
    );

    fireEvent.click(cadetCard);
    expect(cadetCard.getAttribute("aria-pressed")).toBe("true");
  });

  it("reverts to Custom after editing a single setting post-preset", async () => {
    await setupUi();

    fireEvent.click(screen.getByRole("button", { name: /Cadet/ }));
    expect(screen.getByRole("button", { name: /Cadet/ }).getAttribute("aria-pressed")).toBe("true");

    openSelectAndPick("Difficulty", "Hard");

    expect(screen.getByRole("button", { name: /Cadet/ }).getAttribute("aria-pressed")).toBe(
      "false",
    );
    expect(screen.getByRole("button", { name: /Custom/ }).getAttribute("aria-pressed")).toBe(
      "true",
    );
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

  it("disables Next until options finish loading, then advances with the current preferences", async () => {
    const { onNext, getPrimary } = await setupUi();

    fireEvent.click(screen.getByRole("button", { name: /Cadet/ }));
    await waitFor(() => expect(getPrimary()?.disabled).toBe(false));
    expect(getPrimary()?.label).toBe("Next: Choose Archetype");
    act(() => getPrimary()?.onTrigger());

    await waitFor(() => expect(onNext).toHaveBeenCalledTimes(1));
    const [preferences] = onNext.mock.calls[0] as [Record<string, string>, NewGameOptions];
    expect(preferences.fleetSize).toBe("small");
    expect(preferences.difficulty).toBe("easy");
  });
});
