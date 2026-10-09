import { describe, expect, it } from "vite-plus/test";
import {
  checkFindingShape,
  checkRebuildBalance,
  compileDesign,
  rebuildFactsOf,
  validateRebuild,
  yardDemandOf,
  type RebuildBalance,
  type RebuildFacts,
} from "../src/index.js";
import { earlyContext, shipBuildingContent } from "./helpers/earlyContext.js";
import { havock, majestic } from "./helpers/references.js";

const balance: RebuildBalance = {
  maxDisplacementIncreaseBp: 2_000,
  maxSpeedIncreaseMilliKnots: 3_000,
  maxLengthChangeBp: 500,
  maxBeamChangeBp: 500,
};
const source: RebuildFacts = {
  displacementKg: 10_000_000,
  speedMilliKnots: 18_000,
  lengthMm: 100_000,
  beamMm: 20_000,
  hullFormId: "pre_dreadnought_form",
};
const target = (over: Partial<RebuildFacts>): RebuildFacts => ({ ...source, ...over });
const ids = (t: RebuildFacts) => validateRebuild(source, t, balance).findings.map((f) => f.id);

describe("validateRebuild: the retained-hull limits (DESIGN-23 section 21)", () => {
  it("a rebuild that changes nothing is legal, with zero measures", () => {
    const r = validateRebuild(source, source, balance);
    expect(r.legal).toBe(true);
    expect(r.findings).toEqual([]);
    expect(r.measures).toEqual({
      displacementChangeBp: 0,
      speedChangeMilliKnots: 0,
      lengthChangeBp: 0,
      beamChangeBp: 0,
    });
  });

  it("displacement may rise exactly 20 % and not a kilogram more; any decrease is allowed", () => {
    expect(ids(target({ displacementKg: 12_000_000 }))).toEqual([]);
    expect(ids(target({ displacementKg: 12_000_001 }))).toEqual(["REBUILD_DISPLACEMENT_LIMIT"]);
    expect(ids(target({ displacementKg: 1 }))).toEqual([]);
  });

  it("speed may rise exactly 3 kn and not a milli-knot more; slower is allowed", () => {
    expect(ids(target({ speedMilliKnots: 21_000 }))).toEqual([]);
    expect(ids(target({ speedMilliKnots: 21_001 }))).toEqual(["REBUILD_SPEED_LIMIT"]);
    expect(ids(target({ speedMilliKnots: 5_000 }))).toEqual([]);
  });

  it("length and beam may change 5 % either way, exactly, and not more", () => {
    expect(ids(target({ lengthMm: 105_000 }))).toEqual([]);
    expect(ids(target({ lengthMm: 95_000 }))).toEqual([]);
    expect(ids(target({ lengthMm: 105_001 }))).toEqual(["REBUILD_LENGTH_LIMIT"]);
    expect(ids(target({ lengthMm: 94_999 }))).toEqual(["REBUILD_LENGTH_LIMIT"]);
    expect(ids(target({ beamMm: 21_000 }))).toEqual([]);
    expect(ids(target({ beamMm: 18_999 }))).toEqual(["REBUILD_BEAM_LIMIT"]);
  });

  it("a different hull form is always refused", () => {
    expect(ids(target({ hullFormId: "protected_cruiser_form" }))).toEqual([
      "REBUILD_HULL_FORM_CHANGED",
    ]);
  });

  it("reports every failure at once, in a fixed order", () => {
    const r = validateRebuild(
      source,
      target({
        hullFormId: "coast_defence_form",
        displacementKg: 20_000_000,
        speedMilliKnots: 30_000,
        lengthMm: 200_000,
        beamMm: 40_000,
      }),
      balance,
    );
    expect(r.legal).toBe(false);
    expect(r.findings.map((f) => f.id)).toEqual([
      "REBUILD_HULL_FORM_CHANGED",
      "REBUILD_DISPLACEMENT_LIMIT",
      "REBUILD_SPEED_LIMIT",
      "REBUILD_LENGTH_LIMIT",
      "REBUILD_BEAM_LIMIT",
    ]);
  });

  it("every finding is a well-formed BLOCKING finding with evidence and enough remedies", () => {
    const r = validateRebuild(
      source,
      target({
        hullFormId: "x",
        displacementKg: 99_000_000,
        speedMilliKnots: 99_000,
        lengthMm: 1,
        beamMm: 1,
      }),
      balance,
      { demand: { lengthMm: 1e9, beamMm: 1e9, displacementKg: 1e12, heaviestKg: 1e12 }, yards: [] },
    );
    expect(r.findings.length).toBe(6);
    for (const f of r.findings) {
      expect(f.severity).toBe("BLOCKING");
      expect(checkFindingShape(f)).toEqual([]);
      expect(f.evidence.formulaId).toMatch(/^DESIGN-23-21-/);
    }
  });

  it("measures are signed, in bp of the current value, rounded toward zero", () => {
    const r = validateRebuild(
      source,
      target({ displacementKg: 10_333_333, lengthMm: 99_000, speedMilliKnots: 17_000 }),
      balance,
    );
    expect(r.measures).toEqual({
      displacementChangeBp: 333,
      speedChangeMilliKnots: -1_000,
      lengthChangeBp: -100,
      beamChangeBp: 0,
    });
  });

  it("is deterministic and does not mutate its inputs", () => {
    const snap = JSON.stringify([source, balance]);
    const a = validateRebuild(source, target({ displacementKg: 15_000_000 }), balance);
    expect(validateRebuild(source, target({ displacementKg: 15_000_000 }), balance)).toEqual(a);
    expect(JSON.stringify([source, balance])).toBe(snap);
  });

  it("copes with a zero-sized source without dividing by zero", () => {
    const r = validateRebuild(
      target({ lengthMm: 0, displacementKg: 0 }),
      target({ lengthMm: 5, displacementKg: 5 }),
      balance,
    );
    expect(Number.isFinite(r.measures.lengthChangeBp)).toBe(true);
    expect(r.measures.displacementChangeBp).toBe(0);
  });
});

describe("validateRebuild: the dock", () => {
  const env = shipBuildingContent.environmentFor("1896-01");
  const compiledOf = (d: typeof majestic) => compileDesign(d, earlyContext("1896-01"));

  it("is satisfied when some yard can hold the rebuilt hull, and refused when none can", () => {
    const c = compiledOf(majestic);
    const facts = rebuildFactsOf(c, majestic);
    const demand = yardDemandOf(c, majestic);
    expect(validateRebuild(facts, facts, balance, { demand, yards: env.yards }).legal).toBe(true);
    const none = validateRebuild(facts, facts, balance, { demand, yards: [] });
    expect(none.findings.map((f) => f.id)).toEqual(["REBUILD_NO_DOCK"]);
  });

  it("is skipped when no dock information is given", () => {
    expect(validateRebuild(source, source, balance).legal).toBe(true);
  });
});

describe("rebuildFactsOf and the shipped limits", () => {
  it("reads displacement, speed, dimensions and hull form from a compiled design", () => {
    const c = compileDesign(havock, earlyContext("1895-06"));
    const f = rebuildFactsOf(c, havock);
    expect(f.displacementKg).toBe(c.totalKg);
    expect(f.speedMilliKnots).toBe(c.machinery!.maxSpeedMilliKnots);
    expect(f.lengthMm).toBe(havock.hull.lengthWl);
    expect(f.hullFormId).toBe(havock.hull.hullFormId);
  });

  it("the shipped content carries exactly the rule's values (20 %, 3 kn, 5 %, 5 %)", () => {
    expect(shipBuildingContent.rebuild).toEqual({
      maxDisplacementIncreaseBp: 2_000,
      maxSpeedIncreaseMilliKnots: 3_000,
      maxLengthChangeBp: 500,
      maxBeamChangeBp: 500,
    });
  });

  it("a real design rebuilt into itself is legal, and into a different hull form is not", () => {
    const c = compileDesign(majestic, earlyContext("1896-01"));
    const same = rebuildFactsOf(c, majestic);
    expect(validateRebuild(same, same, shipBuildingContent.rebuild!).legal).toBe(true);
    expect(
      validateRebuild(
        same,
        { ...same, hullFormId: "torpedo_boat_form" },
        shipBuildingContent.rebuild!,
      ).legal,
    ).toBe(false);
  });

  it("checkRebuildBalance rejects negative and fractional limits", () => {
    expect(checkRebuildBalance(balance)).toEqual([]);
    expect(checkRebuildBalance({ ...balance, maxBeamChangeBp: -1 })).toHaveLength(1);
    expect(checkRebuildBalance({ ...balance, maxLengthChangeBp: 1.5 })).toHaveLength(1);
  });
});
