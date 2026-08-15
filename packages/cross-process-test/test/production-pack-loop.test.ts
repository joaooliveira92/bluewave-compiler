import { describe, it, expect } from "vite-plus/test";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SafeInt } from "@bluewave/contracts";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import { CampaignCompiler } from "@bluewave/campaign/compiler";
import type { CampaignState, CampaignSnapshot, NationState } from "@bluewave/campaign";
import type { CommandEnvelope, BudgetProjectCommand } from "@bluewave/commands";
import { SaveStore } from "@bluewave/persistence";
import { MonthExecutor, ReplayVerifier } from "@bluewave/phase-engine";
import { mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

// Ticket 05 (.scratch/desktop-mvp/issues/05-verify-full-loop-against-production-pack.md):
// no existing test compiled content/production/1880 and then advanced a
// strategic month / saved / loaded it -- packages/cross-process-test/src/run-child.ts
// exercises exactly that loop (compile -> MonthExecutor -> SaveStore ->
// replay) but only against a synthetic inline 2-nation fixture. This test
// runs the same loop directly against the canonical production pack.

// Mirrors ReplayVerifier's internal `snapshotToHashable`/`hashSnapshot`
// (packages/phase-engine/src/replay.ts, not exported) and run-child.ts's own
// copy of the same shape: ReplayVerifier.verify() compares its replayed
// snapshot hash against this exact subset-hash, not a full canonicalSerialize
// of the raw snapshot.
function snapshotToHashable(snapshot: CampaignSnapshot): unknown {
  const nations: Record<string, NationState> = {};
  for (const [id, nation] of snapshot.nations) {
    nations[id] = nation;
  }
  return {
    version: snapshot.version,
    turnNumber: snapshot.turnNumber,
    campaignId: snapshot.campaignId,
    slots: snapshot.slots.map((s) => ({ ...s })),
    world: {
      areas: snapshot.world.areas.map((a) => ({ ...a })),
      routes: snapshot.world.routes.map((r) => ({ ...r })),
      ports: snapshot.world.ports.map((p) => ({ ...p })),
    },
    nations,
    wars: {
      wars: snapshot.wars.wars.map((w) => ({ ...w })),
      battles: snapshot.wars.battles.map((b) => ({ ...b })),
      participantMemberships: snapshot.wars.participantMemberships.map((m) => ({ ...m })),
      blockadeState: snapshot.wars.blockadeState.map((b) => ({ ...b })),
      battleManifests: (snapshot.wars.battleManifests ?? []).map((m) => ({ ...m })),
    },
    politics: {
      relations: snapshot.politics.relations.map((r) => ({ ...r })),
      shells: { ...snapshot.politics.shells },
    },
    intelligence: {
      shells: { ...snapshot.intelligence.shells },
    },
    rulesetVersion: snapshot.rulesetVersion,
    compatibilityVersion: snapshot.compatibilityVersion,
  };
}

function hashSnapshot(snapshot: CampaignSnapshot): string {
  return sha256Hex(canonicalSerialize(snapshotToHashable(snapshot)));
}

const thisDir = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(thisDir, "..", "..", "..");
const PRODUCTION_PACK = resolve(REPO_ROOT, "content", "production", "1880");

function compileProductionPack(): { state: CampaignState; contentHash: string } {
  const pack = JSON.parse(readFileSync(resolve(PRODUCTION_PACK, "pack.json"), "utf8")) as {
    files?: Record<string, string[]>;
  };
  const files = pack.files ?? {};

  const compiler = new CampaignCompiler();
  const collector = new DiagnosticCollector();
  const signal = new AbortController().signal;

  const output = compiler.compile(
    {
      compilerInput: {
        manifestPath: resolve(PRODUCTION_PACK, "pack.json"),
        contentDir: PRODUCTION_PACK,
        rulesetFiles: (files.rulesets ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
        countryFiles: (files.countries ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
        areaFiles: (files.areas ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
        routeFiles: (files.routes ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
        possessionFiles: (files.possessions ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
        portFiles: (files.ports ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
        technologyFiles: (files.technologies ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
      },
      campaignFiles: {
        fleetFiles: (files.fleets ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
        economyFiles: (files.economies ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
        constructionFiles: (files.constructions ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
        diplomacyFiles: (files.diplomacy ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
        researchFiles: (files.research ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
        designFiles: (files.designs ?? []).map((f) => resolve(PRODUCTION_PACK, f)),
      },
      rulesetVersion: "1.0",
      compatibilityVersion: "1.0.0",
    },
    signal,
    collector,
  );

  if (!output || collector.hasErrors) {
    throw new Error(
      `Production pack compilation failed: ${collector.all.map((d) => d.message).join("; ")}`,
    );
  }
  return { state: output.state, contentHash: output.contentHash };
}

function makeBudgetCommand(
  snapshotHash: string,
  nationId: string,
  projectId: string,
  budget: SafeInt,
): CommandEnvelope<BudgetProjectCommand> {
  return {
    commandId: `cmd-${projectId}-${String(budget)}`,
    version: "0.1.0",
    expectedSnapshotHash: snapshotHash,
    idempotencyKey: `ik-${projectId}-${String(budget)}`,
    timestamp: "production-pack-loop-test",
    body: { type: "budget_project", nationId, projectId, budget },
  };
}

describe("production pack (content/production/1880) full loop", () => {
  it("compiles, advances a strategic month, saves, loads, and replays deterministically", () => {
    // Step 1: compile the canonical production pack (not a synthetic fixture).
    const { state: campaignState, contentHash: contentArtifactHash } = compileProductionPack();
    const snapshot = campaignState.snapshot;

    expect(contentArtifactHash).toBeDefined();
    expect(snapshot.nations.size).toBe(14);

    // Step 2: advance one strategic month, issuing a real command against a
    // real in-progress construction project authored in the pack
    // (con_gbr_inflexible, nationId uk; content/production/1880/constructions.yaml).
    const executor = new MonthExecutor();
    const snapshotHash = sha256Hex(canonicalSerialize(snapshot));
    const cmd = makeBudgetCommand(snapshotHash, "uk", "con_gbr_inflexible", SafeInt(50));
    const collector = new DiagnosticCollector();
    const monthResult = executor.execute(snapshot, [cmd], "production-pack-loop-seed", collector);

    expect(monthResult.success).toBe(true);

    // Step 3: save the post-month state.
    const saveDir = resolve(
      tmpdir(),
      `bw-prod-pack-save-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(saveDir, { recursive: true });

    try {
      const store = new SaveStore();
      const { rawHash: _rh, ...stateForSave } = campaignState;
      const saveableState: CampaignState = {
        ...campaignState,
        rawHash: sha256Hex(canonicalSerialize(stateForSave)),
      };
      store.save(saveableState, saveDir);

      // Step 4: load it back.
      const loadDiag = new DiagnosticCollector();
      const loaded = store.load(saveDir, loadDiag);

      expect(loadDiag.hasErrors).toBe(false);
      expect(loaded).not.toBeNull();
      if (loaded) {
        expect(loaded.snapshot.nations.size).toBe(snapshot.nations.size);
        expect(loaded.snapshot.campaignId).toBe(snapshot.campaignId);
      }

      // Step 5: replay the same command against the pre-month snapshot and
      // confirm it reproduces the same closing state deterministically.
      const replayVerifier = new ReplayVerifier();
      const closingSnapshotHash = hashSnapshot(monthResult.finalSnapshot);
      const replayResult = replayVerifier.verify(
        snapshot,
        [cmd],
        monthResult.commandLedger,
        closingSnapshotHash,
        "production-pack-loop-seed",
        collector,
      );

      expect(replayResult.match).toBe(true);
    } finally {
      rmSync(saveDir, { recursive: true, force: true });
    }
  });
});
