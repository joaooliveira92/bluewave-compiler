import type { CompiledDesign, DesignDraft } from "./compile.js";
import type { Finding } from "./findings.js";
import { UM_PER_INCH, UM_PER_KNOT } from "./units.js";

/** Ship types reachable in the EARLY band (DESIGN-22 section 1, precedence order). BC arrives with the Dreadnought band. */
export const EARLY_SHIP_TYPES = ["BB", "B", "CA", "CL", "DD"] as const;
export type EarlyShipType = (typeof EARLY_SHIP_TYPES)[number];

/** Facts DESIGN-22 predicates read, all in canonical units. */
export interface ClassFacts {
  readonly displacementKg: number;
  readonly speedUms: number;
  /** Thickest main belt, micrometres (0 if none). */
  readonly beltUm: number;
  /** Thickest qualifying armour of any kind (belt, deck, turret, barbette, tower, box), micrometres. */
  readonly anyQualifyingArmourUm: number;
  /** Largest main-gun calibre, micrometres (0 if none). */
  readonly maxMainGunUm: number;
  readonly mainTurretCount: number;
  readonly torpedoTubes: number;
  readonly aircraftCapacity: number;
  /** Thickest armour deck (DECK_MAIN or DECK_SLOPE), micrometres (0 if none). */
  readonly deckUm: number;
  /** Most barrels in any single main-gun mount whose calibre exceeds the normal CL gun limit (0 if none). */
  readonly maxHeavyMountBarrels: number;
}

/** Normative thresholds from docs/rules/ship-classification.md, kept as data so a ruleset change is not a code change. */
export interface ClassificationRules {
  readonly ddMaxDisplacementKg: number;
  readonly ddMinSpeedUms: number;
  readonly qualifyingArmourUm: number;
  readonly clMinDisplacementKg: number;
  readonly clMaxDisplacementKg: number;
  readonly clMinSpeedUms: number;
  readonly clMaxGunUm: number;
  /** Version of the protected-cruiser exception (ADR-0067; bump when its predicate changes). */
  readonly protectedCruiserExceptionVersion: number;
  /** Largest single-mounted gun a belt-less armoured-deck (protected) cruiser may carry and still be CL. */
  readonly clProtectedMaxGunUm: number;
  readonly caMinDisplacementKg: number;
  readonly caMinSpeedUms: number;
  readonly caBeltMinUm: number;
  readonly caBeltMaxUm: number;
  readonly caGunMaxUm: number;
  readonly bMinDisplacementKg: number;
  readonly bBeltMinUm: number;
  readonly bMaxSpeedUms: number;
  readonly bMaxTurrets: number;
  readonly bbMinDisplacementKg: number;
  readonly bbMinTurrets: number;
  readonly bbBeltMinUm: number;
  readonly bbGunMinUm: number;
  readonly aircraftLimit: number;
}

/** DESIGN-22 values for the EARLY band (sections 7-13). */
export const DESIGN_22_EARLY: ClassificationRules = {
  ddMaxDisplacementKg: 2_000_000,
  ddMinSpeedUms: 19 * UM_PER_KNOT + 1 - 1, // strictly greater than 19 kn (9_774_436)
  qualifyingArmourUm: 2 * UM_PER_INCH,
  clMinDisplacementKg: 2_000_000,
  clMaxDisplacementKg: 8_000_000,
  clMinSpeedUms: 16 * UM_PER_KNOT,
  clMaxGunUm: 6 * UM_PER_INCH,
  protectedCruiserExceptionVersion: 1,
  clProtectedMaxGunUm: 8 * UM_PER_INCH,
  caMinDisplacementKg: 4_000_000,
  caMinSpeedUms: 19 * UM_PER_KNOT,
  caBeltMinUm: 2 * UM_PER_INCH,
  caBeltMaxUm: 12 * UM_PER_INCH,
  caGunMaxUm: 11 * UM_PER_INCH,
  bMinDisplacementKg: 5_000_000,
  bBeltMinUm: 6 * UM_PER_INCH,
  bMaxSpeedUms: 20 * UM_PER_KNOT,
  bMaxTurrets: 2,
  bbMinDisplacementKg: 8_000_000,
  bbMinTurrets: 3,
  bbBeltMinUm: 6 * UM_PER_INCH,
  bbGunMinUm: 10 * UM_PER_INCH,
  aircraftLimit: 4,
};

/**
 * Protected-cruiser exception (DESIGN-22 section 9, ADR-0067): an armour-deck ship with no main belt whose guns
 * above the normal CL limit are all single mounts no larger than the protected limit. It changes only the CL gun
 * bound; displacement and speed bounds are untouched.
 */
export const isProtectedCruiser = (f: ClassFacts, r: ClassificationRules): boolean =>
  f.beltUm === 0 &&
  f.deckUm > 0 &&
  f.maxMainGunUm <= r.clProtectedMaxGunUm &&
  f.maxHeavyMountBarrels <= 1;

/** Strict/inclusive boundaries follow the document literally (see its section 21 boundary summary). */
export const classPredicates: Record<
  EarlyShipType,
  (f: ClassFacts, r: ClassificationRules) => string[]
> = {
  DD: (f, r) => {
    const why: string[] = [];
    if (!(f.displacementKg > 0 && f.displacementKg < r.ddMaxDisplacementKg))
      why.push(`displacement ${f.displacementKg} kg must be below ${r.ddMaxDisplacementKg}`);
    if (!(f.speedUms > r.ddMinSpeedUms))
      why.push(`speed must exceed ${r.ddMinSpeedUms} um/s (19 kn)`);
    if (f.torpedoTubes < 1) why.push("needs at least one usable torpedo tube");
    if (f.anyQualifyingArmourUm >= r.qualifyingArmourUm)
      why.push(`has qualifying armour (>= ${r.qualifyingArmourUm} um)`);
    if (f.aircraftCapacity !== 0) why.push("aircraft capacity must be 0");
    return why;
  },
  CL: (f, r) => {
    const why: string[] = [];
    if (!(f.displacementKg >= r.clMinDisplacementKg && f.displacementKg < r.clMaxDisplacementKg))
      why.push(`displacement must be ${r.clMinDisplacementKg}..${r.clMaxDisplacementKg - 1} kg`);
    if (!(f.speedUms > r.clMinSpeedUms)) why.push("speed must exceed 16 kn");
    if (!(f.maxMainGunUm <= r.clMaxGunUm) && !isProtectedCruiser(f, r))
      why.push(
        "main guns must be 6 inches or smaller (protected cruisers: single mounts up to 8 inches, armour deck, no main belt)",
      );
    if (f.aircraftCapacity >= r.aircraftLimit) why.push("aircraft capacity must be below 4");
    return why;
  },
  CA: (f, r) => {
    const why: string[] = [];
    if (!(f.displacementKg > r.caMinDisplacementKg))
      why.push(`displacement must exceed ${r.caMinDisplacementKg} kg`);
    if (!(f.speedUms > r.caMinSpeedUms)) why.push("speed must exceed 19 kn");
    if (!(f.beltUm > r.caBeltMinUm && f.beltUm <= r.caBeltMaxUm))
      why.push("main belt must be over 2 and up to 12 inches");
    if (!(f.maxMainGunUm > r.clMaxGunUm && f.maxMainGunUm <= r.caGunMaxUm))
      why.push("main guns must be over 6 and up to 11 inches");
    if (f.aircraftCapacity >= r.aircraftLimit) why.push("aircraft capacity must be below 4");
    return why;
  },
  B: (f, r) => {
    const why: string[] = [];
    if (!(f.displacementKg >= r.bMinDisplacementKg))
      why.push(`displacement must be at least ${r.bMinDisplacementKg} kg`);
    if (!(f.beltUm >= r.bBeltMinUm)) why.push("main belt must be at least 6 inches");
    if (!(f.maxMainGunUm > r.clMaxGunUm)) why.push("main guns must be over 6 inches");
    if (!(f.speedUms < r.bMaxSpeedUms)) why.push("speed must be below 20 kn");
    if (!(f.mainTurretCount === 1 || f.mainTurretCount === 2))
      why.push("needs 1 or 2 main-battery turrets");
    if (f.aircraftCapacity >= r.aircraftLimit) why.push("aircraft capacity must be below 4");
    return why;
  },
  BB: (f, r) => {
    const why: string[] = [];
    if (!(f.displacementKg > r.bbMinDisplacementKg))
      why.push(`displacement must exceed ${r.bbMinDisplacementKg} kg`);
    if (!(f.mainTurretCount >= r.bbMinTurrets)) why.push("needs at least 3 main-battery turrets");
    if (!(f.beltUm > r.bbBeltMinUm)) why.push("main belt must exceed 6 inches");
    if (!(f.maxMainGunUm > r.bbGunMinUm)) why.push("main guns must exceed 10 inches");
    if (f.aircraftCapacity >= r.aircraftLimit) why.push("aircraft capacity must be below 4");
    return why;
  },
};

export const isEarlyShipType = (s: string): s is EarlyShipType =>
  (EARLY_SHIP_TYPES as readonly string[]).includes(s);

/** Reads the facts out of a compiled design. Main-gun turret count is the number of main-gun mounts fitted. */
export function classFacts(
  c: Pick<CompiledDesign, "totalKg" | "machinery" | "components">,
  d: DesignDraft,
  rules: Pick<ClassificationRules, "clMaxGunUm"> = DESIGN_22_EARLY,
): ClassFacts {
  const beltRegions = d.armour.regions.filter((r) => r.region === "BELT_MAIN");
  const guns = c.components.filter((k) => k.category === "MAIN_GUN");
  return {
    displacementKg: c.totalKg,
    speedUms: Math.floor(((c.machinery?.maxSpeedMilliKnots ?? 0) * UM_PER_KNOT) / 1000),
    beltUm: beltRegions.reduce((m, r) => Math.max(m, r.thicknessUm), 0),
    anyQualifyingArmourUm: d.armour.regions
      .filter((r) =>
        [
          "BELT_MAIN",
          "BELT_UPPER",
          "BELT_ENDS",
          "DECK_MAIN",
          "DECK_SLOPE",
          "TURRET_FACE",
          "BARBETTE",
          "CONNING_TOWER",
          "MAGAZINE_BOX",
        ].includes(r.region),
      )
      .reduce((m, r) => Math.max(m, r.thicknessUm), 0),
    maxMainGunUm: guns.reduce((m, k) => Math.max(m, k.attr.caliberUm ?? 0), 0),
    mainTurretCount: guns.length,
    torpedoTubes: c.components
      .filter((k) => k.category === "TORPEDO_TUBE")
      .reduce((a, k) => a + (k.params.tubes ?? 1), 0),
    aircraftCapacity: 0,
    deckUm: d.armour.regions
      .filter((r) => r.region === "DECK_MAIN" || r.region === "DECK_SLOPE")
      .reduce((m, r) => Math.max(m, r.thicknessUm), 0),
    maxHeavyMountBarrels: guns
      .filter((k) => (k.attr.caliberUm ?? 0) > rules.clMaxGunUm)
      .reduce((m, k) => Math.max(m, k.params.barrels ?? 1), 0),
  };
}

/** First type, in precedence order, whose predicates all pass; null if none. */
export function naturalClass(f: ClassFacts, r: ClassificationRules): EarlyShipType | null {
  return EARLY_SHIP_TYPES.find((t) => classPredicates[t](f, r).length === 0) ?? null;
}

/** DESIGN-22 section 5 mismatch policy. All three rejections are BLOCKING (DESIGN-21 section 25). */
export function classificationFindings(
  f: ClassFacts,
  intended: EarlyShipType,
  r: ClassificationRules,
): { natural: EarlyShipType | null; findings: Finding[] } {
  const failures = classPredicates[intended](f, r);
  const natural = naturalClass(f, r);
  const ev = (value: number): Finding["evidence"] => ({
    formulaId: "DESIGN-22",
    inputs: {
      displacementKg: f.displacementKg,
      speedUms: f.speedUms,
      beltUm: f.beltUm,
      maxMainGunUm: f.maxMainGunUm,
    },
    threshold: 0,
    value,
  });
  const remedies = (extra: string): Finding["remedies"] => [
    {
      id: "change_intended",
      description: `Declare the type the ship actually is${natural ? ` (${natural})` : ""}.`,
    },
    { id: "adjust_design", description: extra },
    { id: "check_rules", description: "Review the DESIGN-22 boundaries for this type." },
  ];
  if (failures.length > 0) {
    return {
      natural,
      findings: [
        {
          id: "INTENDED_CLASSIFICATION_ILLEGAL",
          severity: "BLOCKING",
          what: `The design does not qualify as ${intended}.`,
          why: failures.join("; ") + ".",
          consequence:
            "The ship cannot be built under this classification; treaty, AI-role and battle-role rules all depend on it.",
          remedies: remedies(
            "Change displacement, speed, armour or armament until every rule for the intended type passes.",
          ),
          evidence: ev(failures.length),
        },
      ],
    };
  }
  if (natural === null) {
    return {
      natural,
      findings: [
        {
          id: "NO_NATURAL_CLASSIFICATION_MATCH",
          severity: "BLOCKING",
          what: "The design matches no ship type.",
          why: "No registered type accepts this design.",
          consequence: "It cannot be classified.",
          remedies: remedies("Bring the design inside one type's boundaries."),
          evidence: ev(0),
        },
      ],
    };
  }
  if (natural !== intended) {
    return {
      natural,
      findings: [
        {
          id: "NATURAL_CLASSIFICATION_MISMATCH",
          severity: "BLOCKING",
          what: `The design qualifies as ${intended} but is naturally ${natural}.`,
          why: `Precedence gives ${natural} for these specifications.`,
          consequence:
            "A different type would govern treaty and battle roles than the one declared.",
          remedies: remedies(`Adjust the design so that ${intended} wins by precedence.`),
          evidence: ev(1),
        },
      ],
    };
  }
  return { natural, findings: [] };
}
