// packages/combat/test/air-defense/reason-codes-rollup.test.ts
// AC-16: 20 shipped reason codes + set-equality guard + 6 deferred markers.
import { describe, expect, it } from "vite-plus/test";
import {
  AIR_DEFENSE_REASON_CODES_SHIPPED,
  AIR_DEFENSE_REASON_CODES_DEFERRED,
  AIR_DEFENSE_REASON_CODE_SET,
} from "../../src/air-defense/index.js";

const SHIPPED_SPEC_CODES = [
  "INVALID_AIR_DEFENSE_STATE",
  "INVALID_AIR_DEFENSE_SYSTEM_DEFINITION",
  "AIR_DEFENSE_TARGET_INELIGIBLE",
  "AIR_DEFENSE_CHANNEL_UNAVAILABLE",
  "AIR_DEFENSE_DIRECTOR_UNAVAILABLE",
  "AIR_DEFENSE_RADAR_UNAVAILABLE",
  "AIR_DEFENSE_AMMUNITION_UNAVAILABLE",
  "HEAVY_AA_PROTECTED_RADIUS_EXCEEDED",
  "MEDIUM_AA_PRE_RELEASE_WINDOW_MISSED",
  "LIGHT_AA_DISRUPTION_OPPORTUNITY_CREATED",
  "AA_DIRECTOR_NORMAL_SCALING_CAP_REACHED",
  "RADAR_MEDIUM_AA_DIMINISHING_RETURNS_ACTIVE",
  "RADAR_MEDIUM_AA_REDUNDANT_GROUP_ACTIVE",
  "CIWS_DIMINISHING_RETURNS_ACTIVE",
  "CIWS_STRONG_REDUNDANCY_ACTIVE",
  "CAP_INTERCEPTION_INELIGIBLE",
  "CAP_EXHAUSTED",
  "AIR_ATTACK_DISRUPTED",
  "AIR_ATTACK_ABORTED",
  "AIR_DEFENSE_INVARIANT_FAILED",
] as const;

const DEFERRED_SPEC_CODES = [
  "HEAVY_SAM_DEFERRED",
  "HEAVY_SAM_ENGAGEMENT_DEFERRED",
  "MEDIUM_SAM_DEFERRED",
  "MEDIUM_SAM_ENGAGEMENT_DEFERRED",
  "LIGHT_SAM_DEFERRED",
  "LIGHT_SAM_ENGAGEMENT_DEFERRED",
] as const;

describe("AC-16: §28 reason-code set-equality", () => {
  it("ships exactly the 20 spec-defined reason codes", () => {
    const shippedValues = Object.values(AIR_DEFENSE_REASON_CODES_SHIPPED) as string[];
    for (const code of SHIPPED_SPEC_CODES) {
      expect(shippedValues).toContain(code);
    }
    expect(shippedValues.length).toBe(SHIPPED_SPEC_CODES.length);
  });

  it("AIR_DEFENSE_REASON_CODE_SET has exactly 20 entries", () => {
    expect(AIR_DEFENSE_REASON_CODE_SET.size).toBe(20);
  });

  it("all shipped codes are reachable in the set", () => {
    for (const code of SHIPPED_SPEC_CODES) {
      expect(AIR_DEFENSE_REASON_CODE_SET.has(code)).toBe(true);
    }
  });

  it("deferred markers (6) are NOT in AIR_DEFENSE_REASON_CODE_SET", () => {
    for (const deferred of DEFERRED_SPEC_CODES) {
      expect(AIR_DEFENSE_REASON_CODE_SET.has(deferred)).toBe(false);
    }
  });

  it("shipped set has no extra entries beyond the spec-defined 20", () => {
    const values = Object.values(AIR_DEFENSE_REASON_CODES_SHIPPED) as string[];
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
    for (const v of unique) {
      expect(SHIPPED_SPEC_CODES).toContain(v);
    }
  });

  it("deferred set has exactly 6 entries", () => {
    const deferredValues = Object.values(AIR_DEFENSE_REASON_CODES_DEFERRED) as string[];
    expect(deferredValues.length).toBe(6);
  });

  it("deferred markers use the <NAME>_DEFERRED pattern", () => {
    const deferredValues = Object.values(AIR_DEFENSE_REASON_CODES_DEFERRED) as string[];
    for (const value of deferredValues) {
      expect(value.endsWith("_DEFERRED")).toBe(true);
    }
  });

  it("no shipped code string starts with any deferred code string (disjointness)", () => {
    const shippedValues = Object.values(AIR_DEFENSE_REASON_CODES_SHIPPED) as string[];
    const deferredValues = Object.values(AIR_DEFENSE_REASON_CODES_DEFERRED) as string[];
    for (const shipped of shippedValues) {
      for (const deferred of deferredValues) {
        expect(shipped.includes(deferred)).toBe(false);
      }
    }
  });

  it("all 20 SAM markers in deferred set are disjoint from shipped set", () => {
    const shippedValues = Object.values(AIR_DEFENSE_REASON_CODES_SHIPPED) as string[];
    const deferredValues = Object.values(AIR_DEFENSE_REASON_CODES_DEFERRED) as string[];
    const shippedSet = new Set(shippedValues);
    for (const deferred of deferredValues) {
      expect(shippedSet.has(deferred)).toBe(false);
    }
  });

  it("previously shipped codes not removed (all prior INC-1..INC-4 codes present)", () => {
    const priorCodes = [
      "INVALID_AIR_DEFENSE_STATE",
      "INVALID_AIR_DEFENSE_SYSTEM_DEFINITION",
      "AIR_DEFENSE_TARGET_INELIGIBLE",
      "AIR_DEFENSE_CHANNEL_UNAVAILABLE",
      "AIR_DEFENSE_AMMUNITION_UNAVAILABLE",
      "HEAVY_AA_PROTECTED_RADIUS_EXCEEDED",
      "MEDIUM_AA_PRE_RELEASE_WINDOW_MISSED",
      "AIR_ATTACK_DISRUPTED",
      "AIR_ATTACK_ABORTED",
    ];
    for (const code of priorCodes) {
      expect(AIR_DEFENSE_REASON_CODE_SET.has(code)).toBe(true);
    }
  });
});
