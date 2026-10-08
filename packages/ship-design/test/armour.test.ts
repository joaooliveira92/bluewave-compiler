import { describe, it, expect } from "vite-plus/test";
import {
  compileArmour,
  regionWeightKg,
  penetrationMarginBp,
  checkFindingShape,
  type ArmourBalance,
  type ArmourInput,
  type ArmourRegion,
  type ThreatProfile,
} from "../src/index.js";

const bal: ArmourBalance = {
  steelKgPerM3: 7_850,
  backingBp: 11_000,
  fixingsBp: 10_500,
  materialEffBp: { iron: 8_000, compound: 10_000, nickel_steel: 12_000, face_hardened: 14_000 },
  deckPenetrationBp: 10_000,
  coverageWarnBp: 9_000,
  coverageCriticalBp: 6_000,
  magazineWarnBp: 0,
  magazineCriticalBp: -5_000,
  underwaterRequiredDepth: {
    points: [
      [0, 500],
      [100, 2_000],
      [400, 4_000],
    ],
  },
  floodBaseBp: [1_000, 2_500, 4_000, 5_500, 7_000],
  floodReserveWeightBp: 2_000,
  floodDamageControlWeightBp: 3_000,
  magVulnBaseBp: 3_000,
  magVulnBoilerBp: 2_000,
  magVulnTorpedoBp: 1_500,
};
const belt = (o: Partial<ArmourRegion> = {}): ArmourRegion => ({
  region: "BELT_MAIN",
  thicknessUm: 305_000,
  lengthMm: 60_000,
  heightMm: 2_400,
  materialId: "compound",
  cosObliquityBp: 10_000,
  ...o,
});
const gun6: ThreatProfile = { id: "gun_6in", penetrationUm: 150_000 };
const gun12: ThreatProfile = { id: "gun_12in", penetrationUm: 400_000 };
const input = (o: Partial<ArmourInput> = {}): ArmourInput => ({
  regions: [
    belt(),
    belt({ region: "DECK_MAIN", thicknessUm: 50_000, lengthMm: 60_000, heightMm: 12_000 }),
  ],
  threats: [gun6, gun12],
  designThreatId: "gun_6in",
  citadelLengthMm: 60_000,
  magazines: [],
  torpedoWarheadKg: 100,
  bunkerProtectionBp: 0,
  subdivisionGrade: 2,
  reserveBuoyancyBp: 4_000,
  damageControlBp: 1_000,
  flammableBp: 3_000,
  ...o,
});

describe("armour weight", () => {
  it("matches hand calculation: 60m x 2.4m x 305mm steel", () => {
    // 144 m2 * 0.305 m * 7850 = 344,... kg; *1.1*1.05
    const raw = 144 * 0.305 * 7850;
    expect(regionWeightKg(belt(), bal)).toBe(Math.ceil(raw * 1.1 * 1.05));
  });
  it("is zero for zero thickness and monotone in thickness; rejects negatives", () => {
    expect(regionWeightKg(belt({ thicknessUm: 0 }), bal)).toBe(0);
    expect(regionWeightKg(belt({ thicknessUm: 400_000 }), bal)).toBeGreaterThan(
      regionWeightKg(belt(), bal),
    );
    expect(() => regionWeightKg(belt({ thicknessUm: -1 }), bal)).toThrow();
  });
});

describe("penetration margin", () => {
  it("is positive when plate beats shell and negative otherwise, clamped to +-10000", () => {
    expect(penetrationMarginBp(belt(), gun6, bal)).toBeGreaterThan(0);
    expect(penetrationMarginBp(belt(), gun12, bal)).toBeLessThan(0);
    expect(penetrationMarginBp(belt({ thicknessUm: 5_000_000 }), gun6, bal)).toBe(10_000);
    expect(penetrationMarginBp(belt({ thicknessUm: 0 }), gun6, bal)).toBe(-10_000);
  });
  it("better material and slope raise the margin (trade vs weight is separate)", () => {
    const base = penetrationMarginBp(belt(), gun12, bal);
    expect(penetrationMarginBp(belt({ materialId: "face_hardened" }), gun12, bal)).toBeGreaterThan(
      base,
    );
    expect(penetrationMarginBp(belt({ cosObliquityBp: 8_000 }), gun12, bal)).toBeLessThan(base);
    expect(regionWeightKg(belt({ materialId: "face_hardened" }), bal)).toBe(
      regionWeightKg(belt(), bal),
    );
  });
  it("throws on unknown material or non-positive threat", () => {
    expect(() => penetrationMarginBp(belt({ materialId: "x" }), gun6, bal)).toThrow();
    expect(() => penetrationMarginBp(belt(), { id: "z", penetrationUm: 0 }, bal)).toThrow();
  });
});

describe("compileArmour", () => {
  it("totals weights, covers the citadel, and reports no findings for a sound scheme", () => {
    const r = compileArmour(input(), bal);
    expect(r.totalWeightKg).toBe(Object.values(r.weightByRegionKg).reduce((a, b) => a + b, 0));
    expect(r.coverageBp).toBe(10_000);
    expect(r.findings).toEqual([]);
  });
  it("short belt gives CITADEL_INCOMPLETE (warning then critical)", () => {
    const w = compileArmour(input({ regions: [belt({ lengthMm: 50_000 })] }), bal).findings.find(
      (f) => f.id === "CITADEL_INCOMPLETE",
    )!;
    expect(w.severity).toBe("WARNING");
    expect(checkFindingShape(w)).toEqual([]);
    const c = compileArmour(input({ regions: [belt({ lengthMm: 20_000 })] }), bal).findings.find(
      (f) => f.id === "CITADEL_INCOMPLETE",
    )!;
    expect(c.severity).toBe("CRITICAL");
  });
  it("armour that cannot stop the expected adversary is a warning; no armour at all too", () => {
    const r = compileArmour(input({ designThreatId: "gun_12in" }), bal);
    expect(r.findings.map((f) => f.id)).toContain("ARMOUR_INEFFECTIVE_VS_ADVERSARY");
    expect(compileArmour(input({ regions: [] }), bal).totalWeightKg).toBe(0);
  });
  it("magazine protection: weakest layer governs, unprotected is critical", () => {
    const mag = {
      magazineId: "m1",
      beltMarginBp: 4_000,
      deckMarginBp: -1_000,
      boxMarginBp: null,
      adjacentBoilers: true,
      adjacentTorpedoTubes: false,
      flashProtectionBp: 500,
    };
    const r = compileArmour(input({ magazines: [mag] }), bal);
    expect(r.magazineProtectionBp.m1).toBe(-1_000);
    expect(r.magazineVulnerabilityBp.m1).toBe(3_000 + 2_000 - 500);
    expect(r.findings.find((f) => f.id === "MAGAZINE_UNPROTECTED")!.severity).toBe("WARNING");
    const bare = compileArmour(
      input({ magazines: [{ ...mag, beltMarginBp: null, deckMarginBp: null }] }),
      bal,
    );
    expect(bare.findings.find((f) => f.id === "MAGAZINE_UNPROTECTED")!.severity).toBe("CRITICAL");
  });
  it("underwater, flooding and fire scores respond to design choices and stay in [0,10000]", () => {
    const none = compileArmour(input(), bal);
    expect(none.underwaterResistanceBp).toBe(0);
    const tb = compileArmour(
      input({
        regions: [
          belt(),
          belt({ region: "TORPEDO_BULKHEAD", heightMm: 1_000, thicknessUm: 40_000 }),
        ],
      }),
      bal,
    );
    expect(tb.underwaterResistanceBp).toBeGreaterThan(0);
    const bunkers = compileArmour(
      input({
        bunkerProtectionBp: 5_000,
        regions: [
          belt(),
          belt({ region: "TORPEDO_BULKHEAD", heightMm: 1_000, thicknessUm: 40_000 }),
        ],
      }),
      bal,
    );
    expect(bunkers.underwaterResistanceBp).toBeGreaterThan(tb.underwaterResistanceBp);
    expect(compileArmour(input({ subdivisionGrade: 4 }), bal).floodingResistanceBp).toBeGreaterThan(
      compileArmour(input({ subdivisionGrade: 0 }), bal).floodingResistanceBp,
    );
    expect(compileArmour(input({ flammableBp: 0, damageControlBp: 5_000 }), bal).fireRiskBp).toBe(
      0,
    );
    expect(compileArmour(input({ flammableBp: 99_999 }), bal).fireRiskBp).toBe(10_000);
  });
  it("throws if the design threat is missing, and is order independent", () => {
    expect(() => compileArmour(input({ designThreatId: "nope" }), bal)).toThrow();
    const regs = [belt(), belt({ region: "DECK_MAIN" })];
    expect(JSON.stringify(compileArmour(input({ regions: regs }), bal))).toBe(
      JSON.stringify(compileArmour(input({ regions: [...regs].reverse() }), bal)),
    );
  });
});

describe("deck penetration factor", () => {
  it("decks face reduced penetration; belts do not", () => {
    const deck = belt({ region: "DECK_MAIN", thicknessUm: 100_000 });
    const full = penetrationMarginBp(deck, gun12, bal);
    const reduced = compileArmour(input({ regions: [deck], designThreatId: "gun_12in" }), {
      ...bal,
      deckPenetrationBp: 4_000,
    });
    const plain = compileArmour(input({ regions: [deck], designThreatId: "gun_12in" }), bal);
    expect(reduced.marginBp.DECK_MAIN!.gun_12in!).toBeGreaterThan(
      plain.marginBp.DECK_MAIN!.gun_12in!,
    );
    expect(plain.marginBp.DECK_MAIN!.gun_12in!).toBe(full);
    const b = compileArmour(
      input({ regions: [belt({ thicknessUm: 100_000 })], designThreatId: "gun_12in" }),
      { ...bal, deckPenetrationBp: 4_000 },
    );
    expect(b.marginBp.BELT_MAIN!.gun_12in!).toBe(
      penetrationMarginBp(belt({ thicknessUm: 100_000 }), gun12, bal),
    );
  });
});
