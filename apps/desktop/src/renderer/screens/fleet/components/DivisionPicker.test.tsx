/* @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { DivisionPicker } from "./DivisionPicker.js";

afterEach(cleanup);

const division = {
  divisionId: "fleet_gbr_home",
  fleetName: "Home Fleet",
  areaId: "eng_home_coast",
  ships: [{ name: "HMS Alexandra" }],
} as never;

describe("DivisionPicker", () => {
  it("titles each card with the fleet's name, never the internal id", () => {
    render(
      <DivisionPicker
        divisions={[division]}
        selectedDivisionId={null}
        onSelectDivision={vi.fn()}
        areaName={() => "English Home Waters"}
      />,
    );
    expect(screen.getByText("Home Fleet")).not.toBeNull();
    expect(screen.getByText("English Home Waters")).not.toBeNull();
    expect(screen.queryByText(/fleet_gbr_home/)).toBeNull();
    expect(screen.getByText("HMS Alexandra")).not.toBeNull();
  });
});
