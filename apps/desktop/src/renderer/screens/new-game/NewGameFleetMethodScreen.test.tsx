/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import type { SetPrimaryAction } from "../../shell/primary-action.js";
import { NewGameFleetMethodScreen } from "./NewGameFleetMethodScreen.js";
import { defaultFleetMethod, type FleetMethodDraft } from "./new-game-fleet-method-screen-state.js";

function setupUi(initialFleetMethod: FleetMethodDraft = defaultFleetMethod()) {
  const onPrimaryActionChange = vi.fn() as unknown as SetPrimaryAction;
  const onNext = vi.fn();
  const onBack = vi.fn();
  const utils = render(
    <NewGameFleetMethodScreen
      initialFleetMethod={initialFleetMethod}
      status="ready"
      error={null}
      onBack={onBack}
      onNext={onNext}
      onPrimaryActionChange={onPrimaryActionChange}
    />,
  );
  return { ...utils, onNext, onBack, onPrimaryActionChange };
}

function lastPrimary(onPrimaryActionChange: ReturnType<typeof setupUi>["onPrimaryActionChange"]): {
  label?: string;
  disabled?: boolean;
  onTrigger?: () => void;
} {
  const calls = vi
    .mocked(onPrimaryActionChange)
    .mock.calls.map((call) => call[0])
    .filter(Boolean);
  return calls[calls.length - 1] ?? {};
}

function click(name: string): void {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(name) }));
}

describe("NewGameFleetMethodScreen", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders three cards with the spec §5a copy mapping", () => {
    setupUi();
    expect(screen.getByRole("button", { name: /Inherit an Existing Navy/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Build the Legacy Fleet Manually/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Curated Historical-Inspired Fleet/ })).toBeTruthy();
  });

  it("shows artwork for each of the three fleet methods", () => {
    const { container } = setupUi();
    const images = [...container.querySelectorAll("img")];
    expect(images).toHaveLength(3);
    expect(images[0]?.getAttribute("src")).toMatch(/dockyard/);
    expect(images[1]?.getAttribute("src")).toMatch(/blueprint/);
    expect(images[2]?.getAttribute("src")).toMatch(/cannons/);
  });

  it("treats the card artwork as decorative, keeping the name on the card button", () => {
    const { container } = setupUi();
    for (const image of container.querySelectorAll("img")) {
      expect(image.getAttribute("alt")).toBe("");
    }
    expect(screen.getByRole("button", { name: /Inherit an Existing Navy/ })).toBeTruthy();
  });

  it("lists all three methods in an always-visible comparison legend, marking the active one", () => {
    setupUi();
    const legend = screen.getByRole("list", { name: "Starting-fleet method comparison" });
    const items = legend.querySelectorAll("li");
    expect(items).toHaveLength(3);
    expect(legend.textContent).toContain("Inherit an Existing Navy");
    expect(legend.textContent).toContain("Build the Legacy Fleet Manually");
    expect(legend.textContent).toContain("Curated Historical-Inspired Fleet");
    expect(items[0]?.getAttribute("aria-current")).toBe("true");

    click("Build the Legacy Fleet Manually");
    const after = screen
      .getByRole("list", { name: "Starting-fleet method comparison" })
      .querySelectorAll("li");
    expect(after[1]?.getAttribute("aria-current")).toBe("true");
    expect(after[0]?.getAttribute("aria-current")).toBeNull();
  });

  it("associates the selected card with the caption via aria-describedby", () => {
    setupUi();
    const inherit = screen.getByRole("button", { name: /Inherit an Existing Navy/ });
    const captionId = inherit.getAttribute("aria-describedby");
    expect(captionId).toBeTruthy();
    const caption = document.getElementById(captionId!);
    expect(caption?.textContent).toContain(
      "Start with an operational-but-aging navy and modernize it as you play",
    );
    expect(
      screen
        .getByRole("button", { name: /Build the Legacy Fleet Manually/ })
        .getAttribute("aria-describedby"),
    ).toBeNull();

    click("Build the Legacy Fleet Manually");
    const manual = screen.getByRole("button", { name: /Build the Legacy Fleet Manually/ });
    expect(manual.getAttribute("aria-describedby")).toBe(captionId);
    expect(document.getElementById(captionId!)?.textContent).toContain(
      "Detailed fleet construction isn't available yet",
    );
  });

  it("defaults to the generated (Inherit an Existing Navy) card on first visit", () => {
    setupUi();
    const card = screen.getByRole("button", { name: /Inherit an Existing Navy/ });
    expect(card.getAttribute("aria-pressed")).toBe("true");
  });

  it("shows the manual-build not-yet-available note only when the disabled card is selected", () => {
    setupUi();
    expect(screen.queryByText(/Detailed fleet construction isn't available yet/)).toBeNull();

    click("Build the Legacy Fleet Manually");
    expect(screen.getByText(/Detailed fleet construction isn't available yet/)).toBeTruthy();

    click("Curated Historical-Inspired Fleet");
    expect(screen.queryByText(/Detailed fleet construction isn't available yet/)).toBeNull();
  });

  it("shows no numeric allocation figures, ship counts, or phase breakdowns", () => {
    setupUi();
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/Phase\s*1/i);
    expect(text).not.toMatch(/Phase\s*2/i);
    expect(text).not.toMatch(/\d+\s*ships?/i);
  });

  it("allows selecting any of the three cards, with no gating", () => {
    setupUi();
    click("Build the Legacy Fleet Manually");
    expect(
      screen
        .getByRole("button", { name: /Build the Legacy Fleet Manually/ })
        .getAttribute("aria-pressed"),
    ).toBe("true");

    click("Curated Historical-Inspired Fleet");
    expect(
      screen
        .getByRole("button", { name: /Curated Historical-Inspired Fleet/ })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen
        .getByRole("button", { name: /Build the Legacy Fleet Manually/ })
        .getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("the primary action is never blocked, since a selection always exists", () => {
    const { onPrimaryActionChange } = setupUi();
    expect(lastPrimary(onPrimaryActionChange).disabled).toBe(false);
    click("Build the Legacy Fleet Manually");
    expect(lastPrimary(onPrimaryActionChange).disabled).toBe(false);
  });

  it("emits the selected legacyFleetModeId on continue", () => {
    const { onPrimaryActionChange, onNext } = setupUi();
    click("Curated Historical-Inspired Fleet");
    lastPrimary(onPrimaryActionChange).onTrigger?.();
    expect(onNext).toHaveBeenCalledWith({ legacyFleetModeId: "historical" });
  });

  it("starts from the provided initial fleet method", () => {
    setupUi({ legacyFleetModeId: "disabled" });
    expect(
      screen
        .getByRole("button", { name: /Build the Legacy Fleet Manually/ })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("calls onBack when Back to Identity is clicked", () => {
    const { onBack } = setupUi();
    fireEvent.click(screen.getByRole("button", { name: "Back to Identity" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
