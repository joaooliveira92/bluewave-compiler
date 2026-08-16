//packages/combat/src/torpedoes/constants.ts
// Versioned authoritative torpedo base constants (DESIGN-40 §1-§4 surface shipped
// by INC-1; §7/§8/§23 shipped integer values seeded for INC-2/INC-6 use) shipped
// as a `torpedo_v1` policy + `SHIPPED_TORPEDO_CONTRACT` + `validateTorpedoContract`,
// mirroring packages/combat/src/gunnery/constants.ts. Fail-closed on mismatch.
// Grounded in docs/research/c1-m3-torpedoes.md and recorded in the C-1 ADR
// (ADR-0029, INC-8). Pure/deterministic: fixed integer constants only.
import { BluewaveError } from "@bluewave/contracts";
import { TORPEDO_STATE_INVARIANT_FAILED } from "./reasonCodes.js";

export const torpedoPolicyId = "torpedo_v1" as const;

// Ruleset and formula versions pinned by the torpedo_v1 contract.
export const TORPEDO_RULESET_VERSION = "torpedo_ruleset_v1" as const;
export const TORPEDO_FORMULA_VERSION = "torpedo_formula_v1" as const;

// fixed-point scale shared by every basis-point quantity in this subsystem.
export const TORPEDO_BASIS_POINTS_PER_UNIT = 10_000 as const;

// Speeds are authored as integer basis-point knots (knots * 1_000) on the
// movement precedent (packages/combat/src/movement/constants.ts SPEED_BP_SCALE):
// 26.5 kn is the integer 26_500 bp. The engine-facing conversion to integer
// micrometres-per-second uses KNOTS_TO_UM_S (1 kn = 514_444 µm/s, DESIGN-40 §7
// pins 25 kn = 12_861_100 µm/s).
export const TORPEDO_SPEED_BP_SCALE = 1_000 as const;
export const TORPEDO_KNOTS_TO_UM_S = 514_444 as const;

// DESIGN-40 §1: every torpedo model carries reliability as basis points. The
// research note (docs/research/c1-m3-torpedoes.md §4.5) authors reliability on
// a per-100_000 scale (96_000 = 96.0%), finer-grained than 10_000 bp; the model
// constant set keeps those integers verbatim with this explicit scale.
export const TORPEDO_RELIABILITY_SCALE = 100_000 as const;

// DESIGN-40 §2 closed mount-type enum — exactly these five values.
export const TORPEDO_MOUNT_TYPES = [
  "ABOVE_WATER_FIXED",
  "ABOVE_WATER_TRAINABLE",
  "UNDERWATER_FIXED",
  "UNDERWATER_TRAINABLE",
  "SUBMARINE_INTERNAL",
] as const;
export type TorpedoMountType = (typeof TORPEDO_MOUNT_TYPES)[number];

// Canonical propulsion types (research note §4.1 / §4.4). §21 propulsion tube-hit
// multipliers and §4.4 wake-visibility modifiers are keyed off these.
export const TORPEDO_PROPULSION_TYPES = [
  "COMPRESSED_AIR",
  "WET_HEATER",
  "ELECTRIC",
  "OXYGEN",
] as const;
export type TorpedoPropulsionType = (typeof TORPEDO_PROPULSION_TYPES)[number];

// Canonical warhead types (research note §3.5 explosive-equivalence table).
export const TORPEDO_WARHEAD_TYPES = [
  "WET_GUNCOTTON",
  "TNT",
  "TORPEX",
  "TPX",
  "HBX",
  "HEXANITE",
  "TYPE_97",
] as const;
export type TorpedoWarheadType = (typeof TORPEDO_WARHEAD_TYPES)[number];

// Per-model tube-hit-hazard policies (research note §4.8): ORDINARY for
// compressed-air/wet-heater, OXYGEN for oxygen, ELECTRIC for electric — matching
// the shipped DESIGN-40 §21 propulsion multipliers.
export const TUBE_HIT_HAZARD_POLICIES = ["ORDINARY", "OXYGEN", "ELECTRIC"] as const;
export type TubeHitHazardPolicy = (typeof TUBE_HIT_HAZARD_POLICIES)[number];

// DESIGN-40 §2 fire-control connection state (launcher state surface).
export const FIRE_CONTROL_CONNECTION_STATES = [
  "CONNECTED",
  "DEGRADED",
  "DISCONNECTED",
] as const;
export type FireControlConnectionState = (typeof FIRE_CONTROL_CONNECTION_STATES)[number];

// DESIGN-40 §2 damage state; §21 severe underwater-tube flooding sets DESTROYED.
export const LAUNCHER_DAMAGE_STATES = ["OPERATIONAL", "DAMAGED", "DESTROYED"] as const;
export type LauncherDamageState = (typeof LAUNCHER_DAMAGE_STATES)[number];

// DESIGN-40 §18/§21 flooding-isolation states (intact / degraded / failed
// isolation multipliers 5_000 / 10_000 / 15_000).
export const FLOODING_ISOLATION_STATES = ["INTACT", "DEGRADED", "FAILED"] as const;
export type FloodingIsolationState = (typeof FLOODING_ISOLATION_STATES)[number];

// DESIGN-40 §2 "loaded torpedo model per tube or EMPTY" marker.
export const EMPTY_TUBE = "EMPTY" as const;
// DESIGN-40 §2 "active fire solution or NONE" marker.
export const NO_FIRE_SOLUTION = "NONE" as const;

// DESIGN-40 §7 underwater-tube speed limit (surface ships): exactly 25 knots =
// 12_861_100 µm/s; predicate currentSpeedMicrometresPerSecond <= 12_861_100.
// Flagged BALANCE TARGET in the research note (§4.6: historical practical band
// was ~15-20 kn); the shipped 25-kn ceiling is design-pinned, not silently tuned.
export const UNDERWATER_TUBE_MAX_SPEED_KNOTS = 25 as const;
export const UNDERWATER_TUBE_MAX_SPEED_UM_S = 12_861_100 as const;

// DESIGN-40 §8 above-water launcher speed defaults (exact shipped integers);
// a launcher definition MAY declare a narrower value (INC-2 enforces).
export const ABOVE_WATER_FIXED_MAX_LAUNCH_SPEED_KNOTS = 30 as const;
export const ABOVE_WATER_TRAINABLE_MAX_LAUNCH_SPEED_KNOTS = 35 as const;

// DESIGN-40 §23 shipped oxygen-torpedo effects (declared per oxygen model in
// OxygenTorpedoState; mechanics resolve in INC-6). BALANCE TARGET: oxygen
// wake-detection 7_500 vs near-invisible wake evidence (research §4.4) — the
// per-model wakeVisibilityModifierBp is the lever, the shipped §23 value is not
// silently changed.
export const OXYGEN_RANGE_MULTIPLIER_BP = 15_000 as const;
export const OXYGEN_SPEED_MULTIPLIER_BP = 11_000 as const;
export const OXYGEN_WAKE_DETECTION_MULTIPLIER_BP = 7_500 as const;
export const OXYGEN_TUBE_HIT_SEVERE_FLOODING_MULTIPLIER_BP = 15_000 as const;
export const OXYGEN_CHAIN_REACTION_BASE_BP = 3_000 as const;

// INC-1 grounded seed model set (docs/research/c1-m3-torpedoes.md §4.1). The
// FULL research-grounded `torpedo_models_v1` model/content constant set rolls up
// in INC-8; INC-1 seeds 5 representative models covering every propulsion type
// and era band EARLY/PRE_WAR/INTERWAR.
export const SEED_TORPEDO_MODEL_IDS = [
  "whitehead_18in_1894",
  "rn_21in_mk_iv_1916",
  "ger_533mm_g7a_1934",
  "ger_533mm_g7e_1936",
  "jpn_61cm_type93_1935",
] as const;
export type SeedTorpedoModelId = (typeof SEED_TORPEDO_MODEL_IDS)[number];

// ---------------------------------------------------------------------------
// TorpedoContract — ships the INC-1 authored constant surface. The full
// research-grounded `torpedo_models_v1` model/content set rolls up in INC-8;
// INC-1 seeds the model contract + the grounded seed-model ids.
export interface TorpedoContract {
  policyId: string;
  rulesetVersion: string;
  formulaVersion: string;
  basisPointsPerUnit: number;
  speedBpScale: number;
  knotsToUmS: number;
  reliabilityScale: number;
  mountTypes: readonly TorpedoMountType[];
  propulsionTypes: readonly TorpedoPropulsionType[];
  warheadTypes: readonly TorpedoWarheadType[];
  tubeHitHazardPolicies: readonly TubeHitHazardPolicy[];
  fireControlConnectionStates: readonly FireControlConnectionState[];
  launcherDamageStates: readonly LauncherDamageState[];
  floodingIsolationStates: readonly FloodingIsolationState[];
  underwaterTubeMaxSpeedKnots: number;
  underwaterTubeMaxSpeedUmS: number;
  aboveWaterFixedMaxLaunchSpeedKnots: number;
  aboveWaterTrainableMaxLaunchSpeedKnots: number;
  oxygenRangeMultiplierBp: number;
  oxygenSpeedMultiplierBp: number;
  oxygenWakeDetectionMultiplierBp: number;
  oxygenTubeHitSevereFloodingMultiplierBp: number;
  oxygenChainReactionBaseBp: number;
  shippedModelIds: readonly string[];
}

export const SHIPPED_TORPEDO_CONTRACT: TorpedoContract = {
  policyId: torpedoPolicyId,
  rulesetVersion: TORPEDO_RULESET_VERSION,
  formulaVersion: TORPEDO_FORMULA_VERSION,
  basisPointsPerUnit: TORPEDO_BASIS_POINTS_PER_UNIT,
  speedBpScale: TORPEDO_SPEED_BP_SCALE,
  knotsToUmS: TORPEDO_KNOTS_TO_UM_S,
  reliabilityScale: TORPEDO_RELIABILITY_SCALE,
  mountTypes: TORPEDO_MOUNT_TYPES,
  propulsionTypes: TORPEDO_PROPULSION_TYPES,
  warheadTypes: TORPEDO_WARHEAD_TYPES,
  tubeHitHazardPolicies: TUBE_HIT_HAZARD_POLICIES,
  fireControlConnectionStates: FIRE_CONTROL_CONNECTION_STATES,
  launcherDamageStates: LAUNCHER_DAMAGE_STATES,
  floodingIsolationStates: FLOODING_ISOLATION_STATES,
  underwaterTubeMaxSpeedKnots: UNDERWATER_TUBE_MAX_SPEED_KNOTS,
  underwaterTubeMaxSpeedUmS: UNDERWATER_TUBE_MAX_SPEED_UM_S,
  aboveWaterFixedMaxLaunchSpeedKnots: ABOVE_WATER_FIXED_MAX_LAUNCH_SPEED_KNOTS,
  aboveWaterTrainableMaxLaunchSpeedKnots: ABOVE_WATER_TRAINABLE_MAX_LAUNCH_SPEED_KNOTS,
  oxygenRangeMultiplierBp: OXYGEN_RANGE_MULTIPLIER_BP,
  oxygenSpeedMultiplierBp: OXYGEN_SPEED_MULTIPLIER_BP,
  oxygenWakeDetectionMultiplierBp: OXYGEN_WAKE_DETECTION_MULTIPLIER_BP,
  oxygenTubeHitSevereFloodingMultiplierBp: OXYGEN_TUBE_HIT_SEVERE_FLOODING_MULTIPLIER_BP,
  oxygenChainReactionBaseBp: OXYGEN_CHAIN_REACTION_BASE_BP,
  shippedModelIds: SEED_TORPEDO_MODEL_IDS,
};

function throwMismatch(contract: unknown, reason: string): never {
  throw new BluewaveError(TORPEDO_STATE_INVARIANT_FAILED, {
    code: TORPEDO_STATE_INVARIANT_FAILED,
    contract,
    reason,
  });
}

function arrayEquals(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function validateTorpedoContract(
  c: Partial<TorpedoContract> | null | undefined,
): asserts c is TorpedoContract {
  if (!c) throwMismatch(c, "torpedo_v1 missing contract");
  if (c.policyId !== torpedoPolicyId) throwMismatch(c, "torpedo_v1 expectant policy id");
  if (c.rulesetVersion !== TORPEDO_RULESET_VERSION || c.formulaVersion !== TORPEDO_FORMULA_VERSION)
    throwMismatch(c, "torpedo_v1 ruleset/formula versions");
  if (c.basisPointsPerUnit !== TORPEDO_BASIS_POINTS_PER_UNIT)
    throwMismatch(c, "torpedo_v1 basis-point scale");
  if (c.speedBpScale !== TORPEDO_SPEED_BP_SCALE || c.knotsToUmS !== TORPEDO_KNOTS_TO_UM_S)
    throwMismatch(c, "torpedo_v1 speed scale (knots bp / µm-s conversion)");
  if (c.reliabilityScale !== TORPEDO_RELIABILITY_SCALE)
    throwMismatch(c, "torpedo_v1 reliability scale");
  if (!c.mountTypes || !arrayEquals(c.mountTypes, TORPEDO_MOUNT_TYPES))
    throwMismatch(c, "torpedo_v1 mount-type closed enum (§2)");
  if (!c.propulsionTypes || !arrayEquals(c.propulsionTypes, TORPEDO_PROPULSION_TYPES))
    throwMismatch(c, "torpedo_v1 propulsion-type set");
  if (!c.warheadTypes || !arrayEquals(c.warheadTypes, TORPEDO_WARHEAD_TYPES))
    throwMismatch(c, "torpedo_v1 warhead-type set");
  if (!c.tubeHitHazardPolicies || !arrayEquals(c.tubeHitHazardPolicies, TUBE_HIT_HAZARD_POLICIES))
    throwMismatch(c, "torpedo_v1 tube-hit-hazard policy set");
  if (
    !c.fireControlConnectionStates ||
    !arrayEquals(c.fireControlConnectionStates, FIRE_CONTROL_CONNECTION_STATES)
  )
    throwMismatch(c, "torpedo_v1 fire-control connection states");
  if (!c.launcherDamageStates || !arrayEquals(c.launcherDamageStates, LAUNCHER_DAMAGE_STATES))
    throwMismatch(c, "torpedo_v1 launcher damage states");
  if (!c.floodingIsolationStates || !arrayEquals(c.floodingIsolationStates, FLOODING_ISOLATION_STATES))
    throwMismatch(c, "torpedo_v1 flooding-isolation states");
  if (
    c.underwaterTubeMaxSpeedKnots !== UNDERWATER_TUBE_MAX_SPEED_KNOTS ||
    c.underwaterTubeMaxSpeedUmS !== UNDERWATER_TUBE_MAX_SPEED_UM_S
  )
    throwMismatch(c, "torpedo_v1 §7 underwater-tube speed limit");
  if (
    c.aboveWaterFixedMaxLaunchSpeedKnots !== ABOVE_WATER_FIXED_MAX_LAUNCH_SPEED_KNOTS ||
    c.aboveWaterTrainableMaxLaunchSpeedKnots !== ABOVE_WATER_TRAINABLE_MAX_LAUNCH_SPEED_KNOTS
  )
    throwMismatch(c, "torpedo_v1 §8 above-water launch speed defaults");
  if (
    c.oxygenRangeMultiplierBp !== OXYGEN_RANGE_MULTIPLIER_BP ||
    c.oxygenSpeedMultiplierBp !== OXYGEN_SPEED_MULTIPLIER_BP ||
    c.oxygenWakeDetectionMultiplierBp !== OXYGEN_WAKE_DETECTION_MULTIPLIER_BP ||
    c.oxygenTubeHitSevereFloodingMultiplierBp !== OXYGEN_TUBE_HIT_SEVERE_FLOODING_MULTIPLIER_BP ||
    c.oxygenChainReactionBaseBp !== OXYGEN_CHAIN_REACTION_BASE_BP
  )
    throwMismatch(c, "torpedo_v1 §23 oxygen effects");
  // Fail closed on the shipped-model-id list: exact (ordered) equality with the
  // INC-1 seed ids. A tampered/empty/extra list never passes — the full
  // research-grounded rollup lands in INC-8 under the same fail-closed check.
  if (!c.shippedModelIds || !arrayEquals(c.shippedModelIds, SEED_TORPEDO_MODEL_IDS))
    throwMismatch(c, "torpedo_v1 shipped model id list");
}

// Fail-closed conversion: integer basis-point knots -> integer µm/s. Rejects
// non-integers and unsafe integers at the boundary (ENGINEERING-CONTRACT
// arithmetic). The division by SPEED_BP_SCALE is exact by construction for the
// shipped scale (knots * 1_000 * 514_444 / 1_000).
export function torpedoSpeedBpKnotsToUmS(speedKnotsBp: number): number {
  if (!Number.isInteger(speedKnotsBp) || speedKnotsBp <= 0) {
    throw new BluewaveError(TORPEDO_STATE_INVARIANT_FAILED, {
      code: TORPEDO_STATE_INVARIANT_FAILED,
      reason: "speed must be a positive integer in basis-point knots",
      value: speedKnotsBp,
    });
  }
  const umS = (speedKnotsBp * TORPEDO_KNOTS_TO_UM_S) / TORPEDO_SPEED_BP_SCALE;
  if (!Number.isSafeInteger(umS)) {
    throw new BluewaveError(TORPEDO_STATE_INVARIANT_FAILED, {
      code: TORPEDO_STATE_INVARIANT_FAILED,
      reason: "speed conversion produced an unsafe integer",
      speedKnotsBp,
      umS,
    });
  }
  return umS;
}