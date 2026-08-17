import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { isAbsolute, join, relative } from "node:path";
import type { CampaignState } from "@bluewave/campaign";
import { canonicalSerialize, sha256Hex, verifyEnvelope } from "@bluewave/deterministic";
import type { DiagnosticCode, DiagnosticCollector } from "@bluewave/diagnostics";
import { CompatibilityChecker } from "./compatibility.js";
import { cleanup } from "./recovery.js";
import {
  PointerFileSchema,
  SaveHeaderSchema,
  SaveMetadataSchema,
  SigFileSchema,
  StorableCampaignStateSchema,
  type PointerFile,
  type SaveMetadata,
  type SigFile,
} from "./schemas.js";
import {
  fromStorableSnapshot,
  type StorableCampaignSnapshot,
  toStorableSnapshot,
} from "./snapshotSerialization.js";

export const CORRUPT_SAVE_CODE = "PERSISTENCE_CORRUPT_SAVE" as DiagnosticCode;
export const MISSING_SAVE_CODE = "PERSISTENCE_MISSING_SAVE" as DiagnosticCode;
export const CANCELLED_CODE = "PERSISTENCE_CANCELLED" as DiagnosticCode;
export const UNSIGNED_SAVE_CODE = "PERSISTENCE_UNSIGNED_SAVE" as DiagnosticCode;

export type { SaveMetadata } from "./schemas.js";

export interface SaveResult {
  savePath: string;
  hash: string;
  metadata: SaveMetadata;
}

// Save ids are created by `save()` as `<epochMs>-<uuid>`; treat any inbound id
// as opaque and validate it before it touches the filesystem (TODO #3).
const SAVE_ID_PATTERN = /^\d{13}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidSaveId(saveId: string): boolean {
  return SAVE_ID_PATTERN.test(saveId);
}

// Defense-in-depth containment: the resolved save path must remain inside
// `saveDir` so an ID like an absolute path or `..` can never escape it.
function isContainedIn(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
}

// A cancellation that crosses an IPC/async boundary is detected by
// `error.name === "AbortError"`; a bare `new Error("AbortError")` has name
// "Error" and misses that check (TODO #13).
function createAbortError(): Error {
  const error = new Error("Save operation was cancelled");
  error.name = "AbortError";
  return error;
}

export class SaveStore {
  save(state: CampaignState, saveDir: string, signal?: AbortSignal): SaveResult {
    if (signal?.aborted) {
      throw createAbortError();
    }

    const saveId = `${Date.now()}-${randomUUID()}`;
    const savePath = join(saveDir, saveId);
    const tmpDir = join(saveDir, `.tmp_${saveId}`);

    const { rawHash: _rh, ...stateForHash } = state;
    // Written form only: state's Map-valued snapshot fields (nations, designs,
    // designFamilies, activeCandidates) convert to plain Records so they survive
    // JSON.stringify. The stateHash below stays over the original `state`/
    // `stateForHash` (real Maps) so it matches the rawHash the campaign compiler
    // already computed and what load() recomputes after reconstituting Maps.
    const storableState = { ...state, snapshot: toStorableSnapshot(state.snapshot) };
    const serialized = canonicalSerialize(storableState);
    const stateHash = sha256Hex(canonicalSerialize(stateForHash));
    const serializedHash = sha256Hex(serialized);
    const snapshotHash = sha256Hex(canonicalSerialize(toStorableSnapshot(state.snapshot)));
    const previousSaveId = this.getActiveSaveId(saveDir) ?? undefined;

    const sig: SigFile = {
      serializedHash,
      stateHash,
      compatibilityVersion: state.snapshot.compatibilityVersion,
    };
    const metadata: SaveMetadata = {
      saveId,
      previousSaveId,
      timestamp: new Date().toISOString(),
      turnNumber: state.snapshot.turnNumber,
      campaignId: state.snapshot.campaignId,
      snapshotHash,
      compatibilityVersion: state.snapshot.compatibilityVersion,
      // The hash of the serialized on-disk artifact, matching the name.
      contentArtifactHash: serializedHash,
    };

    // `published` guards the outer catch: once the directory has been renamed
    // to savePath, tmpDir no longer exists (cleanup is a no-op) and a failure
    // must remove the published-but-not-yet-active save instead.
    let published = false;
    try {
      mkdirSync(tmpDir, { recursive: true });
      writeFileSync(join(tmpDir, "campaign.json"), serialized, "utf8");
      writeFileSync(join(tmpDir, "campaign.sig.json"), JSON.stringify(sig, null, 2), "utf8");
      writeFileSync(join(tmpDir, "metadata.json"), JSON.stringify(metadata, null, 2), "utf8");

      if (signal?.aborted) {
        cleanup(tmpDir);
        throw createAbortError();
      }

      // Atomic publication as a complete unit (TODO #4): build every artifact
      // inside tmpDir, then rename the whole directory. tmpDir and savePath
      // share saveDir as parent, so the rename never crosses filesystems.
      renameSync(tmpDir, savePath);
      published = true;

      if (signal?.aborted) {
        // The save is fully written but is not yet the active save. Remove it
        // and leave the pointer untouched — never roll a pointer back that we
        // never advanced (TODO #5/#6).
        rmSync(savePath, { recursive: true, force: true });
        throw createAbortError();
      }

      updatePointer(saveDir, saveId, previousSaveId);

      return { savePath, hash: stateHash, metadata };
    } catch (err) {
      cleanup(tmpDir);
      if (published && existsSync(savePath)) {
        rmSync(savePath, { recursive: true, force: true });
      }
      throw err;
    }
  }

  load(
    saveDir: string,
    diagnostics: DiagnosticCollector,
    signal?: AbortSignal,
  ): CampaignState | null {
    if (signal?.aborted) {
      diagnostics.addError(CANCELLED_CODE, "Load operation was cancelled", {
        stage: "persistence.load",
      });
      return null;
    }

    if (!existsSync(saveDir)) {
      diagnostics.addError(MISSING_SAVE_CODE, `Save directory not found: ${saveDir}`, {
        stage: "persistence.load",
      });
      return null;
    }

    const pointerPath = join(saveDir, "pointer.json");
    if (!existsSync(pointerPath)) {
      diagnostics.addError(
        MISSING_SAVE_CODE,
        `No pointer file found in save directory: ${saveDir}`,
        {
          stage: "persistence.load",
        },
      );
      return null;
    }

    if (signal?.aborted) {
      diagnostics.addError(CANCELLED_CODE, "Load operation was cancelled", {
        stage: "persistence.load",
      });
      return null;
    }

    let pointer: PointerFile;
    try {
      pointer = PointerFileSchema.parse(JSON.parse(readFileSync(pointerPath, "utf8")));
    } catch {
      diagnostics.addError(CORRUPT_SAVE_CODE, "Pointer file is corrupt or unreadable", {
        stage: "persistence.load",
      });
      return null;
    }

    return this.loadById(saveDir, pointer.activeSaveId, diagnostics, signal);
  }

  /**
   * Loads a specific save by id, bypassing the active pointer. Lets callers
   * (e.g. replay verification) reach a save's *predecessor* — the snapshot a
   * turn was executed against — rather than only ever the current active save.
   */
  loadById(
    saveDir: string,
    saveId: string,
    diagnostics: DiagnosticCollector,
    signal?: AbortSignal,
  ): CampaignState | null {
    if (signal?.aborted) {
      diagnostics.addError(CANCELLED_CODE, "Load operation was cancelled", {
        stage: "persistence.load",
      });
      return null;
    }

    // Reject any id that could escape saveDir before a single fs operation
    // (TODO #3).
    if (!isValidSaveId(saveId)) {
      diagnostics.addError(CORRUPT_SAVE_CODE, "Save id is not a valid identifier", {
        stage: "persistence.load",
      });
      return null;
    }

    if (!existsSync(saveDir)) {
      diagnostics.addError(MISSING_SAVE_CODE, `Save directory not found: ${saveDir}`, {
        stage: "persistence.load",
      });
      return null;
    }

    const savePath = join(saveDir, saveId);
    if (!isContainedIn(saveDir, savePath)) {
      diagnostics.addError(CORRUPT_SAVE_CODE, "Save id escapes the save directory", {
        stage: "persistence.load",
      });
      return null;
    }

    const campaignPath = join(savePath, "campaign.json");
    const sigPath = join(savePath, "campaign.sig.json");

    if (!existsSync(campaignPath)) {
      diagnostics.addError(CORRUPT_SAVE_CODE, `Save data file not found: ${campaignPath}`, {
        stage: "persistence.load",
      });
      return null;
    }

    if (signal?.aborted) {
      diagnostics.addError(CANCELLED_CODE, "Load operation was cancelled", {
        stage: "persistence.load",
      });
      return null;
    }

    let campaignJson: string;
    try {
      campaignJson = readFileSync(campaignPath, "utf8");
    } catch {
      diagnostics.addError(CORRUPT_SAVE_CODE, "Failed to read save data file", {
        stage: "persistence.load",
      });
      return null;
    }

    if (signal?.aborted) {
      diagnostics.addError(CANCELLED_CODE, "Load operation was cancelled", {
        stage: "persistence.load",
      });
      return null;
    }

    // Stage 1 — parse as `unknown` and validate only the minimal header, so the
    // compatibility version can be checked BEFORE materializing the
    // version-specific schema. This guarantees structurally-obsolete saves get
    // the stable compatibility diagnostic rather than a mislabeled corruption
    // diagnostic (TODO #14).
    let raw: unknown;
    try {
      raw = JSON.parse(campaignJson);
    } catch {
      diagnostics.addError(CORRUPT_SAVE_CODE, "Save data file contains invalid JSON", {
        stage: "persistence.load",
      });
      return null;
    }

    const headerResult = SaveHeaderSchema.safeParse(raw);
    if (!headerResult.success) {
      diagnostics.addError(CORRUPT_SAVE_CODE, "Save data is missing required fields", {
        stage: "persistence.load",
      });
      return null;
    }

    if (!CompatibilityChecker.check(headerResult.data.snapshot.compatibilityVersion, diagnostics)) {
      return null;
    }

    if (signal?.aborted) {
      diagnostics.addError(CANCELLED_CODE, "Load operation was cancelled", {
        stage: "persistence.load",
      });
      return null;
    }

    // Stage 2 — runtime-structural validation of the accepted compatibility
    // version (TODO #9). The deep value-fidelity is then enforced by the
    // envelope + rawHash checks below.
    const parsedResult = StorableCampaignStateSchema.safeParse(raw);
    if (!parsedResult.success) {
      diagnostics.addError(CORRUPT_SAVE_CODE, "Save data is structurally invalid", {
        stage: "persistence.load",
      });
      return null;
    }

    if (signal?.aborted) {
      diagnostics.addError(CANCELLED_CODE, "Load operation was cancelled", {
        stage: "persistence.load",
      });
      return null;
    }

    // Stage 3 — reconstitute the Records written by toStorableSnapshot back into
    // real Maps (nations, designs, designFamilies, activeCandidates) before any
    // hash/envelope verification below, so those checks run over the same shape
    // (real Maps) the campaign compiler used when it originally computed
    // rawHash/envelope.
    let state: CampaignState;
    try {
      state = {
        ...parsedResult.data,
        snapshot: fromStorableSnapshot(
          parsedResult.data.snapshot as unknown as StorableCampaignSnapshot,
        ),
      };
    } catch {
      diagnostics.addError(CORRUPT_SAVE_CODE, "Save data snapshot is malformed", {
        stage: "persistence.load",
      });
      return null;
    }

    if (signal?.aborted) {
      diagnostics.addError(CANCELLED_CODE, "Load operation was cancelled", {
        stage: "persistence.load",
      });
      return null;
    }

    // Integrity gate A — semantic state hash must equal the persisted rawHash.
    const { rawHash: _rawHash, ...stateForHash } = state;
    const computedRawHash = sha256Hex(canonicalSerialize(stateForHash));
    if (computedRawHash !== state.rawHash) {
      diagnostics.addError(
        CORRUPT_SAVE_CODE,
        "Save data hash mismatch: content has been modified",
        {
          stage: "persistence.load",
        },
      );
      return null;
    }

    // Integrity gate B — validate the signature file, never trust it blindly
    // (TODO #1/#5). Returns false (with the diagnostic) when the load must be
    // refused. A save with NO signature file is a legacy save written before the
    // signature existed (or a turn-zero campaign): it is loaded with a warning,
    // not rejected, so existing saves are not broken. Note this knowingly
    // accepts signature *deletion* (indistinguishable from a true legacy save) —
    // the independent-tamper guarantee holds for any save that still carries a
    // signature (ADR-0032).
    if (!this.validateSignature(sigPath, sha256Hex(campaignJson), state, diagnostics)) {
      return null;
    }

    if (!verifyEnvelope(state["envelope"], state["snapshot"])) {
      diagnostics.addError(
        CORRUPT_SAVE_CODE,
        "Save envelope verification failed: snapshot does not match envelope",
        {
          stage: "persistence.load",
        },
      );
      return null;
    }

    return state;
  }

  /**
   * Integrity gate B — validates `campaign.sig.json` against the on-disk
   * serialized bytes and the reconstituted semantic state. Returns `true` if the
   * save may load. A save with no signature file is a legacy save: it emits a
   * warning and loads (returning `true`). A present-but-invalid or mismatching
   * signature hard-rejects (returning `false`, plus an error diagnostic).
   */
  private validateSignature(
    sigPath: string,
    rawSerializedHash: string,
    state: CampaignState,
    diagnostics: DiagnosticCollector,
  ): boolean {
    if (!existsSync(sigPath)) {
      diagnostics.addWarning(
        UNSIGNED_SAVE_CODE,
        "Save has no signature file; loaded as legacy with no independent on-disk tamper verification",
        { stage: "persistence.load" },
      );
      return true;
    }

    let sig: SigFile;
    try {
      sig = SigFileSchema.parse(JSON.parse(readFileSync(sigPath, "utf8")));
    } catch {
      diagnostics.addError(CORRUPT_SAVE_CODE, "Save signature file is invalid", {
        stage: "persistence.load",
      });
      return false;
    }
    if (sig.serializedHash !== rawSerializedHash) {
      diagnostics.addError(CORRUPT_SAVE_CODE, "Save signature does not match serialized content", {
        stage: "persistence.load",
      });
      return false;
    }
    if (sig.stateHash !== state.rawHash) {
      diagnostics.addError(CORRUPT_SAVE_CODE, "Save signature does not match state", {
        stage: "persistence.load",
      });
      return false;
    }
    if (sig.compatibilityVersion !== state.snapshot.compatibilityVersion) {
      diagnostics.addError(CORRUPT_SAVE_CODE, "Save signature version does not match state", {
        stage: "persistence.load",
      });
      return false;
    }
    return true;
  }

  list(saveDir: string): SaveMetadata[] {
    if (!existsSync(saveDir)) {
      return [];
    }

    const entries = readdirSync(saveDir, { withFileTypes: true });
    const saves: SaveMetadata[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const dirName = entry.name;
      if (dirName.startsWith(".tmp_")) continue;

      const metaPath = join(saveDir, dirName, "metadata.json");
      const sigPath = join(saveDir, dirName, "campaign.sig.json");

      // Metadata and signature fallback are independent gates (TODO #11): a
      // directory with no/invalid metadata but a valid signature still lists.
      if (existsSync(metaPath)) {
        try {
          const meta = SaveMetadataSchema.parse(JSON.parse(readFileSync(metaPath, "utf8")));
          saves.push(meta);
          continue;
        } catch {
          // Fall through to the signature fallback.
        }
      }

      if (existsSync(sigPath)) {
        try {
          const sig = SigFileSchema.parse(JSON.parse(readFileSync(sigPath, "utf8")));
          saves.push({
            saveId: dirName,
            timestamp: "",
            turnNumber: 0,
            campaignId: "",
            // The signature file does not carry a snapshot hash (only the
            // on-disk serialized hash and the whole-campaign state hash), so a
            // degraded record that lacks metadata cannot honestly report one.
            // Leave it empty rather than mislabel it with the state hash (the
            // exact wrong value ticket 03 eliminated from the save path).
            snapshotHash: "",
            compatibilityVersion: sig.compatibilityVersion,
            contentArtifactHash: sig.serializedHash,
          });
        } catch {
          // Skip invalid save directories.
        }
      }
    }

    // Deterministic newest-first ordering. Primary key is the wall-clock
    // timestamp, but equal timestamps (two saves written within the same
    // millisecond — construction commands write extra saves at the same
    // revision) must NOT fall back to the OS `readdirSync` order, which is
    // platform-dependent. Tie-break by the save chain: the active save is
    // the truly-newest, its (immediate) predecessor second, orphans last —
    // then saveId descending as the final total order (saveId embeds the
    // creation timestamp), so the result is identical on every platform for
    // the same package (F6).
    const chainRank = new Map<string, number>();
    const activeSaveId = this.getActiveSaveId(saveDir);
    if (activeSaveId !== null) chainRank.set(activeSaveId, 0);
    const previousSaveId = this.getPreviousSaveId(saveDir);
    if (previousSaveId !== null && !chainRank.has(previousSaveId)) chainRank.set(previousSaveId, 1);

    saves.sort((a, b) => {
      const byTimestamp = b.timestamp.localeCompare(a.timestamp);
      if (byTimestamp !== 0) return byTimestamp;
      const byChain = (chainRank.get(a.saveId) ?? 2) - (chainRank.get(b.saveId) ?? 2);
      if (byChain !== 0) return byChain;
      return b.saveId.localeCompare(a.saveId);
    });
    return saves;
  }

  getActiveSaveId(saveDir: string): string | null {
    const pointerPath = join(saveDir, "pointer.json");
    if (!existsSync(pointerPath)) return null;
    try {
      const pointer = PointerFileSchema.parse(JSON.parse(readFileSync(pointerPath, "utf8")));
      return pointer.activeSaveId;
    } catch {
      return null;
    }
  }

  /**
   * The save id that was active immediately before the current one — i.e.
   * the snapshot the active save's turn was executed against. `null` if the
   * active save is the first save in this directory (no predecessor) or the
   * pointer is missing/corrupt.
   */
  getPreviousSaveId(saveDir: string): string | null {
    const pointerPath = join(saveDir, "pointer.json");
    if (!existsSync(pointerPath)) return null;
    try {
      const pointer = PointerFileSchema.parse(JSON.parse(readFileSync(pointerPath, "utf8")));
      return pointer.previousSaveId ?? null;
    } catch {
      return null;
    }
  }
}

// `previousSaveId` is read once at the start of save() so that the pointer and
// the save's own metadata record the same predecessor (TODO #7). The update is
// a single write+atomic-rename; within a single synchronous process two saves
// cannot interleave here. Cross-process safety is handled by the app-level
// persistence owner (single IPC queue) per ADR-….
function updatePointer(saveDir: string, activeSaveId: string, previousSaveId?: string): void {
  const pointerPath = join(saveDir, "pointer.json");
  const pointer: PointerFile = {
    activeSaveId,
    ...(previousSaveId !== undefined ? { previousSaveId } : {}),
  };
  const tmpPath = `${pointerPath}.tmp`;
  writeFileSync(tmpPath, JSON.stringify(pointer, null, 2), "utf8");
  renameSync(tmpPath, pointerPath);
}
