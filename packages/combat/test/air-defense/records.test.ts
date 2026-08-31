// packages/combat/test/air-defense/records.test.ts
// AC-15: AirDefenseEngagementRecord per DESIGN-45 §26.
import { describe, expect, it } from "vite-plus/test";
import { SafeInt } from "@bluewave/contracts";
import {
  createAirDefenseEngagementRecord,
  computeAirDefenseEngagementRecordHash,
  verifyAirDefenseEngagementRecordHash,
  assertAirDefenseEngagementRecordHash,
  outcomeEffectOrdinal,
  AIR_DEFENSE_RECORD_POLICY_ID,
  type AirDefenseEngagementRecord,
} from "../../src/air-defense/index.js";
import { AIR_DEFENSE_RULESET_VERSION } from "../../src/air-defense/index.js";

const TEST_FORMULA_VERSION = "air_defense_formula_v1" as const;

function makeDefaultRecordParams() {
  return {
    battleMinute: SafeInt(5),
    substep: SafeInt(1),
    defenderId: "ship-001",
    attackerId: "atk-001",
    attackType: "AIRCRAFT_DIVE_BOMBING",
    terminalProfile: "DIVE",
    layer: "LIGHT_AA" as const,
    systemId: "sys-01",
    directorState: "OPERATIONAL",
    radarState: "OPERATIONAL",
    crewQualityBp: SafeInt(8_000),
    damageState: "OPERATIONAL",
    powerState: "OPERATIONAL",
    ammunitionState: "AVAILABLE",
    timingMs: SafeInt(1_000),
    channelId: "ch-1",
    directorScalingBp: SafeInt(10_000),
    radarSaturationBp: SafeInt(10_000),
    ciwsRedundancyBp: SafeInt(10_000),
    outcomeProbabilityBp: SafeInt(1_000),
    randomDrawBp: SafeInt(500),
    outcome: "DISRUPTION" as const,
    disruptionSeverity: "LIGHT" as const,
    formulaVersion: TEST_FORMULA_VERSION,
    rulesetVersion: AIR_DEFENSE_RULESET_VERSION,
    policyId: AIR_DEFENSE_RECORD_POLICY_ID,
  };
}

describe("AC-15: AirDefenseEngagementRecord", () => {
  it("creates a record with all fields and a non-empty deterministic recordHash", () => {
    const record = createAirDefenseEngagementRecord(makeDefaultRecordParams());
    expect(record.defenderId).toBe("ship-001");
    expect(record.attackerId).toBe("atk-001");
    expect(Number(record.battleMinute)).toBe(5);
    expect(Number(record.substep)).toBe(1);
    expect(record.recordHash).toBeTruthy();
    expect(record.recordHash.length).toBe(64);
  });

  it("verify returns true for valid record", () => {
    const record = createAirDefenseEngagementRecord(makeDefaultRecordParams());
    expect(verifyAirDefenseEngagementRecordHash(record)).toBe(true);
  });

  it("verify returns false for tampered record", () => {
    const record = createAirDefenseEngagementRecord(makeDefaultRecordParams());
    const tampered: AirDefenseEngagementRecord = {
      ...record,
      systemId: "tampered-system-id",
    };
    expect(verifyAirDefenseEngagementRecordHash(tampered)).toBe(false);
  });

  it("assert throws when hash is invalid", () => {
    const record = createAirDefenseEngagementRecord(makeDefaultRecordParams());
    const tampered: AirDefenseEngagementRecord = {
      ...record,
      channelId: "tampered",
    };
    expect(() => assertAirDefenseEngagementRecordHash(tampered)).toThrow();
  });

  it("two identical records produce identical hashes", () => {
    const params = makeDefaultRecordParams();
    const record1 = createAirDefenseEngagementRecord(params);
    const record2 = createAirDefenseEngagementRecord(params);
    expect(record1.recordHash).toBe(record2.recordHash);
  });

  it("records with different fields produce different hashes", () => {
    const record1 = createAirDefenseEngagementRecord(makeDefaultRecordParams());
    const record2 = createAirDefenseEngagementRecord({
      ...makeDefaultRecordParams(),
      defenderId: "ship-999",
    });
    expect(record1.recordHash).not.toBe(record2.recordHash);
  });

  it("hash is computed deterministically", () => {
    const hash1 = computeAirDefenseEngagementRecordHash(makeDefaultRecordParams());
    const hash2 = computeAirDefenseEngagementRecordHash(makeDefaultRecordParams());
    expect(hash1).toBe(hash2);
  });

  it("supports different layers and outcomes", () => {
    const record = createAirDefenseEngagementRecord({
      ...makeDefaultRecordParams(),
      layer: "CIWS_TERMINAL_DEFENSE",
      outcome: "KILL",
      disruptionSeverity: null,
    });
    expect(record.layer).toBe("CIWS_TERMINAL_DEFENSE");
    expect(record.outcome).toBe("KILL");
    expect(record.disruptionSeverity).toBeNull();
  });

  it("outcomeEffectOrdinal: KILL=0, DAMAGE=1, ABORT=2, DISRUPTION=3, NO_EFFECT=4", () => {
    expect(outcomeEffectOrdinal("KILL")).toBe(0);
    expect(outcomeEffectOrdinal("DAMAGE")).toBe(1);
    expect(outcomeEffectOrdinal("ABORT")).toBe(2);
    expect(outcomeEffectOrdinal("DISRUPTION")).toBe(3);
    expect(outcomeEffectOrdinal("NO_EFFECT")).toBe(4);
  });
});
