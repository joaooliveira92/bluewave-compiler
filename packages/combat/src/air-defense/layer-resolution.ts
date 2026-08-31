// packages/combat/src/air-defense/layer-resolution.ts
// D-4 M4 Aviation: Air Defense — Layer resolution + eligibility predicates
// per DESIGN-45 §1, §7, §8, §9, §16, §18.
//
// Resolution order: HEAVY_AA → MEDIUM_AA → LIGHT_AA → CIWS_TERMINAL_DEFENSE.
// CAP/SAM layers are deferred to E-track (§1 full layer order).
//
// This is a PURE deterministic function operating on (state, attack, context).
// It does NOT mutate state. Returns new structured data.

import { SafeInt } from "@bluewave/contracts";
import type { AirDefenseAttack, AttackTypeId } from "./air-defense-attack.js";
import type { AirDefenseSystemDefinition, LayerId } from "./air-defense-system-definition.js";
import type { AirDefenseState } from "./air-defense-state.js";
import {
  NAUTICAL_MILE_M,
  PROTECTED_RADIUS,
  LIGHT_AA_WINDOW_DURATIONS,
  effectiveLightAAWindowMilliseconds,
  lightAASpeedMultiplierBp,
} from "./constants.js";
import {
  AIR_DEFENSE_AMMUNITION_UNAVAILABLE,
  AIR_DEFENSE_CHANNEL_UNAVAILABLE,
  AIR_DEFENSE_TARGET_INELIGIBLE,
  HEAVY_AA_PROTECTED_RADIUS_EXCEEDED,
  MEDIUM_AA_PRE_RELEASE_WINDOW_MISSED,
} from "./reason-codes.js";

// ---- §28 Reason codes (string literals for INC-2; full enum in INC-5) ----

export type ReasonCode = string;

// ---- System eligibility result ----

export interface SystemEligibilityResult {
  readonly systemId: string;
  readonly eligible: boolean;
  readonly reason: ReasonCode; // empty string if eligible
}

// ---- Layer eligibility outcome ----

export interface LayerEligibilityOutcome {
  readonly layer: LayerId;
  readonly eligibleSystems: ReadonlyArray<SystemEligibilityResult>;
  /** Whether the attack survived this layer. Always true in INC-2 (no engagement resolution). */
  readonly attackSurvived: boolean;
  /** Effective light-AA window milliseconds (only set for LIGHT_AA layer, 0 otherwise). */
  readonly effectiveWindowMs: number;
}

/** Ordered result of layer resolution — one entry per resolved layer. */
export type LayerResolutionResult = ReadonlyArray<LayerEligibilityOutcome>;

// ---- Defense context ----

/**
 * Explicit battlefield context for layer resolution.
 * All distances in meters, all speeds in knots, all bp in basis points.
 * No ambient state reads — everything is passed in.
 */
export interface AirDefenseContext {
  /** ID of the ship that owns these air-defense systems. */
  readonly defendingShipId: string;
  /** ID of the ship being attacked. */
  readonly targetShipId: string;
  /** Hull classification of the target ship (e.g. "CA", "CV", "DD"). */
  readonly targetType: string;
  /** ShipId → distance in meters from the defending ship. Used for heavy-AA protected radius. */
  readonly nearbyShips: ReadonlyMap<string, SafeInt>;
  /** Attacker's current range from the defended ship in meters. */
  readonly attackerRangeM: SafeInt;
  /** Attacker's current altitude in meters. */
  readonly attackerAltitudeM: SafeInt;
  /** Fire control solution quality in basis points (0-10_000). Used for medium-AA 4_000bp check. */
  readonly fireControlSolutionBp: SafeInt;
  /** Whether the attack is still pre-release (weapon not yet released). */
  readonly isPreRelease: boolean;
}

// ---- Resolution order ----

/**
 * Fixed layer resolution order per §1.
 * CAP, HEAVY_SAM, MEDIUM_SAM, LIGHT_SAM are deferred to E-track.
 * This increment resolves only the 4 AA/CIWS layers.
 */
export const RESOLUTION_ORDER: readonly LayerId[] = [
  "HEAVY_AA",
  "MEDIUM_AA",
  "LIGHT_AA",
  "CIWS_TERMINAL_DEFENSE",
];

// ---- §18 Attack-layer eligibility matrix ----
// Which attack types each layer can engage (lines 307-318).
// A defense layer ABSENT from the attack's eligibility set MUST NOT engage it.

const HEAVY_AA_ELIGIBLE_TYPES: ReadonlySet<AttackTypeId> = new Set([
  "AIRCRAFT_LEVEL_BOMBING", // "applicable SAM/AA" → heavy AA
  "AIRCRAFT_ROCKET_ATTACK", // "applicable SAM/AA" → heavy AA
  "AIRCRAFT_GUIDED_WEAPON_ATTACK", // aircraft before release
  "LIGHT_ASM", // if explicitly capable (see REQUIRES_EXPLICIT_CAPABILITY)
]);

const MEDIUM_AA_ELIGIBLE_TYPES: ReadonlySet<AttackTypeId> = new Set([
  "AIRCRAFT_LEVEL_BOMBING", // medium AA before release
  "AIRCRAFT_DIVE_BOMBING", // medium AA before release
  "AIRCRAFT_SKIP_BOMBING", // medium AA before release
  "AIRCRAFT_TORPEDO_ATTACK", // medium AA before release
  "AIRCRAFT_ROCKET_ATTACK", // medium AA before release
  "AIRCRAFT_GUIDED_WEAPON_ATTACK", // medium AA before release (aircraft)
]);

const LIGHT_AA_ELIGIBLE_TYPES: ReadonlySet<AttackTypeId> = new Set([
  "AIRCRAFT_LEVEL_BOMBING",
  "AIRCRAFT_DIVE_BOMBING",
  "AIRCRAFT_SKIP_BOMBING",
  "AIRCRAFT_TORPEDO_ATTACK",
  "AIRCRAFT_ROCKET_ATTACK",
  "AIRCRAFT_GUIDED_WEAPON_ATTACK",
  "LIGHT_ASM", // if explicitly capable (see REQUIRES_EXPLICIT_CAPABILITY)
]);

const CIWS_ELIGIBLE_TYPES: ReadonlySet<AttackTypeId> = new Set([
  "HEAVY_ASM",
  "MEDIUM_ASM",
  "LIGHT_ASM",
  "AIRCRAFT_LEVEL_BOMBING",
  "AIRCRAFT_DIVE_BOMBING",
  "AIRCRAFT_SKIP_BOMBING",
  "AIRCRAFT_TORPEDO_ATTACK",
  "AIRCRAFT_ROCKET_ATTACK",
  "AIRCRAFT_GUIDED_WEAPON_ATTACK",
]);

const LAYER_ELIGIBLE_TYPES: ReadonlyMap<LayerId, ReadonlySet<AttackTypeId>> = new Map([
  ["HEAVY_AA", HEAVY_AA_ELIGIBLE_TYPES],
  ["MEDIUM_AA", MEDIUM_AA_ELIGIBLE_TYPES],
  ["LIGHT_AA", LIGHT_AA_ELIGIBLE_TYPES],
  ["CIWS_TERMINAL_DEFENSE", CIWS_ELIGIBLE_TYPES],
]);

/**
 * (Layer, attackType) pairs that require the attack type to be explicitly
 * listed in the system's profileEligibility. This encodes the §18 "if-explicitly
 * capable" rules:
 *   - heavy AA engaging LIGHT_ASM (§18: "HEAVY_AA-if-explicitly-capable")
 *   - light AA engaging LIGHT_ASM (§18: "LIGHT_AA-if-explicitly-capable")
 *   - CIWS engaging HEAVY_ASM (§18: "CIWS ... terminal defense" only for
 *     explicitly capable systems)
 *   - CIWS engaging MEDIUM_ASM (§18: "compatible terminal defense" requires the
 *     CIWS to declare the attack type; see ADR-0042)
 * A layer absent from the attack's explicit eligibility set MUST NOT engage it
 * (§18 line 318).
 */
const REQUIRES_EXPLICIT_CAPABILITY: ReadonlySet<string> = new Set([
  "HEAVY_AA:LIGHT_ASM",
  "LIGHT_AA:LIGHT_ASM",
  "CIWS_TERMINAL_DEFENSE:HEAVY_ASM",
  "CIWS_TERMINAL_DEFENSE:MEDIUM_ASM",
]);

// ---- Attack type → light-AA window profile key ----

const ATTACK_TYPE_TO_WINDOW_KEY: ReadonlyMap<AttackTypeId, keyof typeof LIGHT_AA_WINDOW_DURATIONS> =
  new Map([
    ["AIRCRAFT_LEVEL_BOMBING", "LEVEL"],
    ["AIRCRAFT_DIVE_BOMBING", "DIVE"],
    ["AIRCRAFT_SKIP_BOMBING", "SKIP"],
    ["AIRCRAFT_TORPEDO_ATTACK", "TORPEDO"],
    ["AIRCRAFT_ROCKET_ATTACK", "ROCKET"],
    ["AIRCRAFT_GUIDED_WEAPON_ATTACK", "GUIDED_WEAPON"],
  ]);

// ---- Helper: ineligible result ----

function ineligible(systemId: string, reason: ReasonCode): SystemEligibilityResult {
  return { systemId, eligible: false, reason };
}

function eligible(systemId: string): SystemEligibilityResult {
  return { systemId, eligible: true, reason: "" };
}

// ---- Generic capability checks (shared across layers) ----

/**
 * Checks range, altitude, speed, ammunition, and mount-count against
 * the system definition. Returns null if all pass, or a reason code.
 */
function checkSystemCapabilities(
  system: AirDefenseSystemDefinition,
  state: AirDefenseState,
  attack: AirDefenseAttack,
  context: AirDefenseContext,
): ReasonCode | null {
  // Range check: attacker must be within system's engagement range envelope
  const range = Number(context.attackerRangeM);
  if (range < Number(system.rangeMinM) || range > Number(system.rangeMaxM)) {
    return AIR_DEFENSE_TARGET_INELIGIBLE;
  }

  // Altitude check: attacker must be within system's altitude envelope
  const altitude = Number(context.attackerAltitudeM);
  if (altitude < Number(system.altitudeMinM) || altitude > Number(system.altitudeMaxM)) {
    return AIR_DEFENSE_TARGET_INELIGIBLE;
  }

  // Speed check: convert knots to m/s for comparison with system limit
  // 1 knot = 1852 m / 3600 s (exact). Deterministic integer floor.
  const speedMps = SafeInt.div(
    SafeInt.mul(attack.speedKnots, SafeInt(NAUTICAL_MILE_M)),
    SafeInt(3600),
    "floor",
  );
  if (speedMps > Number(system.targetSpeedLimitMps)) {
    return AIR_DEFENSE_TARGET_INELIGIBLE;
  }

  // Ammunition check: if system has a tracked ammo entry with 0 rounds, reject
  const ammo = state.ammunitionByType.get(system.systemId);
  if (ammo !== undefined && Number(ammo) <= 0) {
    return AIR_DEFENSE_AMMUNITION_UNAVAILABLE;
  }

  // Mount check: system must have at least one mount
  if (Number(system.mountCount) <= 0) {
    return AIR_DEFENSE_TARGET_INELIGIBLE;
  }

  return null;
}

/**
 * Checks that the system has at least one free engagement channel.
 * A channel is "free" if it is not reserved in state.channelReservations,
 * or if it is reserved for this system (already allocated).
 */
function checkFreeChannel(
  system: AirDefenseSystemDefinition,
  state: AirDefenseState,
): ReasonCode | null {
  for (const channelId of system.engagementChannels) {
    const reservedFor = state.channelReservations.get(channelId);
    if (reservedFor === undefined || reservedFor === system.systemId) {
      return null; // at least one channel is free or already allocated to this system
    }
  }
  return AIR_DEFENSE_CHANNEL_UNAVAILABLE;
}

// ---- Layer-specific eligibility predicates ----

/**
 * §7 Heavy AA eligibility:
 * (a) attacking the defended ship OR a nearby protected ship within PROTECTED_RADIUS (5 nm = 9260 m)
 * (b) target within system's range/altitude/speed/etc limits
 * (c) firing ship not sunk/abandoned/unable-to-operate
 */
function checkHeavyAAEligibility(
  system: AirDefenseSystemDefinition,
  state: AirDefenseState,
  attack: AirDefenseAttack,
  context: AirDefenseContext,
): ReasonCode | null {
  // (a) Protected radius check:
  // Heavy AA protects its own ship AND nearby protected ships within PROTECTED_RADIUS (5 nm = 9260 m).
  // A target is engageable if it is the defended ship itself, OR it is a nearby
  // ship listed in context.nearbyShips within the protected radius.
  // An unrelated formation outside the protected radius MUST NOT be engaged.
  const isDefendedShip = attack.targetId === context.defendingShipId;

  if (!isDefendedShip) {
    const distanceM = context.nearbyShips.get(attack.targetId);
    if (distanceM === undefined || Number(distanceM) > PROTECTED_RADIUS) {
      return HEAVY_AA_PROTECTED_RADIUS_EXCEEDED;
    }
  }

  // (c) Firing ship not sunk/abandoned/unable-to-operate:
  // Ship is sunk if damage >= 10_000 bp (100%)
  if (Number(state.damageBp) >= 10_000) {
    return AIR_DEFENSE_TARGET_INELIGIBLE;
  }

  return null;
}

/**
 * §8 Medium AA eligibility:
 * - mediumAaEligible flag must be true
 * - Pre-release window: target must be pre-release
 * - Fire control solution >= 4_000 bp
 * - Free channel + ammunition
 */
function checkMediumAAEligibility(
  system: AirDefenseSystemDefinition,
  state: AirDefenseState,
  attack: AirDefenseAttack,
  context: AirDefenseContext,
): ReasonCode | null {
  // mediumAaEligible check (per §8: "may engage ONLY an attack profile explicitly marked")
  if (!attack.mediumAaEligible) {
    return AIR_DEFENSE_TARGET_INELIGIBLE;
  }

  // Pre-release check
  if (!context.isPreRelease) {
    return MEDIUM_AA_PRE_RELEASE_WINDOW_MISSED;
  }

  // Fire control solution >= 4_000 bp
  if (Number(context.fireControlSolutionBp) < 4_000) {
    return AIR_DEFENSE_TARGET_INELIGIBLE;
  }

  // Free channel check
  const channelResult = checkFreeChannel(system, state);
  if (channelResult !== null) return channelResult;

  return null;
}

/**
 * §9 Light AA eligibility:
 * - System profile eligibility per §18 matrix
 * - Window computed via §9 formula (reuse constants helpers)
 * - Speed-band multiplier applied
 */
function computeLightAAWindow(attack: AirDefenseAttack): { windowMs: number; hasWindow: boolean } {
  const windowKey = ATTACK_TYPE_TO_WINDOW_KEY.get(attack.attackType);
  if (windowKey === undefined) {
    return { windowMs: 0, hasWindow: false };
  }

  const baseWindowSeconds = LIGHT_AA_WINDOW_DURATIONS[windowKey];
  const baseWindowMs = baseWindowSeconds * 1_000;
  const speedMultiplierBp = lightAASpeedMultiplierBp(Number(attack.speedKnots));
  const effectiveWindowMs = effectiveLightAAWindowMilliseconds(baseWindowMs, speedMultiplierBp);

  return { windowMs: effectiveWindowMs, hasWindow: true };
}

function checkLightAAEligibility(
  _system: AirDefenseSystemDefinition,
  _state: AirDefenseState,
  _attack: AirDefenseAttack,
  _context: AirDefenseContext,
): ReasonCode | null {
  // Light-AA eligibility is gated at the layer level by the §18 attack-type
  // eligibility matrix (LAYER_ELIGIBLE_TYPES / REQUIRES_EXPLICIT_CAPABILITY),
  // which is enforced earlier in checkSystemEligibilityForLayer.
  //
  // The §9 window computation is NOT a gating condition: attack types in the
  // §9 window table (aircraft delivery profiles) get an engagement window,
  // while types like LIGHT_ASM engaged "if explicitly capable" per §18 are
  // allowed without a §9 pre-impact window entry. The effective window is
  // exposed as informational output on the LayerEligibilityOutcome.
  //
  // No additional layer-specific checks in INC-2 (availability/saturation
  // scaling is INC-4).
  return null;
}

/**
 * §16 CIWS eligibility:
 * - System profile eligibility per §18 matrix
 * - Availability (system operational)
 */
function checkCIWSEligibility(
  _system: AirDefenseSystemDefinition,
  _state: AirDefenseState,
  _attack: AirDefenseAttack,
  _context: AirDefenseContext,
): ReasonCode | null {
  // CIWS is terminal defense — all §18-eligible attack types can be engaged.
  // Availability checks are deferred to INC-4 (saturation scaling).
  return null;
}

// ---- Layer-specific dispatch ----

function checkLayerSpecificEligibility(
  layer: LayerId,
  system: AirDefenseSystemDefinition,
  state: AirDefenseState,
  attack: AirDefenseAttack,
  context: AirDefenseContext,
): ReasonCode | null {
  switch (layer) {
    case "HEAVY_AA":
      return checkHeavyAAEligibility(system, state, attack, context);
    case "MEDIUM_AA":
      return checkMediumAAEligibility(system, state, attack, context);
    case "LIGHT_AA":
      return checkLightAAEligibility(system, state, attack, context);
    case "CIWS_TERMINAL_DEFENSE":
      return checkCIWSEligibility(system, state, attack, context);
  }
}

// ---- Main eligibility check per system per layer ----

function checkSystemEligibilityForLayer(
  layer: LayerId,
  system: AirDefenseSystemDefinition,
  state: AirDefenseState,
  attack: AirDefenseAttack,
  context: AirDefenseContext,
): SystemEligibilityResult {
  // Step 1: Layer-level attack-type eligibility (§18 matrix)
  const layerTypes = LAYER_ELIGIBLE_TYPES.get(layer);
  if (!layerTypes?.has(attack.attackType)) {
    return ineligible(system.systemId, AIR_DEFENSE_TARGET_INELIGIBLE);
  }

  // Step 2: Target-type eligibility — system must accept the target type
  if (!system.profileEligibility.has(context.targetType)) {
    return ineligible(system.systemId, AIR_DEFENSE_TARGET_INELIGIBLE);
  }

  // Step 3: Explicit-capability requirement (§18 "if-explicitly-capable")
  const explicitKey = `${layer}:${attack.attackType}`;
  if (REQUIRES_EXPLICIT_CAPABILITY.has(explicitKey)) {
    if (!system.profileEligibility.has(attack.attackType)) {
      return ineligible(system.systemId, AIR_DEFENSE_TARGET_INELIGIBLE);
    }
  }

  // Step 4: Generic capability checks (range, altitude, speed, ammo, mounts)
  const capReason = checkSystemCapabilities(system, state, attack, context);
  if (capReason !== null) {
    return ineligible(system.systemId, capReason);
  }

  // Step 5: Layer-specific eligibility predicate
  const layerReason = checkLayerSpecificEligibility(layer, system, state, attack, context);
  if (layerReason !== null) {
    return ineligible(system.systemId, layerReason);
  }

  return eligible(system.systemId);
}

// ---- Layer resolution (main entry point) ----

/**
 * Resolves air-defense layer eligibility in canonical order:
 * HEAVY_AA → MEDIUM_AA → LIGHT_AA → CIWS_TERMINAL_DEFENSE.
 *
 * For each layer, collects all systems and evaluates eligibility.
 * A layer with no systems at all or no eligible systems emits a
 * successful empty result (§1 line 20).
 *
 * In INC-2, engagement resolution (kill/abort) is not implemented,
 * so `attackSurvived` is always true and the attack always proceeds
 * to the next layer.
 *
 * This function is PURE and deterministic — it does not mutate state.
 */
export function resolveLayerEligibility(
  state: AirDefenseState,
  attack: AirDefenseAttack,
  context: AirDefenseContext,
): LayerResolutionResult {
  const results: LayerEligibilityOutcome[] = [];

  for (const layer of RESOLUTION_ORDER) {
    const layerSystems = state.systems.filter((s) => s.layer === layer);
    const eligibleSystems: SystemEligibilityResult[] = [];

    for (const system of layerSystems) {
      const result = checkSystemEligibilityForLayer(layer, system, state, attack, context);
      eligibleSystems.push(result);
    }

    // Compute light-AA window for LIGHT_AA layer (informational output)
    let effectiveWindowMs = 0;
    if (layer === "LIGHT_AA") {
      const { windowMs, hasWindow } = computeLightAAWindow(attack);
      if (hasWindow) {
        effectiveWindowMs = windowMs;
      }
    }

    results.push({
      layer,
      eligibleSystems,
      attackSurvived: true, // INC-2: no engagement resolution
      effectiveWindowMs,
    });

    // INC-2: attack always survives (no kill/abort)
    // Future INC-3: check if any system killed/aborted the attack at this layer
    // If so, set attackSurvived = false and stop iterating.
  }

  return results;
}
