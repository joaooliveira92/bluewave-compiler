import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";
import type { ProjectRow } from "../project-progress.js";
import { ProjectReadout } from "./ProjectReadout.js";

afterEach(cleanup);

const row = (over: Partial<ProjectRow> = {}): ProjectRow => ({
  projectId: "project-1",
  className: "Havock class",
  status: "ACTIVE",
  percent: 45,
  yard: null,
  packages: [],
  holdUntilMonth: null,
  isForeign: false,
  readout: {
    totalCostUnits: 640,
    monthlyInstalmentUnits: 120,
    remainingMonths: 6,
    launchMonth: "1880-07",
    haltedCarryingCostUnits: null,
  },
  ...over,
});

describe("ProjectReadout", () => {
  it("renders the compiled instalment, months left, total cost and launch month", () => {
    render(<ProjectReadout row={row()} />);
    expect(screen.getByText("Instalment")).toBeTruthy();
    expect(screen.getByText("120/mo")).toBeTruthy();
    expect(screen.getByText("Months left")).toBeTruthy();
    expect(screen.getByText("6")).toBeTruthy();
    expect(screen.getByText("Total cost")).toBeTruthy();
    expect(screen.getByText("640")).toBeTruthy();
    expect(screen.getByText("Launch")).toBeTruthy();
    expect(screen.getByText("1880-07")).toBeTruthy();
    // A non-halted project has no carrying cost.
    expect(screen.queryByText("Carrying cost")).toBeNull();
  });

  it("shows the half-mothball carrying cost only on a halted row", () => {
    render(
      <ProjectReadout
        row={row({
          status: "HALTED",
          readout: {
            totalCostUnits: 640,
            monthlyInstalmentUnits: 120,
            remainingMonths: 6,
            launchMonth: "1880-07",
            haltedCarryingCostUnits: 3,
          },
        })}
      />,
    );
    expect(screen.getByText("Carrying cost")).toBeTruthy();
    expect(screen.getByText("3/mo")).toBeTruthy();
  });

  it('labels the readout by role and name, and says "complete" when there is no launch month', () => {
    render(
      <ProjectReadout
        row={row({
          readout: {
            totalCostUnits: 100,
            monthlyInstalmentUnits: 0,
            remainingMonths: 0,
            launchMonth: null,
            haltedCarryingCostUnits: null,
          },
        })}
      />,
    );
    const readout = screen.getByRole("list", { name: "Havock class cost and schedule" });
    expect(readout).toBeTruthy();
    expect(screen.getByText("complete")).toBeTruthy();
  });

  it("says the schedule is unavailable instead of fabricating a zero or a completion (no readout)", () => {
    render(<ProjectReadout row={row({ readout: null })} />);
    expect(screen.getByText("unavailable")).toBeTruthy();
    expect(screen.queryByText("Instalment")).toBeNull();
    expect(screen.queryByText("complete")).toBeNull();
  });
});
