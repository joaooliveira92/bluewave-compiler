//packages/combat/src/submarines/contracts.ts
// DESIGN-34 engine-versioned constant-set contracts (C-3 spec §1.3) — the
// "content deliverable" of this sprint: every shipped `*_v1` policy id +
// `SHIPPED_*_CONTRACT` + a fail-closed `validate*Contract` guard. Mirrors
// packages/combat/src/mines/constants.ts (which shipped
// mine_type_definitions_v1) and mines/contracts.ts (the INC-8 rollup).
//
// INC-1 ships the three §1.3 contracts that the strategic-representation /
// types / policies slice exercises:
//   submarine_strategic_asset_v1   (DESIGN-34 §1)
//   submarine_types_v1             (DESIGN-34 §4 + §6 vocab + §9/§10 tables)
//   submarine_policies_v1          (DESIGN-34 §5)
// Each ships DESIGN-34's own exact integers (ticket 06 — no research catalog).
//
// Pure/deterministic; fail-closed: any tampered contract throws
// (INVALID_SUBMARINE_REPRESENTATION for the §1 guard, SUBMARINE_STATE_INVARIANT_FAILED
// for the type/policy definition guards) and never silently passes.
import { SUBMARINE_ASW_VULNERABILITY_BP, SUBMARINE_NEUTRAL_ASW_VULNERABILITY_BP } from "./model.js";
import { BluewaveError } from "@bluewave/contracts";
import {
  SUBMARINE_BASIS_POINTS_PER_UNIT,
  SUBMARINE_FORMULA_VERSION,
  SUBMARINE_RULESET_VERSION,
  SUBMARINE_POLICY_TARGET_WEIGHTS_BP,
  submarineEffectivenessPolicyId,
  submarineFriendlyIdentificationPolicyId,
  submarineMineLayingPolicyId,
  submarineMissionsPolicyId,
  submarinePoliciesPolicyId,
  submarineProximityPolicyId,
  submarineReliabilityPolicyId,
  submarineRemoteEfficiencyPolicyId,
  submarineLongRangeAswVulnerabilityPolicyId,
  submarineScreeningBalancePolicyId,
  submarineSeaStatePolicyId,
  submarineStrategicAssetPolicyId,
  submarineTypesPolicyId,
  STRATEGIC_REPRESENTATIONS,
  SUBMARINE_BASE_SUPPORT_REQUIREMENTS,
  SUBMARINE_MISSIONS,
  SUBMARINE_POLICIES,
  SUBMARINE_RANGE_CLASSES,
  SUBMARINE_SEA_STATE_CATEGORIES,
  SUBMARINE_TYPES,
  BASE_PROXIMITY_BANDS,
  type StrategicRepresentation,
  type SubmarinePolicy,
} from "./constants.js";
import {
  INVALID_SUBMARINE_REPRESENTATION,
  SUBMARINE_STATE_INVARIANT_FAILED,
} from "./reasonCodes.js";
import { SHIPPED_SUBMARINE_MISSION_DEFINITIONS } from "./missionEligibility.js";
import {
  SUBMARINE_RELIABILITY_OPERATIONAL_MULTIPLIER_TABLE_BP,
  SUBMARINE_RELIABILITY_OFFENSIVE_DEPLOYMENT_FLOOR,
  SUBMARINE_RELIABILITY_MIN,
  SUBMARINE_RELIABILITY_MAX,
} from "./reliability.js";
import {
  SUBMARINE_BASE_SUPPORT_MULTIPLIER_BP,
  SUBMARINE_POLICY_MULTIPLIER_BP,
  SUBMARINE_INTELLIGENCE_MULTIPLIER_BP,
  SUBMARINE_ENEMY_PROTECTION_MULTIPLIER_BP,
  SUBMARINE_BLOCKADE_MULTIPLIER_BP,
} from "./effectiveness.js";
import {
  SHIPPED_SEA_STATE_DETECTION_TABLE_BP,
  SHIPPED_SEA_STATE_OBSERVATION_TABLE_BP,
  SHIPPED_SEA_STATE_ATTACK_TABLE_BP,
  SUBMARINE_SNORKEL_MACHINERY_MULTIPLIER_BP,
  SUBMARINE_SURFACED_TRANSIT_SPEED_BP,
  SUBMARINE_SURFACED_DETECTION_ADDITION_BP,
  SUBMARINE_SEA_STATE_MIN,
  SUBMARINE_SEA_STATE_MAX,
  SUBMARINE_SEA_STATE_OPTIMUM_MIN,
  SUBMARINE_SEA_STATE_OPTIMUM_MAX,
} from "./seaStateProfile.js";
import {
  SUBMARINE_HEAVY_SHIP_TYPES,
  SUBMARINE_ELIGIBLE_ESCORT_TYPES,
  SHIPPED_SCREENING_OPPORTUNITY_BANDS,
} from "./screeningBalance.js";
import {
  SUBMARINE_MINE_LAYING_RELIABILITY_FLOOR,
  SUBMARINE_MINE_LAYING_READINESS_FLOOR,
  SUBMARINE_MINE_LAYING_FUEL_FLOOR_BP,
} from "./mineLaying.js";
import {
  SUBMARINE_FRIENDLY_IDENTIFICATION_BASE_BP,
  SUBMARINE_FRIENDLY_IDENTIFICATION_MIN_BP,
  SUBMARINE_FRIENDLY_IDENTIFICATION_MAX_BP,
} from "./friendlyIdentification.js";

function arrayEquals(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

// ---------------------------------------------------------------------------
// submarine_strategic_asset_v1 (§1)
// ---------------------------------------------------------------------------

export interface SubmarineStrategicAssetContract {
  policyId: string;
  rulesetVersion: string;
  formulaVersion: string;
  basisPointsPerUnit: number;
  representations: readonly StrategicRepresentation[];
}

export const SHIPPED_SUBMARINE_STRATEGIC_ASSET_CONTRACT: SubmarineStrategicAssetContract = {
  policyId: submarineStrategicAssetPolicyId,
  rulesetVersion: SUBMARINE_RULESET_VERSION,
  formulaVersion: SUBMARINE_FORMULA_VERSION,
  basisPointsPerUnit: SUBMARINE_BASIS_POINTS_PER_UNIT,
  representations: STRATEGIC_REPRESENTATIONS,
};

function throwStrategicMismatch(contract: unknown, reason: string): never {
  throw new BluewaveError(INVALID_SUBMARINE_REPRESENTATION, {
    code: INVALID_SUBMARINE_REPRESENTATION,
    reason,
    contract,
  });
}

export function validateSubmarineStrategicAssetContract(
  c: Partial<SubmarineStrategicAssetContract> | null | undefined,
): asserts c is SubmarineStrategicAssetContract {
  if (!c) throwStrategicMismatch(c, "submarine_strategic_asset_v1 missing contract");
  if (c.policyId !== submarineStrategicAssetPolicyId)
    throwStrategicMismatch(c, "submarine_strategic_asset_v1 expected policy id");
  if (
    c.rulesetVersion !== SUBMARINE_RULESET_VERSION ||
    c.formulaVersion !== SUBMARINE_FORMULA_VERSION
  )
    throwStrategicMismatch(c, "submarine_strategic_asset_v1 ruleset/formula versions");
  if (c.basisPointsPerUnit !== SUBMARINE_BASIS_POINTS_PER_UNIT)
    throwStrategicMismatch(c, "submarine_strategic_asset_v1 basis-point scale");
  if (!c.representations || !arrayEquals(c.representations, STRATEGIC_REPRESENTATIONS))
    throwStrategicMismatch(c, "submarine_strategic_asset_v1 §1 closed representation enum");
  // restore the typed value after guard (the throw path returns never)
  void c;
}

// ---------------------------------------------------------------------------
// submarine_types_v1 (§4 + §6 vocab + §9/§10 tables)
// ---------------------------------------------------------------------------

export interface SubmarineTypesContract {
  policyId: string;
  rulesetVersion: string;
  formulaVersion: string;
  basisPointsPerUnit: number;
  submarineTypes: readonly string[];
  submarineMissions: readonly string[];
  rangeClasses: readonly string[];
  baseSupportRequirements: readonly string[];
  proximityBands: readonly string[];
  longRangeAswVulnerabilityBp: Record<string, number>;
  shippedSubmarineTypeIds: readonly string[];
}

export const SHIPPED_SUBMARINE_TYPES_CONTRACT: SubmarineTypesContract = {
  policyId: submarineTypesPolicyId,
  rulesetVersion: SUBMARINE_RULESET_VERSION,
  formulaVersion: SUBMARINE_FORMULA_VERSION,
  basisPointsPerUnit: SUBMARINE_BASIS_POINTS_PER_UNIT,
  submarineTypes: SUBMARINE_TYPES,
  submarineMissions: SUBMARINE_MISSIONS,
  rangeClasses: SUBMARINE_RANGE_CLASSES,
  baseSupportRequirements: SUBMARINE_BASE_SUPPORT_REQUIREMENTS,
  proximityBands: BASE_PROXIMITY_BANDS,
  longRangeAswVulnerabilityBp: { ...SUBMARINE_ASW_VULNERABILITY_BP },
  shippedSubmarineTypeIds: SUBMARINE_TYPES,
};

export function validateSubmarineTypesContract(
  c: Partial<SubmarineTypesContract> | null | undefined,
): asserts c is SubmarineTypesContract {
  function mismatch(contract: unknown, reason: string): never {
    throw new BluewaveError(SUBMARINE_STATE_INVARIANT_FAILED, {
      code: SUBMARINE_STATE_INVARIANT_FAILED,
      reason,
      contract,
    });
  }
  if (!c) mismatch(c, "submarine_types_v1 missing contract");
  if (c.policyId !== submarineTypesPolicyId) mismatch(c, "submarine_types_v1 expected policy id");
  if (
    c.rulesetVersion !== SUBMARINE_RULESET_VERSION ||
    c.formulaVersion !== SUBMARINE_FORMULA_VERSION
  )
    mismatch(c, "submarine_types_v1 ruleset/formula versions");
  if (c.basisPointsPerUnit !== SUBMARINE_BASIS_POINTS_PER_UNIT)
    mismatch(c, "submarine_types_v1 basis-point scale");
  if (!c.submarineTypes || !arrayEquals(c.submarineTypes, SUBMARINE_TYPES))
    mismatch(c, "submarine_types_v1 §4 closed five-type enum");
  if (!c.submarineMissions || !arrayEquals(c.submarineMissions, SUBMARINE_MISSIONS))
    mismatch(c, "submarine_types_v1 §6 closed seven-mission enum");
  if (!c.rangeClasses || !arrayEquals(c.rangeClasses, SUBMARINE_RANGE_CLASSES))
    mismatch(c, "submarine_types_v1 range-class vocabulary");
  if (
    !c.baseSupportRequirements ||
    !arrayEquals(c.baseSupportRequirements, SUBMARINE_BASE_SUPPORT_REQUIREMENTS)
  )
    mismatch(c, "submarine_types_v1 base-support vocabulary");
  if (!c.proximityBands || !arrayEquals(c.proximityBands, BASE_PROXIMITY_BANDS))
    mismatch(c, "submarine_types_v1 §8 proximity-band vocabulary");
  if (!c.longRangeAswVulnerabilityBp)
    mismatch(c, "submarine_types_v1 §10 long-range ASW table missing");
  for (const band of BASE_PROXIMITY_BANDS) {
    if (c.longRangeAswVulnerabilityBp[band] !== SUBMARINE_ASW_VULNERABILITY_BP[band])
      mismatch(c, `submarine_types_v1 §10 long-range ASW vulnerability for ${band}`);
  }
  if (!c.shippedSubmarineTypeIds || !arrayEquals(c.shippedSubmarineTypeIds, SUBMARINE_TYPES))
    mismatch(c, "submarine_types_v1 shipped submarine-type id list");
  void c;
}

// ---------------------------------------------------------------------------
// submarine_policies_v1 (§5)
// ---------------------------------------------------------------------------

export interface SubmarinePoliciesContract {
  policyId: string;
  rulesetVersion: string;
  formulaVersion: string;
  basisPointsPerUnit: number;
  policies: readonly SubmarinePolicy[];
  targetWeightsBp: Record<
    SubmarinePolicy,
    { warshipAttackBp: number; merchantAttackBp: number; neutralIncidentMultiplierBp: number }
  >;
  policyChangeEffectiveAt: string;
  shippedPolicyIds: readonly string[];
}

// §5 target weights derive from the single shipped constants copy
// (SUBMARINE_POLICY_TARGET_WEIGHTS_BP in constants.ts) — the contract never
// hand-copies the DESIGN-34 integers a second time, so the shipped set, the
// policy definitions, and this contract cannot drift apart.
const TARGET_WEIGHTS: SubmarinePoliciesContract["targetWeightsBp"] =
  SUBMARINE_POLICY_TARGET_WEIGHTS_BP;

export const SHIPPED_SUBMARINE_POLICIES_CONTRACT: SubmarinePoliciesContract = {
  policyId: submarinePoliciesPolicyId,
  rulesetVersion: SUBMARINE_RULESET_VERSION,
  formulaVersion: SUBMARINE_FORMULA_VERSION,
  basisPointsPerUnit: SUBMARINE_BASIS_POINTS_PER_UNIT,
  policies: SUBMARINE_POLICIES,
  targetWeightsBp: TARGET_WEIGHTS,
  policyChangeEffectiveAt: "NEXT_TRADE_WARFARE_RESOLUTION",
  shippedPolicyIds: SUBMARINE_POLICIES,
};

export function validateSubmarinePoliciesContract(
  c: Partial<SubmarinePoliciesContract> | null | undefined,
): asserts c is SubmarinePoliciesContract {
  function mismatch(contract: unknown, reason: string): never {
    throw new BluewaveError(SUBMARINE_STATE_INVARIANT_FAILED, {
      code: SUBMARINE_STATE_INVARIANT_FAILED,
      reason,
      contract,
    });
  }
  if (!c) mismatch(c, "submarine_policies_v1 missing contract");
  if (c.policyId !== submarinePoliciesPolicyId)
    mismatch(c, "submarine_policies_v1 expected policy id");
  if (
    c.rulesetVersion !== SUBMARINE_RULESET_VERSION ||
    c.formulaVersion !== SUBMARINE_FORMULA_VERSION
  )
    mismatch(c, "submarine_policies_v1 ruleset/formula versions");
  if (c.basisPointsPerUnit !== SUBMARINE_BASIS_POINTS_PER_UNIT)
    mismatch(c, "submarine_policies_v1 basis-point scale");
  if (!c.policies || !arrayEquals(c.policies, SUBMARINE_POLICIES))
    mismatch(c, "submarine_policies_v1 §5 closed three-policy enum");
  if (!c.targetWeightsBp) mismatch(c, "submarine_policies_v1 §5 target weights missing");
  for (const policy of SUBMARINE_POLICIES) {
    const w = c.targetWeightsBp[policy];
    if (!w) mismatch(c, `submarine_policies_v1 §5 target weights for ${policy}`);
    if (w.warshipAttackBp !== TARGET_WEIGHTS[policy].warshipAttackBp)
      mismatch(c, `submarine_policies_v1 §5 warship weight for ${policy}`);
    if (w.merchantAttackBp !== TARGET_WEIGHTS[policy].merchantAttackBp)
      mismatch(c, `submarine_policies_v1 §5 merchant weight for ${policy}`);
    if (w.neutralIncidentMultiplierBp !== TARGET_WEIGHTS[policy].neutralIncidentMultiplierBp)
      mismatch(c, `submarine_policies_v1 §5 neutral-incident multiplier for ${policy}`);
    if (w.warshipAttackBp + w.merchantAttackBp !== SUBMARINE_BASIS_POINTS_PER_UNIT)
      mismatch(
        c,
        `submarine_policies_v1 §5 warship + merchant weights must sum to 10_000 for ${policy}`,
      );
  }
  if (c.policyChangeEffectiveAt !== "NEXT_TRADE_WARFARE_RESOLUTION")
    mismatch(c, "submarine_policies_v1 §5 policy change effective-at");
  if (!c.shippedPolicyIds || !arrayEquals(c.shippedPolicyIds, SUBMARINE_POLICIES))
    mismatch(c, "submarine_policies_v1 shipped policy id list");
  void c;
}

// ---------------------------------------------------------------------------
// submarine_missions_v1 (§6 + §26.4)
// ---------------------------------------------------------------------------

export interface SubmarineMissionsContract {
  policyId: string;
  rulesetVersion: string;
  formulaVersion: string;
  basisPointsPerUnit: number;
  missions: readonly string[];
  shippedMissionDefinitions: ReadonlyArray<{
    missionId: string;
    topicLabel: string;
    missionPriority: number;
  }>;
  shippedMissionIds: readonly string[];
}

// §26.4 mission-priority values are AUTHORED record (see missionEligibility.ts);
// the contract wires the single shipped definitions copy so the shipped set and
// this contract cannot drift apart.
const MISSION_DEFINITION_SURFACES: SubmarineMissionsContract["shippedMissionDefinitions"] =
  SHIPPED_SUBMARINE_MISSION_DEFINITIONS.map((m) => ({
    missionId: m.missionId,
    topicLabel: m.topicLabel,
    missionPriority: m.missionPriority,
  }));

export const SHIPPED_SUBMARINE_MISSIONS_CONTRACT: SubmarineMissionsContract = {
  policyId: submarineMissionsPolicyId,
  rulesetVersion: SUBMARINE_RULESET_VERSION,
  formulaVersion: SUBMARINE_FORMULA_VERSION,
  basisPointsPerUnit: SUBMARINE_BASIS_POINTS_PER_UNIT,
  missions: SUBMARINE_MISSIONS,
  shippedMissionDefinitions: MISSION_DEFINITION_SURFACES,
  shippedMissionIds: SUBMARINE_MISSIONS,
};

export function validateSubmarineMissionsContract(
  c: Partial<SubmarineMissionsContract> | null | undefined,
): asserts c is SubmarineMissionsContract {
  function mismatch(contract: unknown, reason: string): never {
    throw new BluewaveError(SUBMARINE_STATE_INVARIANT_FAILED, {
      code: SUBMARINE_STATE_INVARIANT_FAILED,
      reason,
      contract,
    });
  }
  if (!c) mismatch(c, "submarine_missions_v1 missing contract");
  if (c.policyId !== submarineMissionsPolicyId)
    mismatch(c, "submarine_missions_v1 expected policy id");
  if (
    c.rulesetVersion !== SUBMARINE_RULESET_VERSION ||
    c.formulaVersion !== SUBMARINE_FORMULA_VERSION
  )
    mismatch(c, "submarine_missions_v1 ruleset/formula versions");
  if (c.basisPointsPerUnit !== SUBMARINE_BASIS_POINTS_PER_UNIT)
    mismatch(c, "submarine_missions_v1 basis-point scale");
  if (!c.missions || !arrayEquals(c.missions, SUBMARINE_MISSIONS))
    mismatch(c, "submarine_missions_v1 §6 closed seven-mission enum");
  if (
    !c.shippedMissionDefinitions ||
    c.shippedMissionDefinitions.length !== SUBMARINE_MISSIONS.length
  )
    mismatch(c, "submarine_missions_v1 shipped mission definitions count");
  for (let i = 0; i < SUBMARINE_MISSIONS.length; i += 1) {
    const shipped = MISSION_DEFINITION_SURFACES[i];
    const tampered = c.shippedMissionDefinitions[i];
    if (!shipped || !tampered)
      mismatch(c, `submarine_missions_v1 definition missing at index ${i}`);
    if (tampered.missionId !== shipped.missionId)
      mismatch(c, `submarine_missions_v1 §6 mission id at index ${i}`);
    if (tampered.topicLabel !== shipped.topicLabel)
      mismatch(c, `submarine_missions_v1 topic label for ${shipped.missionId}`);
    if (tampered.missionPriority !== shipped.missionPriority)
      mismatch(c, `submarine_missions_v1 §26.4 mission priority for ${shipped.missionId}`);
  }
  // §26.4 canonical ordering is by mission priority — the shipped priority field
  // MUST be an injective (no ties) ascending sequence so INC-8's ordering is
  // deterministic and total.
  const priorities = c.shippedMissionDefinitions.map((m) => m.missionPriority);
  for (let i = 0; i < priorities.length; i += 1) {
    const prev = priorities[i - 1];
    const next = priorities[i];
    if (prev !== undefined && next !== undefined && !(next > prev))
      mismatch(c, "submarine_missions_v1 §26.4 priorities must be strictly ascending");
  }
  if (!c.shippedMissionIds || !arrayEquals(c.shippedMissionIds, SUBMARINE_MISSIONS))
    mismatch(c, "submarine_missions_v1 shipped mission id list");
  void c;
}

// ---------------------------------------------------------------------------
// submarine_reliability_v1 (§7)
// ---------------------------------------------------------------------------

export interface SubmarineReliabilityContract {
  policyId: string;
  rulesetVersion: string;
  formulaVersion: string;
  basisPointsPerUnit: number;
  reliabilityRangeMin: number; // §7 exact: 0
  reliabilityRangeMax: number; // §7 exact: 100
  offensiveDeploymentFloor: number; // §7 exact: 20
  multiplierTableBp: ReadonlyArray<{ min: number; max: number; multiplierBp: number }>;
}

export const SHIPPED_SUBMARINE_RELIABILITY_CONTRACT: SubmarineReliabilityContract = {
  policyId: submarineReliabilityPolicyId,
  rulesetVersion: SUBMARINE_RULESET_VERSION,
  formulaVersion: SUBMARINE_FORMULA_VERSION,
  basisPointsPerUnit: SUBMARINE_BASIS_POINTS_PER_UNIT,
  reliabilityRangeMin: SUBMARINE_RELIABILITY_MIN,
  reliabilityRangeMax: SUBMARINE_RELIABILITY_MAX,
  offensiveDeploymentFloor: SUBMARINE_RELIABILITY_OFFENSIVE_DEPLOYMENT_FLOOR,
  multiplierTableBp: SUBMARINE_RELIABILITY_OPERATIONAL_MULTIPLIER_TABLE_BP,
};

export function validateSubmarineReliabilityContract(
  c: Partial<SubmarineReliabilityContract> | null | undefined,
): asserts c is SubmarineReliabilityContract {
  function mismatch(contract: unknown, reason: string): never {
    throw new BluewaveError(SUBMARINE_STATE_INVARIANT_FAILED, {
      code: SUBMARINE_STATE_INVARIANT_FAILED,
      reason,
      contract,
    });
  }
  if (!c) mismatch(c, "submarine_reliability_v1 missing contract");
  if (c.policyId !== submarineReliabilityPolicyId)
    mismatch(c, "submarine_reliability_v1 expected policy id");
  if (
    c.rulesetVersion !== SUBMARINE_RULESET_VERSION ||
    c.formulaVersion !== SUBMARINE_FORMULA_VERSION
  )
    mismatch(c, "submarine_reliability_v1 ruleset/formula versions");
  if (c.basisPointsPerUnit !== SUBMARINE_BASIS_POINTS_PER_UNIT)
    mismatch(c, "submarine_reliability_v1 basis-point scale");
  if (
    c.reliabilityRangeMin !== SUBMARINE_RELIABILITY_MIN ||
    c.reliabilityRangeMax !== SUBMARINE_RELIABILITY_MAX
  )
    mismatch(c, "submarine_reliability_v1 §7 integer range [0, 100]");
  if (c.offensiveDeploymentFloor !== SUBMARINE_RELIABILITY_OFFENSIVE_DEPLOYMENT_FLOOR)
    mismatch(c, "submarine_reliability_v1 §7 offensive-deployment floor of 20");
  if (!c.multiplierTableBp || c.multiplierTableBp.length !== 6)
    mismatch(c, "submarine_reliability_v1 §7 six-band multiplier table");
  const shipped = SUBMARINE_RELIABILITY_OPERATIONAL_MULTIPLIER_TABLE_BP;
  for (let i = 0; i < shipped.length; i += 1) {
    const s = shipped[i];
    const t = c.multiplierTableBp[i];
    if (!s || !t) mismatch(c, `submarine_reliability_v1 §7 band missing at index ${i}`);
    if (t.min !== s.min || t.max !== s.max || t.multiplierBp !== s.multiplierBp)
      mismatch(
        c,
        `submarine_reliability_v1 §7 band ${s.min}..${s.max} must be ${s.multiplierBp} bp`,
      );
  }
  void c;
}

// ---------------------------------------------------------------------------
// submarine_proximity_v1 (§8)
// ---------------------------------------------------------------------------

export interface SubmarineProximityContract {
  policyId: string;
  rulesetVersion: string;
  formulaVersion: string;
  basisPointsPerUnit: number;
  proximityBands: ReadonlyArray<{
    band: string;
    minDistance: number;
    maxDistance: number;
  }>;
}

const PROXIMITY_BAND_DEFINITIONS: SubmarineProximityContract["proximityBands"] = [
  { band: "LOCAL", minDistance: 0, maxDistance: 1 },
  { band: "REGIONAL", minDistance: 2, maxDistance: 3 },
  { band: "REMOTE", minDistance: 4, maxDistance: 6 },
  { band: "EXTREME_REMOTE", minDistance: 7, maxDistance: Infinity },
];

export const SHIPPED_SUBMARINE_PROXIMITY_CONTRACT: SubmarineProximityContract = {
  policyId: submarineProximityPolicyId,
  rulesetVersion: SUBMARINE_RULESET_VERSION,
  formulaVersion: SUBMARINE_FORMULA_VERSION,
  basisPointsPerUnit: SUBMARINE_BASIS_POINTS_PER_UNIT,
  proximityBands: PROXIMITY_BAND_DEFINITIONS,
};

export function validateSubmarineProximityContract(
  c: Partial<SubmarineProximityContract> | null | undefined,
): asserts c is SubmarineProximityContract {
  function mismatch(contract: unknown, reason: string): never {
    throw new BluewaveError(SUBMARINE_STATE_INVARIANT_FAILED, {
      code: SUBMARINE_STATE_INVARIANT_FAILED,
      reason,
      contract,
    });
  }
  if (!c) mismatch(c, "submarine_proximity_v1 missing contract");
  if (c.policyId !== submarineProximityPolicyId)
    mismatch(c, "submarine_proximity_v1 expected policy id");
  if (
    c.rulesetVersion !== SUBMARINE_RULESET_VERSION ||
    c.formulaVersion !== SUBMARINE_FORMULA_VERSION
  )
    mismatch(c, "submarine_proximity_v1 ruleset/formula versions");
  if (c.basisPointsPerUnit !== SUBMARINE_BASIS_POINTS_PER_UNIT)
    mismatch(c, "submarine_proximity_v1 basis-point scale");
  if (!c.proximityBands || c.proximityBands.length !== 4)
    mismatch(c, "submarine_proximity_v1 §8 four-band table");
  for (let i = 0; i < PROXIMITY_BAND_DEFINITIONS.length; i += 1) {
    const s = PROXIMITY_BAND_DEFINITIONS[i];
    const t = c.proximityBands[i];
    if (!s || !t) mismatch(c, `submarine_proximity_v1 band missing at index ${i}`);
    if (t.band !== s.band || t.minDistance !== s.minDistance || t.maxDistance !== s.maxDistance)
      mismatch(c, `submarine_proximity_v1 §8 band ${s.band} bounds`);
  }
  void c;
}

// ---------------------------------------------------------------------------
// submarine_remote_efficiency_v1 (§9)
// ---------------------------------------------------------------------------

export interface SubmarineRemoteEfficiencyContract {
  policyId: string;
  rulesetVersion: string;
  formulaVersion: string;
  basisPointsPerUnit: number;
  efficiencyTableBp: ReadonlyArray<{
    submarineTypeId: string;
    bands: Record<string, number>;
  }>;
}

const REMOTE_EFFICIENCY_ENTRIES: SubmarineRemoteEfficiencyContract["efficiencyTableBp"] = [
  {
    submarineTypeId: "COASTAL",
    bands: { LOCAL: 10_000, REGIONAL: 7_500, REMOTE: 2_500, EXTREME_REMOTE: 0 },
  },
  {
    submarineTypeId: "MEDIUM_RANGE",
    bands: { LOCAL: 10_000, REGIONAL: 10_000, REMOTE: 7_500, EXTREME_REMOTE: 5_000 },
  },
  {
    submarineTypeId: "LONG_RANGE",
    bands: { LOCAL: 10_000, REGIONAL: 11_000, REMOTE: 12_500, EXTREME_REMOTE: 10_000 },
  },
  {
    submarineTypeId: "MINELAYING",
    bands: { LOCAL: 10_000, REGIONAL: 10_000, REMOTE: 8_000, EXTREME_REMOTE: 5_000 },
  },
  {
    submarineTypeId: "MISSILE",
    bands: { LOCAL: 10_000, REGIONAL: 10_000, REMOTE: 10_000, EXTREME_REMOTE: 9_000 },
  },
];

export const SHIPPED_SUBMARINE_REMOTE_EFFICIENCY_CONTRACT: SubmarineRemoteEfficiencyContract = {
  policyId: submarineRemoteEfficiencyPolicyId,
  rulesetVersion: SUBMARINE_RULESET_VERSION,
  formulaVersion: SUBMARINE_FORMULA_VERSION,
  basisPointsPerUnit: SUBMARINE_BASIS_POINTS_PER_UNIT,
  efficiencyTableBp: REMOTE_EFFICIENCY_ENTRIES,
};

export function validateSubmarineRemoteEfficiencyContract(
  c: Partial<SubmarineRemoteEfficiencyContract> | null | undefined,
): asserts c is SubmarineRemoteEfficiencyContract {
  function mismatch(contract: unknown, reason: string): never {
    throw new BluewaveError(SUBMARINE_STATE_INVARIANT_FAILED, {
      code: SUBMARINE_STATE_INVARIANT_FAILED,
      reason,
      contract,
    });
  }
  if (!c) mismatch(c, "submarine_remote_efficiency_v1 missing contract");
  if (c.policyId !== submarineRemoteEfficiencyPolicyId)
    mismatch(c, "submarine_remote_efficiency_v1 expected policy id");
  if (
    c.rulesetVersion !== SUBMARINE_RULESET_VERSION ||
    c.formulaVersion !== SUBMARINE_FORMULA_VERSION
  )
    mismatch(c, "submarine_remote_efficiency_v1 ruleset/formula versions");
  if (c.basisPointsPerUnit !== SUBMARINE_BASIS_POINTS_PER_UNIT)
    mismatch(c, "submarine_remote_efficiency_v1 basis-point scale");
  if (!c.efficiencyTableBp || c.efficiencyTableBp.length !== 5)
    mismatch(c, "submarine_remote_efficiency_v1 §9 five-type table");
  for (let i = 0; i < REMOTE_EFFICIENCY_ENTRIES.length; i += 1) {
    const s = REMOTE_EFFICIENCY_ENTRIES[i];
    const t = c.efficiencyTableBp[i];
    if (!s || !t) mismatch(c, `submarine_remote_efficiency_v1 entry missing at index ${i}`);
    if (t.submarineTypeId !== s.submarineTypeId)
      mismatch(c, `submarine_remote_efficiency_v1 type id at index ${i}`);
    for (const band of ["LOCAL", "REGIONAL", "REMOTE", "EXTREME_REMOTE"] as const) {
      if (t.bands[band] !== s.bands[band])
        mismatch(c, `submarine_remote_efficiency_v1 ${s.submarineTypeId} ${band} value`);
    }
  }
  void c;
}

// ---------------------------------------------------------------------------
// submarine_long_range_asw_vulnerability_v1 (§10)
// ---------------------------------------------------------------------------

export interface SubmarineLongRangeAswVulnerabilityContract {
  policyId: string;
  rulesetVersion: string;
  formulaVersion: string;
  basisPointsPerUnit: number;
  validRangeMin: number;
  validRangeMax: number;
  vulnerabilityTableBp: Record<string, number>;
  neutralVulnerabilityBp: number;
}

export const SHIPPED_SUBMARINE_LONG_RANGE_ASW_VULNERABILITY_CONTRACT: SubmarineLongRangeAswVulnerabilityContract =
  {
    policyId: submarineLongRangeAswVulnerabilityPolicyId,
    rulesetVersion: SUBMARINE_RULESET_VERSION,
    formulaVersion: SUBMARINE_FORMULA_VERSION,
    basisPointsPerUnit: SUBMARINE_BASIS_POINTS_PER_UNIT,
    validRangeMin: SUBMARINE_BASIS_POINTS_PER_UNIT,
    validRangeMax: 12_500,
    vulnerabilityTableBp: SUBMARINE_ASW_VULNERABILITY_BP,
    neutralVulnerabilityBp: SUBMARINE_NEUTRAL_ASW_VULNERABILITY_BP,
  };

export function validateSubmarineLongRangeAswVulnerabilityContract(
  c: Partial<SubmarineLongRangeAswVulnerabilityContract> | null | undefined,
): asserts c is SubmarineLongRangeAswVulnerabilityContract {
  function mismatch(contract: unknown, reason: string): never {
    throw new BluewaveError(SUBMARINE_STATE_INVARIANT_FAILED, {
      code: SUBMARINE_STATE_INVARIANT_FAILED,
      reason,
      contract,
    });
  }
  if (!c) mismatch(c, "submarine_long_range_asw_vulnerability_v1 missing contract");
  if (c.policyId !== submarineLongRangeAswVulnerabilityPolicyId)
    mismatch(c, "submarine_long_range_asw_vulnerability_v1 expected policy id");
  if (
    c.rulesetVersion !== SUBMARINE_RULESET_VERSION ||
    c.formulaVersion !== SUBMARINE_FORMULA_VERSION
  )
    mismatch(c, "submarine_long_range_asw_vulnerability_v1 ruleset/formula versions");
  if (c.basisPointsPerUnit !== SUBMARINE_BASIS_POINTS_PER_UNIT)
    mismatch(c, "submarine_long_range_asw_vulnerability_v1 basis-point scale");
  if (c.validRangeMin !== SUBMARINE_BASIS_POINTS_PER_UNIT)
    mismatch(c, "submarine_long_range_asw_vulnerability_v1 valid range min 10_000");
  if (c.validRangeMax !== 12_500)
    mismatch(c, "submarine_long_range_asw_vulnerability_v1 valid range max 12_500");
  if (!c.vulnerabilityTableBp)
    mismatch(c, "submarine_long_range_asw_vulnerability_v1 table missing");
  for (const band of ["LOCAL", "REGIONAL", "REMOTE", "EXTREME_REMOTE"] as const) {
    if (c.vulnerabilityTableBp[band] !== SUBMARINE_ASW_VULNERABILITY_BP[band])
      mismatch(c, `submarine_long_range_asw_vulnerability_v1 ${band} value`);
  }
  if (c.neutralVulnerabilityBp !== SUBMARINE_NEUTRAL_ASW_VULNERABILITY_BP)
    mismatch(c, "submarine_long_range_asw_vulnerability_v1 neutral baseline");
  void c;
}

// ---------------------------------------------------------------------------
// submarine_effectiveness_v1 (§11 + §12)
// ---------------------------------------------------------------------------

export interface SubmarineEffectivenessContract {
  policyId: string;
  rulesetVersion: string;
  formulaVersion: string;
  basisPointsPerUnit: number;
  denominator: number;
  baseSupportMultiplierBp: number;
  policyMultiplierBp: number;
  intelligenceMultiplierBp: number;
  enemyProtectionMultiplierBp: number;
  blockadeMultiplierBp: number;
}

export const SHIPPED_SUBMARINE_EFFECTIVENESS_CONTRACT: SubmarineEffectivenessContract = {
  policyId: submarineEffectivenessPolicyId,
  rulesetVersion: SUBMARINE_RULESET_VERSION,
  formulaVersion: SUBMARINE_FORMULA_VERSION,
  basisPointsPerUnit: SUBMARINE_BASIS_POINTS_PER_UNIT,
  denominator: 10_000 ** 7,
  baseSupportMultiplierBp: SUBMARINE_BASE_SUPPORT_MULTIPLIER_BP,
  policyMultiplierBp: SUBMARINE_POLICY_MULTIPLIER_BP,
  intelligenceMultiplierBp: SUBMARINE_INTELLIGENCE_MULTIPLIER_BP,
  enemyProtectionMultiplierBp: SUBMARINE_ENEMY_PROTECTION_MULTIPLIER_BP,
  blockadeMultiplierBp: SUBMARINE_BLOCKADE_MULTIPLIER_BP,
};

export function validateSubmarineEffectivenessContract(
  c: Partial<SubmarineEffectivenessContract> | null | undefined,
): asserts c is SubmarineEffectivenessContract {
  function mismatch(contract: unknown, reason: string): never {
    throw new BluewaveError(SUBMARINE_STATE_INVARIANT_FAILED, {
      code: SUBMARINE_STATE_INVARIANT_FAILED,
      reason,
      contract,
    });
  }
  if (!c) mismatch(c, "submarine_effectiveness_v1 missing contract");
  if (c.policyId !== submarineEffectivenessPolicyId)
    mismatch(c, "submarine_effectiveness_v1 expected policy id");
  if (
    c.rulesetVersion !== SUBMARINE_RULESET_VERSION ||
    c.formulaVersion !== SUBMARINE_FORMULA_VERSION
  )
    mismatch(c, "submarine_effectiveness_v1 ruleset/formula versions");
  if (c.basisPointsPerUnit !== SUBMARINE_BASIS_POINTS_PER_UNIT)
    mismatch(c, "submarine_effectiveness_v1 basis-point scale");
  if (c.denominator !== 10_000 ** 7)
    mismatch(c, "submarine_effectiveness_v1 §11 denominator 10_000^7");
  if (c.baseSupportMultiplierBp !== SUBMARINE_BASE_SUPPORT_MULTIPLIER_BP)
    mismatch(c, "submarine_effectiveness_v1 §11 base-support multiplier");
  if (c.policyMultiplierBp !== SUBMARINE_POLICY_MULTIPLIER_BP)
    mismatch(c, "submarine_effectiveness_v1 §11 policy multiplier");
  if (c.intelligenceMultiplierBp !== SUBMARINE_INTELLIGENCE_MULTIPLIER_BP)
    mismatch(c, "submarine_effectiveness_v1 §11 intelligence multiplier");
  if (c.enemyProtectionMultiplierBp !== SUBMARINE_ENEMY_PROTECTION_MULTIPLIER_BP)
    mismatch(c, "submarine_effectiveness_v1 §11 enemy-protection multiplier");
  if (c.blockadeMultiplierBp !== SUBMARINE_BLOCKADE_MULTIPLIER_BP)
    mismatch(c, "submarine_effectiveness_v1 §11 blockade multiplier");
  void c;
}

// ---------------------------------------------------------------------------
// submarine_sea_state_v1 (§13–17)
// ---------------------------------------------------------------------------

export interface SubmarineSeaStateContract {
  policyId: string;
  rulesetVersion: string;
  formulaVersion: string;
  basisPointsPerUnit: number;
  seaStateRangeMin: number;
  seaStateRangeMax: number;
  optimumBandMin: number;
  optimumBandMax: number;
  categories: readonly string[];
  detectionTableBp: Record<string, number>;
  observationTableBp: Record<string, number>;
  attackTableBp: Record<string, number>;
  surfacedDetectionAdditionBp: number;
  snorkelMachineryMultiplierBp: number;
  surfacedTransitSpeedBp: number;
}

export const SHIPPED_SUBMARINE_SEA_STATE_CONTRACT: SubmarineSeaStateContract = {
  policyId: submarineSeaStatePolicyId,
  rulesetVersion: SUBMARINE_RULESET_VERSION,
  formulaVersion: SUBMARINE_FORMULA_VERSION,
  basisPointsPerUnit: SUBMARINE_BASIS_POINTS_PER_UNIT,
  seaStateRangeMin: SUBMARINE_SEA_STATE_MIN,
  seaStateRangeMax: SUBMARINE_SEA_STATE_MAX,
  optimumBandMin: SUBMARINE_SEA_STATE_OPTIMUM_MIN,
  optimumBandMax: SUBMARINE_SEA_STATE_OPTIMUM_MAX,
  categories: SUBMARINE_SEA_STATE_CATEGORIES,
  detectionTableBp: { ...SHIPPED_SEA_STATE_DETECTION_TABLE_BP },
  observationTableBp: { ...SHIPPED_SEA_STATE_OBSERVATION_TABLE_BP },
  attackTableBp: { ...SHIPPED_SEA_STATE_ATTACK_TABLE_BP },
  surfacedDetectionAdditionBp: SUBMARINE_SURFACED_DETECTION_ADDITION_BP,
  snorkelMachineryMultiplierBp: SUBMARINE_SNORKEL_MACHINERY_MULTIPLIER_BP,
  surfacedTransitSpeedBp: SUBMARINE_SURFACED_TRANSIT_SPEED_BP,
};

export function validateSubmarineSeaStateContract(
  c: Partial<SubmarineSeaStateContract> | null | undefined,
): asserts c is SubmarineSeaStateContract {
  function mismatch(contract: unknown, reason: string): never {
    throw new BluewaveError(SUBMARINE_STATE_INVARIANT_FAILED, {
      code: SUBMARINE_STATE_INVARIANT_FAILED,
      reason,
      contract,
    });
  }
  if (!c) mismatch(c, "submarine_sea_state_v1 missing contract");
  if (c.policyId !== submarineSeaStatePolicyId)
    mismatch(c, "submarine_sea_state_v1 expected policy id");
  if (
    c.rulesetVersion !== SUBMARINE_RULESET_VERSION ||
    c.formulaVersion !== SUBMARINE_FORMULA_VERSION
  )
    mismatch(c, "submarine_sea_state_v1 ruleset/formula versions");
  if (c.basisPointsPerUnit !== SUBMARINE_BASIS_POINTS_PER_UNIT)
    mismatch(c, "submarine_sea_state_v1 basis-point scale");
  if (c.seaStateRangeMin !== SUBMARINE_SEA_STATE_MIN)
    mismatch(c, "submarine_sea_state_v1 §13 range min 0");
  if (c.seaStateRangeMax !== SUBMARINE_SEA_STATE_MAX)
    mismatch(c, "submarine_sea_state_v1 §13 range max 9");
  if (c.optimumBandMin !== SUBMARINE_SEA_STATE_OPTIMUM_MIN)
    mismatch(c, "submarine_sea_state_v1 §13 optimum band min 2");
  if (c.optimumBandMax !== SUBMARINE_SEA_STATE_OPTIMUM_MAX)
    mismatch(c, "submarine_sea_state_v1 §13 optimum band max 5");
  if (!c.categories || c.categories.length !== 4)
    mismatch(c, "submarine_sea_state_v1 §13 four categories");
  const expectedCategories = ["CALM", "OPTIMAL", "HEAVY", "SEVERE"];
  for (let i = 0; i < expectedCategories.length; i++) {
    if (c.categories[i] !== expectedCategories[i])
      mismatch(c, `submarine_sea_state_v1 §13 category at index ${i}`);
  }
  if (!c.detectionTableBp || Object.keys(c.detectionTableBp).length !== 10)
    mismatch(c, "submarine_sea_state_v1 §14 detection table must have 10 entries");
  for (let ss = 0; ss <= 9; ss++) {
    const k = String(ss);
    if (c.detectionTableBp[k] !== SHIPPED_SEA_STATE_DETECTION_TABLE_BP[ss])
      mismatch(c, `submarine_sea_state_v1 §14 detection multiplier for sea state ${ss}`);
  }
  if (!c.observationTableBp || Object.keys(c.observationTableBp).length !== 10)
    mismatch(c, "submarine_sea_state_v1 §15 observation table must have 10 entries");
  for (let ss = 0; ss <= 9; ss++) {
    const k = String(ss);
    if (c.observationTableBp[k] !== SHIPPED_SEA_STATE_OBSERVATION_TABLE_BP[ss])
      mismatch(c, `submarine_sea_state_v1 §15 observation multiplier for sea state ${ss}`);
  }
  if (!c.attackTableBp || Object.keys(c.attackTableBp).length !== 10)
    mismatch(c, "submarine_sea_state_v1 §16 attack table must have 10 entries");
  for (let ss = 0; ss <= 9; ss++) {
    const k = String(ss);
    if (c.attackTableBp[k] !== SHIPPED_SEA_STATE_ATTACK_TABLE_BP[ss])
      mismatch(c, `submarine_sea_state_v1 §16 attack multiplier for sea state ${ss}`);
  }
  if (c.surfacedDetectionAdditionBp !== SUBMARINE_SURFACED_DETECTION_ADDITION_BP)
    mismatch(c, "submarine_sea_state_v1 §17 surfaced detection addition 12_500");
  if (c.snorkelMachineryMultiplierBp !== SUBMARINE_SNORKEL_MACHINERY_MULTIPLIER_BP)
    mismatch(c, "submarine_sea_state_v1 §17 snorkel machinery multiplier 7_500");
  if (c.surfacedTransitSpeedBp !== SUBMARINE_SURFACED_TRANSIT_SPEED_BP)
    mismatch(c, "submarine_sea_state_v1 §17 surfaced transit speed 7_500");
  void c;
}

// ---------------------------------------------------------------------------
// submarine_screening_balance_v1 (§18)
// ---------------------------------------------------------------------------

export interface SubmarineScreeningBalanceContract {
  policyId: string;
  rulesetVersion: string;
  formulaVersion: string;
  basisPointsPerUnit: number;
  heavyShipTypes: readonly string[];
  eligibleEscortTypes: readonly string[];
  opportunityBands: ReadonlyArray<{ minRatio: number; maxRatio: number; multiplierBp: number }>;
}

export const SHIPPED_SUBMARINE_SCREENING_BALANCE_CONTRACT: SubmarineScreeningBalanceContract = {
  policyId: submarineScreeningBalancePolicyId,
  rulesetVersion: SUBMARINE_RULESET_VERSION,
  formulaVersion: SUBMARINE_FORMULA_VERSION,
  basisPointsPerUnit: SUBMARINE_BASIS_POINTS_PER_UNIT,
  heavyShipTypes: SUBMARINE_HEAVY_SHIP_TYPES,
  eligibleEscortTypes: SUBMARINE_ELIGIBLE_ESCORT_TYPES,
  opportunityBands: SHIPPED_SCREENING_OPPORTUNITY_BANDS,
};

export function validateSubmarineScreeningBalanceContract(
  c: Partial<SubmarineScreeningBalanceContract> | null | undefined,
): asserts c is SubmarineScreeningBalanceContract {
  function mismatch(contract: unknown, reason: string): never {
    throw new BluewaveError(SUBMARINE_STATE_INVARIANT_FAILED, {
      code: SUBMARINE_STATE_INVARIANT_FAILED,
      reason,
      contract,
    });
  }
  if (!c) mismatch(c, "submarine_screening_balance_v1 missing contract");
  if (c.policyId !== submarineScreeningBalancePolicyId)
    mismatch(c, "submarine_screening_balance_v1 expected policy id");
  if (
    c.rulesetVersion !== SUBMARINE_RULESET_VERSION ||
    c.formulaVersion !== SUBMARINE_FORMULA_VERSION
  )
    mismatch(c, "submarine_screening_balance_v1 ruleset/formula versions");
  if (c.basisPointsPerUnit !== SUBMARINE_BASIS_POINTS_PER_UNIT)
    mismatch(c, "submarine_screening_balance_v1 basis-point scale");
  if (!c.heavyShipTypes || !arrayEquals(c.heavyShipTypes, SUBMARINE_HEAVY_SHIP_TYPES))
    mismatch(c, "submarine_screening_balance_v1 §18 heavy ship types");
  if (
    !c.eligibleEscortTypes ||
    !arrayEquals(c.eligibleEscortTypes, SUBMARINE_ELIGIBLE_ESCORT_TYPES)
  )
    mismatch(c, "submarine_screening_balance_v1 §18 eligible escort types");
  if (!c.opportunityBands || c.opportunityBands.length !== 5)
    mismatch(c, "submarine_screening_balance_v1 §18 five opportunity bands");
  for (let i = 0; i < SHIPPED_SCREENING_OPPORTUNITY_BANDS.length; i++) {
    const s = SHIPPED_SCREENING_OPPORTUNITY_BANDS[i];
    const t = c.opportunityBands[i];
    if (!s || !t) mismatch(c, `submarine_screening_balance_v1 band missing at index ${i}`);
    if (t.minRatio !== s.minRatio || t.maxRatio !== s.maxRatio || t.multiplierBp !== s.multiplierBp)
      mismatch(c, `submarine_screening_balance_v1 §18 band at index ${i}`);
  }
  void c;
}

// ---------------------------------------------------------------------------
// submarine_mine_laying_v1 (§20)
// ---------------------------------------------------------------------------

export interface SubmarineMineLayingContract {
  policyId: string;
  rulesetVersion: string;
  formulaVersion: string;
  basisPointsPerUnit: number;
  reliabilityFloor: number;
  readinessFloor: number;
  fuelFloorBp: number;
}

export const SHIPPED_SUBMARINE_MINE_LAYING_CONTRACT: SubmarineMineLayingContract = {
  policyId: submarineMineLayingPolicyId,
  rulesetVersion: SUBMARINE_RULESET_VERSION,
  formulaVersion: SUBMARINE_FORMULA_VERSION,
  basisPointsPerUnit: SUBMARINE_BASIS_POINTS_PER_UNIT,
  reliabilityFloor: SUBMARINE_MINE_LAYING_RELIABILITY_FLOOR,
  readinessFloor: SUBMARINE_MINE_LAYING_READINESS_FLOOR,
  fuelFloorBp: SUBMARINE_MINE_LAYING_FUEL_FLOOR_BP,
};

export function validateSubmarineMineLayingContract(
  c: Partial<SubmarineMineLayingContract> | null | undefined,
): asserts c is SubmarineMineLayingContract {
  function mismatch(contract: unknown, reason: string): never {
    throw new BluewaveError(SUBMARINE_STATE_INVARIANT_FAILED, {
      code: SUBMARINE_STATE_INVARIANT_FAILED,
      reason,
      contract,
    });
  }
  if (!c) mismatch(c, "submarine_mine_laying_v1 missing contract");
  if (c.policyId !== submarineMineLayingPolicyId)
    mismatch(c, "submarine_mine_laying_v1 expected policy id");
  if (
    c.rulesetVersion !== SUBMARINE_RULESET_VERSION ||
    c.formulaVersion !== SUBMARINE_FORMULA_VERSION
  )
    mismatch(c, "submarine_mine_laying_v1 ruleset/formula versions");
  if (c.basisPointsPerUnit !== SUBMARINE_BASIS_POINTS_PER_UNIT)
    mismatch(c, "submarine_mine_laying_v1 basis-point scale");
  if (c.reliabilityFloor !== SUBMARINE_MINE_LAYING_RELIABILITY_FLOOR)
    mismatch(c, "submarine_mine_laying_v1 §20 reliability floor 40");
  if (c.readinessFloor !== SUBMARINE_MINE_LAYING_READINESS_FLOOR)
    mismatch(c, "submarine_mine_laying_v1 §20 readiness floor 50");
  if (c.fuelFloorBp !== SUBMARINE_MINE_LAYING_FUEL_FLOOR_BP)
    mismatch(c, "submarine_mine_laying_v1 §20 fuel floor 3_000 bp");
  void c;
}

// ---------------------------------------------------------------------------
// submarine_friendly_identification_v1 (§23)
// ---------------------------------------------------------------------------

export interface SubmarineFriendlyIdentificationContract {
  policyId: string;
  rulesetVersion: string;
  formulaVersion: string;
  basisPointsPerUnit: number;
  baseProbabilityBp: number;
  clampMinBp: number;
  clampMaxBp: number;
}

export const SHIPPED_SUBMARINE_FRIENDLY_IDENTIFICATION_CONTRACT: SubmarineFriendlyIdentificationContract =
  {
    policyId: submarineFriendlyIdentificationPolicyId,
    rulesetVersion: SUBMARINE_RULESET_VERSION,
    formulaVersion: SUBMARINE_FORMULA_VERSION,
    basisPointsPerUnit: SUBMARINE_BASIS_POINTS_PER_UNIT,
    baseProbabilityBp: SUBMARINE_FRIENDLY_IDENTIFICATION_BASE_BP,
    clampMinBp: SUBMARINE_FRIENDLY_IDENTIFICATION_MIN_BP,
    clampMaxBp: SUBMARINE_FRIENDLY_IDENTIFICATION_MAX_BP,
  };

export function validateSubmarineFriendlyIdentificationContract(
  c: Partial<SubmarineFriendlyIdentificationContract> | null | undefined,
): asserts c is SubmarineFriendlyIdentificationContract {
  function mismatch(contract: unknown, reason: string): never {
    throw new BluewaveError(SUBMARINE_STATE_INVARIANT_FAILED, {
      code: SUBMARINE_STATE_INVARIANT_FAILED,
      reason,
      contract,
    });
  }
  if (!c) mismatch(c, "submarine_friendly_identification_v1 missing contract");
  if (c.policyId !== submarineFriendlyIdentificationPolicyId)
    mismatch(c, "submarine_friendly_identification_v1 expected policy id");
  if (
    c.rulesetVersion !== SUBMARINE_RULESET_VERSION ||
    c.formulaVersion !== SUBMARINE_FORMULA_VERSION
  )
    mismatch(c, "submarine_friendly_identification_v1 ruleset/formula versions");
  if (c.basisPointsPerUnit !== SUBMARINE_BASIS_POINTS_PER_UNIT)
    mismatch(c, "submarine_friendly_identification_v1 basis-point scale");
  if (c.baseProbabilityBp !== SUBMARINE_FRIENDLY_IDENTIFICATION_BASE_BP)
    mismatch(c, "submarine_friendly_identification_v1 §23 base 500 bp");
  if (c.clampMinBp !== SUBMARINE_FRIENDLY_IDENTIFICATION_MIN_BP)
    mismatch(c, "submarine_friendly_identification_v1 §23 clamp min 0");
  if (c.clampMaxBp !== SUBMARINE_FRIENDLY_IDENTIFICATION_MAX_BP)
    mismatch(c, "submarine_friendly_identification_v1 §23 clamp max 10_000");
  void c;
}
