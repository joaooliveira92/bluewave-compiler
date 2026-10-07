import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
});
