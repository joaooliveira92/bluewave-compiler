import { describe, it, expect } from "vite-plus/test";
import {
  classPredicates,
  naturalClass,
  classificationFindings,
  classFacts,
  compileDesign,
  checkFindingShape,
  DESIGN_22_EARLY,
  UM_PER_INCH,
  UM_PER_KNOT,
  type ClassFacts,
} from "../src/index.js";
import { ctx, draft } from "./fixtures/gunboat.js";

const R = DESIGN_22_EARLY;
const facts = (o: Partial<ClassFacts>): ClassFacts => ({
  displacementKg: 1_000_000,
  speedUms: 25 * UM_PER_KNOT,
  beltUm: 0,
  anyQualifyingArmourUm: 0,
  maxMainGunUm: 0,
  mainTurretCount: 0,
  torpedoTubes: 1,
  aircraftCapacity: 0,
  deckUm: 0,
  maxHeavyMountBarrels: 0,
  ...o,
});
const pass = (t: keyof typeof classPredicates, f: ClassFacts) =>
  classPredicates[t](f, R).length === 0;

describe("DESIGN-22 boundaries (strict versus inclusive)", () => {
  it("DD: below 2,000 t, strictly over 19 kn, a tube, no qualifying armour", () => {
    expect(pass("DD", facts({}))).toBe(true);
    expect(pass("DD", facts({ displacementKg: 1_999_999 }))).toBe(true);
    expect(pass("DD", facts({ displacementKg: 2_000_000 }))).toBe(false);
    expect(pass("DD", facts({ speedUms: 9_774_436 }))).toBe(false); // exactly 19 kn
    expect(pass("DD", facts({ speedUms: 9_774_437 }))).toBe(true);
    expect(pass("DD", facts({ torpedoTubes: 0 }))).toBe(false);
    expect(pass("DD", facts({ anyQualifyingArmourUm: 50_799 }))).toBe(true); // splinter plating
    expect(pass("DD", facts({ anyQualifyingArmourUm: 50_800 }))).toBe(false);
  });
  it("CL: 2,000-8,000 t, over 16 kn, guns up to and including 6 inches", () => {
    const cl = facts({
      displacementKg: 5_000_000,
      speedUms: 17 * UM_PER_KNOT,
      maxMainGunUm: 6 * UM_PER_INCH,
    });
    expect(pass("CL", cl)).toBe(true);
    expect(pass("CL", { ...cl, displacementKg: 2_000_000 })).toBe(true);
    expect(pass("CL", { ...cl, displacementKg: 8_000_000 })).toBe(false);
    expect(pass("CL", { ...cl, maxMainGunUm: 6 * UM_PER_INCH + 1 })).toBe(false);
    expect(pass("CL", { ...cl, speedUms: 16 * UM_PER_KNOT })).toBe(false);
  });
  it("CA: over 4,000 t, over 19 kn, belt 2-12 in, guns over 6 and up to 11 in", () => {
    const ca = facts({
      displacementKg: 7_700_000,
      speedUms: 20 * UM_PER_KNOT,
      beltUm: 6 * UM_PER_INCH,
      maxMainGunUm: 9_200 * 25.4,
    });
    expect(pass("CA", ca)).toBe(true);
    expect(pass("CA", { ...ca, beltUm: 2 * UM_PER_INCH })).toBe(false);
    expect(pass("CA", { ...ca, beltUm: 12 * UM_PER_INCH })).toBe(true);
    expect(pass("CA", { ...ca, beltUm: 12 * UM_PER_INCH + 1 })).toBe(false);
    expect(pass("CA", { ...ca, maxMainGunUm: 11 * UM_PER_INCH })).toBe(true);
    expect(pass("CA", { ...ca, maxMainGunUm: 6 * UM_PER_INCH })).toBe(false);
  });
  it("B: slow, belted coast-defence type with 1-2 turrets; BB needs 3+ turrets and a belt over 6 in", () => {
    const b = facts({
      displacementKg: 6_000_000,
      speedUms: 15 * UM_PER_KNOT,
      beltUm: 8 * UM_PER_INCH,
      maxMainGunUm: 12 * UM_PER_INCH,
      mainTurretCount: 2,
    });
    expect(pass("B", b)).toBe(true);
    expect(pass("B", { ...b, speedUms: 20 * UM_PER_KNOT })).toBe(false);
    expect(pass("B", { ...b, mainTurretCount: 3 })).toBe(false);
    expect(pass("B", { ...b, beltUm: 6 * UM_PER_INCH })).toBe(true);
    const bb = facts({
      displacementKg: 14_900_000,
      speedUms: 17 * UM_PER_KNOT,
      beltUm: 9 * UM_PER_INCH,
      maxMainGunUm: 12 * UM_PER_INCH,
      mainTurretCount: 4,
    });
    expect(pass("BB", bb)).toBe(true);
    expect(pass("BB", { ...bb, beltUm: 6 * UM_PER_INCH })).toBe(false);
    expect(pass("BB", { ...bb, displacementKg: 8_000_000 })).toBe(false);
    expect(pass("BB", { ...bb, maxMainGunUm: 10 * UM_PER_INCH })).toBe(false);
  });
  it("natural class follows precedence BB > B > CA > CL > DD", () => {
    const slowBelted = facts({
      displacementKg: 9_000_000,
      speedUms: 15 * UM_PER_KNOT,
      beltUm: 9 * UM_PER_INCH,
      maxMainGunUm: 12 * UM_PER_INCH,
      mainTurretCount: 2,
    });
    expect(naturalClass(slowBelted, R)).toBe("B");
    expect(naturalClass({ ...slowBelted, mainTurretCount: 3 }, R)).toBe("BB");
    expect(naturalClass(facts({}), R)).toBe("DD");
    expect(
      naturalClass(
        facts({ displacementKg: 12_000_000, torpedoTubes: 0, speedUms: 5 * UM_PER_KNOT }),
        R,
      ),
    ).toBeNull();
  });
});

describe("protected-cruiser exception (ADR-0067, ticket 19)", () => {
  const nineInch = facts({
    displacementKg: 7_000_000,
    speedUms: 22 * UM_PER_KNOT,
    beltUm: 0,
    deckUm: 6 * UM_PER_INCH,
    maxMainGunUm: 9_200 * 25.4,
    mainTurretCount: 2,
    maxHeavyMountBarrels: 1,
  });
  const protectedEight = { ...nineInch, maxMainGunUm: 8 * UM_PER_INCH };
  it("is versioned data in the ruleset", () => {
    expect(R.protectedCruiserExceptionVersion).toBe(1);
    expect(R.clProtectedMaxGunUm).toBe(203_200);
  });
  it("lets a belt-less deck cruiser with single mounts up to exactly 8 in be CL", () => {
    expect(pass("CL", protectedEight)).toBe(true);
    expect(naturalClass(protectedEight, R)).toBe("CL");
    expect(pass("CL", { ...protectedEight, maxMainGunUm: 8 * UM_PER_INCH + 1 })).toBe(false);
    expect(pass("CL", { ...protectedEight, maxMainGunUm: 6 * UM_PER_INCH })).toBe(true);
  });
  it("rejects twin mounts, a main belt, or no armour deck above 6 in", () => {
    expect(pass("CL", { ...protectedEight, maxHeavyMountBarrels: 2 })).toBe(false);
    expect(pass("CL", { ...protectedEight, beltUm: 1 })).toBe(false);
    expect(pass("CL", { ...protectedEight, deckUm: 0 })).toBe(false);
  });
  it("does not move the displacement, speed or strict CA 6 in bounds", () => {
    expect(pass("CL", { ...protectedEight, displacementKg: 8_000_000 })).toBe(false);
    expect(pass("CL", { ...protectedEight, speedUms: 16 * UM_PER_KNOT })).toBe(false);
    const sixInchBelted = facts({
      displacementKg: 7_700_000,
      speedUms: 20 * UM_PER_KNOT,
      beltUm: 6 * UM_PER_INCH,
      maxMainGunUm: 6 * UM_PER_INCH,
    });
    expect(pass("CA", sixInchBelted)).toBe(false);
  });
  it("a 9.2 in single-mount ship declared CL is BLOCKING; the 8 in one has no finding", () => {
    expect(classificationFindings(nineInch, "CL", R).findings[0]!.id).toBe(
      "INTENDED_CLASSIFICATION_ILLEGAL",
    );
    expect(classificationFindings(protectedEight, "CL", R)).toEqual({
      natural: "CL",
      findings: [],
    });
  });
  it("is deterministic", () => {
    const a = JSON.stringify(classificationFindings(protectedEight, "CL", R));
    expect(JSON.stringify(classificationFindings({ ...protectedEight }, "CL", R))).toBe(a);
  });
});

describe("classification findings", () => {
  const f = facts({
    displacementKg: 7_700_000,
    speedUms: 20 * UM_PER_KNOT,
    beltUm: 6 * UM_PER_INCH,
    maxMainGunUm: 234_000,
  });
  it("a valid intended class gives no finding", () => {
    expect(classificationFindings(f, "CA", R)).toEqual({ natural: "CA", findings: [] });
  });
  it("illegal intended class is BLOCKING with reasons and remedies", () => {
    const r = classificationFindings(f, "BB", R);
    expect(r.findings[0]!.id).toBe("INTENDED_CLASSIFICATION_ILLEGAL");
    expect(r.findings[0]!.severity).toBe("BLOCKING");
    expect(checkFindingShape(r.findings[0]!)).toEqual([]);
    expect(r.findings[0]!.why).toContain("turrets");
  });
  it("legal but not the natural type is NATURAL_CLASSIFICATION_MISMATCH", () => {
    const mismatch = classificationFindings(
      facts({
        displacementKg: 6_000_000,
        speedUms: 19.5 * UM_PER_KNOT,
        beltUm: 8 * UM_PER_INCH,
        maxMainGunUm: 10 * UM_PER_INCH,
        mainTurretCount: 2,
      }),
      "CA",
      R,
    );
    expect(mismatch.natural).toBe("B");
    expect(mismatch.findings[0]!.id).toBe("NATURAL_CLASSIFICATION_MISMATCH");
  });
});

describe("compileDesign integration", () => {
  const as = (category: string) => ({ ...draft, requirement: { ...draft.requirement, category } });
  it("a torpedo-gunboat declared DD passes and reports its natural class", () => {
    const r = compileDesign(as("DD"), ctx);
    expect(r.valid).toBe(true);
    expect(r.naturalClass).toBe("DD");
    expect(classFacts(r, as("DD")).torpedoTubes).toBe(3);
  });
  it("the same ship declared CL is rejected (too small)", () => {
    const r = compileDesign(as("CL"), ctx);
    expect(r.valid).toBe(false);
    expect(r.findings.map((x) => x.id)).toContain("INTENDED_CLASSIFICATION_ILLEGAL");
  });
  it("armour that qualifies disqualifies a DD", () => {
    const armoured = {
      ...as("DD"),
      armour: {
        ...draft.armour,
        regions: draft.armour.regions.map((x) =>
          x.region === "DECK_MAIN" ? { ...x, thicknessUm: 60_000 } : x,
        ),
      },
    };
    expect(compileDesign(armoured, ctx).findings.map((x) => x.id)).toContain(
      "INTENDED_CLASSIFICATION_ILLEGAL",
    );
  });
  it("categories outside the active band are not classified (no false rejections)", () => {
    const r = compileDesign(draft, ctx);
    expect(r.naturalClass).toBeNull();
    expect(r.valid).toBe(true);
  });
});
