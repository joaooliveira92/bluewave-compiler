// packages/campaign/src/technologyVariation.ts
// DESIGN-03 §6 Technology Variation - Normative
import type { DiagnosticCollector } from "@bluewave/diagnostics";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";

export type VariationId = "none" | "some" | "considerable";
export const VARIATION_IDS = ["none", "some", "considerable"] as const;
export interface TechnologyVariationProfile {
  settingId: VariationId;
  earliestDateShiftMonths: number;
  latestDateShiftMonths: number;
  effectivenessVariationMinBp: number;
  effectivenessVariationMaxBp: number;
  dateDistributionId: string;
  effectivenessDistributionId: string;
  technologyEligibilityPredicateId: string;
  variationFormulaVersion: string;
  streamFamily: string;
}
export const RNG_ALGORITHM_VERSION = "1";
export const STREAM_FAMILY = "setup/technology_variation";
export const CANONICAL_TECH_PROFILES: TechnologyVariationProfile[] = [
  {
    settingId: "none",
    earliestDateShiftMonths: 0,
    latestDateShiftMonths: 0,
    effectivenessVariationMinBp: 10_000,
    effectivenessVariationMaxBp: 10_000,
    dateDistributionId: "constant_zero_v1",
    effectivenessDistributionId: "constant_10000_v1",
    technologyEligibilityPredicateId: "default_v1",
    variationFormulaVersion: "1",
    streamFamily: STREAM_FAMILY,
  },
  {
    settingId: "some",
    earliestDateShiftMonths: -24,
    latestDateShiftMonths: 24,
    effectivenessVariationMinBp: 9_500,
    effectivenessVariationMaxBp: 10_500,
    dateDistributionId: "symmetric_triangular_integer_v1",
    effectivenessDistributionId: "symmetric_triangular_integer_v1",
    technologyEligibilityPredicateId: "default_v1",
    variationFormulaVersion: "1",
    streamFamily: STREAM_FAMILY,
  },
  {
    settingId: "considerable",
    earliestDateShiftMonths: -72,
    latestDateShiftMonths: 72,
    effectivenessVariationMinBp: 9_000,
    effectivenessVariationMaxBp: 11_000,
    dateDistributionId: "symmetric_triangular_integer_v1",
    effectivenessDistributionId: "symmetric_triangular_integer_v1",
    technologyEligibilityPredicateId: "default_v1",
    variationFormulaVersion: "1",
    streamFamily: STREAM_FAMILY,
  },
];
export interface TechnologyDefinition {
  technologyId: string;
  canonicalAvailabilityMonth: number;
  canonicalEffectValues: Record<string, number>;
  variationEligible: boolean;
  dateVariationEligible: boolean;
  effectivenessVariationEligible: boolean;
  earliestPermittedAvailabilityMonth: number;
  latestPermittedAvailabilityMonth: number;
  variableEffectIds: string[];
  prerequisiteTechnologyIds: string[];
  prerequisiteDelayMonths?: number | Record<string, number>;
  effectVariationBounds?: Record<string, { minBp: number; maxBp: number }>;
}
export interface TechnologyManifestEntry {
  technologyId: string;
  canonicalAvailabilityMonth: number;
  selectedDateShift: number;
  finalAvailabilityMonth: number;
  canonicalEffectValues: Record<string, number>;
  effectivenessMultiplier: number;
  finalVariedEffectValues: Record<string, number>;
  eligibilityFlags: {
    variationEligible: boolean;
    dateVariationEligible: boolean;
    effectivenessVariationEligible: boolean;
  };
  variationDecisionRecordIds: string[];
  contentHash: string;
  rulesetHash: string;
  formulaVersion: string;
}
export interface CampaignTechnologyManifest {
  entries: Record<string, TechnologyManifestEntry>;
  contentHash: string;
  rulesetHash: string;
  formulaVersion: string;
  manifestHash: string;
}

function buildKey(p: {
  campaignSeed: string;
  technologyId: string;
  settingId: string;
  formulaVersion: string;
  decisionTypeId: "availability_shift" | "effectiveness_multiplier";
}): string {
  return `${RNG_ALGORITHM_VERSION}|${p.campaignSeed}|${STREAM_FAMILY}|${p.technologyId}|${p.settingId}|${p.formulaVersion}|${p.decisionTypeId}`;
}
function uniformInt(key: string, min: number, max: number): number {
  const h = sha256Hex(key);
  const v = parseInt(h.slice(0, 8), 16);
  const range = max - min + 1;
  return min + (v % range);
}
function triangular(keyBase: string, min: number, max: number): number {
  const a = uniformInt(keyBase + "|a", min, max);
  const b = uniformInt(keyBase + "|b", min, max);
  return Math.trunc((a + b) / 2);
}

const ALLOWED_DATE_DIST = new Set(["constant_zero_v1", "symmetric_triangular_integer_v1"]);
const ALLOWED_EFF_DIST = new Set(["constant_10000_v1", "symmetric_triangular_integer_v1"]);

export function validateTechnologyVariationProfile(p: unknown, c: DiagnosticCollector): boolean {
  const r = p as Record<string, unknown>;
  if (typeof r !== "object" || r === null) {
    c.addError("INVALID_TECHNOLOGY_VARIATION_PROFILE", "profile must be object", {
      stage: "technology-variation",
    });
    return false;
  }
  let ok = true;
  const required = [
    "settingId",
    "earliestDateShiftMonths",
    "latestDateShiftMonths",
    "effectivenessVariationMinBp",
    "effectivenessVariationMaxBp",
    "dateDistributionId",
    "effectivenessDistributionId",
    "technologyEligibilityPredicateId",
    "variationFormulaVersion",
    "streamFamily",
  ] as const;
  for (const f of required)
    if (!(f in r)) {
      c.addError("INVALID_TECHNOLOGY_VARIATION_PROFILE", `Missing field ${f}`, {
        stage: "technology-variation",
      });
      ok = false;
    }
  if (!ok) return false;

  if (!["none", "some", "considerable"].includes(r["settingId"] as string)) {
    c.addError(
      "INVALID_TECHNOLOGY_VARIATION_PROFILE",
      `Invalid settingId ${String(r["settingId"])}`,
      { stage: "technology-variation" },
    );
    ok = false;
  }
  const minD = r["earliestDateShiftMonths"] as number;
  const maxD = r["latestDateShiftMonths"] as number;
  if (
    !Number.isInteger(minD) ||
    !Number.isInteger(maxD) ||
    !Number.isFinite(minD) ||
    !Number.isFinite(maxD) ||
    Math.abs(minD) > 72 ||
    Math.abs(maxD) > 72 ||
    minD > maxD
  ) {
    c.addError(
      "INVALID_TECHNOLOGY_VARIATION_PROFILE",
      `Date shift bounds invalid ${String(minD)}..${String(maxD)} (integers within -72..72, min<=max)`,
      { stage: "technology-variation" },
    );
    ok = false;
  }
  const minE = r["effectivenessVariationMinBp"] as number;
  const maxE = r["effectivenessVariationMaxBp"] as number;
  if (
    !Number.isInteger(minE) ||
    !Number.isInteger(maxE) ||
    !Number.isFinite(minE) ||
    !Number.isFinite(maxE) ||
    minE < 8000 ||
    maxE > 12000 ||
    minE > maxE
  ) {
    c.addError(
      "INVALID_TECHNOLOGY_VARIATION_PROFILE",
      `Effectiveness bounds ${String(minE)}..${String(maxE)} outside 8000..12000 or min>max (integers)`,
      { stage: "technology-variation" },
    );
    ok = false;
  }
  if (!ALLOWED_DATE_DIST.has(r["dateDistributionId"] as string)) {
    c.addError(
      "INVALID_TECHNOLOGY_VARIATION_PROFILE",
      `Invalid dateDistributionId ${String(r["dateDistributionId"])}`,
      { stage: "technology-variation" },
    );
    ok = false;
  }
  if (!ALLOWED_EFF_DIST.has(r["effectivenessDistributionId"] as string)) {
    c.addError(
      "INVALID_TECHNOLOGY_VARIATION_PROFILE",
      `Invalid effectivenessDistributionId ${String(r["effectivenessDistributionId"])}`,
      { stage: "technology-variation" },
    );
    ok = false;
  }
  if ((r["streamFamily"] as string) !== STREAM_FAMILY) {
    c.addError("INVALID_TECHNOLOGY_VARIATION_PROFILE", `streamFamily must be ${STREAM_FAMILY}`, {
      stage: "technology-variation",
    });
    ok = false;
  }
  if (
    typeof r["technologyEligibilityPredicateId"] !== "string" ||
    (r["technologyEligibilityPredicateId"] as string).trim() === ""
  ) {
    c.addError(
      "INVALID_TECHNOLOGY_VARIATION_PROFILE",
      "technologyEligibilityPredicateId must be non-empty string",
      { stage: "technology-variation" },
    );
    ok = false;
  }
  if (
    typeof r["variationFormulaVersion"] !== "string" ||
    (r["variationFormulaVersion"] as string).trim() === ""
  ) {
    c.addError(
      "INVALID_TECHNOLOGY_VARIATION_PROFILE",
      "variationFormulaVersion must be non-empty string",
      { stage: "technology-variation" },
    );
    ok = false;
  }
  // consistency: none must be constant distributions
  if (
    r["settingId"] === "none" &&
    (r["dateDistributionId"] !== "constant_zero_v1" ||
      r["effectivenessDistributionId"] !== "constant_10000_v1")
  ) {
    c.addError(
      "INVALID_TECHNOLOGY_VARIATION_PROFILE",
      "none must use constant_zero_v1 / constant_10000_v1",
      { stage: "technology-variation" },
    );
    ok = false;
  }
  return ok;
}

/**
 * §6.1: the active ruleset MUST contain one TechnologyVariationProfile for each
 * canonical identifier: none, some, considerable. Exactly one profile per id.
 */
export function validateTechnologyVariationProfiles(
  profiles: unknown,
  c: DiagnosticCollector,
): boolean {
  if (!Array.isArray(profiles)) {
    c.addError("INVALID_TECHNOLOGY_VARIATION_PROFILE", "profiles must be an array", {
      stage: "technology-variation",
    });
    return false;
  }
  if (profiles.length !== VARIATION_IDS.length) {
    c.addError(
      "INVALID_TECHNOLOGY_VARIATION_PROFILE",
      `Ruleset must contain exactly ${VARIATION_IDS.length} profiles, got ${profiles.length}`,
      { stage: "technology-variation" },
    );
    return false;
  }
  const ids = new Set((profiles as TechnologyVariationProfile[]).map((p) => p.settingId));
  for (const id of VARIATION_IDS) {
    if (!ids.has(id)) {
      c.addError(
        "INVALID_TECHNOLOGY_VARIATION_PROFILE",
        `Ruleset missing canonical profile ${id}`,
        { stage: "technology-variation" },
      );
      return false;
    }
  }
  let ok = true;
  for (const p of profiles) if (!validateTechnologyVariationProfile(p, c)) ok = false;
  return ok;
}

export function materializeTechnologyVariation(
  techs: TechnologyDefinition[],
  profile: TechnologyVariationProfile,
  campaignSeed: string,
  contentHash: string,
  rulesetHash: string,
  c: DiagnosticCollector,
): CampaignTechnologyManifest | undefined {
  if (!validateTechnologyVariationProfile(profile, c)) return undefined;
  // clone to avoid mutating caller
  const cloned: TechnologyDefinition[] = techs.map((t) => ({
    ...t,
    canonicalEffectValues: { ...t.canonicalEffectValues },
    variableEffectIds: [...t.variableEffectIds],
    prerequisiteTechnologyIds: [...(t.prerequisiteTechnologyIds ?? [])],
    prerequisiteDelayMonths:
      typeof t.prerequisiteDelayMonths === "object" && t.prerequisiteDelayMonths !== null
        ? { ...(t.prerequisiteDelayMonths as Record<string, number>) }
        : t.prerequisiteDelayMonths,
    effectVariationBounds: t.effectVariationBounds
      ? Object.fromEntries(Object.entries(t.effectVariationBounds).map(([k, v]) => [k, { ...v }]))
      : undefined,
  }));
  const sorted = [...cloned].sort((a, b) => a.technologyId.localeCompare(b.technologyId));

  for (const t of sorted) {
    const missing =
      t.variationEligible === undefined ||
      t.dateVariationEligible === undefined ||
      t.effectivenessVariationEligible === undefined ||
      t.earliestPermittedAvailabilityMonth === undefined ||
      t.latestPermittedAvailabilityMonth === undefined ||
      t.variableEffectIds === undefined ||
      t.prerequisiteTechnologyIds === undefined;
    if (missing) {
      c.addWarning(
        "TECHNOLOGY_VARIATION_METADATA_MISSING",
        `Technology ${t.technologyId} missing eligibility metadata, treated ineligible`,
        { stage: "technology-variation" },
      );
      t.variationEligible = false;
      t.dateVariationEligible = false;
      t.effectivenessVariationEligible = false;
    }
    // validate delay values strictly
    if (t.prerequisiteDelayMonths !== undefined) {
      if (typeof t.prerequisiteDelayMonths === "number") {
        if (!Number.isInteger(t.prerequisiteDelayMonths) || t.prerequisiteDelayMonths < 0) {
          c.addError(
            "INVALID_TECHNOLOGY_VARIATION_PROFILE",
            `prerequisiteDelayMonths for ${t.technologyId} must be non-negative integer`,
            { stage: "technology-variation" },
          );
          return undefined;
        }
      } else if (typeof t.prerequisiteDelayMonths === "object") {
        for (const [pre, d] of Object.entries(
          t.prerequisiteDelayMonths as Record<string, number>,
        )) {
          if (!Number.isInteger(d) || d < 0) {
            c.addError(
              "INVALID_TECHNOLOGY_VARIATION_PROFILE",
              `prerequisiteDelayMonths[${pre}] for ${t.technologyId} must be non-negative integer`,
              { stage: "technology-variation" },
            );
            return undefined;
          }
        }
      }
    }
  }

  const byId = new Map(sorted.map((t) => [t.technologyId, t]));
  const adj = new Map<string, string[]>();
  const indeg = new Map<string, number>();
  for (const t of sorted) {
    adj.set(t.technologyId, []);
    indeg.set(t.technologyId, 0);
  }
  for (const t of sorted) {
    for (const pre of t.prerequisiteTechnologyIds ?? []) {
      if (adj.has(pre)) {
        adj.get(pre)!.push(t.technologyId);
        indeg.set(t.technologyId, (indeg.get(t.technologyId) ?? 0) + 1);
      }
    }
  }
  const ready = [...indeg.entries()]
    .filter(([, d]) => d === 0)
    .map(([id]) => id)
    .sort();
  const order: string[] = [];
  const q = [...ready];
  while (q.length) {
    const id = q.shift()!;
    order.push(id);
    const nxt = (adj.get(id) ?? []).sort();
    const newly: string[] = [];
    for (const dep of nxt) {
      const d = (indeg.get(dep) ?? 1) - 1;
      indeg.set(dep, d);
      if (d === 0) newly.push(dep);
    }
    newly.sort();
    q.push(...newly);
    q.sort();
  }
  if (order.length !== sorted.length) {
    const remaining = [...indeg.entries()]
      .filter(([, d]) => d > 0)
      .map(([id]) => id)
      .sort();
    c.addError(
      "TECHNOLOGY_PREREQUISITE_CYCLE",
      `Technology prerequisite cycle: ${remaining.join(", ")}`,
      { stage: "technology-variation" },
    );
    return undefined;
  }

  const entries: Record<string, TechnologyManifestEntry> = {};
  const initialFinal = new Map<string, number>();

  for (const t of sorted) {
    let shift = 0;
    let mult = 10_000;
    if (t.variationEligible) {
      if (t.dateVariationEligible) {
        if (profile.dateDistributionId === "constant_zero_v1") shift = 0;
        else if (profile.dateDistributionId === "symmetric_triangular_integer_v1") {
          const base = buildKey({
            campaignSeed,
            technologyId: t.technologyId,
            settingId: profile.settingId,
            formulaVersion: profile.variationFormulaVersion,
            decisionTypeId: "availability_shift",
          });
          shift = triangular(base, profile.earliestDateShiftMonths, profile.latestDateShiftMonths);
        }
      }
      if (t.effectivenessVariationEligible) {
        let effMin = profile.effectivenessVariationMinBp;
        let effMax = profile.effectivenessVariationMaxBp;
        if (t.effectVariationBounds) {
          for (const [effId, bounds] of Object.entries(t.effectVariationBounds)) {
            if (!Number.isInteger(bounds.minBp) || !Number.isInteger(bounds.maxBp)) {
              c.addError(
                "INVALID_TECHNOLOGY_VARIATION_PROFILE",
                `effectVariationBounds ${effId} must be integers`,
                { stage: "technology-variation" },
              );
              return undefined;
            }
            const eMin = Math.max(effMin, bounds.minBp);
            const eMax = Math.min(effMax, bounds.maxBp);
            if (eMin > eMax) {
              c.addError(
                "INVALID_EFFECT_VARIATION_BOUNDS",
                `Empty intersection for ${t.technologyId}.${effId} [${bounds.minBp}..${bounds.maxBp}] vs profile [${effMin}..${effMax}]`,
                { stage: "technology-variation" },
              );
              return undefined;
            }
            effMin = eMin;
            effMax = eMax;
          }
        }
        if (profile.effectivenessDistributionId === "constant_10000_v1") mult = 10_000;
        else if (profile.effectivenessDistributionId === "symmetric_triangular_integer_v1") {
          const base = buildKey({
            campaignSeed,
            technologyId: t.technologyId,
            settingId: profile.settingId,
            formulaVersion: profile.variationFormulaVersion,
            decisionTypeId: "effectiveness_multiplier",
          });
          mult = triangular(base, effMin, effMax);
        }
      }
    }
    const raw = t.canonicalAvailabilityMonth + shift;
    const clamped = Math.min(
      Math.max(raw, t.earliestPermittedAvailabilityMonth),
      t.latestPermittedAvailabilityMonth,
    );
    initialFinal.set(t.technologyId, clamped);
    const canonicalEff = { ...t.canonicalEffectValues };
    const varied: Record<string, number> = {};
    for (const [k, v] of Object.entries(canonicalEff)) {
      if (
        t.variableEffectIds.includes(k) &&
        t.effectivenessVariationEligible &&
        t.variationEligible
      ) {
        // §6.6: variedEffectValue = roundTowardZero(canonicalEffectValue * multiplierBp / 10_000).
        // BigInt division truncates toward zero, matching round-toward-zero for signed values
        // and floor for unsigned values.
        varied[k] = Number((BigInt(v) * BigInt(mult)) / BigInt(10000));
      } else varied[k] = v;
    }
    entries[t.technologyId] = {
      technologyId: t.technologyId,
      canonicalAvailabilityMonth: t.canonicalAvailabilityMonth,
      selectedDateShift: shift,
      finalAvailabilityMonth: clamped,
      canonicalEffectValues: canonicalEff,
      effectivenessMultiplier: mult,
      finalVariedEffectValues: varied,
      eligibilityFlags: {
        variationEligible: t.variationEligible,
        dateVariationEligible: t.dateVariationEligible,
        effectivenessVariationEligible: t.effectivenessVariationEligible,
      },
      variationDecisionRecordIds: [
        buildKey({
          campaignSeed,
          technologyId: t.technologyId,
          settingId: profile.settingId,
          formulaVersion: profile.variationFormulaVersion,
          decisionTypeId: "availability_shift",
        }),
        buildKey({
          campaignSeed,
          technologyId: t.technologyId,
          settingId: profile.settingId,
          formulaVersion: profile.variationFormulaVersion,
          decisionTypeId: "effectiveness_multiplier",
        }),
      ],
      contentHash,
      rulesetHash,
      formulaVersion: profile.variationFormulaVersion,
    };
  }

  for (const id of order) {
    const t = byId.get(id)!;
    let cur = initialFinal.get(id)!;
    for (const pre of t.prerequisiteTechnologyIds ?? []) {
      const preFinal = initialFinal.get(pre);
      if (preFinal === undefined) continue;
      let delay = 0;
      if (typeof t.prerequisiteDelayMonths === "number") delay = t.prerequisiteDelayMonths;
      else if (typeof t.prerequisiteDelayMonths === "object" && t.prerequisiteDelayMonths !== null)
        delay = (t.prerequisiteDelayMonths as Record<string, number>)[pre] ?? 0;
      const required = preFinal + delay;
      if (cur < required) {
        cur = required;
        initialFinal.set(id, cur);
        entries[id]!.finalAvailabilityMonth = cur;
      }
    }
  }

  const manifest: CampaignTechnologyManifest = {
    entries,
    contentHash,
    rulesetHash,
    formulaVersion: profile.variationFormulaVersion,
    manifestHash: "",
  };
  manifest.manifestHash = sha256Hex(
    canonicalSerialize({
      entries,
      contentHash,
      rulesetHash,
      formulaVersion: profile.variationFormulaVersion,
    }),
  );
  return manifest;
}
export function verifyTechnologyManifest(
  manifest: CampaignTechnologyManifest,
  c: DiagnosticCollector,
): boolean {
  const recomputed = sha256Hex(
    canonicalSerialize({
      entries: manifest.entries,
      contentHash: manifest.contentHash,
      rulesetHash: manifest.rulesetHash,
      formulaVersion: manifest.formulaVersion,
    }),
  );
  if (recomputed !== manifest.manifestHash) {
    c.addError(
      "TECHNOLOGY_MANIFEST_MISMATCH",
      "Technology manifest hash mismatch after campaign creation",
      { stage: "technology-variation" },
    );
    return false;
  }
  return true;
}
