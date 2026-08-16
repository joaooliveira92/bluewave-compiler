// AC-1: TorpedoModelDefinition (DESIGN-40 §1). Every field is required; a
// missing or invalid field fails with INVALID_TORPEDO_MODEL_DEFINITION. The
// definition carries a content version + a deterministic content hash (canonical
// serializer + SHA-256 envelope — no ambient randomness).
import { describe, expect, it } from "vite-plus/test";
import { BluewaveError } from "@bluewave/contracts";
import {
  INVALID_TORPEDO_MODEL_DEFINITION,
  SHIPPED_TORPEDO_MODELS,
  torpedoModelById,
  torpedoModelsContentVersion,
  type TorpedoModelDefinition,
  validateTorpedoModelDefinition,
  verifyTorpedoModelContentHash,
  withTorpedoModelContentHash,
} from "../../src/torpedoes/index.js";

// A valid, hash-computed model surface derived from the shipped G7a seed; tests
// then tamper individual fields to prove the fail-closed guard. NOTE: building a
// tampered model throws the same INVALID_TORPEDO_MODEL_DEFINITION from
// withTorpedoModelContentHash (surface guard) — expectInvalid takes a THUNK so
// that throw is caught and asserted here, not reported as an uncaught failure.
function validModel(overrides: Partial<TorpedoModelDefinition> = {}): TorpedoModelDefinition {
  const g7a = torpedoModelById("ger_533mm_g7a_1934");
  const { contentHash: _ignored, ...surface } = g7a;
  return withTorpedoModelContentHash({ ...surface, ...overrides });
}

function brokenModel(mutate: (m: Record<string, unknown>) => void): TorpedoModelDefinition {
  const m = validModel() as unknown as Record<string, unknown>;
  mutate(m);
  return m as unknown as TorpedoModelDefinition;
}

function expectInvalid(build: () => TorpedoModelDefinition, field: string): BluewaveError {
  let err: BluewaveError | undefined;
  try {
    validateTorpedoModelDefinition(build());
  } catch (e) {
    err = e as BluewaveError;
  }
  expect(err).toBeDefined();
  expect(err!.message).toBe(INVALID_TORPEDO_MODEL_DEFINITION);
  expect(err!.context.field).toBe(field);
  return err!;
}

describe("AC-1: TorpedoModelDefinition accepts every fully-specified model", () => {
  it("every shipped seed model validates and carries content version + hash", () => {
    for (const model of SHIPPED_TORPEDO_MODELS) {
      expect(() => validateTorpedoModelDefinition(model)).not.toThrow();
      expect(model.contentVersion).toBe(torpedoModelsContentVersion);
      expect(model.contentHash).toMatch(/^[0-9a-f]{64}$/);
      expect(verifyTorpedoModelContentHash(model)).toBe(true);
    }
  });

  it("ships a grounded seed set covering every propulsion type and era band", () => {
    const ids = SHIPPED_TORPEDO_MODELS.map((m) => m.torpedoModelId).sort();
    expect(ids).toEqual(
      [
        "whitehead_18in_1894",
        "rn_21in_mk_iv_1916",
        "ger_533mm_g7a_1934",
        "ger_533mm_g7e_1936",
        "jpn_61cm_type93_1935",
      ].sort(),
    );
    const propulsion = new Set(SHIPPED_TORPEDO_MODELS.map((m) => m.propulsionType));
    expect(propulsion.has("COMPRESSED_AIR")).toBe(true);
    expect(propulsion.has("WET_HEATER")).toBe(true);
    expect(propulsion.has("ELECTRIC")).toBe(true);
    expect(propulsion.has("OXYGEN")).toBe(true);
  });

  it("content hash is deterministic: identical content -> identical hash", () => {
    const a = validModel();
    const b = validModel();
    expect(a.contentHash).toBe(b.contentHash);
    expect(a.contentHash.length).toBe(64);
  });

  it("content hash changes when a field changes and verification fails on tamper", () => {
    const a = validModel();
    const b = validModel({ massKg: a.massKg + 1 });
    expect(b.contentHash).not.toBe(a.contentHash);
    const tampered = { ...a, massKg: a.massKg + 1 } as TorpedoModelDefinition;
    expect(verifyTorpedoModelContentHash(tampered)).toBe(false);
  });
});

describe("AC-1: missing or invalid fields fail with INVALID_TORPEDO_MODEL_DEFINITION", () => {
  it("rejects a missing torpedoModelId", () => {
    expectInvalid(() => brokenModel((m) => delete m.torpedoModelId), "torpedoModelId");
  });

  it("rejects missing/empty ownerNationIds", () => {
    expectInvalid(() => brokenModel((m) => delete m.ownerNationIds), "ownerNationIds");
    expectInvalid(() => validModel({ ownerNationIds: [] }), "ownerNationIds");
  });

  it("rejects a missing productionRequirementId", () => {
    expectInvalid(() => brokenModel((m) => delete m.productionRequirementId), "productionRequirementId");
  });

  it("rejects a non-integer or non-positive diameterMm", () => {
    expectInvalid(() => validModel({ diameterMm: 457.5 }), "diameterMm");
    expectInvalid(() => validModel({ diameterMm: 0 }), "diameterMm");
  });

  it("rejects a non-integer or non-positive massKg", () => {
    expectInvalid(() => validModel({ massKg: 1_528.5 }), "massKg");
    expectInvalid(() => validModel({ massKg: -1 }), "massKg");
  });

  it("rejects an unknown warhead type", () => {
    expectInvalid(
      () => validModel({ warheadType: "NUCLEAR" } as unknown as Partial<TorpedoModelDefinition>),
      "warheadType",
    );
  });

  it("rejects an unknown propulsion type", () => {
    expectInvalid(
      () => validModel({ propulsionType: "STEAM" } as unknown as Partial<TorpedoModelDefinition>),
      "propulsionType",
    );
  });

  it("rejects empty orderedSettings and a non-integer setting speed", () => {
    expectInvalid(() => validModel({ orderedSettings: [] }), "orderedSettings");
    expectInvalid(
      () =>
        validModel({
          orderedSettings: [{ settingId: "x", speedKnotsBp: 44_000.5, rangeM: 6_000 }],
        }),
      "orderedSettings[0].speedKnotsBp",
    );
    expectInvalid(
      () =>
        validModel({
          orderedSettings: [{ settingId: "x", speedKnotsBp: 44_000, rangeM: 0 }],
        }),
      "orderedSettings[0].rangeM",
    );
  });

  it("rejects a negative minimum arming distance", () => {
    expectInvalid(() => validModel({ minimumArmingDistanceM: -1 }), "minimumArmingDistanceM");
  });

  it("rejects reliabilityBp outside [0, TORPEDO_RELIABILITY_SCALE]", () => {
    expectInvalid(() => validModel({ reliabilityBp: 100_001 }), "reliabilityBp");
    expectInvalid(() => validModel({ reliabilityBp: -1 }), "reliabilityBp");
  });

  it("rejects empty compatibleLauncherFamilyIds", () => {
    expectInvalid(() => validModel({ compatibleLauncherFamilyIds: [] }), "compatibleLauncherFamilyIds");
  });

  it("rejects an OXYGEN model without its §23 oxygen state", () => {
    expectInvalid(() => validModel({ propulsionType: "OXYGEN", oxygenState: null }), "oxygenState");
  });

  it("rejects a non-OXYGEN model that carries an oxygen state", () => {
    expectInvalid(
      () =>
        validModel({
          oxygenState: {
            oxygenRangeMultiplierBp: 15_000,
            oxygenSpeedMultiplierBp: 11_000,
            oxygenWakeDetectionMultiplierBp: 7_500,
            tubeHitSevereFloodingMultiplierBp: 15_000,
            chainReactionBaseBp: 3_000,
            wakeVisibilityModifierBp: 2_500,
          },
        }),
      "oxygenState",
    );
  });

  it("rejects an oxygen state with a tampered shipped §23 constant", () => {
    expectInvalid(
      () =>
        validModel({
          propulsionType: "OXYGEN",
          oxygenState: {
            oxygenRangeMultiplierBp: 9_999,
            oxygenSpeedMultiplierBp: 11_000,
            oxygenWakeDetectionMultiplierBp: 7_500,
            tubeHitSevereFloodingMultiplierBp: 15_000,
            chainReactionBaseBp: 3_000,
            wakeVisibilityModifierBp: 2_500,
          },
        }),
      "oxygenState.oxygenRangeMultiplierBp",
    );
  });

  it("rejects an unknown tube-hit-hazard policy", () => {
    expectInvalid(
      () => validModel({ tubeHitHazardPolicyId: "RADIOACTIVE" } as unknown as Partial<TorpedoModelDefinition>),
      "tubeHitHazardPolicyId",
    );
  });

  it("rejects a missing contentVersion and a missing contentHash", () => {
    expectInvalid(() => brokenModel((m) => delete m.contentVersion), "contentVersion");
    expectInvalid(() => brokenModel((m) => delete m.contentHash), "contentHash");
  });
});

describe("AC-1: fail-closed model lookup", () => {
  it("torpedoModelById resolves every shipped model", () => {
    for (const model of SHIPPED_TORPEDO_MODELS) {
      expect(torpedoModelById(model.torpedoModelId).torpedoModelId).toBe(model.torpedoModelId);
    }
  });

  it("torpedoModelById fails with INVALID_TORPEDO_MODEL_DEFINITION on an unknown id (never a silent default)", () => {
    let err: BluewaveError | undefined;
    try {
      torpedoModelById("ger_533mm_g7a_2040");
    } catch (e) {
      err = e as BluewaveError;
    }
    expect(err).toBeDefined();
    expect(err!.message).toBe(INVALID_TORPEDO_MODEL_DEFINITION);
  });
});