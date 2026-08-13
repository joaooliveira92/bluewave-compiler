//packages/combat/src/movement/kinematics.ts
// DESIGN-38 §20/§3-steps-5-6 pure movement kinematics over MovementState.
// All arithmetic is integer (fixed-point) under DESIGN-07; heading direction is
// resolved through a fixed-point direction table so results are reproducible
// integers. No ambient I/O, random, or clock.
import { BluewaveError } from "@bluewave/contracts";
import type { DivisionFormation } from "@bluewave/campaign";
import type { MovementState } from "../movement.js";
import { assertFixedPointMovement } from "../movement.js";
import {
  KNOTS_TO_UM_S,
  SPEED_BP_SCALE,
  DIRECTION_FIXED,
  DEG_TO_RAD,
  PROPULSION_ACCEL_KNOT_BP_PER_S,
  PROPULSION_DECEL_KNOT_BP_PER_S,
  LINE_AHEAD_COLUMN_INTERVAL_UM,
  LINE_AHEAD_DIVISION_GAP_UM,
  LINE_ABREAST_ABREAST_INTERVAL_UM,
  STATION_TOLERANCE_UM,
} from "./constants.js";

function foldHeading(degrees: number): number {
  return (((degrees % 360) + 360) % 360) | 0;
}

// currentSpeed must be basis-point knots. Returns integer µm/s (fixed-point).
export function speedBpKnotsToUmS(currentSpeedBpKnots: number): number {
  return Math.round((currentSpeedBpKnots * KNOTS_TO_UM_S) / SPEED_BP_SCALE);
}

// Precomputed integer direction table: cos/sin in fixed-point
// (DIRECTION_FIXED = 1e4) for every integer heading 0..359. Using an authored
// integer table (rather than calling Math.cos/Math.sin at runtime) keeps
// displacement byte-identical across engines/OS (DESIGN-07 fixed-point, AC-13
// cross-process determinism).
const DIRECTION_TABLE: ReadonlyArray<readonly [number, number]> = [
  [10000, 0],
  [9998, 175],
  [9994, 349],
  [9986, 523],
  [9976, 698],
  [9962, 872],
  [9945, 1045],
  [9925, 1219],
  [9903, 1392],
  [9877, 1564],
  [9848, 1736],
  [9816, 1908],
  [9781, 2079],
  [9744, 2250],
  [9703, 2419],
  [9659, 2588],
  [9613, 2756],
  [9563, 2924],
  [9511, 3090],
  [9455, 3256],
  [9397, 3420],
  [9336, 3584],
  [9272, 3746],
  [9205, 3907],
  [9135, 4067],
  [9063, 4226],
  [8988, 4384],
  [8910, 4540],
  [8829, 4695],
  [8746, 4848],
  [8660, 5000],
  [8572, 5150],
  [8480, 5299],
  [8387, 5446],
  [8290, 5592],
  [8192, 5736],
  [8090, 5878],
  [7986, 6018],
  [7880, 6157],
  [7771, 6293],
  [7660, 6428],
  [7547, 6561],
  [7431, 6691],
  [7314, 6820],
  [7193, 6947],
  [7071, 7071],
  [6947, 7193],
  [6820, 7314],
  [6691, 7431],
  [6561, 7547],
  [6428, 7660],
  [6293, 7771],
  [6157, 7880],
  [6018, 7986],
  [5878, 8090],
  [5736, 8192],
  [5592, 8290],
  [5446, 8387],
  [5299, 8480],
  [5150, 8572],
  [5000, 8660],
  [4848, 8746],
  [4695, 8829],
  [4540, 8910],
  [4384, 8988],
  [4226, 9063],
  [4067, 9135],
  [3907, 9205],
  [3746, 9272],
  [3584, 9336],
  [3420, 9397],
  [3256, 9455],
  [3090, 9511],
  [2924, 9563],
  [2756, 9613],
  [2588, 9659],
  [2419, 9703],
  [2250, 9744],
  [2079, 9781],
  [1908, 9816],
  [1736, 9848],
  [1564, 9877],
  [1392, 9903],
  [1219, 9925],
  [1045, 9945],
  [872, 9962],
  [698, 9976],
  [523, 9986],
  [349, 9994],
  [175, 9998],
  [0, 10000],
  [-175, 9998],
  [-349, 9994],
  [-523, 9986],
  [-698, 9976],
  [-872, 9962],
  [-1045, 9945],
  [-1219, 9925],
  [-1392, 9903],
  [-1564, 9877],
  [-1736, 9848],
  [-1908, 9816],
  [-2079, 9781],
  [-2250, 9744],
  [-2419, 9703],
  [-2588, 9659],
  [-2756, 9613],
  [-2924, 9563],
  [-3090, 9511],
  [-3256, 9455],
  [-3420, 9397],
  [-3584, 9336],
  [-3746, 9272],
  [-3907, 9205],
  [-4067, 9135],
  [-4226, 9063],
  [-4384, 8988],
  [-4540, 8910],
  [-4695, 8829],
  [-4848, 8746],
  [-5000, 8660],
  [-5150, 8572],
  [-5299, 8480],
  [-5446, 8387],
  [-5592, 8290],
  [-5736, 8192],
  [-5878, 8090],
  [-6018, 7986],
  [-6157, 7880],
  [-6293, 7771],
  [-6428, 7660],
  [-6561, 7547],
  [-6691, 7431],
  [-6820, 7314],
  [-6947, 7193],
  [-7071, 7071],
  [-7193, 6947],
  [-7314, 6820],
  [-7431, 6691],
  [-7547, 6561],
  [-7660, 6428],
  [-7771, 6293],
  [-7880, 6157],
  [-7986, 6018],
  [-8090, 5878],
  [-8192, 5736],
  [-8290, 5592],
  [-8387, 5446],
  [-8480, 5299],
  [-8572, 5150],
  [-8660, 5000],
  [-8746, 4848],
  [-8829, 4695],
  [-8910, 4540],
  [-8988, 4384],
  [-9063, 4226],
  [-9135, 4067],
  [-9205, 3907],
  [-9272, 3746],
  [-9336, 3584],
  [-9397, 3420],
  [-9455, 3256],
  [-9511, 3090],
  [-9563, 2924],
  [-9613, 2756],
  [-9659, 2588],
  [-9703, 2419],
  [-9744, 2250],
  [-9781, 2079],
  [-9816, 1908],
  [-9848, 1736],
  [-9877, 1564],
  [-9903, 1392],
  [-9925, 1219],
  [-9945, 1045],
  [-9962, 872],
  [-9976, 698],
  [-9986, 523],
  [-9994, 349],
  [-9998, 175],
  [-10000, 0],
  [-9998, -175],
  [-9994, -349],
  [-9986, -523],
  [-9976, -698],
  [-9962, -872],
  [-9945, -1045],
  [-9925, -1219],
  [-9903, -1392],
  [-9877, -1564],
  [-9848, -1736],
  [-9816, -1908],
  [-9781, -2079],
  [-9744, -2250],
  [-9703, -2419],
  [-9659, -2588],
  [-9613, -2756],
  [-9563, -2924],
  [-9511, -3090],
  [-9455, -3256],
  [-9397, -3420],
  [-9336, -3584],
  [-9272, -3746],
  [-9205, -3907],
  [-9135, -4067],
  [-9063, -4226],
  [-8988, -4384],
  [-8910, -4540],
  [-8829, -4695],
  [-8746, -4848],
  [-8660, -5000],
  [-8572, -5150],
  [-8480, -5299],
  [-8387, -5446],
  [-8290, -5592],
  [-8192, -5736],
  [-8090, -5878],
  [-7986, -6018],
  [-7880, -6157],
  [-7771, -6293],
  [-7660, -6428],
  [-7547, -6561],
  [-7431, -6691],
  [-7314, -6820],
  [-7193, -6947],
  [-7071, -7071],
  [-6947, -7193],
  [-6820, -7314],
  [-6691, -7431],
  [-6561, -7547],
  [-6428, -7660],
  [-6293, -7771],
  [-6157, -7880],
  [-6018, -7986],
  [-5878, -8090],
  [-5736, -8192],
  [-5592, -8290],
  [-5446, -8387],
  [-5299, -8480],
  [-5150, -8572],
  [-5000, -8660],
  [-4848, -8746],
  [-4695, -8829],
  [-4540, -8910],
  [-4384, -8988],
  [-4226, -9063],
  [-4067, -9135],
  [-3907, -9205],
  [-3746, -9272],
  [-3584, -9336],
  [-3420, -9397],
  [-3256, -9455],
  [-3090, -9511],
  [-2924, -9563],
  [-2756, -9613],
  [-2588, -9659],
  [-2419, -9703],
  [-2250, -9744],
  [-2079, -9781],
  [-1908, -9816],
  [-1736, -9848],
  [-1564, -9877],
  [-1392, -9903],
  [-1219, -9925],
  [-1045, -9945],
  [-872, -9962],
  [-698, -9976],
  [-523, -9986],
  [-349, -9994],
  [-175, -9998],
  [0, -10000],
  [175, -9998],
  [349, -9994],
  [523, -9986],
  [698, -9976],
  [872, -9962],
  [1045, -9945],
  [1219, -9925],
  [1392, -9903],
  [1564, -9877],
  [1736, -9848],
  [1908, -9816],
  [2079, -9781],
  [2250, -9744],
  [2419, -9703],
  [2588, -9659],
  [2756, -9613],
  [2924, -9563],
  [3090, -9511],
  [3256, -9455],
  [3420, -9397],
  [3584, -9336],
  [3746, -9272],
  [3907, -9205],
  [4067, -9135],
  [4226, -9063],
  [4384, -8988],
  [4540, -8910],
  [4695, -8829],
  [4848, -8746],
  [5000, -8660],
  [5150, -8572],
  [5299, -8480],
  [5446, -8387],
  [5592, -8290],
  [5736, -8192],
  [5878, -8090],
  [6018, -7986],
  [6157, -7880],
  [6293, -7771],
  [6428, -7660],
  [6561, -7547],
  [6691, -7431],
  [6820, -7314],
  [6947, -7193],
  [7071, -7071],
  [7193, -6947],
  [7314, -6820],
  [7431, -6691],
  [7547, -6561],
  [7660, -6428],
  [7771, -6293],
  [7880, -6157],
  [7986, -6018],
  [8090, -5878],
  [8192, -5736],
  [8290, -5592],
  [8387, -5446],
  [8480, -5299],
  [8572, -5150],
  [8660, -5000],
  [8746, -4848],
  [8829, -4695],
  [8910, -4540],
  [8988, -4384],
  [9063, -4226],
  [9135, -4067],
  [9205, -3907],
  [9272, -3746],
  [9336, -3584],
  [9397, -3420],
  [9455, -3256],
  [9511, -3090],
  [9563, -2924],
  [9613, -2756],
  [9659, -2588],
  [9703, -2419],
  [9744, -2250],
  [9781, -2079],
  [9816, -1908],
  [9848, -1736],
  [9877, -1564],
  [9903, -1392],
  [9925, -1219],
  [9945, -1045],
  [9962, -872],
  [9976, -698],
  [9986, -523],
  [9994, -349],
  [9998, -175],
];

// direction basis-points for a heading (fixed DIRECTION_FIXED scale), from the
// authored integer table. Returns { cosBp, sinBp } for a folded [0,359] heading.
function directionBp(heading: number): { cosBp: number; sinBp: number } {
  const h = foldHeading(heading);
  const entry = DIRECTION_TABLE[h % 360] ?? ([0, 0] as readonly [number, number]);
  return { cosBp: entry[0], sinBp: entry[1] };
}

// AC-2: advance position from heading + currentSpeed over dtSeconds integer
// seconds. Returns an immutable advanced copy; the input is unchanged
// (reversible-to-invariant).
export interface AdvancePositionInput {
  state: MovementState;
  dtSeconds: number;
}
export function advancePosition(input: AdvancePositionInput): [number, number] {
  assertFixedPointMovement(input.state);
  if (!Number.isInteger(input.dtSeconds) || input.dtSeconds <= 0) {
    throw new BluewaveError("TACTICAL_STATE_INVARIANT_FAILED", {
      code: "TACTICAL_STATE_INVARIANT_FAILED",
      field: "dtSeconds",
      reason: "movement integration dt must be a positive integer",
      value: input.dtSeconds,
    });
  }
  const speedUmS = speedBpKnotsToUmS(input.state.currentSpeed);
  const distanceUm = speedUmS * input.dtSeconds;
  const { cosBp, sinBp } = directionBp(input.state.heading);
  const dX = Math.round((distanceUm * cosBp) / DIRECTION_FIXED);
  const dY = Math.round((distanceUm * sinBp) / DIRECTION_FIXED);
  return [input.state.position[0] + dX, input.state.position[1] + dY];
}

// AC-3: currentSpeed approaches orderedSpeed at bounded thrust/brake
// acceleration, clamped to [0, attainableMaxBpKnots]. Returns new currentSpeed.
export interface PropulsionInput {
  currentSpeed: number;
  orderedSpeed: number;
  dtSeconds: number;
  attainableMaxBpKnots?: number;
}
export function resolvePropulsion(input: PropulsionInput): number {
  if (!Number.isInteger(input.currentSpeed) || !Number.isInteger(input.orderedSpeed)) {
    throw new BluewaveError("TACTICAL_STATE_INVARIANT_FAILED", {
      code: "TACTICAL_STATE_INVARIANT_FAILED",
      field: "propulsionSpeed",
      reason: "fixed-point",
      value: { currentSpeed: input.currentSpeed, orderedSpeed: input.orderedSpeed },
    });
  }
  if (!Number.isInteger(input.dtSeconds) || input.dtSeconds <= 0) {
    throw new BluewaveError("TACTICAL_STATE_INVARIANT_FAILED", {
      code: "TACTICAL_STATE_INVARIANT_FAILED",
      field: "dtSeconds",
      reason: "propulsion dt must be a positive integer",
      value: input.dtSeconds,
    });
  }
  let next = input.currentSpeed;
  if (next < input.orderedSpeed) {
    next = Math.min(input.orderedSpeed, next + PROPULSION_ACCEL_KNOT_BP_PER_S * input.dtSeconds);
  } else if (next > input.orderedSpeed) {
    next = Math.max(input.orderedSpeed, next - PROPULSION_DECEL_KNOT_BP_PER_S * input.dtSeconds);
  }
  if (input.attainableMaxBpKnots !== undefined) {
    next = Math.min(next, input.attainableMaxBpKnots);
  }
  return next;
}

// AC-4: heading approaches orderedHeading at bounded turning rate (mdeg/s).
// Returns new integer heading in [0,359]. Reuses the reciprocal-course
// convention of battleTurnAway (180° reversal) via foldHeading semantics.
export interface TurningInput {
  heading: number;
  orderedHeading: number;
  dtSeconds: number;
  turningRateMdegS?: number;
}
export function resolveTurning(input: TurningInput): number {
  if (
    !Number.isInteger(input.heading) ||
    !Number.isInteger(input.orderedHeading) ||
    !Number.isInteger(input.dtSeconds)
  ) {
    throw new BluewaveError("TACTICAL_STATE_INVARIANT_FAILED", {
      code: "TACTICAL_STATE_INVARIANT_FAILED",
      field: "turning",
      reason: "heading/dt must be integers",
      value: { heading: input.heading, orderedHeading: input.orderedHeading },
    });
  }
  const from = foldHeading(input.heading);
  const to = foldHeading(input.orderedHeading);
  let diff = (to - from) % 360;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  const rate = input.turningRateMdegS ?? 1_000; // mdeg/s
  const maxDeltaDeg = (rate * input.dtSeconds) / 1_000;
  let delta = Math.sign(diff) * Math.min(Math.abs(diff), maxDeltaDeg);
  delta = Math.round(delta);
  return foldHeading(from + delta);
}

// reciprocal course convenience (battleTurnAway §25 step 2).
export function reciprocalCourse(heading: number): number {
  return foldHeading(heading + 180);
}

// AC-5: formation station geometry. Each unit computes a desired station from its
// ordinal and the division lead. helm steers toward the station by adopting a
// desired heading (derived from the station offset) when off-station.
export interface FormationStationContext {
  formation: DivisionFormation;
  ordinal: number; // 0 = lead
  leadPosition: [number, number];
  leadHeading: number;
  divisionIndex?: number; // column index for multi-column SCREEN/SEARCH_LINE
}
export interface DesiredStation {
  position: [number, number];
  heading: number;
  offStation: boolean;
}
export function computeDesiredStation(ctx: FormationStationContext): DesiredStation {
  const { cosBp, sinBp } = directionBp(ctx.leadHeading);
  let offsetAheadUm = 0;
  let offsetAbeamUm = 0;
  switch (ctx.formation) {
    case "LINE_AHEAD":
      // trailing ships follow in column behind the lead: interval * ordinal.
      offsetAheadUm = -ctx.ordinal * LINE_AHEAD_COLUMN_INTERVAL_UM;
      break;
    case "LINE_ABREAST":
      // ships abeam of the lead: interval * ordinal perpendicular offset.
      offsetAbeamUm = ctx.ordinal * LINE_ABREAST_ABREAST_INTERVAL_UM;
      break;
    case "SEARCH_LINE":
      offsetAheadUm = -ctx.ordinal * LINE_AHEAD_COLUMN_INTERVAL_UM;
      offsetAbeamUm = (ctx.divisionIndex ?? 0) * LINE_AHEAD_DIVISION_GAP_UM;
      break;
    case "SCREEN":
      offsetAheadUm = -ctx.ordinal * LINE_AHEAD_COLUMN_INTERVAL_UM;
      offsetAbeamUm = (ctx.divisionIndex ?? 0) * LINE_AHEAD_DIVISION_GAP_UM;
      break;
    default:
      offsetAheadUm = -ctx.ordinal * LINE_AHEAD_COLUMN_INTERVAL_UM;
  }
  // forward(ahead) and starboard(abeam) unit vectors in position space.
  const x =
    ctx.leadPosition[0] +
    (offsetAheadUm * cosBp) / DIRECTION_FIXED -
    (offsetAbeamUm * sinBp) / DIRECTION_FIXED;
  const y =
    ctx.leadPosition[1] +
    (offsetAheadUm * sinBp) / DIRECTION_FIXED +
    (offsetAbeamUm * cosBp) / DIRECTION_FIXED;
  const position: [number, number] = [Math.round(x), Math.round(y)];
  return { position, heading: ctx.leadHeading, offStation: false };
}

// helm steering: given a computed desired station and current state, returns the
// ordered heading that steers the ship back onto station (heading of the offset
// vector), or keeps the formation heading when already on station.
export function helmSteerToStation(
  state: MovementState,
  desired: DesiredStation,
  stationToleranceUm: number = STATION_TOLERANCE_UM,
): { orderedHeading: number; offStation: boolean } {
  const dx = desired.position[0] - state.position[0];
  const dy = desired.position[1] - state.position[1];
  const distSq = dx * dx + dy * dy;
  if (distSq <= stationToleranceUm * stationToleranceUm) {
    return { orderedHeading: desired.heading, offStation: false };
  }
  const headingDeg = Math.round((Math.atan2(dy, dx) / DEG_TO_RAD + 360) % 360);
  return { orderedHeading: headingDeg, offStation: true };
}

// station-bounded tolerance check (distance to the assigned station), reused by
// turn-away completion predicates. Bearing misalignment is handled by helm
// steering, not the on-station predicate.
export function onStation(
  state: MovementState,
  desired: DesiredStation,
  distanceToleranceUm: number = STATION_TOLERANCE_UM,
): boolean {
  const dx = desired.position[0] - state.position[0];
  const dy = desired.position[1] - state.position[1];
  const distSq = dx * dx + dy * dy;
  return distSq <= distanceToleranceUm * distanceToleranceUm;
}

// AC-6: collisions/grounding resolution emits a successful empty record; no
// partial mutation (resolution deferred to B-6/M3).
export interface CollisionGroundingResult {
  phase: "resolve_collisions_grounding";
  success: boolean;
  empty: boolean;
  records: unknown[];
}
export function resolveCollisionsGrounding(): CollisionGroundingResult {
  return { phase: "resolve_collisions_grounding", success: true, empty: true, records: [] };
}
