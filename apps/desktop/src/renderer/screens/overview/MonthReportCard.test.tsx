import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import type { MonthSummary } from "../../lib/month-summary.js";
import { MonthReportCard } from "./MonthReportCard.js";

const summary = (month: number, over: Partial<MonthSummary> = {}): MonthSummary => ({
  month: { year: 1880, month },
  openingTreasury: 1000,
  closingTreasury: 944,
  netChange: -56,
  maintenanceCost: 16,
  constructionSpending: 60,
  battles: [],
  technologiesDiscovered: 0,
  constructionUpdates: 0,
  researchUpdates: 0,
  ...over,
});

describe("MonthReportCard", () => {
  beforeAll(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });
  afterEach(cleanup);

  it("says plainly that there is no report before the first month is advanced", () => {
    render(<MonthReportCard history={[]} />);
    expect(screen.getByText("No months have been advanced yet this session.")).toBeTruthy();
    expect(screen.getByText(/appears here after you advance the month/)).toBeTruthy();
  });

  it("reports the latest month's treasury movement, with the loss marked as a loss", () => {
    render(<MonthReportCard history={[summary(2)]} />);
    expect(screen.getByText("Report for February 1880.")).toBeTruthy();
    const card = screen.getByTestId("month-report-card");
    expect(card.textContent).toContain("Treasury 1,000 → 944");
    expect(card.textContent).toContain("(−56)");
    expect(card.textContent).toContain("Fleet maintenance 16");
    expect(card.textContent).toContain("New construction 60");
  });

  it("omits the progress line for a quiet month and shows it when there is progress", () => {
    const { rerender } = render(<MonthReportCard history={[summary(2)]} />);
    expect(screen.queryByText(/construction update/)).toBeNull();
    rerender(
      <MonthReportCard
        history={[summary(2, { constructionUpdates: 2, technologiesDiscovered: 1 })]}
      />,
    );
    expect(screen.getByText("2 construction updates · 1 technology discovered")).toBeTruthy();
  });

  it("describes each battle in words with the area's name", () => {
    render(
      <MonthReportCard
        history={[
          summary(2, {
            battles: [
              {
                battleId: "b1",
                areaId: "med_malta",
                attackerId: "uk",
                defenderId: "france",
                winnerId: "uk",
                attackerLosses: 1,
                defenderLosses: 2,
              },
            ],
          }),
        ]}
        areaName={(id) => (id === "med_malta" ? "Malta" : id)}
      />,
    );
    const list = screen.getByRole("list", { name: "Battles this month" });
    expect(within(list).getByText(/Britain defeated France in Malta/)).toBeTruthy();
    // No raw ids leak into the sentence.
    expect(list.textContent).not.toMatch(/med_malta|b1/);
  });

  it("falls back to a readable area name when none is known", () => {
    render(
      <MonthReportCard
        history={[
          summary(2, {
            battles: [
              {
                battleId: "b1",
                areaId: "med_malta",
                attackerId: "uk",
                defenderId: "france",
                winnerId: null,
                attackerLosses: 0,
                defenderLosses: 0,
              },
            ],
          }),
        ]}
      />,
    );
    expect(screen.getByText(/fought to a draw in Med malta/)).toBeTruthy();
  });

  it("keeps earlier months behind a disclosure and says the history is session-only", () => {
    render(
      <MonthReportCard
        history={[summary(3), summary(2, { closingTreasury: 1010, netChange: 10 })]}
      />,
    );
    expect(screen.getByText("Report for March 1880.")).toBeTruthy();
    const details = screen.getByText(/Earlier months this session \(1\)/).closest("details");
    expect(details).not.toBeNull();
    expect(details?.textContent).toContain("February 1880");
    expect(details?.textContent).toContain("(+10)");
    expect(details?.textContent).toContain("History is kept while the app is open.");
  });
});
