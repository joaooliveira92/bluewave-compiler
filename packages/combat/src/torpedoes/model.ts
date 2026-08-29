//packages/combat/src/torpedoes/model.ts
// DESIGN-40 §1 immutable TorpedoModelDefinition: every field required; a missing
// or invalid field fails with INVALID_TORPEDO_MODEL_DEFINITION. The definition
// carries a deterministic content version + content hash (canonical serializer +
// SHA-256 envelope, domain-separated with the torpedo_models_v1 compatibility
// version — no ambient randomness). Pure/deterministic: no I/O/clock/random.
import { BluewaveError } from "@bluewave/contracts";
import { createEnvelope } from "@bluewave/deterministic";
import {
  OXYGEN_CHAIN_REACTION_BASE_BP,
  OXYGEN_RANGE_MULTIPLIER_BP,
  OXYGEN_SPEED_MULTIPLIER_BP,
  OXYGEN_TUBE_HIT_SEVERE_FLOODING_MULTIPLIER_BP,
  OXYGEN_WAKE_DETECTION_MULTIPLIER_BP,
  SEED_TORPEDO_MODEL_IDS,
  TORPEDO_PROPULSION_TYPES,
  type TorpedoPropulsionType,
  TORPEDO_RELIABILITY_SCALE,
  TORPEDO_WARHEAD_TYPES,
  type TorpedoWarheadType,
  TUBE_HIT_HAZARD_POLICIES,
  type TubeHitHazardPolicy,
} from "./constants.js";
import { INVALID_TORPEDO_MODEL_DEFINITION, TORPEDO_STATE_INVARIANT_FAILED } from "./reasonCodes.js";

// Content version of the research-grounded model set (INC-1 seeded a subset;
// INC-8 rolls up the FULL torpedo_models_v1 set — 8 models, see the shipped
// set below).
export const torpedoModelsContentVersion = "torpedo_models_v1" as const;

// DESIGN-40 §1 ordered speed/range setting: integer basis-point knots
// (knots * 1_000, movement precedent) + integer maximum run range in metres.
// Ordered settings preserve the research note's monotone inverse speed/range
// pairing (§4.2).
export interface TorpedoSetting {
  settingId: string;
  speedKnotsBp: number; // integer, knots * 1_000 (26.5 kn -> 26_500)
  rangeM: number; // integer metres, maximum run at this setting
}

// DESIGN-40 §23 oxygen-torpedo declaration. An OXYGEN model MUST declare the
// shipped §23 effects exactly; the per-model wakeVisibilityModifierBp is the
// BALANCE-TARGET lever surfaced by the research note (§4.4) — the shipped §23
// constants are never silently changed.
export interface OxygenTorpedoState {
  oxygenRangeMultiplierBp: number; // §23 15_000
  oxygenSpeedMultiplierBp: number; // §23 11_000
  oxygenWakeDetectionMultiplierBp: number; // §23 7_500
  tubeHitSevereFloodingMultiplierBp: number; // §23 15_000
  chainReactionBaseBp: number; // §23 3_000
  wakeVisibilityModifierBp: number; // per-model modifier, basis points [0, 10_000]
}

export interface TorpedoModelDefinition {
  torpedoModelId: string;
  ownerNationIds: readonly string[]; // owner or licensing nation identifiers
  technologyPrerequisiteIds: readonly string[]; // may be empty for earliest models
  productionRequirementId: string;
  diameterMm: number; // integer mm
  massKg: number; // integer kg
  warheadType: TorpedoWarheadType;
  warheadExplosiveMassKg: number; // integer kg, physical charge
  warheadExplosiveEquivalentMassKg: number; // integer kg TNT-equivalent (authoritative)
  propulsionType: TorpedoPropulsionType;
  orderedSettings: readonly TorpedoSetting[];
  minimumArmingDistanceM: number; // integer metres >= 0
  reliabilityBp: number; // integer [0, TORPEDO_RELIABILITY_SCALE] (per-100_000)
  depthKeepingProfile: string; // non-empty stable authored id
  guidanceCapability: string; // non-empty stable authored id
  compatibleLauncherFamilyIds: readonly string[];
  oxygenState: OxygenTorpedoState | null; // non-null iff propulsionType === "OXYGEN"
  tubeHitHazardPolicyId: TubeHitHazardPolicy;
  contentVersion: string;
  contentHash: string; // deterministic SHA-256 over the non-hash surface
}

function invariant(
  m: TorpedoModelDefinition,
  field: string,
  value: unknown,
  reason: string,
): never {
  throw new BluewaveError(INVALID_TORPEDO_MODEL_DEFINITION, {
    code: INVALID_TORPEDO_MODEL_DEFINITION,
    field,
    reason,
    value,
  });
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function isInt(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && Number.isSafeInteger(v);
}

// AC-1: reject any missing/invalid field of the TorpedoModelDefinition with
// INVALID_TORPEDO_MODEL_DEFINITION. Validates the full surface except the
// content-hash presence (a hash-less surface is validated before hashing).
export function assertTorpedoModelSurface(m: TorpedoModelDefinition): void {
  if (!isNonEmptyString(m.torpedoModelId))
    invariant(m, "torpedoModelId", m.torpedoModelId, "torpedoModelId must be a non-empty string");

  if (!Array.isArray(m.ownerNationIds) || m.ownerNationIds.length === 0)
    invariant(
      m,
      "ownerNationIds",
      m.ownerNationIds,
      "at least one owner/licensing nation is required",
    );
  if (!m.ownerNationIds.every(isNonEmptyString))
    invariant(
      m,
      "ownerNationIds",
      m.ownerNationIds,
      "every owner nation must be a non-empty string",
    );

  if (!Array.isArray(m.technologyPrerequisiteIds))
    invariant(m, "technologyPrerequisiteIds", m.technologyPrerequisiteIds, "must be an array");
  if (!m.technologyPrerequisiteIds.every(isNonEmptyString))
    invariant(
      m,
      "technologyPrerequisiteIds",
      m.technologyPrerequisiteIds,
      "every technology prerequisite must be a non-empty string",
    );

  if (!isNonEmptyString(m.productionRequirementId))
    invariant(
      m,
      "productionRequirementId",
      m.productionRequirementId,
      "productionRequirementId must be a non-empty string",
    );

  if (!isInt(m.diameterMm) || m.diameterMm <= 0)
    invariant(m, "diameterMm", m.diameterMm, "diameter must be a positive integer millimetres");
  if (!isInt(m.massKg) || m.massKg <= 0)
    invariant(m, "massKg", m.massKg, "mass must be a positive integer kilograms");

  if (!(TORPEDO_WARHEAD_TYPES as readonly string[]).includes(m.warheadType))
    invariant(m, "warheadType", m.warheadType, "warheadType must be a canonical warhead type");
  if (!isInt(m.warheadExplosiveMassKg) || m.warheadExplosiveMassKg <= 0)
    invariant(
      m,
      "warheadExplosiveMassKg",
      m.warheadExplosiveMassKg,
      "warhead explosive mass must be a positive integer kilograms",
    );
  if (!isInt(m.warheadExplosiveEquivalentMassKg) || m.warheadExplosiveEquivalentMassKg <= 0)
    invariant(
      m,
      "warheadExplosiveEquivalentMassKg",
      m.warheadExplosiveEquivalentMassKg,
      "warhead explosive-equivalent mass must be a positive integer kilograms",
    );

  if (!(TORPEDO_PROPULSION_TYPES as readonly string[]).includes(m.propulsionType))
    invariant(
      m,
      "propulsionType",
      m.propulsionType,
      "propulsionType must be a canonical propulsion type",
    );

  if (!Array.isArray(m.orderedSettings) || m.orderedSettings.length === 0)
    invariant(
      m,
      "orderedSettings",
      m.orderedSettings,
      "at least one ordered speed/range setting is required",
    );
  for (let i = 0; i < m.orderedSettings.length; i++) {
    const setting = m.orderedSettings[i];
    if (!isNonEmptyString(setting.settingId))
      invariant(m, `orderedSettings[${i}].settingId`, setting.settingId, "non-empty setting id");
    if (!isInt(setting.speedKnotsBp) || setting.speedKnotsBp <= 0)
      invariant(
        m,
        `orderedSettings[${i}].speedKnotsBp`,
        setting.speedKnotsBp,
        "speed must be a positive integer in basis-point knots",
      );
    if (!isInt(setting.rangeM) || setting.rangeM <= 0)
      invariant(
        m,
        `orderedSettings[${i}].rangeM`,
        setting.rangeM,
        "range must be a positive integer metres",
      );
  }

  if (!isInt(m.minimumArmingDistanceM) || m.minimumArmingDistanceM < 0)
    invariant(
      m,
      "minimumArmingDistanceM",
      m.minimumArmingDistanceM,
      "minimum arming distance must be a non-negative integer metres",
    );

  if (!isInt(m.reliabilityBp) || m.reliabilityBp < 0 || m.reliabilityBp > TORPEDO_RELIABILITY_SCALE)
    invariant(
      m,
      "reliabilityBp",
      m.reliabilityBp,
      `reliability must be an integer within [0, ${TORPEDO_RELIABILITY_SCALE}]`,
    );

  if (!isNonEmptyString(m.depthKeepingProfile))
    invariant(
      m,
      "depthKeepingProfile",
      m.depthKeepingProfile,
      "depth-keeping profile must be a non-empty id",
    );
  if (!isNonEmptyString(m.guidanceCapability))
    invariant(
      m,
      "guidanceCapability",
      m.guidanceCapability,
      "guidance capability must be a non-empty id",
    );

  if (!Array.isArray(m.compatibleLauncherFamilyIds) || m.compatibleLauncherFamilyIds.length === 0)
    invariant(
      m,
      "compatibleLauncherFamilyIds",
      m.compatibleLauncherFamilyIds,
      "at least one compatible launcher family is required",
    );
  if (!m.compatibleLauncherFamilyIds.every(isNonEmptyString))
    invariant(
      m,
      "compatibleLauncherFamilyIds",
      m.compatibleLauncherFamilyIds,
      "every launcher family id must be a non-empty string",
    );

  if (m.propulsionType === "OXYGEN") {
    if (m.oxygenState === null || typeof m.oxygenState !== "object")
      invariant(
        m,
        "oxygenState",
        m.oxygenState,
        "an OXYGEN model MUST declare its §23 oxygen state",
      );
    const o = m.oxygenState as OxygenTorpedoState;
    if (o.oxygenRangeMultiplierBp !== OXYGEN_RANGE_MULTIPLIER_BP)
      invariant(
        m,
        "oxygenState.oxygenRangeMultiplierBp",
        o.oxygenRangeMultiplierBp,
        "shipped §23 range multiplier 15_000",
      );
    if (o.oxygenSpeedMultiplierBp !== OXYGEN_SPEED_MULTIPLIER_BP)
      invariant(
        m,
        "oxygenState.oxygenSpeedMultiplierBp",
        o.oxygenSpeedMultiplierBp,
        "shipped §23 speed multiplier 11_000",
      );
    if (o.oxygenWakeDetectionMultiplierBp !== OXYGEN_WAKE_DETECTION_MULTIPLIER_BP)
      invariant(
        m,
        "oxygenState.oxygenWakeDetectionMultiplierBp",
        o.oxygenWakeDetectionMultiplierBp,
        "shipped §23 wake-detection multiplier 7_500",
      );
    if (o.tubeHitSevereFloodingMultiplierBp !== OXYGEN_TUBE_HIT_SEVERE_FLOODING_MULTIPLIER_BP)
      invariant(
        m,
        "oxygenState.tubeHitSevereFloodingMultiplierBp",
        o.tubeHitSevereFloodingMultiplierBp,
        "shipped §23 tube-hit severe-flooding multiplier 15_000",
      );
    if (o.chainReactionBaseBp !== OXYGEN_CHAIN_REACTION_BASE_BP)
      invariant(
        m,
        "oxygenState.chainReactionBaseBp",
        o.chainReactionBaseBp,
        "shipped §23 chain-reaction base 3_000",
      );
    if (
      !isInt(o.wakeVisibilityModifierBp) ||
      o.wakeVisibilityModifierBp < 0 ||
      o.wakeVisibilityModifierBp > 10_000
    )
      invariant(
        m,
        "oxygenState.wakeVisibilityModifierBp",
        o.wakeVisibilityModifierBp,
        "wake-visibility modifier must be integer basis points [0, 10_000]",
      );
  } else {
    if (m.oxygenState !== null)
      invariant(
        m,
        "oxygenState",
        m.oxygenState,
        "oxygen state is only valid for OXYGEN propulsion",
      );
  }

  if (!(TUBE_HIT_HAZARD_POLICIES as readonly string[]).includes(m.tubeHitHazardPolicyId))
    invariant(
      m,
      "tubeHitHazardPolicyId",
      m.tubeHitHazardPolicyId,
      "tube-hit-hazard policy must be canonical",
    );

  if (!isNonEmptyString(m.contentVersion))
    invariant(m, "contentVersion", m.contentVersion, "content version must be a non-empty string");
}

// AC-1: full validation incl. the content hash presence requirement.
export function validateTorpedoModelDefinition(m: TorpedoModelDefinition): void {
  assertTorpedoModelSurface(m);
  if (!isNonEmptyString(m.contentHash))
    invariant(m, "contentHash", m.contentHash, "content hash must be a non-empty string");
}

// Deterministic content hash over the non-hash surface, domain-separated with
// the torpedo_models_v1 content version. Identical content -> identical hash.
export function computeTorpedoModelContentHash(
  m: Omit<TorpedoModelDefinition, "contentHash">,
): string {
  // Strip contentHash defensively before serializing: the caller may hand us a
  // fully-hashed model (verify path) or a hash-less surface (build path). The
  // hash is always computed over the same surface either way — otherwise the
  // recomputed digest would cover the stored hash itself and never verify.
  const { contentHash: _ignored, ...surface } = m as TorpedoModelDefinition;
  return createEnvelope("torpedo-model", torpedoModelsContentVersion, surface).bodyHash;
}

// Build a fully-validated model with its authoritative content hash computed.
export function withTorpedoModelContentHash(
  m: Omit<TorpedoModelDefinition, "contentHash">,
): TorpedoModelDefinition {
  const full = m as TorpedoModelDefinition;
  assertTorpedoModelSurface(full);
  return { ...m, contentHash: computeTorpedoModelContentHash(m) };
}

// Fail-closed content-hash verification: recomputes the hash and compares.
// Any tampered field produces a mismatch (never silently accepted).
export function verifyTorpedoModelContentHash(m: TorpedoModelDefinition): boolean {
  return computeTorpedoModelContentHash(m) === m.contentHash;
}

// ---------------------------------------------------------------------------
// INC-1 grounded seed model set (docs/research/c1-m3-torpedoes.md §4.1-§4.5),
// rolled up to the FULL research-grounded `torpedo_models_v1` set by INC-8
// (8 historical models 1880-1945: Whitehead 14-in/18-in, RN 21-in Mk IV/Mk VIII,
// USN 21-in Mk 14, G7a/G7e, Type 93). BALANCE TARGET items are authored with
// provenance comments and never claimed as grounded (research note §4 / spec
// §1.3). The set ships as SHIPPED_TORPEDO_MODELS + the torpedo_models_v1
// contract surface (SHIPPED_TORPEDO_MODELS_CONTRACT + validateTorpedoModelsContract)
// that fails closed on any tampering (AC-24).
// ---------------------------------------------------------------------------

export const SHIPPED_TORPEDO_MODELS: readonly TorpedoModelDefinition[] = [
  withTorpedoModelContentHash({
    torpedoModelId: "whitehead_18in_1894",
    ownerNationIds: ["rn"],
    technologyPrerequisiteIds: [],
    productionRequirementId: "prod_whitehead_18in_1894",
    diameterMm: 457,
    massKg: 383,
    warheadType: "WET_GUNCOTTON",
    // 118 lb (53.5 kg) wet guncotton — authored as 54 kg (rounded integer);
    // TNT-equivalence ~1.0 (research §3.5).
    warheadExplosiveMassKg: 54,
    warheadExplosiveEquivalentMassKg: 54,
    propulsionType: "COMPRESSED_AIR",
    orderedSettings: [
      // 800 yd (730 m) @ 26.5 kn — NavWeaps WTBR_PreWWII (research §4.2).
      { settingId: "26_5kn", speedKnotsBp: 26_500, rangeM: 730 },
    ],
    // BALANCE TARGET: contact pistol, no run-based arming captured (20-30 m band).
    minimumArmingDistanceM: 25,
    reliabilityBp: 90_000,
    depthKeepingProfile: "primitive",
    guidanceCapability: "none",
    compatibleLauncherFamilyIds: ["18in_above_water_fixed", "18in_above_water_trainable"],
    oxygenState: null,
    tubeHitHazardPolicyId: "ORDINARY",
    contentVersion: torpedoModelsContentVersion,
  }),
  withTorpedoModelContentHash({
    torpedoModelId: "rn_21in_mk_iv_1916",
    ownerNationIds: ["rn"],
    technologyPrerequisiteIds: ["wet_heater_engine"],
    productionRequirementId: "prod_rn_21in_mk_iv_1916",
    diameterMm: 533,
    massKg: 1_454,
    warheadType: "TNT",
    warheadExplosiveMassKg: 234,
    warheadExplosiveEquivalentMassKg: 234,
    propulsionType: "WET_HEATER",
    orderedSettings: [
      { settingId: "35kn", speedKnotsBp: 35_000, rangeM: 7_315 },
      { settingId: "29kn", speedKnotsBp: 29_000, rangeM: 9_144 },
      { settingId: "25kn", speedKnotsBp: 25_000, rangeM: 12_344 },
    ],
    minimumArmingDistanceM: 50, // BALANCE TARGET
    reliabilityBp: 93_500,
    depthKeepingProfile: "basic",
    guidanceCapability: "gyro",
    compatibleLauncherFamilyIds: [
      "21in_underwater_fixed",
      "21in_underwater_trainable",
      "21in_above_water_trainable",
    ],
    oxygenState: null,
    tubeHitHazardPolicyId: "ORDINARY",
    contentVersion: torpedoModelsContentVersion,
  }),
  withTorpedoModelContentHash({
    torpedoModelId: "ger_533mm_g7a_1934",
    ownerNationIds: ["ger"],
    technologyPrerequisiteIds: ["wet_heater_engine"],
    productionRequirementId: "prod_ger_533mm_g7a_1934",
    diameterMm: 533,
    massKg: 1_528,
    warheadType: "HEXANITE",
    warheadExplosiveMassKg: 280,
    warheadExplosiveEquivalentMassKg: 280,
    propulsionType: "WET_HEATER",
    orderedSettings: [
      // NavWeaps + uboat.net values; Wikipedia variant (5_000/7_500/12_000 m)
      // flagged in the research note (§3.1) — NavWeaps pair preferred, recorded.
      { settingId: "44kn", speedKnotsBp: 44_000, rangeM: 6_000 },
      { settingId: "40kn", speedKnotsBp: 40_000, rangeM: 8_000 },
      { settingId: "30kn", speedKnotsBp: 30_000, rangeM: 14_000 },
    ],
    // GROUNDED: U-boat red impeller 150 m (Wikipedia G7a spec table).
    minimumArmingDistanceM: 150,
    reliabilityBp: 96_000,
    depthKeepingProfile: "standard",
    guidanceCapability: "gyro",
    compatibleLauncherFamilyIds: [
      "533mm_above_water_trainable",
      "533mm_underwater_trainable",
      "533mm_submarine_internal",
    ],
    oxygenState: null,
    tubeHitHazardPolicyId: "ORDINARY",
    contentVersion: torpedoModelsContentVersion,
  }),
  withTorpedoModelContentHash({
    torpedoModelId: "ger_533mm_g7e_1936",
    ownerNationIds: ["ger"],
    technologyPrerequisiteIds: ["electric_propulsion"],
    productionRequirementId: "prod_ger_533mm_g7e_1936",
    diameterMm: 533,
    massKg: 1_603,
    warheadType: "HEXANITE",
    warheadExplosiveMassKg: 280,
    warheadExplosiveEquivalentMassKg: 280,
    propulsionType: "ELECTRIC",
    orderedSettings: [
      { settingId: "t2_30kn", speedKnotsBp: 30_000, rangeM: 5_000 },
      { settingId: "t3_30kn", speedKnotsBp: 30_000, rangeM: 7_500 },
    ],
    minimumArmingDistanceM: 150, // same Pi1/Pi2 pistols as G7a (research §4.3)
    reliabilityBp: 93_000,
    depthKeepingProfile: "standard",
    guidanceCapability: "gyro",
    compatibleLauncherFamilyIds: ["533mm_above_water_trainable", "533mm_submarine_internal"],
    oxygenState: null,
    tubeHitHazardPolicyId: "ELECTRIC",
    contentVersion: torpedoModelsContentVersion,
  }),
  withTorpedoModelContentHash({
    torpedoModelId: "jpn_61cm_type93_1935",
    ownerNationIds: ["jpn"],
    technologyPrerequisiteIds: ["oxygen_propulsion"],
    productionRequirementId: "prod_jpn_61cm_type93_1935",
    diameterMm: 610,
    massKg: 2_700,
    warheadType: "TYPE_97",
    // Mod 1 charge authored (Mod 3 780 kg variant recorded for the INC-8 rollup).
    warheadExplosiveMassKg: 490,
    warheadExplosiveEquivalentMassKg: 490,
    propulsionType: "OXYGEN",
    orderedSettings: [
      { settingId: "48kn", speedKnotsBp: 48_000, rangeM: 20_000 },
      { settingId: "40kn", speedKnotsBp: 40_000, rangeM: 32_000 },
      { settingId: "36kn", speedKnotsBp: 36_000, rangeM: 40_000 },
    ],
    minimumArmingDistanceM: 300, // BALANCE TARGET (research §4.3)
    reliabilityBp: 92_000,
    depthKeepingProfile: "advanced",
    guidanceCapability: "gyro",
    compatibleLauncherFamilyIds: [
      "61cm_above_water_trainable",
      "61cm_underwater_trainable",
      "61cm_submarine_internal",
    ],
    oxygenState: {
      oxygenRangeMultiplierBp: OXYGEN_RANGE_MULTIPLIER_BP,
      oxygenSpeedMultiplierBp: OXYGEN_SPEED_MULTIPLIER_BP,
      oxygenWakeDetectionMultiplierBp: OXYGEN_WAKE_DETECTION_MULTIPLIER_BP,
      tubeHitSevereFloodingMultiplierBp: OXYGEN_TUBE_HIT_SEVERE_FLOODING_MULTIPLIER_BP,
      chainReactionBaseBp: OXYGEN_CHAIN_REACTION_BASE_BP,
      wakeVisibilityModifierBp: 2_500,
    },
    tubeHitHazardPolicyId: "OXYGEN",
    contentVersion: torpedoModelsContentVersion,
  }),
  withTorpedoModelContentHash({
    torpedoModelId: "whitehead_14in_1886",
    ownerNationIds: ["rn"],
    technologyPrerequisiteIds: [],
    productionRequirementId: "prod_whitehead_14in_1886",
    diameterMm: 356,
    massKg: 300,
    warheadType: "WET_GUNCOTTON",
    // 60 lb (27 kg) wet guncotton (research §3.1/§4.1); TNT-equivalence ~1.0
    // (research §3.5).
    warheadExplosiveMassKg: 27,
    warheadExplosiveEquivalentMassKg: 27,
    propulsionType: "COMPRESSED_AIR",
    orderedSettings: [
      // BALANCE TARGET: research §3.1/§4.1 grounds only a band (18-25 kn /
      // 26-60 lb; Armstrong 1896 24-kn redesign); the 25 kn @ 550 m entry is
      // authored at the band's top (research §4.2), never claimed as a single
      // pinned figure.
      { settingId: "25kn", speedKnotsBp: 25_000, rangeM: 550 },
    ],
    // BALANCE TARGET (research §4.3): "n/a (contact)" — no run-based arming
    // captured; 20-30 m nominal band, authored at 25 m like the 18-in.
    minimumArmingDistanceM: 25,
    reliabilityBp: 88_000,
    depthKeepingProfile: "primitive",
    guidanceCapability: "none",
    compatibleLauncherFamilyIds: ["14in_above_water_fixed", "14in_above_water_trainable"],
    oxygenState: null,
    tubeHitHazardPolicyId: "ORDINARY",
    contentVersion: torpedoModelsContentVersion,
  }),
  withTorpedoModelContentHash({
    torpedoModelId: "rn_21in_mk_viii_1927",
    ownerNationIds: ["rn"],
    technologyPrerequisiteIds: ["wet_heater_engine"],
    productionRequirementId: "prod_rn_21in_mk_viii_1927",
    diameterMm: 533,
    massKg: 1_566,
    warheadType: "TNT",
    // Mk VIII base: 750 lb (340 kg) TNT, TNT-equivalence 1.0 (research §3.1/§4.1).
    // The VIII** variant (805 lb / 365 kg Torpex, eq ~548) is recorded in the
    // research note (§4.1), not shipped as a separate model.
    warheadExplosiveMassKg: 340,
    warheadExplosiveEquivalentMassKg: 340,
    propulsionType: "WET_HEATER",
    orderedSettings: [
      // Mk VIII base: 5,000 yd (4,572 m) @ 40 kn (research §3.1/§4.2). The
      // VIII** high-speed rows (45.5 kn @ 4,572 m / 41 kn @ 6,401 m) belong to
      // the later production variant and are recorded, not shipped here.
      { settingId: "40kn", speedKnotsBp: 40_000, rangeM: 4_572 },
    ],
    // BALANCE TARGET (research §3.1/§4.3): "~100 m" — no primary source pinned.
    minimumArmingDistanceM: 100,
    reliabilityBp: 95_500,
    depthKeepingProfile: "standard",
    guidanceCapability: "gyro",
    compatibleLauncherFamilyIds: [
      "21in_above_water_trainable",
      "21in_underwater_fixed",
      "21in_underwater_trainable",
    ],
    oxygenState: null,
    tubeHitHazardPolicyId: "ORDINARY",
    contentVersion: torpedoModelsContentVersion,
  }),
  withTorpedoModelContentHash({
    torpedoModelId: "usn_21in_mk14_1931",
    ownerNationIds: ["us"],
    technologyPrerequisiteIds: ["wet_heater_engine"],
    productionRequirementId: "prod_usn_21in_mk14_1931",
    diameterMm: 533,
    massKg: 1_361,
    warheadType: "TNT",
    // Mk 14 Mod 0: 507 lb (230 kg) TNT, TNT-equivalence 1.0 (research §3.1/§4.1).
    // The Mod 3 variant (668 lb / 303 kg TPX, eq ~394) is recorded in the
    // research note (§4.1), not shipped as a separate model.
    warheadExplosiveMassKg: 230,
    warheadExplosiveEquivalentMassKg: 230,
    propulsionType: "WET_HEATER",
    orderedSettings: [
      // 4,500 yd (4,115 m) @ 46 kn; 9,000 yd (8,230 m) @ 31 kn (research §4.2).
      { settingId: "46kn", speedKnotsBp: 46_000, rangeM: 4_115 },
      { settingId: "31kn", speedKnotsBp: 31_000, rangeM: 8_230 },
    ],
    // GROUNDED: 450 yd = 410 m (research §4.3 — USNI technical report via
    // subsim; BuOrd later recommended 700 yd for stabilization).
    minimumArmingDistanceM: 410,
    reliabilityBp: 94_000,
    depthKeepingProfile: "standard",
    guidanceCapability: "gyro",
    compatibleLauncherFamilyIds: [
      "21in_underwater_fixed",
      "21in_underwater_trainable",
      "21in_above_water_trainable",
    ],
    oxygenState: null,
    tubeHitHazardPolicyId: "ORDINARY",
    contentVersion: torpedoModelsContentVersion,
  }),
];

// Fail-closed lookup: a shipped torpedo model by id. An unknown model id fails
// with INVALID_TORPEDO_MODEL_DEFINITION (never a silent default), mirroring the
// baseReloadMsForCaliber fail-closed lookup in the gunnery module.
export function torpedoModelById(modelId: string): TorpedoModelDefinition {
  const model = SHIPPED_TORPEDO_MODELS.find((m) => m.torpedoModelId === modelId);
  if (!model) {
    throw new BluewaveError(INVALID_TORPEDO_MODEL_DEFINITION, {
      code: INVALID_TORPEDO_MODEL_DEFINITION,
      reason: "unknown torpedo model id — no shipped definition for this model",
      value: modelId,
    });
  }
  return model;
}

// ---------------------------------------------------------------------------
// torpedo_models_v1 contract (INC-8, AC-24) — the full research-grounded model
// set as a fail-closed contract surface. `torpedoModelsContentVersion` is the
// `torpedo_models_v1` policy id; SHIPPED_TORPEDO_MODELS is the shipped set
// (8 models, deterministic content hashes). The guard pins the exact ordered
// model-id list + per-model content hash + definition validity; any tampering
// (added/removed/reordered/edited model) fails closed with
// TORPEDO_STATE_INVARIANT_FAILED — the same fail-closed idiom as the
// detonation/damage/tube-hazard contracts (never a silent default).
// ---------------------------------------------------------------------------
export interface TorpedoModelsContract {
  policyId: string;
  modelIds: readonly string[];
  models: readonly TorpedoModelDefinition[];
}

export const SHIPPED_TORPEDO_MODELS_CONTRACT: TorpedoModelsContract = {
  policyId: torpedoModelsContentVersion,
  modelIds: SEED_TORPEDO_MODEL_IDS,
  models: SHIPPED_TORPEDO_MODELS,
};

function throwModelsMismatch(contract: unknown, reason: string): never {
  throw new BluewaveError(TORPEDO_STATE_INVARIANT_FAILED, {
    code: TORPEDO_STATE_INVARIANT_FAILED,
    contract,
    reason,
  });
}

export function validateTorpedoModelsContract(
  c: Partial<TorpedoModelsContract> | null | undefined,
): asserts c is TorpedoModelsContract {
  if (!c) throwModelsMismatch(c, "torpedo_models_v1 missing contract");
  if (c.policyId !== torpedoModelsContentVersion)
    throwModelsMismatch(c, "torpedo_models_v1 expectant policy id");
  // The model-id list is pinned EXACTLY (ordered) to the shipped id set.
  if (
    !c.modelIds ||
    c.modelIds.length !== SEED_TORPEDO_MODEL_IDS.length ||
    !c.modelIds.every((id, i) => id === SEED_TORPEDO_MODEL_IDS[i])
  )
    throwModelsMismatch(c, "torpedo_models_v1 shipped model id list");
  if (!c.models || c.models.length !== SHIPPED_TORPEDO_MODELS.length)
    throwModelsMismatch(c, "torpedo_models_v1 model definition set size");
  // Every shipped model validates and its deterministic content hash verifies —
  // a tampered/edited model never passes (never silently accepted).
  for (const model of c.models) {
    validateTorpedoModelDefinition(model);
    if (model.contentVersion !== torpedoModelsContentVersion)
      throwModelsMismatch(c, "torpedo_models_v1 model content version");
    if (!verifyTorpedoModelContentHash(model))
      throwModelsMismatch(c, `torpedo_models_v1 content hash mismatch: ${model.torpedoModelId}`);
  }
}
