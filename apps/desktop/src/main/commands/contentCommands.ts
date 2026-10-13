import type { BridgeResult } from "../../shared/bridge-contract.js";
import type {
  DrawingBoardContentDto,
  PresentationContentDto,
} from "../../shared/content-contract.js";
import { ContentArtifactError } from "../contentArtifact.js";
import { loadPresentationContent } from "../presentationContent.js";
import { loadShipBuildingData } from "../shipBuildingContent.js";

/**
 * The narrow content-query capability the drawing board uses: main decodes the
 * ship-building catalogue from the verified artifact once and ships the
 * data-only DTO over IPC. It exposes no file path, no generic file read, and no
 * YAML parsing — only already-decoded game content (ADR-0008, ADR-0105
 * `MIG-EXCL-1`, ticket 04 / CRI-IPC-1).
 */
export function inspectDrawingBoardContent(): BridgeResult<DrawingBoardContentDto> {
  try {
    return {
      outcome: "success",
      value: { catalogue: loadShipBuildingData() },
      diagnostics: [],
    };
  } catch (err) {
    if (ContentArtifactError.is(err)) {
      return { outcome: "error", reason: err.code, diagnostics: [err.message] };
    }
    const message = err instanceof Error ? err.message : String(err);
    return { outcome: "error", reason: "CONTENT_UNAVAILABLE", diagnostics: [message] };
  }
}

/**
 * Serves the decoded presentation corpus over the narrow content-query IPC
 * (CAH-PRES-3). Same fail-closed behaviour as the drawing-board content path:
 * an artifact that is missing or carries no presentation corpus returns a
 * stable error reason rather than a partial DTO.
 */
export function inspectPresentationContent(): BridgeResult<PresentationContentDto> {
  try {
    return { outcome: "success", value: loadPresentationContent(), diagnostics: [] };
  } catch (err) {
    if (ContentArtifactError.is(err)) {
      return { outcome: "error", reason: err.code, diagnostics: [err.message] };
    }
    const message = err instanceof Error ? err.message : String(err);
    return { outcome: "error", reason: "CONTENT_UNAVAILABLE", diagnostics: [message] };
  }
}
