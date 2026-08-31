// packages/combat/test/air-defense/ordering.test.ts
// AC-15: canonical ordering per DESIGN-45 §27.
import { describe, expect, it } from "vite-plus/test";
import { SafeInt } from "@bluewave/contracts";
import {
  compareAirDefenseEngagementRecords,
  canonicallySortedRecords,
  compareStrings,
  createAirDefenseEngagementRecord,
  AIR_DEFENSE_RECORD_POLICY_ID,
  type AirDefenseEngagementRecord,
} from "../../src/air-defense/index.js";
import { AIR_DEFENSE_RULESET_VERSION } from "../../src/air-defense/index.js";

const TEST_FORMULA_VERSION = "air_defense_formula_v1" as const;

function makeRecord(
  overrides: Partial<Omit<AirDefenseEngagementRecord, "recordHash">> = {},
): AirDefenseEngagementRecord {
  return createAirDefenseEngagementRecord({
    battleMinute: SafeInt(5),
    substep: SafeInt(1),
    defenderId: "ship-001",
    attackerId: "atk-001",
    attackType: "AIRCRAFT_DIVE_BOMBING",
    terminalProfile: "DIVE",
    layer: "LIGHT_AA",
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
    outcome: "DISRUPTION",
    disruptionSeverity: "LIGHT",
    formulaVersion: TEST_FORMULA_VERSION,
    rulesetVersion: AIR_DEFENSE_RULESET_VERSION,
    policyId: AIR_DEFENSE_RECORD_POLICY_ID,
    ...overrides,
  });
}

describe("AC-15: canonical ordering per §27", () => {
  it("compareStrings orders alphabetically", () => {
    expect(compareStrings("a", "b")).toBeLessThan(0);
    expect(compareStrings("b", "a")).toBeGreaterThan(0);
    expect(compareStrings("a", "a")).toBe(0);
  });

  it("earlier minute sorts before later minute", () => {
    const a = makeRecord({ battleMinute: SafeInt(1) });
    const b = makeRecord({ battleMinute: SafeInt(5) });
    expect(compareAirDefenseEngagementRecords(a, b)).toBeLessThan(0);
    expect(compareAirDefenseEngagementRecords(b, a)).toBeGreaterThan(0);
  });

  it("same minute, lower substep sorts first", () => {
    const a = makeRecord({ battleMinute: SafeInt(5), substep: SafeInt(1) });
    const b = makeRecord({ battleMinute: SafeInt(5), substep: SafeInt(3) });
    expect(compareAirDefenseEngagementRecords(a, b)).toBeLessThan(0);
  });

  it("layer order: HEAVY_AA before MEDIUM_AA before LIGHT_AA before CIWS", () => {
    const heavy = makeRecord({ layer: "HEAVY_AA" });
    const medium = makeRecord({ layer: "MEDIUM_AA" });
    const light = makeRecord({ layer: "LIGHT_AA" });
    const ciws = makeRecord({ layer: "CIWS_TERMINAL_DEFENSE" });
    expect(compareAirDefenseEngagementRecords(heavy, medium)).toBeLessThan(0);
    expect(compareAirDefenseEngagementRecords(medium, light)).toBeLessThan(0);
    expect(compareAirDefenseEngagementRecords(light, ciws)).toBeLessThan(0);
    expect(compareAirDefenseEngagementRecords(heavy, ciws)).toBeLessThan(0);
  });

  it("defenderId sorted ascending", () => {
    const a = makeRecord({ defenderId: "ship-001" });
    const b = makeRecord({ defenderId: "ship-002" });
    expect(compareAirDefenseEngagementRecords(a, b)).toBeLessThan(0);
    expect(compareAirDefenseEngagementRecords(b, a)).toBeGreaterThan(0);
  });

  it("higher outcomeProbabilityBp sorts first (threat priority descending)", () => {
    const low = makeRecord({ outcomeProbabilityBp: SafeInt(1_000) });
    const high = makeRecord({ outcomeProbabilityBp: SafeInt(9_000) });
    expect(compareAirDefenseEngagementRecords(low, high)).toBeGreaterThan(0);
    expect(compareAirDefenseEngagementRecords(high, low)).toBeLessThan(0);
  });

  it("systemId sorted ascending", () => {
    const a = makeRecord({ systemId: "sys-01" });
    const b = makeRecord({ systemId: "sys-02" });
    expect(compareAirDefenseEngagementRecords(a, b)).toBeLessThan(0);
  });

  it("channelId sorted ascending", () => {
    const a = makeRecord({ channelId: "ch-1" });
    const b = makeRecord({ channelId: "ch-2" });
    expect(compareAirDefenseEngagementRecords(a, b)).toBeLessThan(0);
  });

  it("attackerId as engagement identifier sorted ascending", () => {
    const a = makeRecord({ attackerId: "atk-a" });
    const b = makeRecord({ attackerId: "atk-b" });
    expect(compareAirDefenseEngagementRecords(a, b)).toBeLessThan(0);
  });

  it("outcome effect ordinal ascending: KILL before DAMAGE before ABORT before DISRUPTION", () => {
    const kill = makeRecord({ outcome: "KILL", disruptionSeverity: null });
    const damage = makeRecord({ outcome: "DAMAGE", disruptionSeverity: null });
    const abort = makeRecord({ outcome: "ABORT", disruptionSeverity: null });
    const disruption = makeRecord({ outcome: "DISRUPTION", disruptionSeverity: "LIGHT" });
    expect(compareAirDefenseEngagementRecords(kill, damage)).toBeLessThan(0);
    expect(compareAirDefenseEngagementRecords(damage, abort)).toBeLessThan(0);
    expect(compareAirDefenseEngagementRecords(abort, disruption)).toBeLessThan(0);
  });

  it("canonicallySortedRecords returns sorted copy", () => {
    const records = [
      makeRecord({
        battleMinute: SafeInt(10),
        defenderId: "ship-003",
        channelId: "ch-3",
        systemId: "sys-03",
      }),
      makeRecord({
        battleMinute: SafeInt(1),
        defenderId: "ship-001",
        channelId: "ch-1",
        systemId: "sys-01",
      }),
      makeRecord({
        battleMinute: SafeInt(5),
        defenderId: "ship-002",
        channelId: "ch-2",
        systemId: "sys-02",
      }),
    ];
    const sorted = canonicallySortedRecords(records);
    expect(Number(sorted[0]?.battleMinute)).toBe(1);
    expect(Number(sorted[1]?.battleMinute)).toBe(5);
    expect(Number(sorted[2]?.battleMinute)).toBe(10);
  });

  it("canonicallySortedRecords does NOT mutate input array", () => {
    const records = [
      makeRecord({ battleMinute: SafeInt(10), systemId: "sys-03" }),
      makeRecord({ battleMinute: SafeInt(1), systemId: "sys-01" }),
      makeRecord({ battleMinute: SafeInt(5), systemId: "sys-02" }),
    ];
    const originalSystemIds = records.map((r) => r.systemId);
    canonicallySortedRecords(records);
    expect(records.map((r) => r.systemId)).toEqual(originalSystemIds);
  });
});
