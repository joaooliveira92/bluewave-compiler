// AC-21 seeds (INC-1..INC-5): mine reason-code catalog shape. The
// full §30 partition (in-slice / deferred / set-equality) is the INC-8
// deliverable (ticket 05); this increment proves the module ships exactly the
// INC-1..INC-5 codes (INC-4 ships MINE_PRESSURE_REDUCED, its §10 code; INC-5
// ships the §16/§13 value-only codes MINE_DEFENSIVE_STANDOFF_ACTIVE +
// MINE_ROUTE_RISK_CREATED plus the documented NON-§30 in-slice marker
// MINE_STRIKE_RESOLUTION_DEFERRED — 11 shipped total).
import { describe, expect, it } from "vite-plus/test";
import { REASON_CODES } from "../../src/reasonCodes.js";
import {
  DUAL_EQUIPMENT_MODE_MISSING,
  INVALID_MINE_PRESSURE_STATE,
  INVALID_MINE_TYPE_DEFINITION,
  MINE_DEFENSIVE_STANDOFF_ACTIVE,
  MINE_INVENTORY_INSUFFICIENT,
  MINE_LAYING_SOURCE_INELIGIBLE,
  MINE_PRESSURE_REDUCED,
  MINE_REASON_CODES,
  MINE_ROUTE_RISK_CREATED,
  MINE_STRIKE_RESOLUTION_DEFERRED,
  MINESWEEPING_SHIP_INELIGIBLE,
  MINE_SWEEP_RESISTANCE_MISSING,
} from "../../src/mines/index.js";

describe("AC-21: mine reason-code catalog shape (INC-1..INC-5)", () => {
  it("ships exactly the INC-1..INC-5 §30 codes + INC-5 marker — nothing more, nothing less", () => {
    const shipped = Object.values(MINE_REASON_CODES).sort();
    expect(shipped).toEqual(
      [
        "DUAL_EQUIPMENT_MODE_MISSING",
        "INVALID_MINE_PRESSURE_STATE",
        "INVALID_MINE_TYPE_DEFINITION",
        "MINE_DEFENSIVE_STANDOFF_ACTIVE",
        "MINE_INVENTORY_INSUFFICIENT",
        "MINE_LAYING_SOURCE_INELIGIBLE",
        "MINE_PRESSURE_REDUCED",
        "MINE_ROUTE_RISK_CREATED",
        "MINE_STRIKE_RESOLUTION_DEFERRED",
        "MINE_SWEEP_RESISTANCE_MISSING",
        "MINESWEEPING_SHIP_INELIGIBLE",
      ].sort(),
    );
    expect(Object.values(MINE_REASON_CODES).length).toBe(11);
  });

  it("every shipped code is a non-empty string literal (no duplicates)", () => {
    const values = Object.values(MINE_REASON_CODES) as readonly string[];
    for (const code of values) {
      expect(typeof code).toBe("string");
      expect(code.length).toBeGreaterThan(0);
    }
    expect(new Set(values).size).toBe(values.length);
  });

  it("is disjoint from the top-level combat catalog (no redefinition)", () => {
    const mineSet = new Set(Object.values(MINE_REASON_CODES) as readonly string[]);
    const sharedSet: ReadonlySet<string> = new Set(Object.values(REASON_CODES));
    for (const code of mineSet) {
      expect(sharedSet.has(code)).toBe(false);
    }
  });

  it("ships each INC-2/INC-3/INC-4/INC-5 code under its exported literal name", () => {
    expect(INVALID_MINE_PRESSURE_STATE).toBe("INVALID_MINE_PRESSURE_STATE");
    expect(MINE_LAYING_SOURCE_INELIGIBLE).toBe("MINE_LAYING_SOURCE_INELIGIBLE");
    expect(MINE_INVENTORY_INSUFFICIENT).toBe("MINE_INVENTORY_INSUFFICIENT");
    expect(MINESWEEPING_SHIP_INELIGIBLE).toBe("MINESWEEPING_SHIP_INELIGIBLE");
    expect(DUAL_EQUIPMENT_MODE_MISSING).toBe("DUAL_EQUIPMENT_MODE_MISSING");
    expect(MINE_SWEEP_RESISTANCE_MISSING).toBe("MINE_SWEEP_RESISTANCE_MISSING");
    expect(MINE_PRESSURE_REDUCED).toBe("MINE_PRESSURE_REDUCED");
    expect(MINE_DEFENSIVE_STANDOFF_ACTIVE).toBe("MINE_DEFENSIVE_STANDOFF_ACTIVE");
    expect(MINE_ROUTE_RISK_CREATED).toBe("MINE_ROUTE_RISK_CREATED");
    expect(MINE_STRIKE_RESOLUTION_DEFERRED).toBe("MINE_STRIKE_RESOLUTION_DEFERRED");
  });

  it("ships the INC-5 marker MINE_STRIKE_RESOLUTION_DEFERRED — a documented NON-§30 local marker", () => {
    // Per spec §1.4 the marker is NOT one of §30's required codes; it mirrors C-1's
    // TORPEDO_ELIGIBILITY_PREDICATE_DEFERRED precedent for would-be-strike boundaries.
    expect(MINE_REASON_CODES.MINE_STRIKE_RESOLUTION_DEFERRED).toBe(MINE_STRIKE_RESOLUTION_DEFERRED);
    expect(MINE_DEFENSIVE_STANDOFF_ACTIVE).toContain("STANDOFF");
    expect(MINE_ROUTE_RISK_CREATED).toContain("ROUTE_RISK");
  });

  it("does NOT ship §30 codes owned by later increments", () => {
    const shipped: ReadonlySet<string> = new Set(Object.values(MINE_REASON_CODES));
    const laterIncrementCodes = [
      "MINE_REPORT_CAUSE_UNCERTAIN",
      "MINE_DECAY_POLICY_MISSING",
      "CONTROLLED_MINE_TRANSFER_DISPOSITION_MISSING",
      "MINEFIELD_CLEARED",
      "MINE_WARFARE_INVARIANT_FAILED",
      "MINE_BATTLE_HAZARD_GENERATED",
      "MINE_STRIKE_OCCURRED",
      "FRIENDLY_MINE_STRIKE_OCCURRED",
    ];
    for (const code of laterIncrementCodes) {
      expect(shipped.has(code)).toBe(false);
    }
    expect(shipped.has("INVALID_MINE_TYPE_DEFINITION")).toBe(true);
    expect(shipped.has(INVALID_MINE_TYPE_DEFINITION)).toBe(true);
  });
});
