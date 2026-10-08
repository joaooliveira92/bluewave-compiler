import { SaveStore } from "@bluewave/persistence";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type {
  CopyCampaignResult,
  SaveCampaignResult,
} from "../../shared/campaign-command-contract.js";
import { readSessionMetadata, writeSessionMetadata } from "../campaignSessionMetadata.js";
import { getCampaignSession, removeCampaignSession } from "../campaignSessions.js";
import { clearPendingEnvelopes } from "../pendingCommands.js";

/**
 * The campaign's own lifecycle commands: save, close, and save-a-copy.
 *
 * `commitMonth` already persists every committed month to the campaign's package, so
 * the live state and the active save only differ if the package was altered outside the
 * app. `saveCampaign` therefore re-writes only when the package does not hold the
 * current turn (a missing or stale package), and is a no-op otherwise — safe to click
 * repeatedly without piling up identical versioned copies.
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
    const activeId = store.getActiveSaveId(record.saveDir);
    const active = store.list(record.saveDir).find((save) => save.saveId === activeId);
    if (active === undefined || Number(active.turnNumber) !== revision) {
      store.save(record.state, record.saveDir);
    }
  } catch (error) {
    return {
      outcome: "error",
      reason: "SAVE_FAILED",
      diagnostics: [error instanceof Error ? error.message : String(error)],
    };
  }
  return { outcome: "success", value: { revision }, diagnostics: [] };
}

export async function closeCampaign(sessionId: string): Promise<BridgeResult<{ closed: true }>> {
  const record = getCampaignSession(sessionId);
  if (!record) return sessionNotFound(sessionId);
  // Anything queued but not yet committed belongs to this session only.
  clearPendingEnvelopes(sessionId);
  removeCampaignSession(sessionId);
  return { outcome: "success", value: { closed: true }, diagnostics: [] };
}

export async function copyCampaign(
  sessionId: string,
  deps: SessionCommandDeps = defaultSessionCommandDeps,
): Promise<BridgeResult<CopyCampaignResult>> {
  const record = getCampaignSession(sessionId);
  if (!record) return sessionNotFound(sessionId);

  const location = await deps.chooseCopyDirectory(`bluewave-${record.playerSlotId}-copy`);
  if (location === null) {
    return { outcome: "rejected", reason: "SAVE_LOCATION_CANCELLED", diagnostics: [] };
  }
  if (location === record.saveDir) {
    return {
      outcome: "rejected",
      reason: "COPY_TARGET_IS_SOURCE",
      diagnostics: ["Choose a different location for the copy."],
    };
  }

  try {
    new SaveStore().save(record.state, location);
    // The sidecar a later Load needs (player slot, seed, scenario): carry it over.
    const metadata = readSessionMetadata(record.saveDir);
    if (metadata !== null) writeSessionMetadata(location, metadata);
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
