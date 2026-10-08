import { cleanup, render } from "@testing-library/react";
import type {
  BattleHistoryEntry,
  DivisionView,
  StrategicPriority,
} from "@bluewave/campaign-engine";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { DeferredFeaturesPanel } from "./components/shared/DeferredFeaturesPanel.js";
import { WorldMapChart } from "./components/world-map/WorldMapChart.js";
import { initialMapPrototypeState } from "./components/world-map/map-state.js";
import { axeViolations } from "./lib/axe.js";
import { BattleHistorySection } from "./screens/diplomacy/components/BattleHistorySection.js";
import { AreaOverviewTable } from "./screens/fleet/components/AreaOverviewTable.js";
import { MovementCommandsTable } from "./screens/fleet/components/MovementCommandsTable.js";
import { FleetOrganizationView } from "./screens/fleet/organization/FleetOrganizationSection.js";
import { initialDivisionOrganizationState } from "./screens/fleet/organization/division-organization-state.js";
import { OptionsScreen } from "./screens/options/OptionsScreen.js";
import { PrioritiesCard } from "./screens/overview/PrioritiesCard.js";
import { BudgetBar } from "./screens/treasury/BudgetBar.js";
import { BackgroundProvider } from "./shell/BackgroundContext.js";
import { DensityProvider } from "./shell/DensityContext.js";

/**
 * Automated accessibility audit (axe-core) over the screens and components built for the RTW3
 * parity work. It catches structural problems — missing names, bad roles, duplicate ids,
 * invalid ARIA — not visual ones; colour contrast is checked separately in the real app.
 */
const noop = () => undefined;

const division: DivisionView = {
  divisionId: "div_1",
  role: "CORE",
  formation: "LINE_AHEAD",
  flagshipShipId: "alex",
  flagshipName: "HMS Alexandra",
  commanderVacant: true,
  experience: 20,
  cohesion: 30,
  areaId: "home",
  areaName: "English Home Waters",
  ships: [
    { shipId: "alex", name: "HMS Alexandra" },
    { shipId: "dread", name: "HMS Dreadnought" },
  ],
};

const priority: StrategicPriority = {
  id: "p1",
  type: "monthly_deficit",
  severity: "warning",
  title: "Monthly deficit",
  summary: "Projected balance -56.",
  reason: "r",
  destination: "treasury" as never,
  fingerprint: "p1",
};

const battle: BattleHistoryEntry = {
  sequence: 1,
  battleId: "b1",
  areaId: "a",
  areaName: "English Home Waters",
  attackerId: "uk",
  attackerName: "Britain",
  defenderId: "france",
  defenderName: "France",
  involvesPlayer: true,
  outcomeForPlayer: "won",
  playerLossCount: 1,
  enemyLossCount: 3,
  lostShipIds: [],
};

describe("accessibility audit (axe-core)", () => {
  beforeAll(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    window.matchMedia ??= vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });
  afterEach(cleanup);

  const audit = async (ui: React.ReactElement) => {
    const { container } = render(ui);
    expect(await axeViolations(container)).toEqual([]);
  };

  it("Fleet organization — empty and with divisions", async () => {
    const base = {
      ...initialDivisionOrganizationState(),
      roles: ["INDEPENDENT", "CORE"],
      formations: ["LINE_AHEAD", "LINE_ABREAST"],
      initial: { experience: 20, cohesion: 30 },
      penalties: {
        addShip: { experience: 5, cohesion: 10 },
        removeShip: { experience: 3, cohesion: 5 },
        changeFlagship: { experience: 5, cohesion: 10 },
      },
      unassignedShips: [
        {
          shipId: "inflex",
          name: "HMS Inflexible",
          classId: "c",
          areaId: "home",
          areaName: "English Home Waters",
        },
        { shipId: "temp", name: "HMS Temeraire", classId: "c", areaId: "malta", areaName: "Malta" },
      ],
    };
    const props = {
      loadError: null,
      busy: false,
      outcomeUnknown: false,
      onRetry: noop,
      onReload: noop,
      send: noop,
    };
    await audit(<FleetOrganizationView state={base} {...props} />);
    cleanup();
    await audit(
      <FleetOrganizationView
        state={{ ...base, divisions: [division], notice: "Create division queued." }}
        {...props}
      />,
    );
  });

  it("Overview priorities", async () => {
    await audit(
      <PrioritiesCard state={{ status: "ready", priorities: [priority] }} onNavigate={noop} />,
    );
  });

  it("Treasury budget bar", async () => {
    await audit(
      <BudgetBar
        breakdown={{
          income: 20,
          fleetMaintenance: 16,
          constructionSpend: 0,
          researchSpend: 60,
          totalExpenditure: 76,
          projectedSurplusDeficit: -56,
          availableFunds: 1000,
          projectedMonthEndFunds: 944,
        }}
      />,
    );
  });

  it("Deferred-features panel, battle history, area overview, movement table", async () => {
    await audit(
      <DeferredFeaturesPanel
        testId="d"
        items={[{ id: "a", name: "Alpha", reason: "Because alpha." }]}
      />,
    );
    cleanup();
    await audit(
      <BattleHistorySection state={{ status: "ready", history: { battles: [battle] } }} />,
    );
    cleanup();
    await audit(
      <AreaOverviewTable
        rows={[
          {
            areaId: "a",
            name: "Malta",
            ports: ["Valletta"],
            divisions: [],
            neighbours: ["Algeria"],
          },
        ]}
      />,
    );
    cleanup();
    await audit(
      <MovementCommandsTable
        commands={[
          {
            commandId: "c1",
            divisionId: "d1",
            fromAreaId: "a",
            toAreaId: "b",
            status: "submitted",
            submittedAtRevision: 1,
          },
        ]}
        areaName={(id) => id}
        divisionName={(id) => id}
      />,
    );
  });

  it("Options (density, save, copy, close)", async () => {
    await audit(
      <BackgroundProvider>
        <DensityProvider>
          <OptionsScreen saving={false} onSave={noop} onCopy={noop} onCloseCampaign={noop} />
        </DensityProvider>
      </BackgroundProvider>,
    );
  });

  it("World map — full and embedded panel variants", async () => {
    const props = {
      state: initialMapPrototypeState,
      route: null,
      onSelect: noop,
      onRuler: noop,
      onToggleLayer: noop,
      onSetProjection: noop,
      onSetCentre: noop,
      onToggleClosedPassages: noop,
    };
    await audit(<WorldMapChart {...props} />);
    cleanup();
    await audit(<WorldMapChart {...props} variant="panel" />);
  });

  it("control: the harness really catches violations (so a clean result means something)", async () => {
    const { container } = render(
      <div>
        <button type="button" />
        <img src="x.png" />
        <input type="text" />
      </div>,
    );
    const violations = await axeViolations(container);
    expect(violations.length).toBeGreaterThanOrEqual(3);
    const ids = violations.map((v) => v.split(" ")[0]);
    expect(ids).toEqual(expect.arrayContaining(["button-name", "image-alt", "label"]));
  });
});
