/**
 * One nation's slice of `CampaignSnapshot`, flattened for UI convenience.
 * Shape confirmed in the desktop-mvp map, ticket 07 (Q15), with fields
 * grounded in `overview-screen-state.test.ts` and `OverviewScreen.tsx`.
 */
export interface PlayerProjectionEconomy {
  readonly treasury: number;
  readonly monthlyAppropriation: number;
  readonly shipyardCapacity: number;
}

export interface PlayerProjectionPort {
  readonly id: string;
  readonly name: string;
  readonly areaId: string;
  readonly capacity: number;
}

export interface PlayerProjectionShip {
  readonly name: string;
  readonly designId: string;
}

export interface PlayerProjectionDivision {
  readonly name: string;
  readonly areaId: string;
  readonly ships: readonly PlayerProjectionShip[];
}

export interface PlayerProjectionFleet {
  readonly name: string;
  readonly divisions: readonly PlayerProjectionDivision[];
}

export interface PlayerProjectionStrategicArea {
  readonly id: string;
  readonly name: string;
}

export interface PlayerProjectionMonth {
  readonly month: number;
  readonly year: number;
}

export interface PlayerProjectionCommandWorkspace {
  readonly commands: readonly unknown[];
  readonly movementCommands: readonly unknown[];
}

export interface PlayerProjection {
  readonly campaignIdentity: string;
  readonly snapshotHash: string;
  readonly revision: number;
  readonly month: PlayerProjectionMonth;
  readonly economy: PlayerProjectionEconomy;
  readonly fleet: readonly PlayerProjectionFleet[];
  readonly ports: readonly PlayerProjectionPort[];
  readonly knownTechnologyIds: readonly string[];
  readonly strategicAreas: readonly PlayerProjectionStrategicArea[];
  readonly knownEnemyNations: readonly string[];
  readonly commandWorkspace: PlayerProjectionCommandWorkspace;
}
