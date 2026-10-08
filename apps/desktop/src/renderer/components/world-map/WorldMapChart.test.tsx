import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { WorldMapChart } from "./WorldMapChart.js";
import { initialMapPrototypeState } from "./map-state.js";

const noop = () => undefined;

function renderChart() {
  return render(
    <WorldMapChart
      state={initialMapPrototypeState}
      route={null}
      onSelect={noop}
      onRuler={noop}
      onToggleLayer={noop}
      onSetProjection={noop}
      onSetCentre={noop}
      onToggleClosedPassages={noop}
    />,
  );
}

describe("WorldMapChart", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("is keyboard-focusable and handles pan/zoom/reset keys without throwing", () => {
    renderChart();
    const map = screen.getByRole("application");
    expect(map.getAttribute("tabindex")).toBe("0");
    for (const key of ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "-", "0"]) {
      expect(fireEvent.keyDown(map, { key })).toBe(false); // preventDefault called
    }
    expect(fireEvent.keyDown(map, { key: "x" })).toBe(true); // other keys untouched
  });

  it("tells the player when canvas drawing is unavailable instead of drawing nothing", async () => {
    // jsdom has no canvas implementation: getContext returns null.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    vi.stubGlobal("Path2D", class {});
    renderChart();
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/coastline unavailable/i);
    vi.unstubAllGlobals();
  });

  it("renders a scale bar element and the layer toolbar", () => {
    const { container } = renderChart();
    expect(container.querySelector('[aria-hidden="true"] span')).not.toBeNull();
    expect(screen.getByText("Ownership")).toBeTruthy();
  });

  it("exposes area ownership as text: labelled keyboard-selectable areas and a data table", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <WorldMapChart
        state={initialMapPrototypeState}
        route={null}
        onSelect={onSelect}
        onRuler={noop}
        onToggleLayer={noop}
        onSetProjection={noop}
        onSetCentre={noop}
        onToggleClosedPassages={noop}
      />,
    );
    const areas = [...container.querySelectorAll('path[role="button"]')];
    expect(areas.length).toBe(36); // one reachable copy per area, not one per wrap turn
    for (const area of areas) {
      expect(area.getAttribute("aria-label")).toMatch(
        /: (held by .+|unclaimed), (no fleets|\d+ fleets?)$/,
      );
      expect(area.getAttribute("tabindex")).toBe("0");
    }
    const first = areas[0] as Element;
    fireEvent.keyDown(first, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(first, { key: " " });
    expect(onSelect).toHaveBeenCalledTimes(2);

    const table = screen.getByRole("table", { name: "Area control" });
    expect(table.querySelectorAll("tbody tr").length).toBe(areas.length);
  });

  describe("panel variant (embedded on Overview)", () => {
    function renderPanel() {
      return render(
        <WorldMapChart
          variant="panel"
          state={initialMapPrototypeState}
          route={null}
          onSelect={noop}
          onRuler={noop}
          onToggleLayer={noop}
          onSetProjection={noop}
          onSetCentre={noop}
          onToggleClosedPassages={noop}
        />,
      );
    }
    const hidden = (element: HTMLElement) => element.closest(".hidden") !== null;

    it("collapses the layer controls behind a Layers button until opened", () => {
      renderPanel();
      const layers = screen.getByRole("button", { name: "Layers & areas" });
      expect(layers.getAttribute("aria-expanded")).toBe("false");
      expect(hidden(screen.getByText("Ownership"))).toBe(true);

      fireEvent.click(layers);
      expect(layers.getAttribute("aria-expanded")).toBe("true");
      expect(hidden(screen.getByText("Ownership"))).toBe(false);

      fireEvent.click(layers);
      expect(hidden(screen.getByText("Ownership"))).toBe(true);
    });

    it("keeps idle hint cards out of the way", () => {
      renderPanel();
      expect(hidden(screen.getByText(/Click an area to inspect/))).toBe(true);
      expect(hidden(screen.getByText(/Shift-click two areas for a route reading/))).toBe(true);
    });

    it("can omit the minimap", () => {
      const { container } = render(
        <WorldMapChart
          variant="panel"
          showMinimap={false}
          state={initialMapPrototypeState}
          route={null}
          onSelect={noop}
          onRuler={noop}
          onToggleLayer={noop}
          onSetProjection={noop}
          onSetCentre={noop}
          onToggleClosedPassages={noop}
        />,
      );
      expect(container.querySelector('[data-testid="map-minimap"]')).toBeNull();
    });
  });

  it("the full variant shows every control from the start", () => {
    renderChart();
    expect(screen.queryByRole("button", { name: "Layers & areas" })).toBeNull();
    expect(screen.getByText("Ownership").closest(".hidden")).toBeNull();
  });

  describe("area list", () => {
    function renderWithSelect() {
      const onSelect = vi.fn();
      render(
        <WorldMapChart
          state={initialMapPrototypeState}
          route={null}
          onSelect={onSelect}
          onRuler={noop}
          onToggleLayer={noop}
          onSetProjection={noop}
          onSetCentre={noop}
          onToggleClosedPassages={noop}
        />,
      );
      return onSelect;
    }

    it("lists every area with its owner, and a count in the heading", () => {
      renderWithSelect();
      const list = screen.getByRole("list", { name: "Areas" });
      expect(within(list).getAllByRole("button")).toHaveLength(36);
      expect(screen.getByText("Areas (36)")).toBeTruthy();
    });

    it("filters by name or owner and says when nothing matches", () => {
      renderWithSelect();
      const list = screen.getByRole("list", { name: "Areas" });
      fireEvent.change(screen.getByLabelText("Filter areas"), { target: { value: "north sea" } });
      const names = within(list)
        .getAllByRole("button")
        .map((button) => button.textContent ?? "");
      expect(names.length).toBeGreaterThan(0);
      expect(names.length).toBeLessThan(36);
      expect(names.every((name) => /north sea/i.test(name))).toBe(true);

      fireEvent.change(screen.getByLabelText("Filter areas"), { target: { value: "zzzzzz" } });
      expect(within(list).queryAllByRole("button")).toHaveLength(0);
      expect(screen.getByText("No areas match.")).toBeTruthy();
    });

    it("switches what each row counts between ships and possessions", () => {
      renderWithSelect();
      const list = screen.getByRole("list", { name: "Areas" });
      const group = screen.getByRole("group", { name: "Show in the area list" });
      const ships = within(group).getByRole("button", { name: "ships" });
      const possessions = within(group).getByRole("button", { name: "possessions" });
      expect(ships.getAttribute("aria-pressed")).toBe("true");
      expect(list.textContent).toMatch(/\d+ fleets?/);
      expect(list.textContent).not.toMatch(/\d+ possessions?/);

      fireEvent.click(possessions);
      expect(possessions.getAttribute("aria-pressed")).toBe("true");
      expect(ships.getAttribute("aria-pressed")).toBe("false");
      expect(list.textContent).toMatch(/\d+ possessions?/);
      expect(list.textContent).not.toMatch(/\d+ fleets?/);
    });

    it("counts the LIVE campaign's own ports per area (not the fixture's) when an overlay is supplied", () => {
      render(
        <WorldMapChart
          state={initialMapPrototypeState}
          route={null}
          overlay={{
            source: "campaign",
            ownership: new Map(),
            fleets: [],
            ports: [
              { id: "p1", name: "Portsmouth", area: "area_north_sea", nation: "uk", level: 3 },
              { id: "p2", name: "Plymouth", area: "area_north_sea", nation: "uk", level: 2 },
              { id: "p3", name: "Valletta", area: "area_mediterranean", nation: "uk", level: 1 },
            ],
          }}
          onSelect={noop}
          onRuler={noop}
          onToggleLayer={noop}
          onSetProjection={noop}
          onSetCentre={noop}
          onToggleClosedPassages={noop}
        />,
      );
      fireEvent.click(
        within(screen.getByRole("group", { name: "Show in the area list" })).getByRole("button", {
          name: "possessions",
        }),
      );
      const list = screen.getByRole("list", { name: "Areas" });
      const row = (name: RegExp) =>
        within(list)
          .getAllByRole("button")
          .find((button) => name.test(button.textContent ?? ""))!;
      expect(row(/^North Sea/).textContent).toContain("2 possessions");
      expect(row(/^Mediterranean/).textContent).toContain("1 possession");
      // Exactly the live ports are counted: 3 in total, and areas without a port stay quiet.
      const counted = within(list)
        .getAllByRole("button")
        .filter((button) => /possession/.test(button.textContent ?? ""));
      expect(counted).toHaveLength(2);
    });

    it("selects the area when a row is clicked", () => {
      const onSelect = renderWithSelect();
      const list = screen.getByRole("list", { name: "Areas" });
      fireEvent.click(within(list).getAllByRole("button")[0] as HTMLElement);
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(typeof onSelect.mock.calls[0]?.[0]).toBe("string");
    });
  });
});
