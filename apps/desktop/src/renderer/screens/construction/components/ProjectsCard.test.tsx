import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { axeViolations } from "../../../lib/axe.js";
import type { ProjectRow } from "../project-progress.js";
import { ProjectsCard } from "./ProjectsCard.js";

afterEach(cleanup);

const row = (over: Partial<ProjectRow> = {}): ProjectRow => ({
  projectId: "project-1",
  className: "Havock class",
  status: "ACTIVE",
  percent: 45,
  yard: "yard small",
  holdUntilMonth: null,
  packages: [
    { id: "hull", label: "Hull", percent: 50, state: "active" },
    { id: "machinery", label: "Machinery", percent: 100, state: "done" },
    { id: "launch", label: "Launch", percent: 0, state: "waiting" },
    { id: "fit_out", label: "Fit-out", percent: 0, state: "ready" },
  ],
  ...over,
});

describe("ProjectsCard", () => {
  it("shows the ship, its yard and overall progress, with each package's state", () => {
    render(<ProjectsCard rows={[row()]} />);
    const list = screen.getByRole("list", { name: "Ships under construction" });
    expect(within(list).getByText("Havock class")).toBeTruthy();
    expect(within(list).getByText("yard small")).toBeTruthy();
    expect(within(list).getByText("45%")).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Havock class progress" })).toBeTruthy();
    const packages = screen.getByRole("list", { name: "Havock class work packages" });
    expect(within(packages).getByText("In progress · 50%")).toBeTruthy();
    expect(within(packages).getByText("Done")).toBeTruthy();
    expect(within(packages).getByText("Waiting")).toBeTruthy();
    expect(within(packages).getByText("Ready to start")).toBeTruthy();
  });

  it("explains work packages only when some ship has them", () => {
    const { unmount } = render(<ProjectsCard rows={[row()]} />);
    expect(screen.getByText(/built in work packages/)).toBeTruthy();
    unmount();
    render(<ProjectsCard rows={[row({ packages: [], yard: null })]} />);
    expect(screen.queryByText(/built in work packages/)).toBeNull();
    expect(screen.getByText("How far each ship is along.")).toBeTruthy();
  });

  it("shows only overall progress for a project with one figure, and says when it is on hold", () => {
    render(<ProjectsCard rows={[row({ packages: [], yard: null, holdUntilMonth: "1880-05" })]} />);
    expect(screen.queryByRole("list", { name: "Havock class work packages" })).toBeNull();
    expect(screen.getByText("on hold until 1880-05")).toBeTruthy();
  });

  it("says so when nothing is under construction", () => {
    render(<ProjectsCard rows={[]} />);
    expect(screen.getByText("No ships under construction")).toBeTruthy();
    expect(screen.queryByRole("list", { name: "Ships under construction" })).toBeNull();
  });

  it("has no accessibility violations in any of those states", async () => {
    for (const rows of [[row()], [row({ packages: [], yard: null })], []]) {
      const { container } = render(<ProjectsCard rows={rows} />);
      expect(await axeViolations(container)).toEqual([]);
      cleanup();
    }
  });
});
