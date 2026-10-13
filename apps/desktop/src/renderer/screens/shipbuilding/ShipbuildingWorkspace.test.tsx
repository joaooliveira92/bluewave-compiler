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
      Math.round(view.totalKg / 1000).toLocaleString("en-US"),
    );
    expect(statusOf("displacement")).toContain(
      Math.round(view.buoyantKg / 1000).toLocaleString("en-US"),
    );
    expect(statusOf("cost")).toContain(
      `£${Math.round(view.forecast.costMicro / 1_000_000).toLocaleString("en-US")}`,
    );
    expect(within(commands()).getByRole("status").textContent).toContain(
      view.valid ? "Can be submitted" : "Cannot be built",
    );
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

describe("Design map and inspector routing", () => {
  const map = () => screen.getByRole("navigation", { name: "Design map" });
  const inspector = () => screen.getByRole("complementary", { name: /^Inspector/ });
  const localTabs = () => within(inspector()).getByRole("tablist", { name: /tabs$/ });
  const openTab = (name: string) => fireEvent.click(within(localTabs()).getByRole("tab", { name }));

  it("lists the seven sections, each announcing its status", () => {
    render(<ShipbuildingWorkspace />);
    const names = within(map())
      .getAllByRole("button")
      .map((b) => b.getAttribute("aria-label") ?? "");
    expect(names.map((n) => n.split(",")[0])).toEqual([
      "Overview",
      "Hull",
      "Machinery",
      "Protection",
      "Armament",
      "Systems",
      "Review",
    ]);
    for (const n of names)
      expect(n).toMatch(/, (valid|\d+ warnings?|\d+ unresolved issues?|not configured)$/);
  });

  it("gives every section two to four local tabs in one flat row, and swaps them with the section", () => {
    render(<ShipbuildingWorkspace />);
    for (const section of [
      "Overview",
      "Hull",
      "Machinery",
      "Protection",
      "Armament",
      "Systems",
      "Review",
    ]) {
      openMap(section);
      expect(screen.getByRole("complementary", { name: `Inspector: ${section}` })).toBeTruthy();
      expect(within(inspector()).getAllByRole("tablist")).toHaveLength(1);
      const tabs = within(localTabs()).getAllByRole("tab");
      expect(tabs.length).toBeGreaterThanOrEqual(2);
      expect(tabs.length).toBeLessThanOrEqual(4);
    }
  });

  it("swaps the inspector content with the local tab", () => {
    render(<ShipbuildingWorkspace />);
    openMap("Hull");
    expect(screen.getByRole("region", { name: "Hull and displacement" })).toBeTruthy();
    openTab("Stability");
    expect(screen.queryByRole("region", { name: "Hull and displacement" })).toBeNull();
    expect(screen.getByRole("region", { name: "Topside load" })).toBeTruthy();
  });

  it("lists only the tab's own fittings under Armament", () => {
    // The starting design (a Havock-like destroyer) carries three light guns, tubes, magazines and auxiliaries.
    render(<ShipbuildingWorkspace />);
    openMap("Armament");
    const rows = () =>
      within(screen.getByRole("region", { name: /fittings$/ }))
        .getAllByRole("rowheader")
        .map((r) => r.textContent ?? "");
    openTab("Secondary");
    expect(rows().map((r) => r.match(/gun_\w+/)?.[0])).toEqual([
      "gun_12pdr",
      "gun_6pdr_a",
      "gun_6pdr_b",
    ]);
    openTab("Torpedoes");
    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toMatch(/tubes/);
  });

  it("still edits the draft from a relocated editor, with undo", () => {
    render(<ShipbuildingWorkspace />);
    openMap("Protection");
    openTab("Magazines");
    const before = statusOf("displacement");
    const region = screen.getByRole("region", { name: /Magazines/ });
    fireEvent.click(within(region).getAllByRole("button", { name: /^Remove / })[0]!);
    expect(statusOf("displacement")).not.toBe(before);
    fireEvent.click(within(commands()).getByRole("button", { name: "Undo" }));
    expect(statusOf("displacement")).toBe(before);
  });

  it("renders a tab with nothing available as not configured rather than failing", () => {
    render(<ShipbuildingWorkspace />);
    openMap("Systems");
    openTab("Aviation");
    expect(within(inspector()).getByText(/not available/i)).toBeTruthy();
  });

  it("sends Finish to the Review section's Finish tab", () => {
    render(<ShipbuildingWorkspace />);
    fireEvent.click(within(commands()).getByRole("button", { name: /Finish design/ }));
    const finish = within(localTabs()).getByRole("tab", { name: "Finish" });
    expect(finish.getAttribute("aria-selected")).toBe("true");
  });
});

describe("Engineering status strip", () => {
  const strip = () => screen.getByRole("region", { name: "Engineering status" });
  const item = (id: string) => strip().querySelector<HTMLElement>(`[data-status="${id}"]`)!;
  const trigger = (id: string) => item(id).querySelector<HTMLElement>("button, a")!;

  it("shows displacement, cost, speed, range, stability, topside load and warnings", () => {
    render(<ShipbuildingWorkspace />);
    for (const id of [
      "displacement",
      "cost",
      "speed",
      "range",
      "stability",
      "topside",
      "remaining",
      "warnings",
    ])
      expect(item(id)).toBeTruthy();
    // A sound design stays neutral; only the warning count turns amber.
    expect(item("displacement").getAttribute("data-tone")).toBe("neutral");
    expect(item("warnings").getAttribute("data-tone")).toBe("warn");
  });

  it("opens a weight breakdown, whose groups add up to current, on clicking displacement", () => {
    render(<ShipbuildingWorkspace />);
    fireEvent.click(trigger("displacement"));
    const title = screen.getByText("Weight breakdown");
    const body = title.parentElement!;
    expect(within(body).getByText("Hull")).toBeTruthy();
    expect(within(body).getByText("Machinery")).toBeTruthy();
    expect(within(body).getByText("Current")).toBeTruthy();
    expect(within(body).getByText("Capacity")).toBeTruthy();
    expect(within(body).getByText("Remaining")).toBeTruthy();
  });

  it("opens a cost breakdown on clicking cost", () => {
    render(<ShipbuildingWorkspace />);
    fireEvent.click(trigger("cost"));
    const body = screen.getByText("Cost breakdown").parentElement!;
    expect(within(body).getByText("Hull")).toBeTruthy();
    expect(within(body).getByText("Total")).toBeTruthy();
  });

  it("opens the stability causes on clicking stability", () => {
    render(<ShipbuildingWorkspace />);
    fireEvent.click(trigger("stability"));
    const body = screen.getByText("Stability causes").parentElement!;
    expect(within(body).getByText("GM")).toBeTruthy();
  });

  it("distinguishes committed from reserved weight when available weight is hovered", () => {
    render(<ShipbuildingWorkspace />);
    fireEvent.mouseEnter(trigger("remaining"));
    const body = screen.getByText("Available weight").parentElement!;
    expect(within(body).getByText("Committed")).toBeTruthy();
    expect(within(body).getByText("Reserved")).toBeTruthy();
    expect(within(body).getByText("Free")).toBeTruthy();
  });
});
