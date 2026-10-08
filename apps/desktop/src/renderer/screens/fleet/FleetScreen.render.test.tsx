import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import type { FleetScreenState } from "./fleet-screen-state.js";
import { initialFleetScreenState } from "./fleet-screen-state.js";
import { FleetScreen } from "./FleetScreen.js";

const hook = vi.hoisted(() => ({ state: null as unknown }));
vi.mock("./hooks/useFleetScreen.js", () => ({
  useFleetScreen: () => ({
    state: hook.state,
    loadError: null,
    selectedDivisionId: "fleet_home",
    destinationAreaId: null,
    request: { outcomeUnknown: false, retry: () => undefined },
    loadScreen: async () => undefined,
    setSelectedDivisionId: () => undefined,
    setDestinationAreaId: () => undefined,
    submit: () => undefined,
    replace: () => undefined,
    cancel: () => undefined,
  }),
}));
// The heavy children have their own tests; here only the screen's composition is under test.
vi.mock("../../components/world-map/WorldMapPanel.js", () => ({
  WorldMapPanel: () => <div data-testid="map-stub" />,
}));
vi.mock("./organization/FleetOrganizationSection.js", () => ({
  FleetOrganizationSection: () => <div data-testid="organization-stub" />,
}));

const loaded: FleetScreenState = {
  ...initialFleetScreenState(),
  playerNationId: "uk",
  divisions: [
    { divisionId: "fleet_home", fleetName: "Home Fleet", areaId: "home", ships: [] },
  ] as FleetScreenState["divisions"],
  areas: [{ id: "home", name: "English Home Waters" }] as FleetScreenState["areas"],
};

describe("FleetScreen", () => {
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

  it("does not offer movement orders the engine cannot execute, and says why", () => {
    hook.state = loaded;
    render(<FleetScreen sessionId="ses-1" />);
    expect(screen.queryByRole("button", { name: /Submit movement command/ })).toBeNull();
    const panel = screen.getByTestId("movement-deferred");
    expect(panel.textContent).toContain("Movement orders — not yet modelled by the engine");
    expect(panel.textContent).toContain("Fleet movement orders");
  });

  it("composes the positions map, organization, submarine deferral and area overview", () => {
    hook.state = loaded;
    render(<FleetScreen sessionId="ses-1" />);
    expect(screen.getByRole("heading", { name: "Fleet", level: 2 })).toBeTruthy();
    expect(screen.getByTestId("map-stub")).toBeTruthy();
    expect(screen.getByTestId("organization-stub")).toBeTruthy();
    expect(screen.getByTestId("submarines-deferred")).toBeTruthy();
    expect(screen.getByText("Area overview")).toBeTruthy();
    expect(screen.getByRole("radio", { name: /Home Fleet/ })).toBeTruthy();
  });
});
