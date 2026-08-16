// AC-21 seeds (INC-1): mine reason-code catalog shape. The full §30 partition
// (in-slice / deferred / set-equality) is the INC-8 deliverable (ticket 05);
// this increment only proves the module ships and carries exactly its own code.
import { describe, expect, it } from "vite-plus/test";
import { REASON_CODES } from "../../src/reasonCodes.js";
import {
  INVALID_MINE_TYPE_DEFINITION,
  MINE_REASON_CODES,
} from "../../src/mines/index.js";

describe("AC-21: INC-1 mine reason-code catalog shape", () => {
  it("ships exactly the INC-1 §30 code — nothing more, nothing less", () => {
    const shipped = Object.values(MINE_REASON_CODES).sort();
    expect(shipped).toEqual(["INVALID_MINE_TYPE_DEFINITION"]);
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

  it("does NOT ship §30 codes owned by later increments", () => {
    const shipped: ReadonlySet<string> = new Set(Object.values(MINE_REASON_CODES));
    const laterIncrementCodes = [
      "INVALID_MINE_PRESSURE_STATE",
      "MINE_LAYING_SOURCE_INELIGIBLE",
      "MINE_INVENTORY_INSUFFICIENT",
      "MINESWEEPING_SHIP_INELIGIBLE",
      "DUAL_EQUIPMENT_MODE_MISSING",
      "MINE_SWEEP_RESISTANCE_MISSING",
      "MINE_PRESSURE_REDUCED",
      "MINE_ROUTE_RISK_CREATED",
      "MINE_DEFENSIVE_STANDOFF_ACTIVE",
      "MINE_REPORT_CAUSE_UNCERTAIN",
      "MINE_DECAY_POLICY_MISSING",
      "CONTROLLED_MINE_TRANSFER_DISPOSITION_MISSING",
      "MINEFIELD_CLEARED",
      "MINE_WARFARE_INVARIANT_FAILED",
      "MINE_STRIKE_RESOLUTION_DEFERRED",
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
