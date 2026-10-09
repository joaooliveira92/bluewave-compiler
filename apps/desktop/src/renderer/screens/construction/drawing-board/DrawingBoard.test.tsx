import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

  it("draws a top-down hull plan with one marker per placed fitting", () => {
    render(<DrawingBoard />);
    const plan = region("Hull plan");
    const img = within(plan).getByRole("img", { name: /Top-down plan/ });
    expect(within(plan).getByRole("img", { name: /Side profile/ })).toBeTruthy();
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

  it("compares against the starting design and lists only what changed", () => {
    render(<DrawingBoard />);
    const cmp = () => region("Compared with starting design");
    expect(within(cmp()).getByText(/No differences/)).toBeTruthy();
    commit(/installed power/i, "3400");
    expect(within(cmp()).queryByText(/No differences/)).toBeNull();
    expect(within(cmp()).getByText("Displacement")).toBeTruthy();
  });

  it("lists edits in the history and jumping back restores the earlier design", () => {
    render(<DrawingBoard />);
    const hist = () => region("Edit history");
    expect(within(hist()).getByText(/Start:/)).toBeTruthy();
    const before = metric("Top speed");
    commit(/installed power/i, "3400");
    expect(within(hist()).getByText(/Machinery: installed kw → 3400/)).toBeTruthy();
    fireEvent.click(within(hist()).getByRole("button", { name: /0\. Start:/ }));
    expect(metric("Top speed")).toBe(before);
    fireEvent.click(within(hist()).getByRole("button", { name: /1\. Machinery/ }));
    expect(metric("Top speed")).not.toBe(before);
  });

  it("previews the revision tier of the edits against a project under construction", () => {
    const projects = [
      {
        projectId: "p1",
        className: "Ironclad",
        status: "ACTIVE",
        totalWork: 1_000_000,
        completedWork: 300_000,
      },
    ];
    render(<DrawingBoard projects={projects} />);
    const panel = () => region("Revision preview");
    expect(within(panel()).getByText(/No changes yet/)).toBeTruthy();
    commit(/installed power/i, "3400");
    expect(within(panel()).getByRole("status").textContent).toMatch(
      /Redesign.*30\.0% hull progress/,
    );
  });

  it("says there is nothing to revise when no ship is under construction", () => {
    render(<DrawingBoard />);
    expect(within(region("Revision preview")).getByText(/nothing to revise/)).toBeTruthy();
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
    // the working design has an edit, so loading a candidate asks first
    fireEvent.click(await screen.findByRole("button", { name: "Replace my design" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(within(region("Validation")).getByRole("status").textContent).toContain(
      "Design can be submitted",
    );
    expect((screen.getByRole("button", { name: /undo/i }) as HTMLButtonElement).disabled).toBe(
      true,
    ); // history reset
  }, 40_000);

  it("adds a component from the grouped menu and removes it", async () => {
    render(<DrawingBoard />);
    const rows = () => within(region("Components and arrangement")).getAllByRole("row").length;
    const n = rows();
    fireEvent.click(screen.getByRole("button", { name: "Add component" }));
    const items = await screen.findAllByRole("menuitem");
    const six = items.find((i) => /6-pounder|6 pounder|6pdr/i.test(i.textContent ?? ""))!;
    expect(six).toBeTruthy();
    fireEvent.click(six);
    await waitFor(() => expect(rows()).toBe(n + 1));
    fireEvent.click(screen.getByRole("button", { name: "Remove gun_qf_6pdr_1" }));
    expect(rows()).toBe(n);
  });

  it("offers components that are not yet available as disabled, with the month they arrive", async () => {
    render(<DrawingBoard />);
    fireEvent.change(screen.getByLabelText("Starting design"), {
      target: { value: "torpedo_cruiser_1880" },
    });
    openTab("Arrangement");
    fireEvent.click(screen.getByRole("button", { name: "Add component" }));
    const items = await screen.findAllByRole("menuitem");
    const later = items.filter((i) => /from \d{4}-\d{2}/.test(i.textContent ?? ""));
    expect(later.length).toBeGreaterThan(0);
    expect(later.every((i) => i.getAttribute("aria-disabled") === "true")).toBe(true);
  });

  it("duplicates a fitting from its row menu and moves it to another zone", async () => {
    render(<DrawingBoard />);
    const panel = () => region("Components and arrangement");
    const rows = () => within(panel()).getAllByRole("row").length;
    const n = rows();
    fireEvent.click(within(panel()).getByRole("button", { name: "More actions for funnel" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Duplicate" }));
    await waitFor(() => expect(rows()).toBe(n + 1));
    expect(within(panel()).getByText("funnel_single_1")).toBeTruthy();
  });

  it("right-clicking a fitting opens the same actions", async () => {
    render(<DrawingBoard />);
    const panel = region("Components and arrangement");
    const row = within(panel).getByText("funnel").closest("tr")!;
    fireEvent.contextMenu(row);
    expect(await screen.findByRole("menuitem", { name: "Duplicate" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Remove" })).toBeTruthy();
  });

  it("switching the starting design asks first when there are edits, then loads the battleship and resets history", async () => {
    render(<DrawingBoard />);
    commit(/installed power/i, "3400");
    fireEvent.change(screen.getByLabelText("Starting design"), {
      target: { value: "majestic_like" },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Replace my design" }));
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

describe("forecast and the treasury", () => {
  it("states what the order will cost the treasury, in units", () => {
    render(<DrawingBoard />);
    const panel = region("Cost and construction forecast");
    expect(within(panel).getByText(/Charged to the treasury when ordered/)).toBeTruthy();
    const row = within(panel).getByText(/Charged to the treasury when ordered/).parentElement!;
    expect(row.textContent).toMatch(/\d[\d,]* units \(£10,000 each\)/);
  });
});
