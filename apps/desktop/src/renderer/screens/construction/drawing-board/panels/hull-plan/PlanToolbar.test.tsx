import { useState } from "react";
import type { ComponentDef, DesignDraft, MountSide } from "@bluewave/ship-design";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { PlanModeButtons, PlanToolOptions } from "./PlanToolbar.js";
import { IDLE_TOOL, type PlanTool } from "./plan-tool.js";

const gun = { id: "gun_a", displayName: "Gun A", category: "MAIN_GUN" } as ComponentDef;
const pump = { id: "pump", displayName: "Pump", category: "AUXILIARY" } as unknown as ComponentDef;
const draft = {
  placements: [
    {
      instanceId: "gun_1",
      componentId: "gun_a",
      zoneId: "FORECASTLE",
      stationPermille: 200,
      side: "CENTRE",
    },
  ],
} as unknown as DesignDraft;
const defOf = (id: string) => (id === "gun_a" ? gun : id === "pump" ? pump : undefined);

const ModeButtons = ({ onChange }: { readonly onChange: (t: PlanTool) => void }) => {
  const [tool, setTool] = useState<PlanTool>(IDLE_TOOL);
  return (
    <PlanModeButtons
      tool={tool}
      onTool={(next) => {
        setTool(next);
        onChange(next);
      }}
    />
  );
};

describe("PlanModeButtons", () => {
  it("turns a mode on, switches between modes, and off when the active one is pressed again", () => {
    const onChange = vi.fn<(t: PlanTool) => void>();
    render(<ModeButtons onChange={onChange} />);
    const place = screen.getByRole("button", { name: "Place on plan" });
    const move = screen.getByRole("button", { name: "Move on plan" });
    expect(place.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(place);
    expect(place.getAttribute("aria-pressed")).toBe("true");
    expect(onChange).toHaveBeenLastCalledWith({ ...IDLE_TOOL, mode: "place" });
    fireEvent.click(move);
    expect(place.getAttribute("aria-pressed")).toBe("false");
    expect(move.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(move);
    expect(move.getAttribute("aria-pressed")).toBe("false");
    expect(onChange).toHaveBeenLastCalledWith({ ...IDLE_TOOL, mode: "off" });
  });
});

describe("PlanToolOptions", () => {
  const base = {
    onTool: vi.fn<(t: PlanTool) => void>(),
    draft,
    available: [gun, pump],
    defOf,
    onNudge: vi.fn<(d: number) => void>(),
    onSide: vi.fn<(s: MountSide) => void>(),
    onAutoPlace: vi.fn<() => void>(),
    notice: null,
  };

  it("explains the tool when idle, with no options and no notice", () => {
    render(<PlanToolOptions {...base} tool={IDLE_TOOL} />);
    const options = screen.getByRole("group", { name: "Plan tool options" });
    expect(within(options).queryByLabelText("Component to place")).toBeNull();
    expect(within(options).getByRole("status").textContent).toMatch(
      /Use Place on plan or Move on plan/,
    );
  });

  it("offers a component picker in place mode, with Auto-place disabled until one is chosen", () => {
    render(<PlanToolOptions {...base} tool={{ ...IDLE_TOOL, mode: "place" }} />);
    expect(screen.getByLabelText("Component to place")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Auto-place" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(screen.getByRole("status").textContent).toMatch(/Choose a component/);
  });

  it("enables Auto-place once a component is chosen and runs it", () => {
    const onAutoPlace = vi.fn<() => void>();
    render(
      <PlanToolOptions
        {...base}
        onAutoPlace={onAutoPlace}
        tool={{ ...IDLE_TOOL, mode: "place", componentId: "gun_a" }}
      />,
    );
    expect(screen.getByRole("status").textContent).toMatch(/Stations snap to 10‰/);
    fireEvent.click(screen.getByRole("button", { name: "Auto-place" }));
    expect(onAutoPlace).toHaveBeenCalledOnce();
  });

  it("offers the selected fitting nudge buttons and a side picker for mounts", () => {
    const onNudge = vi.fn<(d: number) => void>();
    render(
      <PlanToolOptions
        {...base}
        onNudge={onNudge}
        tool={{ ...IDLE_TOOL, mode: "move", instanceId: "gun_1" }}
      />,
    );
    expect(screen.getByLabelText("Fitting to move")).toBeTruthy();
    const bow = screen.getByRole("button", { name: /Move 10 permille toward the bow/ });
    fireEvent.click(bow);
    expect(onNudge).toHaveBeenCalledWith(-10);
    expect(screen.getByLabelText("Side of the selected fitting")).toBeTruthy();
  });

  it("shows the raised notice instead of the standing hint", () => {
    render(
      <PlanToolOptions
        {...base}
        notice="Placed Gun A at 300‰."
        tool={{ ...IDLE_TOOL, mode: "place" }}
      />,
    );
    expect(screen.getByRole("status").textContent).toBe("Placed Gun A at 300‰.");
  });
});
