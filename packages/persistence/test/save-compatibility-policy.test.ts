// Save-compatibility policy (release-readiness ticket 03 / ADR-0113): the
// first release rejects a save whose compatibility version is not the locked
// release constant, with the stable `PERSISTENCE_COMPATIBILITY_MISMATCH`
// diagnostic rather than a generic corruption code. The round-trip here is the
// seed of the per-version fixture corpus: a future bump must keep loading every
// released version's snapshot.

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { CampaignSnapshot, CampaignState } from "@bluewave/campaign";
import { SafeInt } from "@bluewave/contracts";
import { canonicalSerialize, createEnvelope, sha256Hex } from "@bluewave/deterministic";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import {
  COMPATIBILITY_MISMATCH_CODE,
  CURRENT_COMPATIBILITY_VERSION,
} from "../src/compatibility.js";
import { CORRUPT_SAVE_CODE } from "../src/errors.js";
import { SaveStore } from "../src/store.js";

function createFixtureState(): CampaignState {
  const snapshot: CampaignSnapshot = {
    version: "1.0.0",
    turnNumber: SafeInt.ONE,
    campaignId: "save-compat-fixture",
    startYear: 1880,
    startMonth: 1,
    strategicWeather: [],
    slots: [{ nationId: "nation-a", type: "playable" }],
    world: {
      areas: [{ id: "area-1", name: "Test Area", type: "sea" }],
      routes: [],
      ports: [],
    },
    nations: new Map(),
    wars: {
      wars: [],
      battles: [],
      participantMemberships: [],
      blockadeState: [],
      battleManifests: [],
    },
    politics: { relations: [], shells: {} },
    intelligence: { shells: {} },
    designs: new Map(),
    designFamilies: new Map(),
    rulesetVersion: "1.0.0",
    compatibilityVersion: CURRENT_COMPATIBILITY_VERSION,
  };

  const envelope = createEnvelope("campaign-snapshot", CURRENT_COMPATIBILITY_VERSION, snapshot);
  const rawHash = sha256Hex(canonicalSerialize({ snapshot, envelope }));

  return { snapshot, envelope, rawHash };
}

describe("save-compatibility policy (ADR-0113)", () => {
  let tmpDir: string;
  let store: SaveStore;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "save-compat-policy-"));
    store = new SaveStore();
  });

  afterEach(() => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  });

  it("locks CURRENT_COMPATIBILITY_VERSION to the first-release constant", () => {
    // The first public release pins the v1 format. A deliberate bump (see
    // ADR-0113) must update this test, add a per-version fixture and register a
    // migration or a documented rejection — never edit the constant silently.
    expect(CURRENT_COMPATIBILITY_VERSION).toBe("1.1.0");
  });

  it("round-trips a snapshot saved at the current compatibility version", () => {
    const state = createFixtureState();
    store.save(state, tmpDir);

    const diagnostics = new DiagnosticCollector();
    const loaded = store.load(tmpDir, diagnostics);

    expect(diagnostics.hasErrors).toBe(false);
    expect(loaded).not.toBeNull();
    if (!loaded) return;
    expect(loaded.snapshot.compatibilityVersion).toBe(CURRENT_COMPATIBILITY_VERSION);
    expect(loaded.rawHash).toBe(state.rawHash);
    expect(loaded.envelope.bodyHash).toBe(state.envelope.bodyHash);
  });

  it("rejects a save stored with a prior compatibility version using the stable mismatch code", () => {
    const state = createFixtureState();
    store.save(state, tmpDir);

    // Mutate ONLY the stored compatibility version to a prior release. The
    // minimal header still decodes (it is a string), so the failure can only be
    // the stage-1 compatibility gate — not a generic corruption path. The
    // signature/rawHash are deliberately left stale: the compatibility check
    // runs before them, which is the point of the two-stage load.
    const saveId = store.getActiveSaveId(tmpDir);
    expect(saveId).not.toBeNull();
    const campaignPath = join(tmpDir, saveId!, "campaign.json");
    const parsed = JSON.parse(readFileSync(campaignPath, "utf8")) as {
      snapshot: { compatibilityVersion: string };
    };
    parsed.snapshot.compatibilityVersion = "1.0.0";
    writeFileSync(campaignPath, JSON.stringify(parsed), "utf8");

    const diagnostics = new DiagnosticCollector();
    const loaded = store.load(tmpDir, diagnostics);

    expect(loaded).toBeNull();
    expect(diagnostics.hasErrors).toBe(true);
    // Exactly the stable mismatch diagnostic, and NOT a generic corruption code
    // (ADR-0032 two-stage load / ADR-0113).
    expect(diagnostics.errors.map((d) => d.code)).toEqual([COMPATIBILITY_MISMATCH_CODE]);
    expect(diagnostics.errors.some((d) => d.code === CORRUPT_SAVE_CODE)).toBe(false);
    expect(diagnostics.errors[0]!.message).toContain('Save compatibility version "1.0.0"');
    expect(diagnostics.errors[0]!.message).toContain(CURRENT_COMPATIBILITY_VERSION);
    expect(diagnostics.errors[0]!.stage).toBe("persistence.load");
  });
});
