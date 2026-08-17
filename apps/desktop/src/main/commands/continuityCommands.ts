import { randomUUID } from "node:crypto";
import { advanceMonth, getScenarioById, type CampaignSnapshot } from "@bluewave/campaign";
import type { NationState } from "@bluewave/campaign";
import { CommandLedger } from "@bluewave/commands";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { RecoveryManager, SaveStore, type SaveMetadata } from "@bluewave/persistence";
import { ReplayVerifier } from "@bluewave/phase-engine";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type {
  LoadCampaignResponse,
  RecoverCampaignResponse,
  ReplayCampaignResponse,
  ReplayedRevision,
  VerifyCampaignResponse,
} from "../../shared/continuity-contract.js";
import { registerCampaignSession } from "../campaignSessions.js";
import { readSessionMetadata } from "../campaignSessionMetadata.js";

/**
 * The four Campaign File continuance commands (desktop-mvp ticket 16),
 * wired for real through `@bluewave/persistence`'s `SaveStore` /
 * `CompatibilityChecker` / `RecoveryManager` and `@bluewave/phase-engine`'s
 * `ReplayVerifier` per the resolved New-Game & Continuity Contract
 * (`.scratch/desktop-mvp/issues/08-new-game-continuity-contract.md`).
 *
 * "Package" here = `SaveStore`'s save directory (not the retired `.bluewave`
 * content-authoring format in `main/project.ts`). All four commands take an
 * `undefined` payload on the IPC boundary — grounded in
 * `useCampaignFiles.ts`, which calls them payload-less — so the main process
 * prompts for the package directory itself via a native dialog (`ticket 08`:
 * "the main process handles file/package selection (a native dialog)"). Each
 * command therefore owns its own `choosePackageDirectory` dependency,
 * injected in tests exactly like `compileCampaign`'s `chooseSaveDirectory`.
 *
 * The renderer's Campaign File screen runs these from a fresh app start
 * (its Package Operations buttons are its initial screen), so NOTHING here
 * depends on an already-registered session — every command re-reads the
 * picked package from disk, and `loadCampaign` alone registers the session
 * the in-campaign screens then operate on.
 */

export interface ContinuityDeps {
  /**
   * Prompts for the package's save directory. Returns `null` if the user
   * cancels. Main-process-driven native dialog, same pattern as
   * `compileCampaign`'s `chooseSaveDirectory` (ticket 12).
   */
  readonly choosePackageDirectory: () => Promise<string | null>;
  readonly generateSessionId: () => string;
}

export const defaultContinuityDeps: ContinuityDeps = {
  generateSessionId: () => randomUUID(),
  choosePackageDirectory: async () => {
    const { dialog } = await import("electron");
    const result = await dialog.showOpenDialog({
      title: "Choose a campaign package",
      buttonLabel: "Open",
      properties: ["openDirectory"],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0]!;
  },
};

const PACKAGE_SELECTION_CANCELLED = "PACKAGE_SELECTION_CANCELLED";

function cancelled(): BridgeResult<never> {
  return { outcome: "rejected", reason: PACKAGE_SELECTION_CANCELLED, diagnostics: [] };
}

// ---------------------------------------------------------------------------
// loadCampaign
// ---------------------------------------------------------------------------

/**
 * `loadCampaign(undefined) -> LoadCampaignResponse` (ticket 08/16). Prompts
 * for a package save directory, loads it through `SaveStore.load` (rawHash +
 * envelope + `CompatibilityChecker` integrity all pass before anything is
 * returned), and registers a full `CampaignSessionRecord` — real state, not
 * a fresh/empty campaign.
 *
 * The record's fields a snapshot alone can't supply come from the package's
 * `session.json` sidecar (`main/campaignSessionMetadata.ts`, written by
 * `compileCampaign`): `playerSlotId`, `campaignSeed` (the deterministic
 * root for future `commitMonth` seeds), and `scenarioId` (whose canonical
 * start date + `turnNumber` months yields the current calendar month —
 * `commitMonth` advances exactly one calendar month per turn, so
 * month(start) + N turns == month at revision N, exactly).
 */
export async function loadCampaign(
  deps: ContinuityDeps,
): Promise<BridgeResult<LoadCampaignResponse>> {
  const saveDir = await deps.choosePackageDirectory();
  if (saveDir === null) return cancelled();

  const store = new SaveStore();
  const collector = new DiagnosticCollector();
  const state = store.load(saveDir, collector);
  if (!state) {
    return {
      outcome: "error",
      reason: "LOAD_FAILED",
      diagnostics: collector.all.map((d) => d.message),
    };
  }

  const metadata = readSessionMetadata(saveDir);
  if (!metadata) {
    return {
      outcome: "error",
      reason: "SESSION_METADATA_MISSING",
      diagnostics: [
        `${saveDir} is a valid package but has no readable session.json metadata. It cannot be restored — only packages written by the New Game flow carry the player slot, seed, and scenario needed to continue.`,
      ],
    };
  }

  if (!state.snapshot.nations.has(metadata.playerSlotId)) {
    return {
      outcome: "error",
      reason: "UNKNOWN_PLAYER_SLOT",
      diagnostics: [
        `Nation ${metadata.playerSlotId} (from session.json) does not exist in the package snapshot.`,
      ],
    };
  }

  const scenario = getScenarioById(metadata.scenarioId);
  if (!scenario) {
    return {
      outcome: "error",
      reason: "SESSION_METADATA_INVALID",
      diagnostics: [`Scenario ${metadata.scenarioId} is not a canonical scenario.`],
    };
  }

  const activeRevision = Number(state.snapshot.turnNumber);
  const month = advanceMonth(scenario.startYear, scenario.startMonth, activeRevision);

  const sessionId = deps.generateSessionId();
  registerCampaignSession({
    sessionId,
    saveDir,
    playerSlotId: metadata.playerSlotId,
    campaignSeed: metadata.campaignSeed,
    month,
    state,
  });

  return {
    outcome: "success",
    value: {
      sessionId,
      packagePath: saveDir,
      campaignIdentity: state.snapshot.campaignId,
      activeRevision,
    },
    diagnostics: [],
  };
}

// ---------------------------------------------------------------------------
// verifyCampaign
// ---------------------------------------------------------------------------

/**
 * `verifyCampaign(undefined) -> VerifyCampaignResponse` (ticket 08/16).
 * `SaveStore.load` performs exactly the fast, package-local integrity
 * checks ticket 08's answer names — rawHash recomputed over the whole
 * state, `verifyEnvelope` over `{envelope, snapshot}`, and
 * `CompatibilityChecker` over the pinned compatibility version — so verify
 * literally IS a `SaveStore.load` pass/fail. `issues` carries the load
 * diagnostics verbatim on failure. The claimed identity/revision fall back
 * to the package's `metadata.json` (written by `SaveStore`, not covered by
 * the state envelope) when the state itself fails integrity, so a corrupt
 * package's verify report is still identifiable.
 */
export async function verifyCampaign(
  deps: ContinuityDeps,
): Promise<BridgeResult<VerifyCampaignResponse>> {
  const saveDir = await deps.choosePackageDirectory();
  if (saveDir === null) return cancelled();

  const store = new SaveStore();
  const collector = new DiagnosticCollector();
  const state = store.load(saveDir, collector);

  const claimed = store.list(saveDir)[0];
  const campaignIdentity = state ? state.snapshot.campaignId : (claimed?.campaignId ?? "");
  const activeRevision = state ? Number(state.snapshot.turnNumber) : (claimed?.turnNumber ?? 0);

  if (state) {
    return {
      outcome: "success",
      value: { valid: true, campaignIdentity, activeRevision, issues: [] },
      diagnostics: [],
    };
  }

  return {
    outcome: "success",
    value: {
      valid: false,
      campaignIdentity,
      activeRevision,
      issues: collector.all.map((d) => d.message),
    },
    diagnostics: [],
  };
}

// ---------------------------------------------------------------------------
// replayCampaign
// ---------------------------------------------------------------------------

/**
 * `replayCampaign(undefined) -> ReplayCampaignResponse` (ticket 08/16): full
 * `ReplayVerifier`-based command-history replay. Walks the package's save
 * chain (every `SaveStore` save directory, grouped by revision —
 * construction commands write extra saves *at the same revision*, so the
 * newest save per revision is the state the next month executed against)
 * and, for each consecutive revision pair, replays that month
 * deterministically: same engine, same ruleset, same random seed
 * (`${campaignSeed}:month:<pre-turn>`, the exact derivation `commitMonth`
 * uses) against the pre-month snapshot, and confirms the replayed closing
 * hash matches the persisted post-month snapshot's deterministic
 * subset-hash — the same `snapshotToHashable`/`hashSnapshot` comparison
 * ticket 05 proved end-to-end against `content/production/1880` (copied
 * verbatim from `packages/phase-engine/src/replay.ts`, which does not
 * export it; `ReplayVerifier.verify()` compares exactly this hash).
 *
 * `commitMonth` executes every month with an empty command array (the
 * engine-facing command set — construction orders are folded into the
 * snapshot before the month runs), so the replayed command ledger is empty
 * by construction and the authoritative comparison is the closing-state
 * hash. A campaign that has never advanced has no executed months and
 * trivially `matched` with zero revisions.
 */
export async function replayCampaign(
  deps: ContinuityDeps,
): Promise<BridgeResult<ReplayCampaignResponse>> {
  const saveDir = await deps.choosePackageDirectory();
  if (saveDir === null) return cancelled();

  const metadata = readSessionMetadata(saveDir);
  if (!metadata) {
    return {
      outcome: "error",
      reason: "SESSION_METADATA_MISSING",
      diagnostics: [
        `${saveDir} has no readable session.json — the replay seed (derived from the campaign's configuration seed) cannot be reconstructed.`,
      ],
    };
  }

  const store = new SaveStore();
  const listed = store.list(saveDir);
  if (listed.length === 0) {
    return {
      outcome: "error",
      reason: "REPLAY_FAILED",
      diagnostics: ["Package contains no saves."],
    };
  }

  // list() is newest-first with a deterministic tie-break (timestamp, then
  // the save chain, then saveId — never OS directory order, F6). A later
  // save at the same revision supersedes an earlier one (construction saves
  // never advance revision), so per-turn selection keeps the FIRST save seen
  // — the newest — rather than overwriting it with an older one.
  const newestSavePerTurn = new Map<number, SaveMetadata>();
  for (const meta of listed) {
    if (!newestSavePerTurn.has(meta.turnNumber)) {
      newestSavePerTurn.set(meta.turnNumber, meta);
    }
  }
  const turns = [...newestSavePerTurn.keys()].sort((a, b) => a - b);

  if (turns.length < 2) {
    return {
      outcome: "success",
      value: { matched: true, revisions: [] },
      diagnostics: [
        `Campaign is at revision ${String(turns[0] ?? 0)} — no executed months to replay.`,
      ],
    };
  }

  const verifier = new ReplayVerifier();
  const collector = new DiagnosticCollector();
  const revisions: ReplayedRevision[] = [];
  let allMatched = true;

  for (let i = 0; i + 1 < turns.length; i++) {
    const preTurn = turns[i]!;
    const postTurn = turns[i + 1]!;
    const pre = loadSaveForTurn(store, saveDir, newestSavePerTurn, preTurn);
    const post = loadSaveForTurn(store, saveDir, newestSavePerTurn, postTurn);

    if (!pre || !post) {
      allMatched = false;
      revisions.push({
        revision: postTurn,
        matched: false,
        expectedHash: "missing",
        actualHash: "missing",
      });
      continue;
    }

    const seed = `${metadata.campaignSeed}:month:${String(pre.snapshot.turnNumber)}`;
    // `commitMonth` advances `turnNumber` by one purely as session
    // bookkeeping after execution; the engine's own final snapshot keeps the
    // pre-turn label. Compare like with like by hashing the persisted
    // post-month snapshot at the pre-turn number.
    const expectedHash = hashSnapshot({ ...post.snapshot, turnNumber: pre.snapshot.turnNumber });
    const result = verifier.verify(
      pre.snapshot,
      [],
      new CommandLedger(),
      expectedHash,
      seed,
      collector,
    );

    revisions.push({
      revision: postTurn,
      matched: result.match,
      expectedHash: result.originalFinalHash,
      actualHash: result.replayedFinalHash,
    });
    if (!result.match) allMatched = false;
  }

  return {
    outcome: "success",
    value: { matched: allMatched, revisions },
    diagnostics: collector.all.map((d) => d.message),
  };
}

function loadSaveForTurn(
  store: SaveStore,
  saveDir: string,
  newestSavePerTurn: Map<number, SaveMetadata>,
  turn: number,
): import("@bluewave/campaign").CampaignState | null {
  const meta = newestSavePerTurn.get(turn);
  if (!meta) return null;
  return store.loadById(saveDir, meta.saveId, new DiagnosticCollector());
}

// ---------------------------------------------------------------------------
// recoverCampaign
// ---------------------------------------------------------------------------

/**
 * `recoverCampaign(undefined) -> RecoverCampaignResponse` (ticket 08/16):
 * `RecoveryManager`'s existing corruption-recovery flow, honestly wrapped by
 * an integrity probe first. `SaveStore.load`'s hash/envelope/compatibility
 * checks ARE the corruption detector: the active save is loaded with full
 * verification, and a failed load stands as the corruption verdict. A
 * corrupt active save is reverted to its predecessor via
 * `RecoveryManager.revert` (an atomic pointer flip), then re-verified via a
 * fresh `SaveStore.load`. A healthy package is left untouched
 * (`recovered: false` — reverting would needlessly lose the newest state);
 * a corrupt package with no predecessor can't be recovered
 * (`activeRevision: null`).
 */
export async function recoverCampaign(
  deps: ContinuityDeps,
): Promise<BridgeResult<RecoverCampaignResponse>> {
  const saveDir = await deps.choosePackageDirectory();
  if (saveDir === null) return cancelled();

  const store = new SaveStore();
  const notes: string[] = [];

  const activeSaveId = store.getActiveSaveId(saveDir);
  if (activeSaveId === null) {
    return {
      outcome: "success",
      value: {
        recovered: false,
        activeRevision: null,
        notes: ["No pointer file (or an unreadable one) — nothing to recover."],
      },
      diagnostics: [],
    };
  }

  const probe = new DiagnosticCollector();
  const active = store.loadById(saveDir, activeSaveId, probe);
  if (active) {
    return {
      outcome: "success",
      value: {
        recovered: false,
        activeRevision: Number(active.snapshot.turnNumber),
        notes: ["Active save passes integrity checks — no recovery performed."],
      },
      diagnostics: [],
    };
  }
  notes.push(...probe.all.map((d) => d.message));

  const previousSaveId = store.getPreviousSaveId(saveDir);
  if (previousSaveId === null) {
    return {
      outcome: "success",
      value: {
        recovered: false,
        activeRevision: null,
        notes: [...notes, "The active save is corrupt and no earlier save exists to revert to."],
      },
      diagnostics: [],
    };
  }

  if (!RecoveryManager.revert(saveDir, previousSaveId)) {
    return {
      outcome: "error",
      reason: "RECOVERY_FAILED",
      diagnostics: [...notes, "RecoveryManager could not write the reverted pointer."],
    };
  }
  notes.push(`Reverted the package pointer to save ${previousSaveId}.`);

  const after = new DiagnosticCollector();
  const reverted = store.load(saveDir, after);
  if (!reverted) {
    return {
      outcome: "success",
      value: {
        recovered: false,
        activeRevision: null,
        notes: [
          ...notes,
          ...after.all.map((d) => d.message),
          "Reverted save also fails integrity.",
        ],
      },
      diagnostics: [],
    };
  }

  return {
    outcome: "success",
    value: {
      recovered: true,
      activeRevision: Number(reverted.snapshot.turnNumber),
      notes,
    },
    diagnostics: [],
  };
}

// ---------------------------------------------------------------------------
// ReplayVerifier's subset-hash, copied per ticket 05's note
// ---------------------------------------------------------------------------

/**
 * Mirrors `ReplayVerifier`'s internal `snapshotToHashable`/`hashSnapshot`
 * (`packages/phase-engine/src/replay.ts`, not exported) — exactly the shape
 * ticket 05's production-pack loop test had to copy locally. `verify()`
 * compares its replayed closing state against a hash of THIS subset, not a
 * full canonicalSerialize of the raw snapshot, so any caller computing the
 * expected hash must use the identical shape.
 */
function snapshotToHashable(snapshot: CampaignSnapshot): unknown {
  const nations: Record<string, NationState> = {};
  for (const [id, nation] of snapshot["nations"]) {
    nations[id] = nation;
  }
  const wars = {
    wars: snapshot["wars"]["wars"].map((w) => ({ ...w })),
    battles: snapshot["wars"]["battles"].map((b) => ({ ...b, manifestHash: b["manifestHash"] })),
    participantMemberships: snapshot["wars"]["participantMemberships"].map((m) => ({ ...m })),
    blockadeState: snapshot["wars"]["blockadeState"].map((b) => ({ ...b })),
    battleManifests: (snapshot["wars"]["battleManifests"] ?? []).map((m) => ({ ...m })),
  };
  return {
    version: snapshot["version"],
    turnNumber: snapshot["turnNumber"],
    campaignId: snapshot["campaignId"],
    // B-6/ADR-0025: start date + current-month per-area weather are part of
    // the authoritative snapshot surface (parity with ReplayVerifier).
    startYear: snapshot["startYear"],
    startMonth: snapshot["startMonth"],
    strategicWeather: (snapshot["strategicWeather"] ?? []).map((s) => ({ ...s })),
    slots: snapshot["slots"].map((s) => ({ ...s })),
    world: {
      areas: snapshot["world"]["areas"].map((a) => ({ ...a })),
      routes: snapshot["world"]["routes"].map((r) => ({ ...r })),
      ports: snapshot["world"]["ports"].map((p) => ({ ...p })),
    },
    nations,
    wars,
    politics: {
      relations: snapshot["politics"]["relations"].map((r) => ({ ...r })),
      shells: { ...snapshot["politics"]["shells"] },
    },
    intelligence: {
      shells: { ...snapshot["intelligence"]["shells"] },
    },
    rulesetVersion: snapshot["rulesetVersion"],
    compatibilityVersion: snapshot["compatibilityVersion"],
  };
}

function hashSnapshot(snapshot: CampaignSnapshot): string {
  return sha256Hex(canonicalSerialize(snapshotToHashable(snapshot)));
}
