import { existsSync, readdirSync, realpathSync, statSync } from "node:fs";
import { basename, dirname, join, resolve, sep } from "node:path";
import { SaveStore } from "@bluewave/persistence";
import { Effect } from "effect";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type {
  CopyCampaignResult,
  SaveCampaignResult,
} from "../../shared/campaign-command-contract.js";
import { readSessionMetadata, writeSessionMetadata } from "../campaignSessionMetadata.js";
import { getCampaignSession } from "../campaignSessions.js";
import { CampaignSessionStore } from "../runtime/campaignSessionStore.js";
import type { CommandError } from "../runtime/commandError.js";
import { ProjectStore } from "../runtime/projectStore.js";

/**
 * The campaign's own lifecycle commands: save, close, and save-a-copy (INC-3;
 * ADR-0159).
 *
 * `commitMonth` already persists every committed month to the campaign's package,
 * so the live state and the active save only differ if the package was altered
 * outside the app. `saveCampaign` therefore compares the active save's
 * full-content hash with the live state's (`SaveStore.isCurrent`): it re-writes
 * only when they differ (a missing, stale or altered package) and is a no-op
 * otherwise — safe to click repeatedly without piling up identical versioned
 * copies. A spurious mismatch only costs one extra save.
 */

/** `saveCampaign` as an Effect program (INC-3): resolves the session and persists through services. */
export const saveCampaignProgram = (
  sessionId: string,
): Effect.Effect<
  BridgeResult<SaveCampaignResult>,
  CommandError,
  CampaignSessionStore | ProjectStore
> =>
  Effect.gen(function* () {
    const sessions = yield* CampaignSessionStore;
    const projects = yield* ProjectStore;
    const record = yield* sessions.get(sessionId);

    // Compare full content, not just the turn: construction and research can change the live
    // state within a turn. (`rawHash` is no use here — it does not cover nation data.)
    const revision = Number(record.state.snapshot.turnNumber);
    if (!(yield* projects.isCurrent(record.state, record.saveDir))) {
      yield* projects.save(record.state, record.saveDir);
    }
    return { outcome: "success", value: { revision }, diagnostics: [] };
  });

/** `closeCampaign` as an Effect program (INC-3): drops every session-scoped store. */
export const closeCampaignProgram = (
  sessionId: string,
): Effect.Effect<BridgeResult<{ closed: true }>, CommandError, CampaignSessionStore> =>
  Effect.gen(function* () {
    const sessions = yield* CampaignSessionStore;
    // Fails with SESSION_NOT_FOUND when the session is not open.
    yield* sessions.get(sessionId);
    // Queued-but-uncommitted commands (diplomacy, divisions, research, construction) and the
    // construction workspace belong to this session only.
    yield* sessions.clearPendingEnvelopes(sessionId);
    yield* sessions.clearConstructionWorkspace(sessionId);
    yield* sessions.remove(sessionId);
    return { outcome: "success", value: { closed: true }, diagnostics: [] };
  });

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
