import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { loadDrawingBoardContent } from "./content.js";
import { DrawingBoard } from "./DrawingBoard.js";
import { PLAN_H, PLAN_MID, PLAN_W, stationX } from "./panels/hull-plan/geometry.js";
import { openTab, region } from "./test-helpers.js";

afterEach(cleanup);

const commit = (label: string | RegExp, value: string) => {
  const input = screen.getByLabelText(label) as HTMLInputElement;
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
};
/** The ship-building parity panels (SB-2): brief, yards, armour, batteries, plan tools, plan and profile drawings. */
describe("DrawingBoard panels", () => {
  it("edits armour regions: size, plate, slope, and adds a new region from the hull", () => {
    render(<DrawingBoard />);
    fireEvent.change(screen.getByLabelText("Starting design"), {
      target: { value: "majestic_like" },
    });
    const protection = () => region("Protection");
    expect(within(protection()).getByText("Coverage")).toBeTruthy();
    const regionsBefore = within(protection()).getAllByRole("listitem").length;
    commit(/Length of BELT_MAIN/, "10");
    openTab("History");
    expect(
      within(region("Edit history")).getByText(/Armour: set belt main \(.* 10\.0 m ×/),
    ).toBeTruthy();
    // Inclined plate: the checkbox sets cos(30 degrees).
    fireEvent.click(within(protection()).getAllByRole("checkbox")[0]!);
    openTab("History");
    expect(within(region("Edit history")).getByText(/Armour: set .*, inclined\)/)).toBeTruthy();
    // Add a region that is not yet fitted: the list grows by one.
    fireEvent.click(within(protection()).getByRole("button", { name: "Add region" }));
    expect(within(protection()).getAllByRole("listitem").length).toBe(regionsBefore + 1);
  });

  it("offers the armour materials weakest first, disabling those not yet makeable", () => {
    render(<DrawingBoard />);
    fireEvent.change(screen.getByLabelText("Starting design"), {
      target: { value: "majestic_like" },
    });
    const select = within(region("Protection")).getAllByLabelText(/Material of /)[0]!;
    const options = [...select.querySelectorAll("option")].map((o) => o.value);
    expect(options.length).toBeGreaterThan(1);
    expect(options.indexOf("wrought_iron")).toBeLessThan(options.indexOf("harvey"));
    expect(options).toContain((select as HTMLSelectElement).value);
    // The 1896 battleship cannot make Krupp plate yet (technology year 1900): offered, disabled, with the reason.
    const krupp = [...select.querySelectorAll("option")].find((o) => o.value === "krupp") as
      | HTMLOptionElement
      | undefined;
    expect(krupp?.disabled).toBe(true);
    expect(krupp?.textContent).toMatch(/needs hc_krupp_cemented_armor/);
    const current = [...select.querySelectorAll("option")].find(
      (o) => o.value === (select as HTMLSelectElement).value,
    ) as HTMLOptionElement;
    expect(current.disabled).toBe(false);
  });

  it("groups guns into named batteries, sets the mount side, and clears a battery as one undoable step", async () => {
    render(<DrawingBoard />);
    fireEvent.change(screen.getByLabelText("Starting design"), {
      target: { value: "majestic_like" },
    });
    const batteries = () => region("Batteries");
    const main = within(batteries()).getAllByRole("listitem")[0]!;
    expect(main.textContent).toMatch(/Main battery, \d+\.\d-inch/);
    expect(within(batteries()).getAllByText(/^A · /).length).toBeGreaterThan(0);
    // Set a mount to port: its badge changes and the history says so.
    const side = screen.getAllByLabelText(/^Side of /)[0] as HTMLSelectElement;
    fireEvent.change(side, { target: { value: "PORT" } });
    openTab("History");
    expect(within(region("Edit history")).getByText(/ to port$/)).toBeTruthy();
    // Clear the first battery: one confirmation, one history entry, one undo restores everything.
    openTab("Arrangement");
    const before = screen.getAllByRole("button", { name: /^Remove / }).length;
    fireEvent.click(
      within(batteries()).getAllByRole("button", { name: /^Clear Main battery/ })[0]!,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Clear battery" }));
    expect(screen.getAllByRole("button", { name: /^Remove / }).length).toBeLessThan(before);
    fireEvent.click(screen.getByRole("button", { name: /undo/i }));
    expect(screen.getAllByRole("button", { name: /^Remove / }).length).toBe(before);
  });

  describe("plan tools", () => {
    const content = loadDrawingBoardContent();
    // The destroyer's hull puts station 300 in the central machinery zone.
    const placeable = content.components.find(
      (c) =>
        c.introduction.fromMonth <= "1895-06" &&
        (c.allowedZones === undefined || c.allowedZones.includes("CENTRAL_MACHINERY")),
    )!;
    const sized = (svg: Element) => {
      svg.getBoundingClientRect = () =>
        ({
          left: 0,
          top: 0,
          width: PLAN_W,
          height: PLAN_H,
          right: PLAN_W,
          bottom: PLAN_H,
        }) as DOMRect;
    };

    it("places a fitting by clicking the plan, with the zone and station from the point", () => {
      render(<DrawingBoard />);
      const panel = region("Hull plan");
      sized(within(panel).getByRole("img", { name: /^Top-down plan/ }));
      fireEvent.click(within(panel).getByRole("button", { name: "Place on plan" }));
      // Choosing nothing first says what to do instead of failing silently.
      fireEvent.click(screen.getByTestId("plan-click-layer"), {
        clientX: stationX(300),
        clientY: PLAN_MID,
      });
      expect(within(panel).getByRole("status").textContent).toMatch(/Choose a component/);
      fireEvent.change(within(panel).getByLabelText("Component to place"), {
        target: { value: placeable.id },
      });
      fireEvent.click(screen.getByTestId("plan-click-layer"), {
        clientX: stationX(300),
        clientY: PLAN_MID,
      });
      expect(within(panel).getByRole("status").textContent).toMatch(/Placed .* at 300‰/);
      openTab("History");
      expect(within(region("Edit history")).getByText(/Add .* to central machinery/)).toBeTruthy();
    });

    it("moves a fitting with keyboard-reachable buttons, one undoable edit each", () => {
      render(<DrawingBoard />);
      const panel = region("Hull plan");
      fireEvent.click(within(panel).getByRole("button", { name: "Move on plan" }));
      const select = within(panel).getByLabelText("Fitting to move") as HTMLSelectElement;
      fireEvent.change(select, { target: { value: select.options[1]!.value } });
      expect(screen.getByTestId("plan-selected-ring")).toBeTruthy();
      fireEvent.click(
        within(panel).getByRole("button", { name: /Move 10 permille toward the stern/ }),
      );
      expect(within(panel).getByRole("status").textContent).toMatch(/10‰ toward the stern/);
      openTab("History");
      expect(within(region("Edit history")).getByText(/Move .* at \d+‰/)).toBeTruthy();
    });

    it("says what is missing instead of failing silently, and adds nothing", () => {
      render(<DrawingBoard />);
      const panel = region("Hull plan");
      sized(within(panel).getByRole("img", { name: /^Top-down plan/ }));
      fireEvent.click(within(panel).getByRole("button", { name: "Move on plan" }));
      fireEvent.click(screen.getByTestId("plan-click-layer"), {
        clientX: stationX(300),
        clientY: PLAN_MID,
      });
      expect(within(panel).getByRole("status").textContent).toMatch(
        /Choose a fitting to move first/,
      );
      openTab("History");
      expect(within(region("Edit history")).queryByText(/Move |Add /)).toBeNull();
    });

    it("is off by default: no click layer until a tool is chosen", () => {
      render(<DrawingBoard />);
      region("Hull plan");
      expect(screen.queryByTestId("plan-click-layer")).toBeNull();
    });
  });

  it("shows the class code and lets the player declare the ship type, speed and range", () => {
    render(<DrawingBoard />);
    const brief = region("Design brief");
    expect(within(brief).getByLabelText(/^Class code DD/)).toBeTruthy();
    commit(/Required range/, "4321");
    expect((screen.getByLabelText(/Required range/) as HTMLInputElement).value).toBe("4321");
    fireEvent.change(screen.getByLabelText("Ship type"), { target: { value: "CL" } });
    expect((screen.getByLabelText("Ship type") as HTMLSelectElement).value).toBe("CL");
    // Declaring a type the destroyer does not qualify for is blocked by DESIGN-22, and the history says why.
    openTab("History");
    expect(within(region("Edit history")).getByText(/Brief: category → CL/)).toBeTruthy();
  });

  it("lists the shipyards in the forecast with exactly one forecast yard", () => {
    render(<DrawingBoard />);
    openTab("Analysis");
    const forecast = region("Cost and construction forecast");
    const yards = within(forecast).getByRole("list", { name: "Shipyards" });
    const rows = within(yards).getAllByRole("listitem");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.filter((r) => /Forecast yard/.test(r.textContent ?? ""))).toHaveLength(1);
  });

  it("draws a distinct, described plan and profile that agree on the funnels", () => {
    render(<DrawingBoard />);
    const panel = region("Hull plan");
    const plan = within(panel).getByRole("img", { name: /^Top-down plan/ });
    const profile = within(panel).getByRole("img", { name: /^Side profile/ });
    expect(plan).not.toBe(profile);
    for (const view of [plan, profile]) {
      expect(view.getAttribute("aria-label")).toMatch(/schematic/);
      expect(view.getAttribute("aria-label")).toMatch(/ram bow|spoon bow|plumb bow/);
    }
    const planFunnels = plan.querySelectorAll('[data-testid="hull-funnel"]').length;
    const profileFunnels = profile.querySelectorAll('[data-testid="profile-funnel"]').length;
    expect(profileFunnels).toBe(planFunnels);
    const stated = /(\d+) funnels?|no funnels/.exec(plan.getAttribute("aria-label") ?? "");
    expect(stated).not.toBeNull();
    expect(stated![1] === undefined ? 0 : Number(stated![1])).toBe(planFunnels);
    expect(profile.querySelector('[data-testid="profile-hull"]')).not.toBeNull();
  });

  it("explains the drawing through keyboard-reachable legend chips that open a popover", async () => {
    render(<DrawingBoard />);
    const panel = region("Hull plan");
    const legend = within(panel).getByRole("group", { name: "Drawing legend" });
    const bow = within(legend).getByRole("button", { name: /^(Ram|Spoon|Plumb) bow \(Bow:/ });
    expect(bow.tagName).toBe("BUTTON");
    fireEvent.click(bow);
    const dialog = await screen.findByText(/drawing choice per hull form/i);
    expect(dialog).toBeTruthy();
    expect(screen.getByText("Drawing convention")).toBeTruthy();
  });
});
