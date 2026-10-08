import type { Finding } from "./findings.js";
import { sortFindings } from "./findings.js";
import { evaluate, type LookupTable } from "./formula/eval.js";
import { parseFormula } from "./formula/parse.js";
import { toSafe } from "./units.js";

export const ARMOUR_REGIONS = [
  "BELT_MAIN",
  "BELT_UPPER",
  "BELT_ENDS",
  "DECK_MAIN",
  "DECK_SLOPE",
  "TURRET_FACE",
  "BARBETTE",
  "CONNING_TOWER",
  "MAGAZINE_BOX",
  "SPLINTER_PLATING",
  "TORPEDO_BULKHEAD",
  "TORPEDO_BELT",
] as const;
export type ArmourRegionId = (typeof ARMOUR_REGIONS)[number];

export interface ArmourRegion {
  readonly region: ArmourRegionId;
  readonly thicknessUm: number;
  readonly lengthMm: number;
  readonly heightMm: number;
  readonly materialId: string;
  /** cos(obliquity) in bp: 10_000 for a flat-on hit, lower for sloped plate (more effective). */
  readonly cosObliquityBp: number;
}

/** What the design must resist: a reference shell class with its penetration at the intended range band. */
export interface ThreatProfile {
  readonly id: string;
  readonly penetrationUm: number;
}

export interface ArmourBalance {
  readonly steelKgPerM3: number;
  readonly backingBp: number;
  readonly fixingsBp: number;
  /** Effective-thickness multiplier per armour material, bp. */
  readonly materialEffBp: Readonly<Record<string, number>>;
  readonly coverageWarnBp: number;
  readonly coverageCriticalBp: number;
  readonly magazineWarnBp: number;
  readonly magazineCriticalBp: number;
  /** Required torpedo-bulkhead depth (mm) versus warhead mass (kg). */
  readonly underwaterRequiredDepth: LookupTable;
  readonly floodBaseBp: readonly [number, number, number, number, number];
  readonly floodReserveWeightBp: number;
  readonly floodDamageControlWeightBp: number;
  readonly magVulnBaseBp: number;
  readonly magVulnBoilerBp: number;
  readonly magVulnTorpedoBp: number;
}

const BP = 10_000n;
const fmt = (n: number) => n.toLocaleString("en-US");

/** F-A1: region plate weight in kg, rounded up. */
export function regionWeightKg(r: ArmourRegion, b: ArmourBalance): number {
  if (r.thicknessUm < 0 || r.lengthMm < 0 || r.heightMm < 0)
    throw new Error("armour dimensions must be >= 0");
  const area = BigInt(r.lengthMm) * BigInt(r.heightMm); // mm2
  const num =
    area *
    BigInt(r.thicknessUm) *
    BigInt(b.steelKgPerM3) *
    BigInt(b.backingBp) *
    BigInt(b.fixingsBp);
  const den = 1000n * 1_000_000_000n * BP * BP; // um->mm, mm3->m3
  return toSafe("regionWeight", (num + den - 1n) / den);
}

/** F-A2: penetration margin in bp, clamped to [-10000, +10000]. Negative = the shell defeats the plate. */
export function penetrationMarginBp(
  r: ArmourRegion,
  threat: ThreatProfile,
  b: ArmourBalance,
): number {
  const eff = b.materialEffBp[r.materialId];
  if (eff === undefined) throw new Error(`unknown armour material '${r.materialId}'`);
  if (threat.penetrationUm <= 0) throw new Error("threat penetration must be > 0");
  const effective = (BigInt(r.thicknessUm) * BigInt(eff) * BigInt(r.cosObliquityBp)) / (BP * BP);
  const pen = BigInt(threat.penetrationUm);
  const raw = ((effective - pen) * BP) / pen;
  const v = raw > BP ? BP : raw < -BP ? -BP : raw;
  return Number(v);
}

export interface MagazineProtectionInput {
  readonly magazineId: string;
  readonly beltMarginBp: number | null;
  readonly deckMarginBp: number | null;
  readonly boxMarginBp: number | null;
  readonly adjacentBoilers: boolean;
  readonly adjacentTorpedoTubes: boolean;
  readonly flashProtectionBp: number;
}

export interface ArmourInput {
  readonly regions: readonly ArmourRegion[];
  readonly threats: readonly ThreatProfile[];
  /** The adversary the requirement expects (must be in `threats`). */
  readonly designThreatId: string;
  readonly citadelLengthMm: number;
  readonly magazines: readonly MagazineProtectionInput[];
  readonly torpedoWarheadKg: number;
  readonly bunkerProtectionBp: number;
  readonly subdivisionGrade: 0 | 1 | 2 | 3 | 4;
  readonly reserveBuoyancyBp: number;
  readonly damageControlBp: number;
  /** Fire-risk contributions (bp) of flammable stowages, already summed per tag by the caller. */
  readonly flammableBp: number;
}

export interface ArmourResult {
  readonly weightByRegionKg: Readonly<Record<string, number>>;
  readonly totalWeightKg: number;
  /** Margin in bp per region per threat id. */
  readonly marginBp: Readonly<Record<string, Readonly<Record<string, number>>>>;
  readonly coverageBp: number;
  readonly magazineProtectionBp: Readonly<Record<string, number>>;
  readonly magazineVulnerabilityBp: Readonly<Record<string, number>>;
  readonly underwaterResistanceBp: number;
  readonly floodingResistanceBp: number;
  readonly fireRiskBp: number;
  readonly findings: readonly Finding[];
}

const clampBp = (v: number, lo = 0, hi = 10_000) => Math.max(lo, Math.min(hi, v));

export function compileArmour(input: ArmourInput, b: ArmourBalance): ArmourResult {
  const findings: Finding[] = [];
  const designThreat = input.threats.find((t) => t.id === input.designThreatId);
  if (!designThreat) throw new Error(`design threat '${input.designThreatId}' not in threats`);

  const regions = [...input.regions].sort((x, y) =>
    x.region < y.region ? -1 : x.region > y.region ? 1 : 0,
  );
  const weightByRegionKg: Record<string, number> = {};
  const marginBp: Record<string, Record<string, number>> = {};
  let total = 0;
  for (const r of regions) {
    weightByRegionKg[r.region] = (weightByRegionKg[r.region] ?? 0) + regionWeightKg(r, b);
    total += regionWeightKg(r, b);
    const m: Record<string, number> = marginBp[r.region] ?? {};
    for (const t of input.threats)
      m[t.id] = Math.max(m[t.id] ?? -10_000, penetrationMarginBp(r, t, b));
    marginBp[r.region] = m;
  }
  const margin = (region: ArmourRegionId): number | null =>
    marginBp[region]?.[designThreat.id] ?? null;

  const belt = regions.filter((r) => r.region === "BELT_MAIN").reduce((a, r) => a + r.lengthMm, 0);
  const coverageBp =
    input.citadelLengthMm <= 0
      ? 0
      : Math.min(10_000, toSafe("cov", (BigInt(belt) * BP) / BigInt(input.citadelLengthMm)));
  if (input.citadelLengthMm > 0 && coverageBp < b.coverageWarnBp) {
    const critical = coverageBp < b.coverageCriticalBp;
    findings.push({
      id: "CITADEL_INCOMPLETE",
      severity: critical ? "CRITICAL" : "WARNING",
      what: "The armoured belt does not cover the machinery and magazine spaces.",
      why: `Belt ${fmt(belt)} mm of ${fmt(input.citadelLengthMm)} mm citadel = ${coverageBp} bp (limit ${critical ? b.coverageCriticalBp : b.coverageWarnBp} bp).`,
      consequence:
        "Shells can reach the boilers or magazines at the waterline; one hit can cripple the ship.",
      remedies: [
        {
          id: "extend_belt",
          description: `Extend the belt by about ${fmt(input.citadelLengthMm - belt)} mm (adds weight).`,
        },
        {
          id: "shorten_citadel",
          description: "Shorten the citadel by compacting machinery or magazines.",
        },
        { id: "thin_belt", description: "Thin the belt to afford full length coverage." },
      ],
      evidence: {
        formulaId: "F-A3",
        inputs: { belt, citadel: input.citadelLengthMm },
        threshold: b.coverageWarnBp,
        value: coverageBp,
      },
    });
  }

  const sides = [
    margin("BELT_MAIN"),
    margin("DECK_MAIN"),
    margin("DECK_SLOPE"),
    margin("TURRET_FACE"),
  ].filter((v): v is number => v !== null);
  if (sides.length > 0 && sides.every((v) => v < 0)) {
    findings.push({
      id: "ARMOUR_INEFFECTIVE_VS_ADVERSARY",
      severity: "WARNING",
      what: `No armour region defeats the expected adversary (${designThreat.id}).`,
      why: `Best margin ${Math.max(...sides)} bp against ${fmt(designThreat.penetrationUm)} µm penetration.`,
      consequence:
        "The protection adds weight but does not stop the shells the ship is expected to meet.",
      remedies: [
        {
          id: "thicker_belt",
          description: "Thicken the belt or deck, or use a more effective armour material.",
        },
        { id: "slope_plate", description: "Slope the plate to raise effective thickness." },
        { id: "drop_armour", description: "Give up armour and spend the weight on speed or guns." },
      ],
      evidence: {
        formulaId: "F-A2",
        inputs: { penetrationUm: designThreat.penetrationUm },
        threshold: 0,
        value: Math.max(...sides),
      },
    });
  }

  const magazineProtectionBp: Record<string, number> = {};
  const magazineVulnerabilityBp: Record<string, number> = {};
  for (const m of [...input.magazines].sort((x, y) => (x.magazineId < y.magazineId ? -1 : 1))) {
    const parts = [m.beltMarginBp, m.deckMarginBp, m.boxMarginBp].filter(
      (v): v is number => v !== null,
    );
    const prot = parts.length === 0 ? -10_000 : Math.min(...parts);
    magazineProtectionBp[m.magazineId] = prot;
    magazineVulnerabilityBp[m.magazineId] = clampBp(
      b.magVulnBaseBp +
        (m.adjacentBoilers ? b.magVulnBoilerBp : 0) +
        (m.adjacentTorpedoTubes ? b.magVulnTorpedoBp : 0) -
        m.flashProtectionBp,
    );
    if (prot < b.magazineWarnBp) {
      const critical = prot < b.magazineCriticalBp;
      findings.push({
        id: "MAGAZINE_UNPROTECTED",
        severity: critical ? "CRITICAL" : "WARNING",
        what: `Magazine ${m.magazineId} is not protected against the expected adversary.`,
        why: `Weakest protection margin ${prot} bp (limit ${critical ? b.magazineCriticalBp : b.magazineWarnBp} bp).`,
        consequence: "A single penetrating hit can detonate the magazine and lose the ship.",
        remedies: [
          {
            id: "armour_box",
            description: "Add a magazine armour box or thicken deck/belt over it.",
          },
          {
            id: "move_magazine",
            description: "Move the magazine behind the thickest armour, away from the hull sides.",
          },
          { id: "flash_protection", description: "Fit flash protection to limit propagation." },
        ],
        evidence: {
          formulaId: "F-A4",
          inputs: { threatPenetrationUm: designThreat.penetrationUm },
          threshold: critical ? b.magazineCriticalBp : b.magazineWarnBp,
          value: prot,
        },
      });
    }
  }

  // F-A5 underwater: effective depth = bulkhead thickness-equivalent from the TORPEDO_BULKHEAD/BELT regions' heights plus bunkers.
  const tb = regions.filter((r) => r.region === "TORPEDO_BULKHEAD" || r.region === "TORPEDO_BELT");
  const depthMm = tb.reduce((a, r) => a + r.heightMm, 0);
  const required = Math.max(
    1,
    evaluate(parseFormula("lookup(req, w)"), {
      vars: { w: input.torpedoWarheadKg },
      tables: { req: b.underwaterRequiredDepth },
    }),
  );
  const effDepth = toSafe(
    "effDepth",
    (BigInt(depthMm) * (BP + BigInt(input.bunkerProtectionBp))) / BP,
  );
  const underwaterResistanceBp = clampBp(toSafe("uw", (BigInt(effDepth) * BP) / BigInt(required)));

  // F-A6 flooding resistance, F-A7 fire risk
  const floodingResistanceBp = clampBp(
    b.floodBaseBp[input.subdivisionGrade] +
      toSafe("fr", (BigInt(input.reserveBuoyancyBp) * BigInt(b.floodReserveWeightBp)) / BP) +
      toSafe("fd", (BigInt(input.damageControlBp) * BigInt(b.floodDamageControlWeightBp)) / BP),
  );
  const fireRiskBp = clampBp(input.flammableBp - input.damageControlBp);

  return {
    weightByRegionKg,
    totalWeightKg: total,
    marginBp,
    coverageBp,
    magazineProtectionBp,
    magazineVulnerabilityBp,
    underwaterResistanceBp,
    floodingResistanceBp,
    fireRiskBp,
    findings: sortFindings(findings),
  };
}
