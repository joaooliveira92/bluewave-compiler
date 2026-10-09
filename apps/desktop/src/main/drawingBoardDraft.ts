import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decodeLog, PersistenceError } from "@bluewave/ship-design";
import { z } from "zod";
import type { BridgeResult } from "../shared/bridge-contract.js";
import type {
  DrawingBoardDraftRecord,
  ReadDrawingBoardDraftResult,
  WriteDrawingBoardDraftPayload,
} from "../shared/design-contract.js";
import { getCampaignSession } from "./campaignSessions.js";

/**
 * The Drawing Board's working design for a campaign: the starting design and the undoable edit log, so closing the
 * board, leaving the screen or restarting the app never loses work. Renderer-owned and never authoritative, like
 * `ui-state.json`: a sibling of the save ids in the campaign's save directory, outside the envelope and hash, never read by
 * the engine. Written atomically (tmp file, then rename).
 */
export const DRAWING_BOARD_DRAFT_FILENAME = "drawing-board-draft.json";

/** An edit log is at most 500 edits of small objects; anything far larger is not ours. */
const MAX_LOG_CHARS = 4_000_000;

const StoredSchema = z.object({
  schema: z.literal("drawing_board_draft_v1"),
  savedAt: z.string(),
  presetId: z.string().min(1).max(200),
  log: z.string().min(1).max(MAX_LOG_CHARS),
});

function sessionMissing(sessionId: string) {
  return {
    outcome: "error" as const,
    reason: "SESSION_NOT_FOUND",
    diagnostics: [`No active campaign session ${sessionId}`],
  };
}

/** Tolerant read: a missing, unreadable or malformed file is "no draft", never a crash. */
export function loadDrawingBoardDraft(saveDir: string): DrawingBoardDraftRecord | null {
  const path = join(saveDir, DRAWING_BOARD_DRAFT_FILENAME);
  if (!existsSync(path)) return null;
  try {
    const parsed = StoredSchema.safeParse(JSON.parse(readFileSync(path, "utf8")));
    if (!parsed.success) return null;
    decodeLog(parsed.data.log);
    return { presetId: parsed.data.presetId, log: parsed.data.log, savedAt: parsed.data.savedAt };
  } catch {
    return null;
  }
}

export async function readDrawingBoardDraft(
  sessionId: string,
): Promise<BridgeResult<ReadDrawingBoardDraftResult>> {
  const record = getCampaignSession(sessionId);
  if (!record) return sessionMissing(sessionId);
  return {
    outcome: "success",
    value: { draft: loadDrawingBoardDraft(record.saveDir) },
    diagnostics: [],
  };
}

/** Saves the working design, or removes it (`draft: null`) when there is nothing left to keep. */
export async function writeDrawingBoardDraft(
  payload: WriteDrawingBoardDraftPayload,
  now: () => Date = () => new Date(),
): Promise<BridgeResult<{ readonly saved: boolean }>> {
  const record = getCampaignSession(payload.sessionId);
  if (!record) return sessionMissing(payload.sessionId);
  const path = join(record.saveDir, DRAWING_BOARD_DRAFT_FILENAME);
  if (payload.draft === null) {
    rmSync(path, { force: true });
    return { outcome: "success", value: { saved: false }, diagnostics: [] };
  }
  try {
    decodeLog(payload.draft.log);
  } catch (err) {
    return {
      outcome: "rejected",
      reason: "INVALID_COMMAND_PAYLOAD",
      diagnostics: [err instanceof PersistenceError ? err.message : "not an edit log"],
    };
  }
  const stored = {
    schema: "drawing_board_draft_v1",
    savedAt: now().toISOString(),
    presetId: payload.draft.presetId,
    log: payload.draft.log,
  };
  const tmp = `${path}.tmp`;
  try {
    writeFileSync(tmp, JSON.stringify(stored), "utf8");
    renameSync(tmp, path);
  } catch (err) {
    rmSync(tmp, { force: true });
    return {
      outcome: "error",
      reason: "DRAFT_WRITE_FAILED",
      diagnostics: [err instanceof Error ? err.message : String(err)],
    };
  }
  return { outcome: "success", value: { saved: true }, diagnostics: [] };
}

/** Wire shape of `writeDrawingBoardDraft` (semantic checks live in the handler). */
export const WriteDrawingBoardDraftPayloadSchema = z.object({
  sessionId: z.string().min(1),
  draft: z
    .object({
      presetId: z.string().min(1).max(200),
      log: z.string().min(1).max(MAX_LOG_CHARS),
    })
    .nullable(),
});
