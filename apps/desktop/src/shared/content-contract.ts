import type { ShipBuildingData } from "@bluewave/ship-design";

/**
 * The drawing-board content the main process decodes once and ships to the
 * renderer over the narrow content-query IPC (`inspectDrawingBoardContent`).
 *
 * Data-only: every field is structured-cloneable (the runtime
 * `ShipBuildingContent` the board compiles against carries functions and cannot
 * cross the wire; the renderer rebuilds it with the effect-free
 * `buildShipBuildingContent`). The renderer never sees a file path, a raw
 * document, or a parser — only this decoded DTO (ADR-0105 `MIG-EXCL-1`).
 *
 * `catalogue.referenceDesigns` is authored discovery order (UK first, starters
 * before historical), so the renderer's first reference design stays the
 * historical default (ADR-0109).
 */
export interface DrawingBoardContentDto {
  readonly catalogue: ShipBuildingData;
}
