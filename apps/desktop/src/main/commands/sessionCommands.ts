import { existsSync, readdirSync, realpathSync, statSync } from "node:fs";
import { basename, dirname, join, resolve, sep } from "node:path";
import { SaveStore } from "@bluewave/persistence";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type {
  CopyCampaignResult,
  SaveCampaignResult,
} from "../../shared/campaign-command-contract.js";
import { readSessionMetadata, writeSessionMetadata } from "../campaignSessionMetadata.js";
import { getCampaignSession, removeCampaignSession } from "../campaignSessions.js";
import { clearConstructionWorkspace } from "../constructionWorkspace.js";
import { clearPendingEnvelopes } from "../pendingCommands.js";

/**
 * The campaign's own lifecycle commands: save, close, and save-a-copy.
 *
 * `commitMonth` already persists every committed month to the campaign's package, so
 * the live state and the active save only differ if the package was altered outside the
 * app. `saveCampaign` therefore compares the active save's full-content hash with
 * the live state's (`SaveStore.isCurrent`): it re-writes only when they differ (a missing, stale or altered
 * package) and is a no-op otherwise — safe to click repeatedly without piling up
 * identical versioned copies. A spurious mismatch only costs one extra save.
 */

export interface SessionCommandDeps {
  /** Ask the player where to put a copy; null when they cancel. */
  readonly chooseCopyDirectory: (suggestedName: string) => Promise<string | null>;
}

export const defaultSessionCommandDeps: SessionCommandDeps = {
  chooseCopyDirectory: async (suggestedName: string) => {
    const { dialog } = await import("electron");
    const result = await dialog.showSaveDialog({
      title: "Save a copy of this campaign",
      defaultPath: suggestedName,
      buttonLabel: "Save Copy",
    });
    if (result.canceled || !result.filePath) return null;
    return result.filePath;
  },
};

const sessionNotFound = (sessionId: string) =>
  ({
    outcome: "error",
    reason: "SESSION_NOT_FOUND",
    diagnostics: [`No active campaign session ${sessionId}`],
  }) as const;

export async function saveCampaign(sessionId: string): Promise<BridgeResult<SaveCampaignResult>> {
  const record = getCampaignSession(sessionId);
  if (!record) return sessionNotFound(sessionId);

  const revision = Number(record.state.snapshot.turnNumber);
  const store = new SaveStore();
  try {
    // Compare full content, not just the turn: construction and research can change the live
    // state within a turn. (`rawHash` is no use here — it does not cover nation data.)
    if (!store.isCurrent(record.state, record.saveDir)) store.save(record.state, record.saveDir);
  } catch (error) {
    return {
      outcome: "error",
      reason: "SAVE_FAILED",
      diagnostics: [error instanceof Error ? error.message : String(error)],
    };
  }
  return { outcome: "success", value: { revision }, diagnostics: [] };
}

/** Everything the app holds in memory for a session goes when the campaign closes. */
export async function closeCampaign(sessionId: string): Promise<BridgeResult<{ closed: true }>> {
  const record = getCampaignSession(sessionId);
  if (!record) return sessionNotFound(sessionId);
  // Queued-but-uncommitted commands (diplomacy, divisions, research, construction) and the
  // construction workspace belong to this session only.
  clearPendingEnvelopes(sessionId);
  clearConstructionWorkspace(sessionId);
  removeCampaignSession(sessionId);
  return { outcome: "success", value: { closed: true }, diagnostics: [] };
}

/**
 * `path` resolved the way the filesystem will see it: symlinks followed on the part that
 * exists, so two spellings of one folder compare equal and a symlink cannot hide a nested path.
 */
function canonicalPath(path: string): string {
  let existing = resolve(path);
  const rest: string[] = [];
  while (!existsSync(existing)) {
    const parent = dirname(existing);
    if (parent === existing) break;
    rest.unshift(basename(existing));
    existing = parent;
  }
  return join(existsSync(existing) ? realpathSync(existing) : existing, ...rest);
}

export interface CopyTargetProblem {
  readonly reason: string;
  readonly message: string;
}

/**
 * Why `target` is not a safe place for a copy of the package at `source`, or null when it is.
 * A copy must land in a new or empty folder, never inside the source (it would be scanned
 * as part of it), never around it, and never on top of another campaign's package.
 */
export function assessCopyTarget(source: string, target: string): CopyTargetProblem | null {
  const from = canonicalPath(source);
  const to = canonicalPath(target);
  if (to === from) {
    return {
      reason: "COPY_TARGET_IS_SOURCE",
      message: "Choose a different location for the copy.",
    };
  }
  if (to.startsWith(from + sep)) {
    return {
      reason: "COPY_TARGET_INSIDE_SOURCE",
      message: "The copy cannot be placed inside the campaign it copies.",
    };
  }
  if (from.startsWith(to + sep)) {
    return {
      reason: "COPY_TARGET_CONTAINS_SOURCE",
      message: "The copy cannot be placed in a folder that contains the campaign it copies.",
    };
  }
  if (existsSync(to)) {
    if (!statSync(to).isDirectory()) {
      return { reason: "COPY_TARGET_NOT_A_DIRECTORY", message: "The chosen location is a file." };
    }
    if (readdirSync(to).length > 0) {
      return {
        reason: "COPY_TARGET_NOT_EMPTY",
        message:
          "The chosen folder is not empty. Choose a new or empty folder so nothing is overwritten.",
      };
    }
  }
  return null;
}

export async function copyCampaign(
  sessionId: string,
  deps: SessionCommandDeps = defaultSessionCommandDeps,
): Promise<BridgeResult<CopyCampaignResult>> {
  const record = getCampaignSession(sessionId);
  if (!record) return sessionNotFound(sessionId);

  // A copy without the session sidecar (player slot, seed, scenario) could never be opened
  // again, so refuse before asking the player anything or writing anything.
  const metadata = readSessionMetadata(record.saveDir);
  if (metadata === null) {
    return {
      outcome: "error",
      reason: "SESSION_METADATA_MISSING",
      diagnostics: [
        "This campaign's session file is missing, so a copy could not be opened later.",
      ],
    };
  }

  const location = await deps.chooseCopyDirectory(`bluewave-${record.playerSlotId}-copy`);
  if (location === null) {
    return { outcome: "rejected", reason: "SAVE_LOCATION_CANCELLED", diagnostics: [] };
  }
  const problem = assessCopyTarget(record.saveDir, location);
  if (problem !== null) {
    return { outcome: "rejected", reason: problem.reason, diagnostics: [problem.message] };
  }

  try {
    new SaveStore().save(record.state, location);
    writeSessionMetadata(location, metadata);
  } catch (error) {
    return {
      outcome: "error",
      reason: "SAVE_FAILED",
      diagnostics: [error instanceof Error ? error.message : String(error)],
    };
  }
  return {
    outcome: "success",
    value: { revision: Number(record.state.snapshot.turnNumber), location },
    diagnostics: [],
  };
}
