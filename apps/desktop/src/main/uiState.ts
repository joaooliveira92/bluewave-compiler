import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { BridgeResult } from "../shared/bridge-contract.js";
import type {
  ReadUiStateResult,
  UiState,
  WriteUiStatePayload,
  WriteUiStateResult,
} from "../shared/campaign-command-contract.js";
import { getCampaignSession } from "./campaignSessions.js";
import { UiStateSchema } from "./campaignCommandSchemas.js";

/**
 * The per-campaign renderer-owned UI-state sidecar (spec §7 "Dismissal" §8
 * "Persistence"). One mechanism serves both priority-dismissal and
 * first-month-inspection state. It is **never authoritative**: it is written
 * as a sibling of the campaign's save directory (not inside a `SaveStore`
 * save id), is not part of the envelope/hash, and is never read by
 * `MonthExecutor`. Dismissal expiry is inherent — fingerprints are only
 * honored while the sidecar's `turnNumber` equals the session's current turn.
 *
 * The filename lives next to `pointer.json`/save ids in `saveDir`, so it is
 * keyed by `campaignId` via location (one campaign save dir == one sidecar).
 */
export const UI_STATE_FILENAME = "ui-state.json";

/** Cancellation matches `SaveStore`'s convention (`error.name === "AbortError"`). */
function createAbortError(): Error {
  const error = new Error("UI-state write was cancelled");
  error.name = "AbortError";
  return error;
}

/** Empty defaults — the tolerant-read fallback and the initial shape. */
export function emptyUiState(turnNumber: number): UiState {
  return { turnNumber, dismissedFingerprints: [] };
}

/**
 * The core expiry rule (spec §7 "Dismissal"): `dismissedFingerprints` are
 * honored only while `stored.turnNumber === currentTurnNumber`; on turn
 * advance the dismissal set collapses to empty. `firstMonthInspection` does
 * NOT expire — once `completed`/`dismissed` reopening stays disabled and a
 * mid-guide close resumes from the last completed step, both across turns
 * (§8 "Persistence"). Pure and deterministic; never touches authority.
 */
export function resolveUiState(stored: UiState, currentTurnNumber: number): UiState {
  const expired = stored.turnNumber !== currentTurnNumber;
  return {
    turnNumber: currentTurnNumber,
    dismissedFingerprints: expired ? [] : [...stored.dismissedFingerprints],
    firstMonthInspection: stored.firstMonthInspection,
  };
}

/**
 * Tolerant read (acceptance: missing/corrupt -> empty defaults, never
 * crashes). A missing file, unparseable JSON, or a shape that fails
 * `UiStateSchema` all fall back to `emptyUiState(currentTurnNumber)`; a
 * readable-but-stale sidecar is resolved against the current turn.
 */
export function loadUiState(saveDir: string, currentTurnNumber: number): UiState {
  const path = join(saveDir, UI_STATE_FILENAME);
  if (!existsSync(path)) {
    return emptyUiState(currentTurnNumber);
  }
  try {
    const parsed = UiStateSchema.safeParse(JSON.parse(readFileSync(path, "utf8")));
    if (!parsed.success) {
      return emptyUiState(currentTurnNumber);
    }
    return resolveUiState(parsed.data, currentTurnNumber);
  } catch {
    return emptyUiState(currentTurnNumber);
  }
}

/**
 * Atomic write (tmp file -> rename, matching `SaveStore.save`'s pointer
 * publish / ENGINEERING-CONTRACT "Save atomically"): the final
 * `ui-state.json` path is never left partially written, and a failed write
 * removes the tmp artifact. Cancellation is checked before any fs work;
 * unlike an authoritative save there is no pointer to advance (this is
 * renderer-owned UI state, not a campaign save).
 */
export function saveUiState(saveDir: string, uiState: UiState, signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw createAbortError();
  }
  const path = join(saveDir, UI_STATE_FILENAME);
  const tmpPath = `${path}.tmp`;
  try {
    writeFileSync(tmpPath, JSON.stringify(uiState, null, 2), "utf8");
    renameSync(tmpPath, path);
  } catch (err) {
    rmSync(tmpPath, { force: true });
    throw err;
  }
}

/**
 * `readUiState(sessionId) -> { uiState }`. Reads the session's sidecar,
 * tolerantly (missing/corrupt -> defaults) and resolved against the session's
 * current turn (so a stale turn's dismissals are already expired on read).
 */
export async function readUiState(sessionId: string): Promise<BridgeResult<ReadUiStateResult>> {
  const record = getCampaignSession(sessionId);
  if (!record) {
    return {
      outcome: "error",
      reason: "SESSION_NOT_FOUND",
      diagnostics: [`No active campaign session ${sessionId}`],
    };
  }
  const currentTurnNumber = Number(record.state.snapshot.turnNumber);
  return {
    outcome: "success",
    value: { uiState: loadUiState(record.saveDir, currentTurnNumber) },
    diagnostics: [],
  };
}

/**
 * `writeUiState(payload, signal?) -> { uiState }`. Persists the renderer's
 * UI-state sidecar for the session's campaign. `turnNumber` is stamped from
 * the session's authoritative current turn (never trusted from the renderer),
 * so a write always reflects the live turn and expiry stays honest. The
 * sidecar is written as a sibling of the save ids in `saveDir` — outside the
 * authoritative envelope, so `SaveStore` save/load and `MonthExecutor` are
 * unaffected.
 */
export async function writeUiState(
  payload: WriteUiStatePayload,
  signal?: AbortSignal,
): Promise<BridgeResult<WriteUiStateResult>> {
  const record = getCampaignSession(payload.sessionId);
  if (!record) {
    return {
      outcome: "error",
      reason: "SESSION_NOT_FOUND",
      diagnostics: [`No active campaign session ${payload.sessionId}`],
    };
  }
  const currentTurnNumber = Number(record.state.snapshot.turnNumber);
  // Merge semantics (spec §7 "one mechanism for both"; INC-3 criterion 3):
  // a write only touches the fields it carries. `dismissedFingerprints` is a
  // complete-set replace (every dismissal write submits the full current set);
  // `firstMonthInspection`, when ABSENT, is carried forward from the stored
  // sidecar so a dismissal-only writer never erases inspection progress (and
  // an inspection-only writer never erases dismissals it does not carry).
  // An explicit reset of inspection remains available by sending
  // `{ status: "not_started", lastCompletedStep: 0 }`.
  const stored = loadUiState(record.saveDir, currentTurnNumber);
  const next: UiState = {
    turnNumber: currentTurnNumber,
    dismissedFingerprints: [...payload.dismissedFingerprints],
    ...(payload.firstMonthInspection !== undefined
      ? { firstMonthInspection: { ...payload.firstMonthInspection } }
      : stored.firstMonthInspection !== undefined
        ? { firstMonthInspection: { ...stored.firstMonthInspection } }
        : {}),
  };
  try {
    saveUiState(record.saveDir, next, signal);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      outcome: "error",
      reason: "UI_STATE_WRITE_FAILED",
      diagnostics: [message],
    };
  }
  return { outcome: "success", value: { uiState: next }, diagnostics: [] };
}
