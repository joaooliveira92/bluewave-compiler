import {
  buildShipBuildingContent,
  type RawReferenceDesign,
  type ShipBuildingContent,
} from "@bluewave/ship-design";
import type { DrawingBoardContentDto } from "../../../../shared/content-contract.js";

/** A reference design offered as a starting point (identical to the authored `RawReferenceDesign`). */
export type ReferenceDesign = RawReferenceDesign;

/** Drawing-board content: the runtime catalogue plus the reference designs offered as starting points. */
export interface DrawingBoardContent extends ShipBuildingContent {
  readonly references: readonly ReferenceDesign[];
}

let injected: DrawingBoardContentDto | null = null;
let cached: DrawingBoardContent | null = null;

/**
 * The injectable content seam. The app hands over the DTO decoded by the main
 * process (`inspectDrawingBoardContent`) once it arrives over IPC; tests inject a
 * fixture directly. Nothing here parses YAML, reads the filesystem, or bundles a
 * validation runtime — the renderer only receives decoded domain data (ADR-0105
 * `MIG-EXCL-1`).
 */
export function setDrawingBoardContent(dto: DrawingBoardContentDto): void {
  injected = dto;
  cached = null;
}

/** True once the decoded content has been injected (from IPC in the app, from a fixture in tests). */
export function hasDrawingBoardContent(): boolean {
  return injected !== null;
}

/** The effect-free runtime view of a decoded DTO: rebuilds the catalogue and attaches the references. */
function buildDrawingBoardContent(dto: DrawingBoardContentDto): DrawingBoardContent {
  return {
    ...buildShipBuildingContent(dto.catalogue),
    references: dto.catalogue.referenceDesigns ?? [],
  };
}

/**
 * The synchronous loader the drawing board already calls. It reads the injected
 * DTO — the drawing board never parses content itself; if the DTO has not
 * arrived, it fails loudly rather than silently rendering unvalidated content.
 */
export function loadDrawingBoardContent(): DrawingBoardContent {
  if (cached) return cached;
  if (injected === null) {
    throw new Error(
      "Drawing-board content has not been loaded from the main process (inspectDrawingBoardContent).",
    );
  }
  cached = buildDrawingBoardContent(injected);
  return cached;
}
