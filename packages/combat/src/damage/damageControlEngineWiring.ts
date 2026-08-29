//packages/combat/src/damage/damageControlEngineWiring.ts
// Step 8.6 resolveDamageControl — called after resolveDamage (step 8.5/9-10).
// Applies per-minute fire resolution, flooding resolution,
// damage-control allocation, and terminal state re-evaluation.
//
// Pure/deterministic: no ambient I/O/clock/random except the caller-provided
// keyedRng function for deterministic randomness when resolving fire spread
// and high-speed loss checks. Integer fixed-point arithmetic only.

import type { FireRecord, FloodingSourceRecord } from "./state.js";
import type { DamageControlResource } from "./damageControlConstants.js";
import {
  allocateDamageControl,
  getEffectivePumping,
  getEffectiveFirefighting,
  getEffectiveRepairReduction,
  type DamageControlAllocation,
} from "./damageControl.js";
import { resolveFireProgression, computeFireSmokeStrength } from "./fireResolution.js";
import { resolveFloodingProgression } from "./floodingResolution.js";
import type { SmokeSourceType } from "../smoke/constants.js";
import { createSmokeEventRecord, type SmokeEventRecord } from "../smoke/smokeRecords.js";

// ---------------------------------------------------------------------------
// Context and result types

export interface DamageControlContext {
  fireRecords: FireRecord[];
  floodingRecords: FloodingSourceRecord[];
  floodedWaterBp: number;
  shipType: string;
  currentSpeedKt: number;
  resources: DamageControlResource;
  keyedRng: ((stream: string) => number) | null;
}

export interface DamageControlStageResult {
  fireRecords: FireRecord[];
  floodingRecords: FloodingSourceRecord[];
  nextFloodedWaterBp: number;
  allocations: DamageControlAllocation[];
  smokeEventRecords: SmokeEventRecord[];
  // fire smoke creates smoke clouds
  highSpeedLoss: boolean;
}

// ---------------------------------------------------------------------------
// resolveDamageControl — per-minute damage-control stage

export function resolveDamageControl(
  context: DamageControlContext,
  battleMinute: number,
  substep: number,
): DamageControlStageResult {
  // Step 1: Allocate damage-control resources to active fire and flooding sources
  const { allocations } = allocateDamageControl(
    context.resources,
    context.fireRecords,
    context.floodingRecords,
    context.floodedWaterBp,
  );

  // Step 2: Get effective pumping, firefighting, and repair capacities
  const effectivePumping = getEffectivePumping(allocations);
  const _effectiveFirefighting = getEffectiveFirefighting(allocations);
  const effectiveRepairReduction = getEffectiveRepairReduction(allocations);

  // Step 3: Run fire progression — intensity decays, suppression, spread
  const { fireRecords, newFires } = resolveFireProgression(
    context.fireRecords,
    context.shipType,
    context.keyedRng,
  );

  // Combine existing fires with new fires from spread
  const allFires = [...fireRecords, ...newFires];

  // Step 4: Resolve flooding progression — compute net delta, severity, high-speed check.
  // The effective pumping and repair reduction from damage-control allocation are used here.
  const progressiveFailureBp = 10_000; // Default: no progressive failure multiplier
  const { nextFloodedWaterBp, highSpeedLoss } = resolveFloodingProgression(
    context.floodingRecords,
    context.floodedWaterBp,
    context.currentSpeedKt,
    progressiveFailureBp,
    effectivePumping,
    effectiveRepairReduction,
    context.keyedRng,
  );

  // Step 5: Compute fire smoke (DESIGN-41 §25) from each active fire
  const smokeEventRecords: SmokeEventRecord[] = [];
  for (const fire of allFires) {
    const smokeStrength = computeFireSmokeStrength(fire.intensityBp, context.shipType);
    if (smokeStrength > 0) {
      // For fire smoke, we use the locationId + minute as a synthetic cloud id
      const cloudId = `fire-smoke-${fire.locationId}-${battleMinute}`;
      smokeEventRecords.push(
        createSmokeEventRecord({
          kind: "FUNNEL_EMISSION",
          battleMinute,
          substep,
          sourceType: "FIRE" as SmokeSourceType,
          sourceId: fire.locationId,
          cloudId,
          position: [0, 0] as readonly [number, number], // Position updated by owning stage
          densityBp: smokeStrength,
          weatherContext: null,
        }),
      );
    }
  }

  return {
    fireRecords: allFires,
    floodingRecords: context.floodingRecords,
    nextFloodedWaterBp,
    allocations,
    smokeEventRecords,
    highSpeedLoss,
  };
}
