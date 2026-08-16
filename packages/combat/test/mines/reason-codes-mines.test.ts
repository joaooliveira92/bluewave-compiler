// AC-21 seeds (INC-1..INC-5): mine reason-code catalog shape. The
// full §30 partition (in-slice / deferred / set-equality) is the INC-8
// deliverable (ticket 05); this increment proves the module ships exactly the
// INC-1..INC-7 codes. INC-7 ships the §21/§23/§27 codes its boundaries exercise
// (MINE_DECAY_POLICY_MISSING, CONTROLLED_MINE_TRANSFER_DISPOSITION_MISSING,
// MINEFIELD_CLEARED) — 15 shipped total (14 §30 direct/value + the INC-5
// NON-§30 marker). MINE_WARFARE_INVARIANT_FAILED remains an ambient standalone
// export (NOT in the shipped map), formalized by INC-8.
import { describe, expect, it } from "vite-plus/test";
import { REASON_CODES } from "../../src/reasonCodes.js";
import {
  CONTROLLED_MINE_TRANSFER_DISPOSITION_MISSING,
  DUAL_EQUIPMENT_MODE_MISSING,
  INVALID_MINE_PRESSURE_STATE,
  INVALID_MINE_TYPE_DEFINITION,
  MINE_DECAY_POLICY_MISSING,
  MINE_DEFENSIVE_STANDOFF_ACTIVE,
  MINE_INVENTORY_INSUFFICIENT,
  MINE_LAYING_SOURCE_INELIGIBLE,
  MINE_PRESSURE_REDUCED,
  MINE_REASON_CODES,
  MINE_REPORT_CAUSE_UNCERTAIN,
  MINE_ROUTE_RISK_CREATED,
  MINE_STRIKE_RESOLUTION_DEFERRED,
  MINEFIELD_CLEARED,
  MINESWEEPING_SHIP_INELIGIBLE,
  MINE_SWEEP_RESISTANCE_MISSING,
} from "../../src/mines/index.js";

describe("AC-21: mine reason-code catalog shape (INC-1..INC-7)", () => {
  it("ships exactly the INC-1..INC-7 §30 codes + INC-5 marker — nothing more, nothing less", () => {
    const shipped = Object.values(MINE_REASON_CODES).sort();
    expect(shipped).toEqual(
      [
        "CONTROLLED_MINE_TRANSFER_DISPOSITION_MISSING",
        "DUAL_EQUIPMENT_MODE_MISSING",
        "INVALID_MINE_PRESSURE_STATE",
        "INVALID_MINE_TYPE_DEFINITION",
        "MINE_DECAY_POLICY_MISSING",
        "MINE_DEFENSIVE_STANDOFF_ACTIVE",
        "MINE_INVENTORY_INSUFFICIENT",
        "MINE_LAYING_SOURCE_INELIGIBLE",
        "MINE_PRESSURE_REDUCED",
        "MINE_REPORT_CAUSE_UNCERTAIN",
        "MINE_ROUTE_RISK_CREATED",
        "MINE_STRIKE_RESOLUTION_DEFERRED",
        "MINE_SWEEP_RESISTANCE_MISSING",
        "MINEFIELD_CLEARED",
        "MINESWEEPING_SHIP_INELIGIBLE",
      ].sort(),
    );
    expect(Object.values(MINE_REASON_CODES).length).toBe(15);
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
    expect(MINE_REPORT_CAUSE_UNCERTAIN).toBe("MINE_REPORT_CAUSE_UNCERTAIN");
    expect(MINE_DECAY_POLICY_MISSING).toBe("MINE_DECAY_POLICY_MISSING");
    expect(CONTROLLED_MINE_TRANSFER_DISPOSITION_MISSING).toBe(
      "CONTROLLED_MINE_TRANSFER_DISPOSITION_MISSING",
    );
    expect(MINEFIELD_CLEARED).toBe("MINEFIELD_CLEARED");
  });

  it("ships the INC-5 marker MINE_STRIKE_RESOLUTION_DEFERRED — a documented NON-§30 local marker", () => {
    // Per spec §1.4 the marker is NOT one of §30's required codes; it mirrors C-1's
    // TORPEDO_ELIGIBILITY_PREDICATE_DEFERRED precedent for would-be-strike boundaries.
    expect(MINE_REASON_CODES.MINE_STRIKE_RESOLUTION_DEFERRED).toBe(MINE_STRIKE_RESOLUTION_DEFERRED);
    expect(MINE_DEFENSIVE_STANDOFF_ACTIVE).toContain("STANDOFF");
    expect(MINE_ROUTE_RISK_CREATED).toContain("ROUTE_RISK");
  });

  it("does NOT ship §30 codes owned by INC-8 or the deferred strike continuation", () => {
    const shipped: ReadonlySet<string> = new Set(Object.values(MINE_REASON_CODES));
    const laterIncrementCodes = [
      // INC-8 owns MINE_WARFARE_INVARIANT_FAILED (shipped ambiently as a standalone
      // export by INC-7, but NOT in the shipped map until INC-8 formalizes it).
      "MINE_WARFARE_INVARIANT_FAILED",
      // Deferred strike-resolution continuation (ticket 03/05).
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
