// AC-24 seeds (INC-1): `torpedo_v1` SHIPPED_TORPEDO_CONTRACT + validate guard
// fail-closed on tampering; exact shipped §7/§8/§23 integers; the grounded
// seed model set; the INC-1 reason-code catalog (exactly the five INC-1 §29
// codes, disjoint from the top-level combat catalog — the full §29 partition
// set-equality test is the INC-8 deliverable).
import { describe, expect, it } from "vite-plus/test";
import { BluewaveError } from "@bluewave/contracts";
import { REASON_CODES } from "../../src/reasonCodes.js";
import {
  ABOVE_WATER_FIXED_MAX_LAUNCH_SPEED_KNOTS,
  ABOVE_WATER_TRAINABLE_MAX_LAUNCH_SPEED_KNOTS,
  INVALID_TORPEDO_MODEL_DEFINITION,
  OXYGEN_RANGE_MULTIPLIER_BP,
  resolvedAboveWaterMaxLaunchSpeedKnots,
  SHIPPED_TORPEDO_CONTRACT,
  SHIPPED_TORPEDO_MODELS,
  TORPEDO_MOUNT_TYPES,
  TORPEDO_REASON_CODES,
  TORPEDO_STATE_INVARIANT_FAILED,
  torpedoModelsContentVersion,
  torpedoPolicyId,
  torpedoSpeedBpKnotsToUmS,
  UNDERWATER_TUBE_MAX_SPEED_KNOTS,
  UNDERWATER_TUBE_MAX_SPEED_UM_S,
  validateTorpedoContract,
  validateTorpedoLauncherDefinition,
  type TorpedoLauncherDefinition,
} from "../../src/torpedoes/index.js";

describe("AC-24: torpedo_v1 contract + validate guard (fail closed)", () => {
  it("ships the *_v1 policy id and SHIPPED_TORPEDO_CONTRACT", () => {
    expect(torpedoPolicyId).toBe("torpedo_v1");
    expect(SHIPPED_TORPEDO_CONTRACT.policyId).toBe("torpedo_v1");
  });

  it("validates the shipped contract without throwing", () => {
    expect(() => validateTorpedoContract(SHIPPED_TORPEDO_CONTRACT)).not.toThrow();
  });

  it("fails closed on a mismatched policy id", () => {
    let err: BluewaveError | undefined;
    try {
      validateTorpedoContract({ ...SHIPPED_TORPEDO_CONTRACT, policyId: "x" });
    } catch (e) {
      err = e as BluewaveError;
    }
    expect(err).toBeDefined();
    expect(err!.context.code).toBe(TORPEDO_STATE_INVARIANT_FAILED);
  });

  it("fails closed on a tampered scale constant", () => {
    expect(() =>
      validateTorpedoContract({ ...SHIPPED_TORPEDO_CONTRACT, basisPointsPerUnit: 999 }),
    ).toThrow(BluewaveError);
  });

  it("fails closed on a tampered mount-type closed enum (sixth value)", () => {
    expect(() =>
      validateTorpedoContract({
        ...SHIPPED_TORPEDO_CONTRACT,
        mountTypes: [...TORPEDO_MOUNT_TYPES, "SURFACE_TRAINABLE"],
      } as Partial<typeof SHIPPED_TORPEDO_CONTRACT>),
    ).toThrow(BluewaveError);
  });

  it("fails closed on a tampered §7 underwater-tube speed limit", () => {
    expect(() =>
      validateTorpedoContract({ ...SHIPPED_TORPEDO_CONTRACT, underwaterTubeMaxSpeedUmS: 1 }),
    ).toThrow(BluewaveError);
  });

  it("fails closed on a tampered §23 oxygen constant", () => {
    expect(() =>
      validateTorpedoContract({ ...SHIPPED_TORPEDO_CONTRACT, oxygenRangeMultiplierBp: 9_999 }),
    ).toThrow(BluewaveError);
  });

  it("fails closed on a tampered shipped-model-id list", () => {
    expect(() =>
      validateTorpedoContract({ ...SHIPPED_TORPEDO_CONTRACT, shippedModelIds: [] }),
    ).toThrow(BluewaveError);
  });

  it("fails closed on a null/missing contract", () => {
    expect(() => validateTorpedoContract(null)).toThrow(BluewaveError);
    expect(() => validateTorpedoContract(undefined)).toThrow(BluewaveError);
  });
});

describe("AC-24: exact shipped constant surface", () => {
  it("ships the closed §2 mount-type enum with exactly five values", () => {
    expect([...TORPEDO_MOUNT_TYPES]).toEqual([
      "ABOVE_WATER_FIXED",
      "ABOVE_WATER_TRAINABLE",
      "UNDERWATER_FIXED",
      "UNDERWATER_TRAINABLE",
      "SUBMARINE_INTERNAL",
    ]);
  });

  it("ships the exact §7 underwater-tube threshold (25 kn = 12_861_100 µm/s)", () => {
    expect(UNDERWATER_TUBE_MAX_SPEED_KNOTS).toBe(25);
    expect(UNDERWATER_TUBE_MAX_SPEED_UM_S).toBe(12_861_100);
    expect(torpedoSpeedBpKnotsToUmS(25_000)).toBe(12_861_100);
  });

  it("ships the exact §8 above-water defaults (fixed 30 kn / trainable 35 kn)", () => {
    expect(ABOVE_WATER_FIXED_MAX_LAUNCH_SPEED_KNOTS).toBe(30);
    expect(ABOVE_WATER_TRAINABLE_MAX_LAUNCH_SPEED_KNOTS).toBe(35);
  });

  it("resolvedAboveWaterMaxLaunchSpeedKnots applies defaults and a narrower declared value", () => {
    const fixed: TorpedoLauncherDefinition = {
      launcherFamilyId: "f",
      mountType: "ABOVE_WATER_FIXED",
      tubeCount: 2,
      boreDiameterMm: 533,
      handlingMassLimitKg: 1_600,
      supportedPropulsionTypes: ["WET_HEATER"],
      fireControlSupportedGuidance: ["gyro"],
      underwaterLaunchCapability: false,
      requiredReloadTimeMs: 120_000,
      aboveWaterMaxLaunchSpeedKnots: null,
    };
    const trainable = {
      ...fixed,
      launcherFamilyId: "t",
      mountType: "ABOVE_WATER_TRAINABLE" as const,
    };
    const narrower = { ...fixed, launcherFamilyId: "n", aboveWaterMaxLaunchSpeedKnots: 28 };
    const underwater = { ...fixed, launcherFamilyId: "u", mountType: "UNDERWATER_FIXED" as const };
    expect(resolvedAboveWaterMaxLaunchSpeedKnots(fixed)).toBe(30);
    expect(resolvedAboveWaterMaxLaunchSpeedKnots(trainable)).toBe(35);
    expect(resolvedAboveWaterMaxLaunchSpeedKnots(narrower)).toBe(28);
    expect(resolvedAboveWaterMaxLaunchSpeedKnots(underwater)).toBeNull(); // §7 governs
  });

  it("validateTorpedoLauncherDefinition rejects an invalid definition", () => {
    expect(() =>
      validateTorpedoLauncherDefinition({
        launcherFamilyId: "",
        mountType: "UNDERWATER_TRAINABLE",
        tubeCount: 4,
        boreDiameterMm: 533,
        handlingMassLimitKg: 1_600,
        supportedPropulsionTypes: ["WET_HEATER"],
        fireControlSupportedGuidance: ["gyro"],
        underwaterLaunchCapability: true,
        requiredReloadTimeMs: 120_000,
        aboveWaterMaxLaunchSpeedKnots: null,
      }),
    ).toThrow(BluewaveError);
  });

  it("ships the grounded seed model set under torpedo_models_v1 with deterministic hashes", () => {
    expect(SHIPPED_TORPEDO_CONTRACT.shippedModelIds).toEqual(
      SHIPPED_TORPEDO_MODELS.map((m) => m.torpedoModelId),
    );
    for (const model of SHIPPED_TORPEDO_MODELS) {
      expect(model.contentVersion).toBe(torpedoModelsContentVersion);
      expect(model.contentHash).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("speed conversion rejects non-integers and produces exact integers", () => {
    expect(torpedoSpeedBpKnotsToUmS(44_000)).toBe(22_635_536); // 44 kn (G7a high)
    expect(() => torpedoSpeedBpKnotsToUmS(44_000.5)).toThrow(BluewaveError);
    expect(() => torpedoSpeedBpKnotsToUmS(0)).toThrow(BluewaveError);
  });
});

describe("AC-21 seeds: INC-1 reason-code catalog shape", () => {
  it("ships exactly the five INC-1 §29 codes — nothing more, nothing less", () => {
    const shipped = Object.values(TORPEDO_REASON_CODES).sort();
    expect(shipped).toEqual(
      [
        "INVALID_TORPEDO_MODEL_DEFINITION",
        "INVALID_TORPEDO_LAUNCHER_STATE",
        "TORPEDO_MODEL_INCOMPATIBLE",
        "TORPEDO_AMMUNITION_UNAVAILABLE",
        "TORPEDO_STATE_INVARIANT_FAILED",
      ].sort(),
    );
  });

  it("every shipped code is a non-empty string literal (no duplicates)", () => {
    const values = Object.values(TORPEDO_REASON_CODES) as readonly string[];
    for (const code of values) {
      expect(typeof code).toBe("string");
      expect(code.length).toBeGreaterThan(0);
    }
    expect(new Set(values).size).toBe(values.length);
  });

  it("is disjoint from the top-level combat catalog (no redefinition)", () => {
    const torpedoSet = new Set(Object.values(TORPEDO_REASON_CODES) as readonly string[]);
    const sharedSet: ReadonlySet<string> = new Set(Object.values(REASON_CODES));
    for (const code of torpedoSet) {
      expect(sharedSet.has(code)).toBe(false);
    }
  });

  it("does NOT ship §29 codes owned by later increments (INC-2+ own the rest)", () => {
    const shipped: ReadonlySet<string> = new Set(Object.values(TORPEDO_REASON_CODES));
    const laterIncrementCodes = [
      "TORPEDO_MANUAL_LAUNCH_MODE_PROHIBITED",
      "TORPEDO_LAUNCH_AUTHORITY_DENIED",
      "TORPEDO_TARGET_CONTACT_INSUFFICIENT",
      "TORPEDO_FIRE_SOLUTION_INSUFFICIENT",
      "TORPEDO_LAUNCH_ARC_INVALID",
      "TORPEDO_LAUNCH_SPEED_LIMIT_MISSING",
      "UNDERWATER_TUBE_SPEED_LIMIT_EXCEEDED",
      "TORPEDO_FRIENDLY_FIRE_RISK_PROHIBITED",
      "TORPEDO_LAUNCH_FAILURE",
      "TORPEDO_DUD",
      "TORPEDO_HIT_RESOLVED",
      "TORPEDO_PROGRESSIVE_FLOODING_CREATED",
      "TORPEDO_MACHINERY_DAMAGE_CREATED",
      "TORPEDO_SYSTEM_SHOCK_DAMAGE_CREATED",
      "UNDERWATER_TUBE_SEVERE_FLOODING",
      "TORPEDO_CHAIN_REACTION",
      "TORPEDO_ELIGIBILITY_PREDICATE_DEFERRED",
      "TORPEDO_FIRE_SOLUTION_FACTOR_MISSING",
    ];
    for (const code of laterIncrementCodes) {
      expect(shipped.has(code)).toBe(false);
    }
    // and the INC-1 codes themselves are present
    expect(shipped.has("INVALID_TORPEDO_MODEL_DEFINITION")).toBe(true);
    expect(shipped.has(INVALID_TORPEDO_MODEL_DEFINITION)).toBe(true);
    expect(shipped.has("TORPEDO_STATE_INVARIANT_FAILED")).toBe(true);
    expect(TORPEDO_STATE_INVARIANT_FAILED).toBe("TORPEDO_STATE_INVARIANT_FAILED");
  });

  it("OXYGEN_RANGE_MULTIPLIER_BP pins the shipped §23 value", () => {
    expect(OXYGEN_RANGE_MULTIPLIER_BP).toBe(15_000);
  });
});
