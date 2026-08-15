import {
  readFileSync,
  writeFileSync,
  renameSync,
  mkdirSync,
  existsSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { canonicalSerialize, sha256Hex, verifyEnvelope } from "@bluewave/deterministic";
import type { CampaignState } from "@bluewave/campaign";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import type { DiagnosticCode } from "@bluewave/diagnostics";
import { CompatibilityChecker } from "./compatibility.js";
import { cleanup } from "./recovery.js";
import {
  fromStorableSnapshot,
  toStorableSnapshot,
  type StorableCampaignSnapshot,
} from "./snapshotSerialization.js";

export const CORRUPT_SAVE_CODE = "PERSISTENCE_CORRUPT_SAVE" as DiagnosticCode;
export const MISSING_SAVE_CODE = "PERSISTENCE_MISSING_SAVE" as DiagnosticCode;
export const CANCELLED_CODE = "PERSISTENCE_CANCELLED" as DiagnosticCode;

export interface SaveMetadata {
  saveId: string;
  timestamp: string;
  turnNumber: number;
  campaignId: string;
  snapshotHash: string;
  compatibilityVersion: string;
  contentArtifactHash: string;
}

export interface SaveResult {
  savePath: string;
  hash: string;
  metadata: SaveMetadata;
}

interface PointerFile {
  activeSaveId: string;
  previousSaveId?: string;
}

interface SigFile {
  hash: string;
  compatibilityVersion: string;
}

export class SaveStore {
  save(state: CampaignState, saveDir: string, signal?: AbortSignal): SaveResult {
    if (signal?.aborted) {
      throw new Error("AbortError");
    }

    const saveId = `${Date.now()}-${randomUUID()}`;
    const savePath = join(saveDir, saveId);
    const tmpDir = join(saveDir, `.tmp_${saveId}`);

    const { rawHash: _rh, ...stateForHash } = state;
    // Written form only: state's Map-valued snapshot fields (nations, designs,
    // designFamilies, activeCandidates) convert to plain Records so they survive
    // JSON.stringify. The hash below stays over the original `state`/`stateForHash`
    // (real Maps) so it matches the rawHash the campaign compiler already computed
    // and what load() recomputes after reconstituting Maps from disk.
    const storableState = { ...state, snapshot: toStorableSnapshot(state.snapshot) };
    const serialized = canonicalSerialize(storableState);
    const hash = sha256Hex(canonicalSerialize(stateForHash));
    const sig: SigFile = {
      hash,
      compatibilityVersion: state.snapshot.compatibilityVersion,
    };
    const metadata: SaveMetadata = {
      saveId,
      timestamp: new Date().toISOString(),
      turnNumber: state.snapshot.turnNumber as number,
      campaignId: state.snapshot.campaignId,
      snapshotHash: state.snapshot.campaignId,
      compatibilityVersion: state.snapshot.compatibilityVersion,
      contentArtifactHash: hash,
    };

    try {
      mkdirSync(tmpDir, { recursive: true });

      writeFileSync(join(tmpDir, "campaign.json"), serialized, "utf8");
      writeFileSync(join(tmpDir, "campaign.sig.json"), JSON.stringify(sig, null, 2), "utf8");
      writeFileSync(join(tmpDir, "metadata.json"), JSON.stringify(metadata, null, 2), "utf8");

      if (signal?.aborted) {
        cleanup(tmpDir);
        throw new Error("AbortError");
      }

      const campaignTmp = join(tmpDir, "campaign.json");
      const campaignFinal = join(savePath, "campaign.json");
      const sigTmp = join(tmpDir, "campaign.sig.json");
      const sigFinal = join(savePath, "campaign.sig.json");
      const metaTmp = join(tmpDir, "metadata.json");
      const metaFinal = join(savePath, "metadata.json");

      mkdirSync(savePath, { recursive: true });
      renameSync(campaignTmp, campaignFinal);
      renameSync(sigTmp, sigFinal);
      renameSync(metaTmp, metaFinal);

      cleanup(tmpDir);

      if (signal?.aborted) {
        pointerSaveRollback(saveDir, savePath);
        throw new Error("AbortError");
      }

      updatePointer(saveDir, saveId);

      return { savePath, hash, metadata };
    } catch (err) {
      cleanup(tmpDir);
      if (existsSync(savePath)) {
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

    let pointer: PointerFile;
    try {
      const pointerContent = readFileSync(pointerPath, "utf8");
      pointer = JSON.parse(pointerContent) as PointerFile;
    } catch {
      diagnostics.addError(CORRUPT_SAVE_CODE, "Pointer file is corrupt or unreadable", {
        stage: "persistence.load",
      });
      return null;
    }

    return this.loadById(saveDir, pointer["activeSaveId"], diagnostics, signal);
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

    if (!existsSync(saveDir)) {
      diagnostics.addError(MISSING_SAVE_CODE, `Save directory not found: ${saveDir}`, {
        stage: "persistence.load",
      });
      return null;
    }

    const savePath = join(saveDir, saveId);
    const campaignPath = join(savePath, "campaign.json");

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

    type StorableCampaignState = Omit<CampaignState, "snapshot"> & {
      snapshot: StorableCampaignSnapshot;
    };

    let parsed: StorableCampaignState;
    try {
      parsed = JSON.parse(campaignJson) as StorableCampaignState;
    } catch {
      diagnostics.addError(CORRUPT_SAVE_CODE, "Save data file contains invalid JSON", {
        stage: "persistence.load",
      });
      return null;
    }

    if (!parsed.snapshot || !parsed.envelope || !parsed.rawHash) {
      diagnostics.addError(CORRUPT_SAVE_CODE, "Save data is missing required fields", {
        stage: "persistence.load",
      });
      return null;
    }

    // Reconstitute the Records written by toStorableSnapshot back into real Maps
    // (nations, designs, designFamilies, activeCandidates) before any hash/envelope
    // verification below, so those checks run over the same shape (real Maps) the
    // campaign compiler used when it originally computed rawHash/envelope.
    let state: CampaignState;
    try {
      state = { ...parsed, snapshot: fromStorableSnapshot(parsed.snapshot) };
    } catch {
      diagnostics.addError(CORRUPT_SAVE_CODE, "Save data snapshot is malformed", {
        stage: "persistence.load",
      });
      return null;
    }

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

    if (signal?.aborted) {
      diagnostics.addError(CANCELLED_CODE, "Load operation was cancelled", {
        stage: "persistence.load",
      });
      return null;
    }

    if (!CompatibilityChecker.check(state.snapshot.compatibilityVersion, diagnostics)) {
      return null;
    }

    return state;
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

      if (existsSync(metaPath)) {
        try {
          const meta: SaveMetadata = JSON.parse(readFileSync(metaPath, "utf8")) as SaveMetadata;
          saves.push(meta);
        } catch {
          try {
            const sigContent = readFileSync(sigPath, "utf8");
            const sig: SigFile = JSON.parse(sigContent) as SigFile;
            saves.push({
              saveId: dirName,
              timestamp: "",
              turnNumber: 0,
              campaignId: "",
              snapshotHash: "",
              compatibilityVersion: sig.compatibilityVersion,
              contentArtifactHash: sig.hash,
            });
          } catch {
            // Skip corrupt save dirs
          }
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
      const pointer: PointerFile = JSON.parse(readFileSync(pointerPath, "utf8")) as PointerFile;
      return pointer["activeSaveId"];
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
      const pointer: PointerFile = JSON.parse(readFileSync(pointerPath, "utf8")) as PointerFile;
      return pointer["previousSaveId"] ?? null;
    } catch {
      return null;
    }
  }
}

function updatePointer(saveDir: string, activeSaveId: string): void {
  const pointerPath = join(saveDir, "pointer.json");
  let previousSaveId: string | undefined;

  if (existsSync(pointerPath)) {
    try {
      const existing: PointerFile = JSON.parse(readFileSync(pointerPath, "utf8")) as PointerFile;
      previousSaveId = existing["activeSaveId"];
    } catch {
      // Ignore corrupt existing pointer
    }
  }

  const pointer: PointerFile = { activeSaveId, previousSaveId };
  const tmpPath = `${pointerPath}.tmp`;
  writeFileSync(tmpPath, JSON.stringify(pointer, null, 2), "utf8");
  renameSync(tmpPath, pointerPath);
}

function pointerSaveRollback(saveDir: string, _newSavePath: string): void {
  const pointerPath = join(saveDir, "pointer.json");
  if (!existsSync(pointerPath)) return;

  try {
    const pointer: PointerFile = JSON.parse(readFileSync(pointerPath, "utf8")) as PointerFile;
    if (pointer["previousSaveId"]) {
      const revertedPointer: PointerFile = { activeSaveId: pointer["previousSaveId"] };
      const tmpPath = `${pointerPath}.tmp`;
      writeFileSync(tmpPath, JSON.stringify(revertedPointer, null, 2), "utf8");
      renameSync(tmpPath, pointerPath);
    }
  } catch {
    // Best-effort rollback
  }
}

export { cleanup } from "./recovery.js";
