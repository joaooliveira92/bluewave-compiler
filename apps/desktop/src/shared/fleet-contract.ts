import type { MovementCommand } from "@bluewave/campaign-engine";

/**
 * Read-only for MVP (desktop-mvp map, Construction & Fleet Contract
 * ticket) — divisions, geography, and commands are copied from engine
 * responses; the screen never decides whether a route is adjacent,
 * accessible, or otherwise legal. `submitMovementCommand`/
 * `replaceMovementCommand`/`cancelMovementCommand` stay unimplemented.
 * Shapes grounded in `DivisionPicker.tsx`, `OrderSection.tsx`, and
 * `fleet-screen-state.test.ts`.
 */

export interface FleetShipView {
  readonly name: string;
  readonly designId: string;
  readonly status: string;
}

export interface FleetDivisionView {
  readonly divisionId: string;
  readonly fleetName: string;
  readonly areaId: string;
  readonly ships: readonly FleetShipView[];
}

export interface FleetArea {
  readonly id: string;
  readonly name: string;
}

export interface FleetAreaEdge {
  readonly fromAreaId: string;
  readonly toAreaId: string;
}

export interface FleetPort {
  readonly id: string;
  readonly name: string;
  readonly areaId: string;
}

export interface FleetScreenProjection {
  readonly revision: number;
  readonly month: { readonly month: number; readonly year: number };
  readonly playerNationId: string;
  readonly divisions: readonly FleetDivisionView[];
  readonly areas: readonly FleetArea[];
  readonly areaEdges: readonly FleetAreaEdge[];
  readonly ports: readonly FleetPort[];
  readonly movementCommands: readonly MovementCommand[];
}

export interface MovementCommandOutcome {
  readonly workspace: { readonly movementCommands: readonly MovementCommand[] };
  readonly command: { readonly commandId: string; readonly status: string };
}

export interface SubmitMovementCommandPayload {
  readonly sessionId: string;
  readonly divisionId: string;
  readonly fromAreaId: string;
  readonly toAreaId: string;
  readonly expectedRevision: number;
  readonly transportRequestId: string;
}

export interface ReplaceMovementCommandPayload
  extends SubmitMovementCommandPayload {
  readonly commandId: string;
}

export interface CancelMovementCommandPayload {
  readonly sessionId: string;
  readonly commandId: string;
  readonly expectedRevision: number;
  readonly transportRequestId: string;
}
