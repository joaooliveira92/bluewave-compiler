import { describe, expect, it } from "vite-plus/test";
import { BluewaveError } from "@bluewave/contracts";
import {
  LAND_TARGET_DAMAGE_STATES,
  DAMAGE_EVENT_TYPES,
  createDamageEvent,
  validateDamageState,
} from "../../src/coastal-defense/index.js";

describe("DamageState", () => {
  it("validates all 5 damage states", () => {
    for (const s of LAND_TARGET_DAMAGE_STATES) {
      expect(validateDamageState(s)).toBe(s);
    }
  });

  it("rejects unknown damage state", () => {
    expect(() => validateDamageState("MELTED")).toThrowError(BluewaveError);
  });
});

describe("DamageEvent", () => {
  it("creates valid damage events", () => {
    for (const et of DAMAGE_EVENT_TYPES) {
      const e = createDamageEvent(et);
      expect(e.eventType).toBe(et);
    }
  });

  it("rejects unknown damage event type", () => {
    expect(() => createDamageEvent("NUKE")).toThrowError(BluewaveError);
  });
});