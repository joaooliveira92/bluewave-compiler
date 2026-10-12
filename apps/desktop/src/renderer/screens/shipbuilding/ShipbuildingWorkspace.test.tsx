import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { buildWorkshopView } from "@bluewave/ship-design";
import { loadDrawingBoardContent } from "../../components/design-workspace/index.js";
import { ShipbuildingWorkspace } from "./ShipbuildingWorkspace.js";

afterEach(cleanup);

const commands = () => screen.getByRole("group", { name: "Design commands" });
const statusBar = () => screen.getByRole("region", { name: "Engineering status" });
const statusOf = (id: string) =>
  statusBar().querySelector<HTMLElement>(`[data-status="${id}"]`)?.textContent ?? "";
const commit = (label: string | RegExp, value: string) => {
  const input = screen.getByLabelText(label) as HTMLInputElement;
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
};
const openMap = (name: string) =>
  fireEvent.click(
    within(screen.getByRole("navigation", { name: "Design map" })).getByRole("button", {
      name: new RegExp(name),
    }),
  );

describe("Shipbuilding workspace shell", () => {
  it("lays out a command bar, design map, ship view, inspector and engineering strip", () => {
    render(<ShipbuildingWorkspace />);
    expect(commands()).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Design map" })).toBeTruthy();
    const ship = screen.getByRole("region", { name: "Ship view" });
    expect(within(ship).getByRole("img", { name: /Top-down plan/ })).toBeTruthy();
    expect(screen.getByRole("complementary", { name: /^Inspector/ })).toBeTruthy();
    expect(statusBar()).toBeTruthy();
  });

  it("keeps ordinary ship parameters out of the command bar", () => {
    render(<ShipbuildingWorkspace />);
    // Design-level commands only: class name, ship type and the technology year are the bar's only inputs.
    const inputs = within(commands()).queryAllByRole("textbox");
    expect(inputs.map((i) => i.getAttribute("aria-label"))).toEqual(["Class name"]);
    expect(within(commands()).queryAllByRole("spinbutton")).toEqual([]);
    for (const name of [
      "Undo",
      "Redo",
      "Compare",
      "More design actions",
      "Validate",
      "Finish design",
    ])
      expect(within(commands()).getByRole("button", { name: new RegExp(name) })).toBeTruthy();
  });

  it("shows the compiled validity, displacement and cost", () => {
    render(<ShipbuildingWorkspace />);
    const content = loadDrawingBoardContent();
    const ref = content.references[0]!;
    const view = buildWorkshopView(
      ref.draft,
      content.environmentFor(ref.month, ref.draft.nationId),
    );
    expect(statusOf("displacement")).toContain(
      `${Math.round(view.totalKg / 1000).toLocaleString("en-US")} t`,
    );
    expect(statusOf("cost")).toContain(
      `£${Math.round(view.forecast.costMicro / 1_000_000).toLocaleString("en-US")}`,
    );
    expect(statusOf("validity")).toContain(view.valid ? "Valid" : "blocking");
  });

  it("edits the hull from the inspector, updates the strip, and undoes the edit", () => {
    render(<ShipbuildingWorkspace />);
    openMap("Hull");
    const before = statusOf("displacement");
    commit(/^Length \(waterline\)/, "120");
    expect(statusOf("displacement")).not.toBe(before);
    fireEvent.click(within(commands()).getByRole("button", { name: "Undo" }));
    expect(statusOf("displacement")).toBe(before);
    fireEvent.click(within(commands()).getByRole("button", { name: "Redo" }));
    expect(statusOf("displacement")).not.toBe(before);
  });

  it("edits the machinery and undoes it with the keyboard shortcut", () => {
    render(<ShipbuildingWorkspace />);
    openMap("Machinery");
    const power = screen.getByLabelText(/^Installed power/) as HTMLInputElement;
    const original = power.value;
    commit(/^Installed power/, "1000");
    expect((screen.getByLabelText(/^Installed power/) as HTMLInputElement).value).not.toBe(
      original,
    );
    fireEvent.keyDown(screen.getByTestId("shipbuilding-workspace"), { key: "z", ctrlKey: true });
    expect((screen.getByLabelText(/^Installed power/) as HTMLInputElement).value).toBe(original);
  });

  it("sends Validate and Finish to the Review section", () => {
    render(<ShipbuildingWorkspace />);
    fireEvent.click(within(commands()).getByRole("button", { name: /Validate/ }));
    expect(screen.getByRole("complementary", { name: "Inspector: Review" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Validation" })).toBeTruthy();
  });

  it("disables Save draft outside a campaign, where there is nowhere to save", () => {
    render(<ShipbuildingWorkspace />);
    const save = within(commands()).getByRole("button", {
      name: /Save draft/,
    }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
  });
});
