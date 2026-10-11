import { hashWithContext } from "@bluewave/deterministic";
import type { ShipBuildingCatalogue } from "@bluewave/content-compiler";
import {
  buildShipBuildingContent,
  type AuthoredArmamentContent,
  type ComponentDef,
  type HullFormRecord,
  type NationNavalProfile,
  type PropulsionPlant,
  type RawReferenceDesign,
  type ShipBuildingContent,
  type ShipBuildingData,
} from "@bluewave/ship-design";

import { ContentArtifactError, readContentArtifact } from "./contentArtifact.js";
import { resolveGeneratedContentDir } from "./contentPack.js";

let cached: ShipBuildingContent | null = null;
let cachedHash: string | null = null;
let cachedArmamentHash: string | null = null;

/**
 * Loads the ship-building content from the compiled content artifact (ADR-0122)
 * once per process — never from raw YAML. The same content must be given to
 * every month execution so replays compile identically, and it is exactly the
 * content the compiler validated (ticket 03, CRI-MAIN-1).
 */
export function loadShipBuildingContent(): ShipBuildingContent {
  if (cached) return cached;
  const { bundle, manifest } = readContentArtifact(resolveGeneratedContentDir());
  const catalogue = bundle.shipBuilding as ShipBuildingCatalogue | undefined;
  if (catalogue === undefined) {
    throw new ContentArtifactError(
      "CONTENT_ARTIFACT_INVALID",
      "The compiled content artifact carries no ship-building catalogue.",
    );
  }
  const data: ShipBuildingData = {
    components: catalogue.components as ComponentDef[],
    plants: catalogue.plants as unknown as PropulsionPlant[],
    hullForms: catalogue.hullForms as HullFormRecord[],
    balance: catalogue.balance as ShipBuildingData["balance"],
    technologies: bundle.technologies as { id: string; year: number }[],
    navalProfiles: catalogue.navalProfiles as unknown as NationNavalProfile[],
    armament: catalogue.armament as unknown as AuthoredArmamentContent,
    referenceDesigns: catalogue.referenceDesigns as RawReferenceDesign[],
  };
  cached = buildShipBuildingContent(data);
  // Artifact-derived identity (ADR-0123): the recorded content hash is the
  // artifact's canonical body hash under a domain-separated envelope, so the
  // identity is exactly the thing CI validated — never the raw file bytes.
  cachedHash = hashWithContext(manifest.bodyHash, "ship-building-content");
  cachedArmamentHash = hashWithContext(manifest.bodyHash, "armament-content");
  return cached;
}

/**
 * Hash of the compiled ship-building content a month ran on. A month records it
 * so a replay can tell "the content changed since" (an expected difference after
 * a content update) from a real divergence. Artifact-derived and
 * domain-separated, so it is content-derived and tamper-evident (ADR-0123).
 */
export function shipBuildingContentHash(): string {
  loadShipBuildingContent();
  return cachedHash!;
}

/**
 * A separately versioned, domain-separated identity derived from the same
 * artifact body hash (ADR-0093 Step 3). Kept as its own recorded field so older
 * saves keep their existing content identity; a replay can detect an armament
 * content change on its own. Deterministic across processes.
 */
export function armamentContentHash(): string {
  loadShipBuildingContent();
  return cachedArmamentHash!;
}
