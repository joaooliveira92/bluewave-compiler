import type { CampaignSnapshot, CampaignState } from "@bluewave/campaign";
import { createEnvelope } from "@bluewave/deterministic";
import { SaveStore } from "@bluewave/persistence";
import type { BridgeResult } from "../../../shared/bridge-contract.js";
import type { ConstructionCommandOutcome } from "../../../shared/construction-contract.js";
import type { CampaignSessionRecord } from "../../campaignSessions.js";
import { registerCampaignSession } from "../../campaignSessions.js";
import { toSaveableState } from "../../saveHelpers.js";

/**
 * The persistence boundary for authoritative construction mutations (the DIP
 * seam): the command flows depend on this interface rather than on `SaveStore`
 * and session registration directly, so the storage mechanism can be swapped
 * (e.g. a fake in tests) without touching command logic.
 */
export type SnapshotMutationResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly result: BridgeResult<ConstructionCommandOutcome> };

export interface ConstructionSnapshotStore {
  persist(
    record: CampaignSessionRecord,
    mutate: (snapshot: CampaignSnapshot) => CampaignSnapshot,
  ): SnapshotMutationResult;
}

/**
 * Apply an authoritative snapshot mutation, recompute the envelope + hash,
 * persist via `SaveStore`, and re-register the session (commitMonth's exact
 * pattern). A save failure yields `SAVE_FAILED` with the session untouched.
 */
export class SaveStoreConstructionSnapshotStore implements ConstructionSnapshotStore {
  persist(
    record: CampaignSessionRecord,
    mutate: (snapshot: CampaignSnapshot) => CampaignSnapshot,
  ): SnapshotMutationResult {
    const nextSnapshot = mutate(record.state.snapshot);
    const nextEnvelope = createEnvelope(
      "campaign-snapshot",
      nextSnapshot.compatibilityVersion,
      nextSnapshot,
    );
    const nextState: CampaignState = toSaveableState({
      snapshot: nextSnapshot,
      envelope: nextEnvelope,
      rawHash: record.state.rawHash,
    });

    const store = new SaveStore();
    try {
      store.save(nextState, record.saveDir);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        result: { outcome: "error", reason: "SAVE_FAILED", diagnostics: [message] },
      };
    }
    registerCampaignSession({ ...record, state: nextState });
    return { ok: true };
  }
}

/** Default store used by the command flows; replace via the exported seam. */
export const constructionSnapshotStore: ConstructionSnapshotStore =
  new SaveStoreConstructionSnapshotStore();
