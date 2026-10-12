/* @vitest-environment jsdom */
import { type ArchetypeSelection } from "@bluewave/campaign-engine";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import type { PrimaryAction } from "../../shell/primary-action.js";
import { NewGameArchetypeScreen } from "./NewGameArchetypeScreen.js";

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

function setupUi(initialArchetype: ArchetypeSelection | null = null) {
  const onNext = vi.fn();
  const onBack = vi.fn();
  let primary: PrimaryAction | null = null;
  const utils = render(
    <NewGameArchetypeScreen
      initialArchetype={initialArchetype}
      onBack={onBack}
      onNext={onNext}
      onPrimaryActionChange={(action) => {
        primary = action;
      }}
    />,
  );
  return { ...utils, onNext, onBack, getPrimary: () => primary };
}

function archetypeListbox(): HTMLElement {
  return screen.getByRole("listbox", { name: "Archetype presets" });
}

function archetypeOption(name: string): HTMLElement {
  return within(archetypeListbox()).getByRole("option", { name });
}

/** The focused-slot detail panel is the region named after the slot's title. */
function detailPanel(name: string): HTMLElement {
  return screen.getByRole("region", { name });
}

function appliedArchetype(): string {
  const text = screen.getByRole("status").textContent ?? "";
  return text.replace(/^Current archetype:\s*/u, "");
}

describe("NewGameArchetypeScreen", () => {
  afterEach(() => {
    cleanup();
  });

  it("splits into a deck and a detail column that sit side by side, with no in-screen title", () => {
    setupUi();

    const master = archetypeListbox().closest("aside");
    const detail = screen.getByRole("region", { name: "Archetype details" });
    expect(master).not.toBeNull();
    expect(master?.parentElement).toBe(detail.parentElement);
    expect(master?.contains(detail)).toBe(false);
    expect(screen.queryByRole("heading", { name: "Choose your archetype" })).toBeNull();
  });

  it("lists the three presets plus Create Your Own as four options of one listbox", () => {
    setupUi();

    expect(screen.getAllByRole("listbox")).toHaveLength(1);
    const names = within(archetypeListbox())
      .getAllByRole("option")
      .map((option) => option.getAttribute("aria-label"));
    expect(names).toEqual(["Merchant Prince", "Shipyard Baron", "Grand Admiral", "Create Your Own"]);
  });

  it("wraps arrow navigation at both ends of the deck", () => {
    setupUi();

    fireEvent.keyDown(archetypeListbox(), { key: "ArrowLeft" });
    expect(detailPanel("Create Your Own")).toBeTruthy();

    fireEvent.keyDown(archetypeListbox(), { key: "ArrowRight" });
    expect(detailPanel("Merchant Prince")).toBeTruthy();

    fireEvent.keyDown(archetypeListbox(), { key: "ArrowDown" });
    expect(detailPanel("Shipyard Baron")).toBeTruthy();

    fireEvent.keyDown(archetypeListbox(), { key: "ArrowUp" });
    expect(detailPanel("Merchant Prince")).toBeTruthy();
  });

  it("steps focus exactly once per wheel step", () => {
    setupUi();

    fireEvent.wheel(archetypeListbox(), { deltaY: 120, deltaMode: 0 });

    expect(detailPanel("Shipyard Baron")).toBeTruthy();
    expect(archetypeListbox().getAttribute("aria-activedescendant")).toBe(
      archetypeOption("Shipyard Baron").id,
    );
  });

  it("previews the focused archetype without applying it", () => {
    const { getPrimary } = setupUi();

    fireEvent.keyDown(archetypeListbox(), { key: "ArrowRight" });
    fireEvent.keyDown(archetypeListbox(), { key: "ArrowRight" });

    expect(detailPanel("Grand Admiral")).toBeTruthy();
    expect(within(detailPanel("Grand Admiral")).getByText("Applies on Next")).toBeTruthy();
    for (const option of within(archetypeListbox()).getAllByRole("option")) {
      expect(option.getAttribute("aria-selected")).toBe("false");
    }
    expect(getPrimary()?.label).toBe("Select");
  });

  it("applies the focused preset on Enter", () => {
    const { getPrimary } = setupUi();

    fireEvent.keyDown(archetypeListbox(), { key: "ArrowRight" });
    fireEvent.keyDown(archetypeListbox(), { key: "ArrowRight" });
    fireEvent.keyDown(archetypeListbox(), { key: "Enter" });

    expect(archetypeOption("Grand Admiral").getAttribute("aria-selected")).toBe("true");
    expect(appliedArchetype()).toBe("Grand Admiral");
    expect(within(detailPanel("Grand Admiral")).getByText("Active")).toBeTruthy();
    expect(getPrimary()?.label).toBe("Choose Nation");
  });

  it("applies a preset when any visible card, not just the top one, is tapped", () => {
    setupUi();

    fireEvent.pointerDown(archetypeOption("Grand Admiral"), { button: 0, pointerId: 1 });

    expect(archetypeOption("Grand Admiral").getAttribute("aria-selected")).toBe("true");
    expect(appliedArchetype()).toBe("Grand Admiral");
    expect(detailPanel("Grand Admiral")).toBeTruthy();
  });

  it("moves focus without applying anything when a drag flings the top card away", async () => {
    setupUi();

    fireEvent.pointerDown(archetypeOption("Merchant Prince"), {
      button: 0,
      pointerId: 7,
      clientX: 0,
      clientY: 0,
    });
    fireEvent.pointerMove(window, { pointerId: 7, clientX: 40, clientY: 0 });
    fireEvent.pointerMove(window, { pointerId: 7, clientX: 220, clientY: 0 });
    fireEvent.pointerUp(window, { button: 0, pointerId: 7, clientX: 220, clientY: 0 });

    await waitFor(() => expect(detailPanel("Shipyard Baron")).toBeTruthy());
    for (const option of within(archetypeListbox()).getAllByRole("option")) {
      expect(option.getAttribute("aria-selected")).toBe("false");
    }
  });

  it("shows the focused archetype's name, tagline, description, allocation and consequences", () => {
    setupUi();

    fireEvent.keyDown(archetypeListbox(), { key: "ArrowRight" });
    fireEvent.keyDown(archetypeListbox(), { key: "ArrowRight" });

    const panel = detailPanel("Grand Admiral");
    expect(within(panel).getByRole("heading", { name: "Grand Admiral" })).toBeTruthy();
    expect(within(panel).getByText("Doctrine and battle")).toBeTruthy();
    expect(within(panel).getByText(/Favors commander and doctrine bonuses/)).toBeTruthy();
    const allocation = within(panel).getByText("Allocation").parentElement;
    expect(allocation?.textContent).toBe("AllocationEconomy5Industry5Combat10");
    expect(within(panel).getByText("Consequences")).toBeTruthy();
    // Combat 10 against the balanced 6: the compact preview's dimension delta.
    expect(within(panel).getByText("+4", { exact: true })).toBeTruthy();
    expect(within(panel).queryByRole("button", { name: /select|apply/i })).toBeNull();
  });

  it("reads Active only on the applied archetype's panel", () => {
    setupUi();

    fireEvent.keyDown(archetypeListbox(), { key: "ArrowRight" });
    fireEvent.keyDown(archetypeListbox(), { key: "Enter" });
    expect(within(detailPanel("Shipyard Baron")).getByText("Active")).toBeTruthy();

    fireEvent.keyDown(archetypeListbox(), { key: "ArrowRight" });
    const panel = detailPanel("Grand Admiral");
    expect(within(panel).queryByText("Active")).toBeNull();
    expect(within(panel).getByText("Applies on Next")).toBeTruthy();
  });

  it("disables the primary action until an archetype is previewed or applied", () => {
    const { getPrimary } = setupUi();

    expect(getPrimary()?.disabled).toBe(true);

    fireEvent.keyDown(archetypeListbox(), { key: "ArrowRight" });

    expect(getPrimary()?.disabled).toBe(false);
    expect(getPrimary()?.label).toBe("Select");
  });

  it("applies on the first primary press and advances on the second", () => {
    const { getPrimary, onNext } = setupUi();

    fireEvent.keyDown(archetypeListbox(), { key: "ArrowRight" });
    act(() => getPrimary()?.onTrigger());

    expect(onNext).not.toHaveBeenCalled();
    expect(appliedArchetype()).toBe("Shipyard Baron");
    expect(getPrimary()?.label).toBe("Choose Nation");

    act(() => getPrimary()?.onTrigger());

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledWith({
      kind: "preset",
      id: "shipyard_baron",
      allocation: expect.objectContaining({ economy: expect.any(Number) }),
    });
  });

  it("restores a persisted preset selection focused and Active", () => {
    const { getPrimary } = setupUi({
      kind: "preset",
      id: "grand_admiral",
      allocation: { economy: 5, industry: 5, combat: 10 },
    });

    expect(appliedArchetype()).toBe("Grand Admiral");
    expect(archetypeOption("Grand Admiral").getAttribute("aria-selected")).toBe("true");
    expect(within(detailPanel("Grand Admiral")).getByText("Active")).toBeTruthy();
    expect(getPrimary()?.label).toBe("Choose Nation");
    expect(getPrimary()?.disabled).toBe(false);
  });

  it("calls onBack when Back is clicked", () => {
    const { onBack } = setupUi();

    fireEvent.click(screen.getByRole("button", { name: "Back to Preferences" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
