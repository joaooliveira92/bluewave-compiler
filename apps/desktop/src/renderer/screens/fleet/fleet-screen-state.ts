import type { DeferredFeature } from "../../components/shared/DeferredFeaturesPanel.js";
import type { MovementCommand } from "@bluewave/campaign-engine";
import type {
  FleetScreenProjection,
  MovementCommandOutcome,
} from "../../../shared/fleet-contract.js";
import type { RequestLifecycle } from "../../lib/command-screen-workflow.js";
import { commandNotice } from "../../lib/command-screen-workflow.js";

/**
 * Presentation state for the fleet movement screen. Divisions, geography, and
 * commands are copied from engine responses — the screen never decides whether
 * a route is adjacent, accessible, or otherwise legal.
 */
export interface FleetScreenState extends RequestLifecycle {
  readonly month: FleetScreenProjection["month"] | null;
  readonly playerNationId: string | null;
  readonly divisions: FleetScreenProjection["divisions"];
  readonly areas: FleetScreenProjection["areas"];
  readonly areaEdges: FleetScreenProjection["areaEdges"];
  readonly ports: FleetScreenProjection["ports"];
  readonly movementCommands: readonly MovementCommand[];
}

export function initialFleetScreenState(): FleetScreenState {
  return {
    revision: 0,
    month: null,
    playerNationId: null,
    divisions: [],
    areas: [],
    areaEdges: [],
    ports: [],
    movementCommands: [],
    pendingRequest: null,
    requiresRefresh: false,
    notice: null,
  };
}

/**
 * Map a fleet projection's domain fields into the state. The command screen
 * module owns the lifecycle fields (revision, pending, refresh, notice).
 */
export function projectFleetScreen(projection: FleetScreenProjection): Partial<FleetScreenState> {
  return {
    month: projection.month,
    playerNationId: projection.playerNationId,
    divisions: projection.divisions,
    areas: projection.areas,
    areaEdges: projection.areaEdges,
    ports: projection.ports,
    movementCommands: projection.movementCommands,
  };
}

/**
 * The route the engine currently holds for a division, if any. A superseded or
 * cancelled command stays in the workspace for audit but is no longer pending.
 */
export function pendingRouteFor(
  state: FleetScreenState,
  divisionId: string,
): MovementCommand | null {
  return (
    state.movementCommands.find(
      (command) => command.divisionId === divisionId && command.status === "submitted",
    ) ?? null
  );
}

export function acceptMovementCommand(value: MovementCommandOutcome): {
  readonly patch: Partial<FleetScreenState>;
  readonly notice: string;
} {
  return {
    patch: { movementCommands: value.workspace.movementCommands },
    notice: commandNotice(value.command),
  };
}

/**
 * RTW3 submarine items the engine cannot supply yet (docs/research/
 * rtw3-intel-and-submarines-engine-surface.md). The 1880 content has no
 * submarine hulls at all, so an empty roster would be correct for this era.
 */
export const DEFERRED_SUBMARINE_ITEMS: readonly DeferredFeature[] = [
  {
    id: "submarine-roster",
    name: "Submarine roster",
    reason: "The fleet view does not carry hull types, and 1880 content has no submarine designs.",
  },
  {
    id: "submarine-auto-build",
    name: "Auto-build submarines",
    reason: "There is no campaign setting or command for it yet.",
  },
];

export interface AreaOverviewRow {
  readonly areaId: string;
  readonly name: string;
  /** Names of the player's ports in this area. */
  readonly ports: readonly string[];
  /** Names of the player's divisions (fleets) currently in this area. */
  readonly divisions: readonly string[];
  /** Areas reachable in one hop, by name. */
  readonly neighbours: readonly string[];
}

/**
 * Area overview (RTW3 "Area overview"): per strategic area, what the player has
 * there and what it borders. Derived only from the Fleet screen's own data.
 */
export function buildAreaOverview(
  areas: readonly { readonly id: string; readonly name: string }[],
  areaEdges: readonly { readonly fromAreaId: string; readonly toAreaId: string }[],
  ports: readonly { readonly name: string; readonly areaId: string }[],
  divisions: readonly { readonly fleetName: string; readonly areaId: string }[],
): AreaOverviewRow[] {
  const nameOf = new Map(areas.map((area) => [area.id, area.name]));
  const neighbours = new Map<string, Set<string>>();
  for (const edge of areaEdges) {
    for (const [from, to] of [
      [edge.fromAreaId, edge.toAreaId],
      [edge.toAreaId, edge.fromAreaId],
    ] as const) {
      const set = neighbours.get(from) ?? new Set<string>();
      set.add(nameOf.get(to) ?? to);
      neighbours.set(from, set);
    }
  }
  const byName = (a: string, b: string) => a.localeCompare(b);
  return areas
    .map((area) => ({
      areaId: area.id,
      name: area.name,
      ports: ports
        .filter((port) => port.areaId === area.id)
        .map((port) => port.name)
        .sort(byName),
      divisions: divisions
        .filter((division) => division.areaId === area.id)
        .map((division) => division.fleetName)
        .sort(byName),
      neighbours: [...(neighbours.get(area.id) ?? [])].sort(byName),
    }))
    .sort((a, b) => byName(a.name, b.name));
}
