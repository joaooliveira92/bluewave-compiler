import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { DrawingBoard } from "./DrawingBoard.js";

afterEach(cleanup);

const commit = (label: string | RegExp, value: string) => {
  const input = screen.getByLabelText(label) as HTMLInputElement;
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
};
const region = (name: string) => screen.getByRole("region", { name });
const metric = (label: string) =>
  within(region("Performance")).getByText(label).nextElementSibling!.textContent ?? "";

describe("DrawingBoard", () => {
  it("opens on the Havock-like destroyer as a valid design with the standard panels", () => {
    render(<DrawingBoard />);
    for (const name of [
      "Hull and displacement",
      "Machinery, fuel and range",
      "Components and arrangement",
      "Protection",
      "Validation",
      "Performance",
      "Weight summary",
      "Cost and construction forecast",
    ]) {
      expect(region(name)).toBeTruthy();
    }
    expect(within(region("Validation")).getByRole("status").textContent).toContain(
      "Design can be submitted",
    );
    expect(metric("Classification")).toBe("DD");
    expect(metric("Top speed")).toMatch(/kn \(need 25\.5\)/);
  });

  it("draws a top-down hull plan with one marker per placed fitting", () => {
    render(<DrawingBoard />);
    const plan = region("Hull plan");
    const img = within(plan).getByRole("img");
    expect(img.querySelectorAll("circle").length).toBeGreaterThan(0);
    expect(img.getAttribute("aria-label")).toMatch(/Top-down plan/);
  });

  it("draws gun arcs for armed designs and hides them with the toggle", () => {
    render(<DrawingBoard />);
    const arcs = () => region("Hull plan").querySelectorAll("[data-arc]").length;
    expect(arcs()).toBeGreaterThan(0);
    fireEvent.click(screen.getByLabelText("Show gun arcs"));
    expect(arcs()).toBe(0);
  });

  it("shows topside load as absolute deck area and a percentage, updated by edits", () => {
    render(<DrawingBoard />);
    const used = () =>
      within(region("Topside load")).getByRole("meter").getAttribute("aria-valuenow");
    expect(within(region("Topside load")).getByText(/m² deck area/)).toBeTruthy();
    const before = used();
    fireEvent.click(screen.getAllByRole("button", { name: /^Remove / })[0]!);
    expect(Number(used())).toBeLessThan(Number(before));
  });

  it("labels the development metric as such", () => {
    render(<DrawingBoard />);
    expect(
      within(region("Cost and construction forecast")).getByText(/DEV METRIC: not a combat result/),
    ).toBeTruthy();
  });

  it("editing installed power changes speed and the weight ledger; undo restores them", () => {
    render(<DrawingBoard />);
    const before = metric("Top speed");
    const undo = screen.getByRole("button", { name: /undo/i }) as HTMLButtonElement;
    expect(undo.disabled).toBe(true);
    commit(/installed power/i, "3400");
    expect(metric("Top speed")).not.toBe(before);
    expect(undo.disabled).toBe(false);
    fireEvent.click(undo);
    expect(metric("Top speed")).toBe(before);
    fireEvent.click(screen.getByRole("button", { name: /redo/i }));
    expect(metric("Top speed")).not.toBe(before);
  });

  it("an overweight edit shows blocking findings with cause, consequence and remedies", () => {
    render(<DrawingBoard />);
    commit(/coal bunkers/i, "400");
    const validation = region("Validation");
    expect(within(validation).getByRole("status").textContent).toContain("cannot be built");
    expect(within(validation).getAllByText("BLOCKING").length).toBeGreaterThan(0);
    const overweight = within(validation).getByText(/exceeds what this hull may carry/i);
    fireEvent.click(overweight);
    expect(within(validation).getAllByText(/Why:/).length).toBeGreaterThan(0);
    expect(within(validation).getAllByText(/Consequence:/).length).toBeGreaterThan(0);
    expect(within(validation).getAllByText(/Ways to fix it:/).length).toBeGreaterThan(0);
    expect(
      within(region("Cost and construction forecast")).getByText(/Resolve blocking findings/),
    ).toBeTruthy();
  });

  it("suggests fixes for an overweight ship, previews their effect, and applying one improves the design", () => {
    render(<DrawingBoard />);
    commit(/coal bunkers/i, "400");
    const validation = region("Validation");
    expect(within(validation).getByRole("status").textContent).toContain("cannot be built");
    fireEvent.click(within(validation).getByRole("button", { name: /suggest fixes/i }));
    const list = within(validation).getByRole("list", { name: /suggested fixes/i });
    expect(within(list).getAllByRole("listitem").length).toBeGreaterThan(0);
    expect(list.textContent).toMatch(/blocking \d+ → \d+/);
    fireEvent.click(within(list).getAllByRole("button", { name: /apply/i })[0]!);
    // the suggestion list belongs to the old design and disappears
    expect(within(validation).queryByRole("list", { name: /suggested fixes/i })).toBeNull();
    expect(within(validation).getByRole("status").textContent).toMatch(/\d+ blocking/);
  });

  it("the AI designer proposes valid alternatives that can be loaded as the working design", async () => {
    render(<DrawingBoard />);
    const panel = region("AI alternatives");
    fireEvent.click(within(panel).getByRole("button", { name: /generate alternatives/i }));
    const list = await waitFor(() => within(panel).getByRole("list", { name: /ai candidates/i }), {
      timeout: 20_000,
    });
    const items = within(list).getAllByRole("listitem");
    expect(items.length).toBeGreaterThan(0);
    expect(list.textContent).toContain("development metric");
    commit(/installed power/i, "3400");
    fireEvent.click(within(items[0]!).getByRole("button", { name: /load design/i }));
    expect(within(region("Validation")).getByRole("status").textContent).toContain(
      "Design can be submitted",
    );
    expect((screen.getByRole("button", { name: /undo/i }) as HTMLButtonElement).disabled).toBe(
      true,
    ); // history reset
  }, 40_000);

  it("adds and removes components", () => {
    render(<DrawingBoard />);
    const rows = () => within(region("Components and arrangement")).getAllByRole("row").length;
    const n = rows();
    fireEvent.change(screen.getByLabelText("Add component"), { target: { value: "gun_qf_6pdr" } });
    fireEvent.click(screen.getByRole("button", { name: /add to ship/i }));
    expect(rows()).toBe(n + 1);
    fireEvent.click(screen.getByRole("button", { name: "Remove gun_qf_6pdr_1" }));
    expect(rows()).toBe(n);
  });

  it("switching the starting design loads the battleship and resets history", () => {
    render(<DrawingBoard />);
    commit(/installed power/i, "3400");
    fireEvent.change(screen.getByLabelText("Starting design"), {
      target: { value: "majestic_like" },
    });
    expect(metric("Classification")).toBe("B");
    expect((screen.getByRole("button", { name: /undo/i }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("the forecast shows a build time that grows with displacement (historical table, ticket 20)", () => {
    const months = () => {
      const t = within(region("Cost and construction forecast")).getByText("Build time")
        .nextElementSibling!.textContent!;
      return Number(/^(\d+) months/.exec(t)![1]);
    };
    render(<DrawingBoard />);
    const destroyer = months();
    fireEvent.change(screen.getByLabelText("Starting design"), {
      target: { value: "majestic_like" },
    });
    expect(months()).toBeGreaterThan(destroyer);
    expect(months()).toBeGreaterThanOrEqual(30);
  });

  it("labels the build time provisional only while a bracketing point is not VERIFIED (ticket 22)", () => {
    const text = () =>
      within(region("Cost and construction forecast")).getByText("Build time").nextElementSibling!
        .textContent!;
    render(<DrawingBoard />);
    // the small default hull sits on the SECONDARY 390 t row
    expect(text()).toMatch(/historical build time.*provisional/);
    fireEvent.change(screen.getByLabelText("Starting design"), {
      target: { value: "majestic_like" },
    });
    // Majestic-size hull is bracketed by VERIFIED Cressy / Canopus points
    expect(text()).toContain("historical build time");
    expect(text()).not.toMatch(/provisional/i);
  });

  it("technology depends on the year: the same battleship is rejected before its guns exist", () => {
    render(<DrawingBoard />);
    fireEvent.change(screen.getByLabelText("Starting design"), {
      target: { value: "majestic_like" },
    });
    fireEvent.change(screen.getByLabelText("Technology as of"), { target: { value: "1890-01" } });
    expect(
      within(region("Validation")).getAllByText(/not available to this nation yet/i).length,
    ).toBeGreaterThan(0);
  });
});
