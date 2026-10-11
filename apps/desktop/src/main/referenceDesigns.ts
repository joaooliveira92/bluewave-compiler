import type { DesignDraft } from "@bluewave/ship-design";
import type { ShipBuildingCatalogue } from "@bluewave/content-compiler";

import { ContentArtifactError, readContentArtifact } from "./contentArtifact.js";
import { resolveGeneratedContentDir } from "./contentPack.js";

/** A raw reference design as authored under `ship-building/reference-designs/<nation>/` (ADR-0109). */
export interface RawReferenceDesignFile {
  readonly id: string;
  readonly name: string;
  readonly month: string;
  readonly starterFor?: string;
  readonly draft: DesignDraft;
}

/**
 * Every reference design, read from the compiled content artifact (ADR-0122) —
 * never from raw YAML. The artifact preserves the authored discovery order
 * (UK-first, starters then historical), so the first starter stays the
 * historical default (ADR-0109).
 */
export function readReferenceDesigns(): RawReferenceDesignFile[] {
  const { bundle } = readContentArtifact(resolveGeneratedContentDir());
  const catalogue = bundle.shipBuilding as ShipBuildingCatalogue | undefined;
  if (catalogue === undefined) {
    throw new ContentArtifactError(
      "CONTENT_ARTIFACT_INVALID",
      "The compiled content artifact carries no ship-building catalogue.",
    );
  }
  return catalogue.referenceDesigns as RawReferenceDesignFile[];
}
