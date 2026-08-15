import type { PlayerProjection } from "@bluewave/campaign-engine";

export interface OverviewScreenState {
  readonly projection: PlayerProjection | null;
  readonly loadError: string | null;
}

export function initialOverviewScreenState(): OverviewScreenState {
  return { projection: null, loadError: null };
}

export function applyProjectionLoaded(
  state: OverviewScreenState,
  projection: PlayerProjection,
): OverviewScreenState {
  return { projection, loadError: null };
}

export function applyLoadFailed(state: OverviewScreenState, error: string): OverviewScreenState {
  return { ...state, loadError: error };
}

export interface FleetSummary {
  readonly totalShips: number;
  readonly fleetCount: number;
  readonly divisionCount: number;
}

export function summarizeFleet(projection: PlayerProjection): FleetSummary {
  let totalShips = 0;
  let divisionCount = 0;
  for (const fleet of projection.fleet) {
    for (const division of fleet.divisions) {
      divisionCount++;
      totalShips += division.ships.length;
    }
  }
  return { totalShips, fleetCount: projection.fleet.length, divisionCount };
}

export function totalPortCapacity(projection: PlayerProjection): number {
  return projection.ports.reduce((sum, port) => sum + port.capacity, 0);
}

export function monthLabel(month: PlayerProjection["month"]): string {
  const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const name = MONTH_NAMES[month.month - 1] ?? String(month.month);
  return `${name} ${month.year}`;
}
