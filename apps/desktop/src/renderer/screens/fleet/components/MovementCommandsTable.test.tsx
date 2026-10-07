import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import type { MovementCommand } from "@bluewave/campaign-engine";
import { MovementCommandsTable } from "./MovementCommandsTable.js";

const debugFlag = vi.hoisted(() => ({ on: false }));
vi.mock("../../../shell/debug-flag.js", () => ({
  get DEBUG_MODE() {
    return debugFlag.on;
  },
}));

const command: MovementCommand = {
  commandId: "cmd_movement_0042",
  divisionId: "fleet_gbr_home",
  fromAreaId: "area_a",
  toAreaId: "area_b",
  status: "submitted",
  submittedAtRevision: 9,
};

function renderTable() {
  render(
    <MovementCommandsTable
      commands={[command]}
      areaName={(id) => (id === "area_a" ? "English Home Waters" : "Malta")}
      divisionName={(id) => (id === "fleet_gbr_home" ? "Home Fleet" : id)}
    />,
  );
}

describe("MovementCommandsTable release/debug display (ADR-0058)", () => {
  afterEach(cleanup);

  it("shows readable names and no engine ids or revision in a release build", () => {
    debugFlag.on = false;
    renderTable();
    expect(screen.getByText("Home Fleet")).toBeTruthy();
    expect(screen.getByText("English Home Waters")).toBeTruthy();
    expect(screen.queryByText("cmd_movement_0042")).toBeNull();
    expect(screen.queryByText("fleet_gbr_home")).toBeNull();
    expect(screen.queryByText("Revision")).toBeNull();
    expect(screen.queryByText("9")).toBeNull();
  });

  it("adds the command id and revision columns in a debug build", () => {
    debugFlag.on = true;
    renderTable();
    expect(screen.getByText("cmd_movement_0042")).toBeTruthy();
    expect(screen.getByText("Revision")).toBeTruthy();
    expect(screen.getByText("9")).toBeTruthy();
    // The division is still shown by name, never by id.
    expect(screen.getByText("Home Fleet")).toBeTruthy();
    expect(screen.queryByText("fleet_gbr_home")).toBeNull();
  });
});
