import {
  Activity,
  Crosshair,
  Hammer,
  LayoutDashboard,
  Map as MapIcon,
  Settings,
  Settings2,
  Ship,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import { lazy, Suspense, type ComponentType } from "react";
import { CampaignPreferencesScreen } from "../screens/campaign-preferences/CampaignPreferencesScreen.js";
import { ConstructionScreen } from "../screens/construction/ConstructionScreen.js";
import { FleetScreen } from "../screens/fleet/FleetScreen.js";
import { OptionsScreen } from "../screens/options/OptionsScreen.js";
import { OverviewScreen } from "../screens/overview/OverviewScreen.js";
import { useCampaignShellContext } from "./CampaignShellContext.js";

const DebuggingScreen = lazy(() =>
  import("../screens/debugging/DebuggingScreen.js").then((module) => ({
    default: module.DebuggingScreen,
  })),
);
const SimulationScreen = lazy(() =>
  import("../screens/simulation/SimulationScreen.js").then((module) => ({
    default: module.SimulationScreen,
  })),
);
const TacticalSandboxScreen = lazy(() =>
  import("../screens/tactical-sandbox/TacticalSandboxScreen.js").then((module) => ({
    default: module.TacticalSandboxScreen,
  })),
);
// PROTOTYPE — throwaway, ticket 06. Dev-only; see
// screens/map-prototype/README.md. Delete this and its folder once the
// rendering-technology question is settled.
const MapPrototypeScreen = lazy(() =>
  import("../screens/map-prototype/MapPrototypeScreen.js").then((module) => ({
    default: module.MapPrototypeScreen,
  })),
);

export type Screen =
  | "file"
  | "new-game-preferences"
  | "new-game-archetype"
  | "new-game-nation"
  | CampaignScreen;

export type CampaignScreen =
  | "overview"
  | "construction"
  | "fleet"
  | "simulation"
  | "tactical-sandbox"
  | "debugging"
  | "map-prototype"
  | "campaign-preferences"
  | "options";

interface CampaignScreenRouteProps {
  readonly sessionId: string;
}

type CampaignScreenRoute = ComponentType<CampaignScreenRouteProps>;

export interface CampaignScreenDefinition {
  readonly id: CampaignScreen;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly group: "campaign" | "settings";
  readonly searchable: boolean;
  readonly route: CampaignScreenRoute;
}

function OverviewRoute({ sessionId }: CampaignScreenRouteProps) {
  const { actions } = useCampaignShellContext();
  return <OverviewScreen sessionId={sessionId} onNavigate={actions.selectScreen} />;
}

function ConstructionRoute({ sessionId }: CampaignScreenRouteProps) {
  return <ConstructionScreen sessionId={sessionId} />;
}

function FleetRoute({ sessionId }: CampaignScreenRouteProps) {
  return <FleetScreen sessionId={sessionId} />;
}

function SimulationRoute({ sessionId }: CampaignScreenRouteProps) {
  const { actions } = useCampaignShellContext();
  return (
    <SimulationScreen sessionId={sessionId} onPrimaryActionChange={actions.setPrimaryAction} />
  );
}

function TacticalSandboxRoute({ sessionId }: CampaignScreenRouteProps) {
  return <TacticalSandboxScreen sessionId={sessionId} />;
}

function DebuggingRoute({ sessionId }: CampaignScreenRouteProps) {
  return <DebuggingScreen sessionId={sessionId} />;
}

function MapPrototypeRoute() {
  return <MapPrototypeScreen />;
}

function CampaignPreferencesRoute({ sessionId }: CampaignScreenRouteProps) {
  const { actions } = useCampaignShellContext();
  return (
    <CampaignPreferencesScreen sessionId={sessionId} onCloseCampaign={actions.closeCampaign} />
  );
}

function OptionsRoute() {
  const { state, actions } = useCampaignShellContext();
  return (
    <OptionsScreen
      saving={state.saving}
      onSave={actions.saveCampaign}
      onCloseCampaign={actions.closeCampaign}
    />
  );
}

// PROTOTYPE — throwaway, ticket 06. Never registered in a production build, so
// a stray merge cannot ship a fixture world to players.
const MAP_PROTOTYPE_SCREEN: CampaignScreenDefinition = {
  id: "map-prototype",
  label: "Map Prototype",
  icon: MapIcon,
  group: "campaign",
  searchable: true,
  route: MapPrototypeRoute,
};

export const CAMPAIGN_SCREEN_REGISTRY: readonly CampaignScreenDefinition[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    group: "campaign",
    searchable: true,
    route: OverviewRoute,
  },
  {
    id: "construction",
    label: "Construction",
    icon: Hammer,
    group: "campaign",
    searchable: true,
    route: ConstructionRoute,
  },
  {
    id: "fleet",
    label: "Fleet",
    icon: Ship,
    group: "campaign",
    searchable: true,
    route: FleetRoute,
  },
  {
    id: "simulation",
    label: "Simulation & Turn",
    icon: Activity,
    group: "campaign",
    searchable: true,
    route: SimulationRoute,
  },
  {
    id: "tactical-sandbox",
    label: "Tactical Sandbox",
    icon: Crosshair,
    group: "campaign",
    searchable: true,
    route: TacticalSandboxRoute,
  },
  {
    id: "debugging",
    label: "Debugging & Telemetry",
    icon: Terminal,
    group: "campaign",
    searchable: true,
    route: DebuggingRoute,
  },
  ...(import.meta.env.DEV ? [MAP_PROTOTYPE_SCREEN] : []),
  {
    id: "campaign-preferences",
    label: "Campaign Preferences",
    icon: Settings2,
    group: "settings",
    searchable: false,
    route: CampaignPreferencesRoute,
  },
  {
    id: "options",
    label: "Options",
    icon: Settings,
    group: "settings",
    searchable: false,
    route: OptionsRoute,
  },
];

export const CAMPAIGN_SCREENS = CAMPAIGN_SCREEN_REGISTRY.filter(
  (screen) => screen.group === "campaign",
);
export const SETTINGS_SCREENS = CAMPAIGN_SCREEN_REGISTRY.filter(
  (screen) => screen.group === "settings",
);
export const CAMPAIGN_SCREEN_SEARCH_TARGETS = CAMPAIGN_SCREEN_REGISTRY.filter(
  (screen) => screen.searchable,
).map(({ id, label }) => ({ id, label }));

const CAMPAIGN_SCREEN_ROUTES = new Map(
  CAMPAIGN_SCREEN_REGISTRY.map(({ id, route }) => [id, route]),
);

export interface CampaignScreenOutletProps {
  readonly screen: Screen;
}

export function CampaignScreenOutlet({ screen }: CampaignScreenOutletProps) {
  const { state } = useCampaignShellContext();
  if (state.mode.kind !== "campaign") return null;
  const Route = CAMPAIGN_SCREEN_ROUTES.get(screen as CampaignScreen);
  if (Route === undefined) return null;
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading screen…</div>}>
      <Route sessionId={state.mode.campaign.sessionId} />
    </Suspense>
  );
}
