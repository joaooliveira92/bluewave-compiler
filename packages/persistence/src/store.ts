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
  save(
    state: CampaignState,
    saveDir: string,
    signal?: AbortSignal,
  ): SaveResult {
    if (signal?.aborted) {
      throw new Error("AbortError");
    }

    const saveId = `${Date.now()}-${randomUUID()}`;
    const savePath = join(saveDir, saveId);
    const tmpDir = join(saveDir, `.tmp_${saveId}`);

    const { rawHash: _rh, ...stateForHash } = state;
    const serialized = canonicalSerialize(state);
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
      diagnostics.addError(MISSING_SAVE_CODE, `No pointer file found in save directory: ${saveDir}`, {
        stage: "persistence.load",
      });
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

    const saveId = pointer["activeSaveId"];
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

    let state: CampaignState;
    try {
      state = JSON.parse(campaignJson) as CampaignState;
    } catch {
      diagnostics.addError(CORRUPT_SAVE_CODE, "Save data file contains invalid JSON", {
        stage: "persistence.load",
      });
      return null;
    }

    if (!state.snapshot || !state.envelope || !state.rawHash) {
      diagnostics.addError(CORRUPT_SAVE_CODE, "Save data is missing required fields", {
        stage: "persistence.load",
      });
      return null;
    }

    const { rawHash: _rawHash, ...stateForHash } = state;
    const computedRawHash = sha256Hex(canonicalSerialize(stateForHash));
    if (computedRawHash !== state.rawHash) {
      diagnostics.addError(CORRUPT_SAVE_CODE, "Save data hash mismatch: content has been modified", {
        stage: "persistence.load",
      });
      return null;
    }

    if (!verifyEnvelope(state["envelope"], state["snapshot"])) {
      diagnostics.addError(CORRUPT_SAVE_CODE, "Save envelope verification failed: snapshot does not match envelope", {
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

    saves.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
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

function pointerSaveRollback(saveDir: string, newSavePath: string): void {
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