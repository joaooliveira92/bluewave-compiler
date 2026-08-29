import { describe, expect, it } from "vite-plus/test";
import {
  resolveDamageControl,
  type DamageControlContext,
  type DamageControlStageResult,
} from "../../src/damage/damageControlEngineWiring.js";
import type { FireRecord, FloodingSourceRecord } from "../../src/damage/state.js";
import { createDefaultDamageControlResource } from "../../src/damage/damageControl.js";
import type { DamageControlResource } from "../../src/damage/damageControlConstants.js";

function makeDefaultResource(): DamageControlResource {
  return createDefaultDamageControlResource();
}

function makeContext(overrides: Partial<DamageControlContext> = {}): DamageControlContext {
  return {
    fireRecords: [],
    floodingRecords: [],
    floodedWaterBp: 0,
    shipType: "ORDINARY",
    currentSpeedKt: 10,
    resources: makeDefaultResource(),
    keyedRng: null,
    ...overrides,
  };
}

function makeFire(locationId: string, intensityBp: number, cause = "gunnery"): FireRecord {
  return { locationId, intensityBp, cause };
}

function makeFlood(
  compartmentId: string,
  rateKgMin: number,
  cause = "gunnery",
): FloodingSourceRecord {
  return { compartmentId, rateKgMin, cause };
}

describe("resolveDamageControl", () => {
  it("returns empty results when no fires or floods", () => {
    const ctx = makeContext();
    const result = resolveDamageControl(ctx, 1, 0);

    expect(result.fireRecords.length).toBe(0);
    expect(result.floodingRecords.length).toBe(0);
    expect(result.allocations.length).toBe(0);
    expect(result.smokeEventRecords.length).toBe(0);
    expect(result.highSpeedLoss).toBe(false);
  });

  it("fire progression creates decayed records", () => {
    const fires = [makeFire("comp-1", 5_000)];
    const ctx = makeContext({ fireRecords: fires });
    const result = resolveDamageControl(ctx, 1, 0);

    // Fire should decay by FIRE_INTENSITY_DECAY_PER_MINUTE = 200
    expect(result.fireRecords.length).toBe(1);
    expect(result.fireRecords[0].intensityBp).toBe(5_000 - 200);
    expect(result.fireRecords[0].locationId).toBe("comp-1");
  });

  it("fire with low intensity is extinguished", () => {
    const fires = [makeFire("comp-1", 100)];
    const ctx = makeContext({ fireRecords: fires });
    const result = resolveDamageControl(ctx, 1, 0);

    // 100 - 200 < 1 → extinguished
    expect(result.fireRecords.length).toBe(0);
  });

  it("multiple fires decay independently", () => {
    const fires = [makeFire("comp-1", 10_000), makeFire("comp-2", 1_000)];
    const ctx = makeContext({ fireRecords: fires });
    const result = resolveDamageControl(ctx, 1, 0);

    expect(result.fireRecords.length).toBe(2);
    expect(result.fireRecords[0].intensityBp).toBe(10_000 - 200);
    expect(result.fireRecords[1].intensityBp).toBe(1_000 - 200);
  });

  it("flooding progression updates flooded water mass", () => {
    const floods = [makeFlood("comp-1", 100)];
    const ctx = makeContext({ floodingRecords: floods, floodedWaterBp: 500 });
    const result = resolveDamageControl(ctx, 1, 0);

    // Speed 10 knots → speedPressureBp = 7_500
    // rawIngress = floor(100 * 7_500 * 10_000 / 100_000_000) = floor(75_000) = 75,000... wait
    // Actually: numerator = 100 * 7_500 * 10_000 = 7_500_000_000
    // divisor = 100_000_000
    // rawIngress = 75
    // pumping base = 200 per team
    // effectivePumping from allocations = ? (depends on team allocation)
    // netDeltaKgMin = max(0, 75 - effectivePumping)
    // So with teams, nextFloodedWaterBp >= 500
    expect(result.nextFloodedWaterBp).toBeGreaterThanOrEqual(500);
  });

  it("damage-control resources are allocated", () => {
    const fires = [makeFire("comp-1", 8_000)];
    const floods = [makeFlood("comp-1", 500)];
    const ctx = makeContext({ fireRecords: fires, floodingRecords: floods, floodedWaterBp: 3_000 });
    const result = resolveDamageControl(ctx, 1, 0);

    expect(result.allocations.length).toBeGreaterThan(0);
    // Fire with intensity >= 5_000 should get UNCONTROLLED_MAJOR_FIRE priority
    const fireAlloc = result.allocations.find(
      (a) => a.targetId === "comp-1" && a.allocatedFirefighting > 0,
    );
    expect(fireAlloc).toBeDefined();
  });

  it("combined fire + flood produces smoke records and allocations", () => {
    const fires = [makeFire("comp-1", 8_000)];
    const floods = [makeFlood("comp-1", 200)];
    const ctx = makeContext({
      fireRecords: fires,
      floodingRecords: floods,
      floodedWaterBp: 2_000,
    });
    const result = resolveDamageControl(ctx, 1, 0);

    // Fire with intensity 8_000 should produce smoke
    // computeFireSmokeStrength(8000, "ORDINARY") = floor(8000 * 8000 * 10000 / 100_000_000)
    // = floor(640_000_000_000 / 100_000_000) = 6_400
    expect(result.smokeEventRecords.length).toBeGreaterThan(0);
    expect(result.smokeEventRecords[0].kind).toBe("FUNNEL_EMISSION");
    expect(result.smokeEventRecords[0].sourceType).toBe("FIRE");
    expect(result.smokeEventRecords[0].densityBp).toBeGreaterThan(0);

    // Should have both fire and flood allocations
    expect(result.allocations.length).toBe(2);
  });

  it("fires with low intensity produce no smoke", () => {
    const fires = [makeFire("comp-1", 10)];
    const ctx = makeContext({ fireRecords: fires });
    const result = resolveDamageControl(ctx, 1, 0);

    // computeFireSmokeStrength(10, "ORDINARY") = 0 for small intensities
    expect(result.smokeEventRecords.length).toBe(0);
  });

  it("high-speed loss false when no keyedRng provided", () => {
    const floods = [makeFlood("comp-1", 500)];
    const ctx = makeContext({
      floodingRecords: floods,
      floodedWaterBp: 5_000, // CRITICAL severity
      currentSpeedKt: 25,
      keyedRng: null,
    });
    const result = resolveDamageControl(ctx, 1, 0);

    // Without keyedRng, high speed loss is always false
    expect(result.highSpeedLoss).toBe(false);
  });

  it("smoke records have correct FUNNEL_EMISSION kind", () => {
    const fires = [makeFire("comp-1", 8_000)];
    const ctx = makeContext({ fireRecords: fires });
    const result = resolveDamageControl(ctx, 1, 0);

    for (const sr of result.smokeEventRecords) {
      expect(sr.kind).toBe("FUNNEL_EMISSION");
      expect(sr.sourceType).toBe("FIRE");
    }
  });

  it("flooding records are unchanged by resolveDamageControl", () => {
    const floods = [makeFlood("comp-1", 100)];
    const ctx = makeContext({ floodingRecords: floods });
    const result = resolveDamageControl(ctx, 1, 0);

    expect(result.floodingRecords).toBe(floods);
    expect(result.floodingRecords.length).toBe(1);
  });

  it("fire smoke strength depends on fire intensity", () => {
    const intenseFire = resolveDamageControl(
      makeContext({ fireRecords: [makeFire("comp-1", 10_000)] }),
      1,
      0,
    );
    const weakFire = resolveDamageControl(
      makeContext({ fireRecords: [makeFire("comp-1", 1_000)] }),
      1,
      0,
    );

    // Stronger fire should produce more smoke
    const intenseSmoke = intenseFire.smokeEventRecords.reduce((sum, r) => sum + r.densityBp, 0);
    const weakSmoke = weakFire.smokeEventRecords.reduce((sum, r) => sum + r.densityBp, 0);
    expect(intenseSmoke).toBeGreaterThan(weakSmoke);
  });
});
