import { BluewaveError } from "@bluewave/contracts";
export interface MovementState {
  position: [number, number]; // fixed-point integer
  heading: number; // 0..359
  orderedSpeed: number; // knots *1000 ? integer
  currentSpeed: number;
  acceleration: number;
  turningRate: number;
  collisionRadius: number;
  propulsionState: string;
  machineryReliability: number;
  fuelState: string;
  formationStation: string;
  groundingState?: string;
  collisionState?: string;
}
export function assertFixedPointMovement(s: MovementState) {
  for (const v of [s.position[0], s.position[1], s.heading, s.orderedSpeed, s.currentSpeed]) {
    if (!Number.isInteger(v))
      throw new BluewaveError("TACTICAL_STATE_INVARIANT_FAILED", {
        code: "TACTICAL_STATE_INVARIANT_FAILED",
        reason: "fixed-point",
        v,
      });
  }
}
