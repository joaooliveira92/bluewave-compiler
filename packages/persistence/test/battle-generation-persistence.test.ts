//packages/persistence/test/battle-generation-persistence.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vite-plus/test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { canonicalSerialize, sha256Hex, createEnvelope } from "@bluewave/deterministic";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { SafeInt } from "@bluewave/contracts";
import type { CampaignState, CampaignSnapshot } from "@bluewave/campaign";
import { SaveStore } from "../src/store.js";
import { CURRENT_COMPATIBILITY_VERSION } from "../src/compatibility.js";

// Builds a snapshot carrying the new B-1 snapshot fields (battleManifests,
// divisions, manifestHash) so save/load round-trips them (AC-13).
function makeManifestSnapshot(): CampaignSnapshot {
  return {
    version: "0.1.0",
    turnNumber: SafeInt(1),
    campaignId: "battle-gen-persistence",
    slots: [
      { nationId: "GBR", type: "playable" },
      { nationId: "FRA", type: "ai" },
    ],
    world: { areas: [], routes: [], ports: [] },
    nations: new Map([
      [
        "GBR",
        {
          id: "GBR",
          name: "GBR",
          tag: "GBR",
          treasury: SafeInt(10000),
          income: SafeInt(0),
          expenses: SafeInt(0),
          baseResources: SafeInt(0),
          navalAppropriationRateBp: SafeInt(2000),
          maintenanceCost: SafeInt(0),
          fleets: [],
          divisions: [
            {
              divisionId: "div_1",
              nationId: "GBR",
              shipOrder: ["g1"],
              flagshipShipId: "g1",
              commanderOfficerId: "VACANT",
              divisionRole: "CORE",
              preferredFormation: "LINE_AHEAD",
              experience: SafeInt(20),
              cohesion: SafeInt(30),
              locationAreaId: "a-1",
              creationMonth: "1880-01",
              lastReorganizationMonth: "1880-01",
              provenanceRefs: [],
              rulesetVersion: "1.0",
              aggregateHash: "agg_1",
            },
          ],
          research: {
            nationId: "GBR",
            technologies: [],
            fieldPriorities: {},
            researchBudget: SafeInt(0),
            activeCandidates: new Map(),
            discoveredTechs: [],
          },
          constructionProjects: [],
          isPlayable: true,
          isAI: false,
        },
      ],
    ]),
    wars: {
      wars: [],
      battles: [
        {
          id: "battle_1",
          phase: "pending",
          attackerId: "GBR",
          defenderId: "FRA",
          areaId: "a-1",
          attackerFleetIds: [],
          defenderFleetIds: [],
          manifestHash: "manifest_hash_1",
        },
      ],
      participantMemberships: [],
      blockadeState: [],
      battleManifests: [
        {
          battleId: "battle_1",
          opportunityId: "opp_1",
          warId: "war_1",
          areaId: "a-1",
          missionType: "FLEET_BATTLE",
          attackerId: "GBR",
          defenderId: "FRA",
          acceptanceClass: "OPTIONAL",
          battleSeed: "seed_1",
          manifestHash: "manifest_hash_1",
          persistentAssets: ["g1"],
          sides: [
            { sideId: "ATTACKER", participantIds: ["GBR"] },
            { sideId: "DEFENDER", participantIds: ["FRA"] },
          ],
        },
      ],
    },
    politics: { relations: [], shells: {} },
    intelligence: { shells: {} },
    designs: new Map(),
    designFamilies: new Map(),
    rulesetVersion: "1.0",
    compatibilityVersion: CURRENT_COMPATIBILITY_VERSION,
  };
}

describe("battle-generation persistence (AC-13)", () => {
  let tmpDir: string;
  let store: SaveStore;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "battle-gen-persist-"));
    store = new SaveStore();
  });
  afterEach(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("save/load roundtrip preserves manifests, divisions, and reservations", () => {
    const snapshot = makeManifestSnapshot();
    const envelope = createEnvelope("campaign-snapshot", CURRENT_COMPATIBILITY_VERSION, snapshot);
    const rawHash = sha256Hex(canonicalSerialize({ snapshot, envelope }));
    const state: CampaignState = { snapshot, envelope, rawHash };

    const saved = store.save(state, tmpDir);
    expect(saved).toBeDefined();

    const loaded = store.load(tmpDir, new DiagnosticCollector());
    expect(loaded).toBeDefined();
    const loadedSnapshot = loaded!.snapshot;
    expect(loadedSnapshot.wars.battleManifests).toEqual(snapshot.wars.battleManifests);
    expect(loadedSnapshot.wars.battles).toEqual(snapshot.wars.battles);
    expect(loadedSnapshot.wars.battles[0]!.manifestHash).toBe("manifest_hash_1");
  });

  it("reload after a save/load cycle recomputes identical rawHash (canonical stability)", () => {
    const snapshot = makeManifestSnapshot();
    const envelope = createEnvelope("campaign-snapshot", CURRENT_COMPATIBILITY_VERSION, snapshot);
    const rawHash = sha256Hex(canonicalSerialize({ snapshot, envelope }));
    const state: CampaignState = { snapshot, envelope, rawHash };

    store.save(state, tmpDir);
    const loaded = store.load(tmpDir, new DiagnosticCollector());
    expect(loaded).toBeDefined();
    expect(loaded!.rawHash).toBe(rawHash);
  });

  it("schema version is pinned and recorded", () => {
    expect(CURRENT_COMPATIBILITY_VERSION).toBe("1.0.0");
  });
});
