// AC-2: authoritative integer TorpedoLauncherState (DESIGN-40 §2) — closed
// mount-type enum with exactly five values, integer/fixed-point guards via
// assertFixedPointTorpedo (TORPEDO_STATE_INVARIANT_FAILED), structural rejection
// at the construction boundary (INVALID_TORPEDO_LAUNCHER_STATE), and an
// authoritative deterministic state hash.
import { describe, expect, it } from "vite-plus/test";
import { BluewaveError } from "@bluewave/contracts";
import {
  assertFixedPointTorpedo,
  computeTorpedoLauncherStateHash,
  createTorpedoLauncherState,
  EMPTY_TUBE,
  INVALID_TORPEDO_LAUNCHER_STATE,
  NO_RELOAD_IN_PROGRESS,
  TORPEDO_MOUNT_TYPES,
  TORPEDO_STATE_INVARIANT_FAILED,
  type TorpedoLauncherState,
  withTorpedoLauncherStateHash,
} from "../../src/torpedoes/index.js";

function baseLauncher(overrides: Partial<TorpedoLauncherState> = {}): TorpedoLauncherState {
  return {
    launcherId: "LCH-1",
    ownerPlatformId: "SHIP-ALPHA",
    launcherFamilyId: "533mm_underwater_trainable",
    mountPosition: "port_amidships",
    mountType: "UNDERWATER_TRAINABLE",
    tubeCount: 4,
    loadedPerTube: ["ger_533mm_g7a_1934", "ger_533mm_g7a_1934", EMPTY_TUBE, "ger_533mm_g7a_1934"],
    reserveAmmunition: { "ger_533mm_g7a_1934": 6, "jpn_61cm_type93_1935": 2 },
    reloadState: NO_RELOAD_IN_PROGRESS,
    trainingLimitsMdeg: { min: -45_000, max: 45_000 },
    underwaterLaunchCapability: true,
    fireControlConnectionState: "CONNECTED",
    damageState: "OPERATIONAL",
    floodingIsolationState: "INTACT",
    activeFireSolution: "SOL-1",
    rulesetVersion: "torpedo_ruleset_v1",
    formulaVersion: "torpedo_formula_v1",
    stateHash: "",
    ...overrides,
  };
}

function expectInvariant(s: TorpedoLauncherState, field: string): BluewaveError {
  let err: BluewaveError | undefined;
  try {
    assertFixedPointTorpedo(s);
  } catch (e) {
    err = e as BluewaveError;
  }
  expect(err).toBeDefined();
  expect(err!.message).toBe(TORPEDO_STATE_INVARIANT_FAILED);
  expect(err!.context.field).toBe(field);
  return err!;
}

describe("AC-2: closed mount-type enum (exactly the five DESIGN-40 §2 values)", () => {
  it("ships exactly ABOVE_WATER_FIXED / ABOVE_WATER_TRAINABLE / UNDERWATER_FIXED / UNDERWATER_TRAINABLE / SUBMARINE_INTERNAL", () => {
    expect([...TORPEDO_MOUNT_TYPES]).toEqual([
      "ABOVE_WATER_FIXED",
      "ABOVE_WATER_TRAINABLE",
      "UNDERWATER_FIXED",
      "UNDERWATER_TRAINABLE",
      "SUBMARINE_INTERNAL",
    ]);
  });

  it("rejects a sixth, non-canonical mount type", () => {
    expectInvariant(
      baseLauncher({ mountType: "SURFACE_TRAINABLE" } as unknown as Partial<TorpedoLauncherState>),
      "mountType",
    );
  });
});

describe("AC-2: assertFixedPointTorpedo invariant guard (TORPEDO_STATE_INVARIANT_FAILED)", () => {
  it("accepts a fully-valid TorpedoLauncherState", () => {
    expect(() => assertFixedPointTorpedo(baseLauncher())).not.toThrow();
  });

  it("rejects a missing launcherId", () => {
    expectInvariant(baseLauncher({ launcherId: "" }), "launcherId");
  });

  it("rejects a non-integer tube count", () => {
    expectInvariant(baseLauncher({ tubeCount: 4.5 } as Partial<TorpedoLauncherState>), "tubeCount");
  });

  it("rejects a zero tube count", () => {
    expectInvariant(baseLauncher({ tubeCount: 0 } as Partial<TorpedoLauncherState>), "tubeCount");
  });

  it("rejects loadedPerTube whose length mismatches tubeCount", () => {
    expectInvariant(
      baseLauncher({ loadedPerTube: ["ger_533mm_g7a_1934"] } as Partial<TorpedoLauncherState>),
      "loadedPerTube",
    );
  });

  it("accepts EMPTY entries and rejects empty-string / malformed loaded entries", () => {
    expect(() =>
      assertFixedPointTorpedo(
        baseLauncher({ loadedPerTube: [EMPTY_TUBE, "ger_533mm_g7a_1934", EMPTY_TUBE, "ger_533mm_g7a_1934"] }),
      ),
    ).not.toThrow();
    expectInvariant(
      baseLauncher({ loadedPerTube: ["", "ger_533mm_g7a_1934", EMPTY_TUBE, "ger_533mm_g7a_1934"] } as Partial<TorpedoLauncherState>),
      "loadedPerTube[0]",
    );
  });

  it("rejects non-integer or negative reserve counts", () => {
    expectInvariant(
      baseLauncher({
        reserveAmmunition: { "ger_533mm_g7a_1934": 6.5 },
      } as Partial<TorpedoLauncherState>),
      "reserveAmmunition[ger_533mm_g7a_1934]",
    );
    expectInvariant(
      baseLauncher({
        reserveAmmunition: { "ger_533mm_g7a_1934": -1 },
      } as Partial<TorpedoLauncherState>),
      "reserveAmmunition[ger_533mm_g7a_1934]",
    );
  });

  it("rejects a reload record with an out-of-range tube index", () => {
    expectInvariant(
      baseLauncher({
        reloadState: {
          status: "RELOAD_IN_PROGRESS",
          tubeIndex: 7,
          modelId: "ger_533mm_g7a_1934",
          requiredReloadTimeMs: 120_000,
          progressMs: 0,
        },
      }),
      "reloadState.tubeIndex",
    );
  });

  it("rejects reload progress beyond the required reload time", () => {
    expectInvariant(
      baseLauncher({
        reloadState: {
          status: "RELOAD_IN_PROGRESS",
          tubeIndex: 2,
          modelId: "ger_533mm_g7a_1934",
          requiredReloadTimeMs: 120_000,
          progressMs: 120_001,
        },
      }),
      "reloadState.progressMs",
    );
  });

  it("rejects a non-integer required reload time", () => {
    expectInvariant(
      baseLauncher({
        reloadState: {
          status: "RELOAD_IN_PROGRESS",
          tubeIndex: 2,
          modelId: "ger_533mm_g7a_1934",
          requiredReloadTimeMs: 120_000.5,
          progressMs: 0,
        },
      } as Partial<TorpedoLauncherState>),
      "reloadState.requiredReloadTimeMs",
    );
  });

  it("rejects training limits where min exceeds max", () => {
    expectInvariant(
      baseLauncher({ trainingLimitsMdeg: { min: 45_000, max: -45_000 } }),
      "trainingLimitsMdeg",
    );
  });

  it("rejects a non-boolean underwater-launch capability", () => {
    expectInvariant(
      baseLauncher({ underwaterLaunchCapability: "yes" } as unknown as Partial<TorpedoLauncherState>),
      "underwaterLaunchCapability",
    );
  });

  it("rejects non-canonical fire-control connection / damage / isolation states", () => {
    expectInvariant(
      baseLauncher({ fireControlConnectionState: "LINKED" } as unknown as Partial<TorpedoLauncherState>),
      "fireControlConnectionState",
    );
    expectInvariant(
      baseLauncher({ damageState: "SCRAPPED" } as unknown as Partial<TorpedoLauncherState>),
      "damageState",
    );
    expectInvariant(
      baseLauncher({ floodingIsolationState: "LEAKY" } as unknown as Partial<TorpedoLauncherState>),
      "floodingIsolationState",
    );
  });

  it("rejects an empty-string active fire solution", () => {
    expectInvariant(baseLauncher({ activeFireSolution: "" }), "activeFireSolution");
  });

  it("accepts the NONE fire-solution marker", () => {
    expect(() =>
      assertFixedPointTorpedo(baseLauncher({ activeFireSolution: "NONE" })),
    ).not.toThrow();
  });

  it("rejects missing ruleset/formula versions", () => {
    expectInvariant(baseLauncher({ rulesetVersion: "" }), "rulesetVersion");
    expectInvariant(baseLauncher({ formulaVersion: "" }), "formulaVersion");
  });
});

describe("AC-2: construction boundary (INVALID_TORPEDO_LAUNCHER_STATE) + state hash", () => {
  it("rejects a structurally-missing field with INVALID_TORPEDO_LAUNCHER_STATE", () => {
    let err: BluewaveError | undefined;
    try {
      const { launcherId: _omit, ...partial } = baseLauncher();
      void _omit;
      createTorpedoLauncherState(partial as unknown as Parameters<typeof createTorpedoLauncherState>[0]);
    } catch (e) {
      err = e as BluewaveError;
    }
    expect(err).toBeDefined();
    expect(err!.message).toBe(INVALID_TORPEDO_LAUNCHER_STATE);
    expect(err!.context.field).toBe("launcherId");
  });

  it("builds a fully-invariant state with a computed hash", () => {
    const built = createTorpedoLauncherState(baseLauncher());
    expect(built.stateHash).toMatch(/^[0-9a-f]{64}$/);
    expect(() => assertFixedPointTorpedo(built)).not.toThrow();
  });

  it("withTorpedoLauncherStateHash computes the authoritative hash", () => {
    const { stateHash: _omit, ...surface } = baseLauncher();
    void _omit;
    const full = withTorpedoLauncherStateHash(surface);
    expect(full.stateHash).toBe(computeTorpedoLauncherStateHash(full));
    expect(full.stateHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("the state hash is deterministic and depends on every state field", () => {
    const a = withTorpedoLauncherStateHash(baseLauncher());
    const b = withTorpedoLauncherStateHash(baseLauncher());
    expect(a.stateHash).toBe(b.stateHash);
    const c = withTorpedoLauncherStateHash(baseLauncher({ damageState: "DAMAGED" }));
    expect(c.stateHash).not.toBe(a.stateHash);
  });
});