import { randomUUID } from "node:crypto";
import { advanceMonth, getScenarioById } from "@bluewave/campaign";
import { CommandLedger } from "@bluewave/commands";
import { DiagnosticCollector, type DiagnosticCode } from "@bluewave/diagnostics";
import { RecoveryManager, SaveStore, type SaveMetadata } from "@bluewave/persistence";
import { hashSnapshot, ReplayVerifier } from "@bluewave/phase-engine";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type {
  LoadCampaignResponse,
  RecoverCampaignResponse,
  ReplayCampaignResponse,
  ReplayedRevision,
  VerifyCampaignResponse,
} from "../../shared/continuity-contract.js";
import { registerCampaignSession } from "../campaignSessions.js";
import { restorePendingQueue } from "../pendingCommands.js";
import { ledgerOf, parseMonthInput } from "../monthInput.js";
import { promotePlayerSlotForExecution } from "./commitMonth/snapshot.js";
import { loadShipBuildingContent, shipBuildingContentHash } from "../shipBuildingContent.js";
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
  // Commands the player queued for this month before the app closed are queued again.
  restorePendingQueue(sessionId);

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
// listCampaigns
// ---------------------------------------------------------------------------

/**
 * `listCampaigns(undefined) -> BridgeResult<SaveMetadata[]>` — the
 * campaign-list/load screen's backing query (§17.4). Prompts for the package
 * save directory via the same native dialog as `loadCampaign`, then returns
 * `SaveStore.list(saveDir)`: the package's saves as real `SaveMetadata`
 * records, deterministically newest-first, skipping corrupt/incompatible
 * directories. The new additive list fields (`campaignName`/`nationId`/
 * `campaignDate`) are carried on the records when the save wrote them;
 * legacy/degraded records simply omit them (the screen renders "—"). No
 * state is mutated and no session is registered — the actual load still goes
 * through `loadCampaign`/`CompatibilityChecker`.
 */
export async function listCampaigns(
  deps: Pick<ContinuityDeps, "choosePackageDirectory">,
): Promise<BridgeResult<SaveMetadata[]>> {
  const saveDir = await deps.choosePackageDirectory();
  if (saveDir === null) return cancelled();

  const store = new SaveStore();
  return {
    outcome: "success",
    value: store.list(saveDir),
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
 * subset-hash — using `@bluewave/phase-engine`'s exported
 * `snapshotToHashable`/`hashSnapshot`, the exact functions
 * `ReplayVerifier.verify()` compares with.
 *
 * Each month is replayed with the input it was executed with, stored beside
 * the save that closes it (`month-input.json`, see `monthInput.ts`): the
 * player's command envelopes, their original outcomes (compared step by
 * step) and the ship-building content hash. If that content has changed
 * since, the month is reported as not reproducible rather than replayed
 * against different rules. Saves written before month inputs existed carry
 * none and replay with no commands, as they always did. A campaign that has
 * never advanced has no executed months and trivially `matched` with zero
 * revisions.
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
    const postSaveId = newestSavePerTurn.get(postTurn)!.saveId;
    const stored = store.loadMonthInput(saveDir, postSaveId, collector);
    const input = stored.status === "present" ? parseMonthInput(stored.value) : null;
    if (stored.status === "corrupt" || (stored.status === "present" && input === null)) {
      if (stored.status === "present") {
        collector.addError(
          "REPLAY_MONTH_INPUT_INVALID" as DiagnosticCode,
          `Revision ${String(postTurn)}: the stored month input is not a month_input_v1 record.`,
          { stage: "replay" },
        );
      }
      allMatched = false;
      revisions.push({
        revision: postTurn,
        matched: false,
        expectedHash: "unreadable",
        actualHash: "unreadable",
      });
      continue;
    }
    if (input !== null && input.shipBuildingContentHash !== shipBuildingContentHash()) {
      collector.addWarning(
        "REPLAY_CONTENT_CHANGED" as DiagnosticCode,
        `Revision ${String(postTurn)} was played with different ship-building content; it cannot be reproduced by this version.`,
        { stage: "replay" },
      );
      allMatched = false;
      revisions.push({
        revision: postTurn,
        matched: false,
        expectedHash: "content-changed",
        actualHash: "content-changed",
      });
      continue;
    }
    // `commitMonth` advances `turnNumber` by one purely as session
    // bookkeeping after execution; the engine's own final snapshot keeps the
    // pre-turn label. Compare like with like by hashing the persisted
    // post-month snapshot at the pre-turn number.
    // commitMonth executes with the player's slot first (the engine authorizes human commands against slots[0]) and
    // restores the compiled order before saving; replay does the same on both sides so the queued envelopes validate.
    const executed = promotePlayerSlotForExecution(pre.snapshot, metadata.playerSlotId);
    const expectedHash = hashSnapshot(
      promotePlayerSlotForExecution(
        { ...post.snapshot, turnNumber: pre.snapshot.turnNumber },
        metadata.playerSlotId,
      ),
    );
    const result = verifier.verify(
      executed,
      input === null ? [] : [...input.commands],
      input === null ? new CommandLedger() : ledgerOf(input),
      expectedHash,
      seed,
      collector,
      input === null ? undefined : { shipBuilding: loadShipBuildingContent() },
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
