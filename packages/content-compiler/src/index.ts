//packages/content-compiler/src/index.ts

import type { ContentPack } from "@bluewave/content-schema";
import type { DiagnosticCollector } from "@bluewave/diagnostics";

export interface CompilerInput {
  manifestPath: string;
  contentDir: string;
  rulesetFiles: string[];
  countryFiles: string[];
  areaFiles: string[];
  routeFiles: string[];
  possessionFiles: string[];
  portFiles: string[];
  technologyFiles: string[];
  /**
   * Ship-building catalogue (the full authored surface). Every group is optional:
   * the content-pack-only `bwc compile` boundary leaves them undefined and its
   * artifact is byte-identical to before; `content:build`/`content:check` supply
   * them so the catalogue flows through the same four compiler stages.
   */
  shipComponentFiles?: string[];
  propulsionPlantFiles?: string[];
  hullFormFiles?: string[];
  shipBalanceFiles?: string[];
  gunFamilyFiles?: string[];
  gunModelFiles?: string[];
  gunMountFiles?: string[];
  ammunitionFiles?: string[];
  navalProfileFiles?: string[];
  referenceDesignFiles?: string[];
}

/**
 * The compiled ship-building catalogue: canonical, sorted, inert JSON that the
 * runtime can hand to `buildShipBuildingContent` without re-reading YAML. The
 * `technologies` collection lives on the bundle root (it is a content-pack
 * collection) and is joined by the consumer, mirroring the authored layout.
 */
export interface ShipBuildingCatalogue {
  components: unknown[];
  plants: unknown[];
  hullForms: unknown[];
  balance: unknown;
  navalProfiles: unknown[];
  armament: {
    gunFamilies: unknown[];
    gunModels: unknown[];
    gunMounts: unknown[];
    ammunition: unknown[];
  };
  referenceDesigns: unknown[];
}

/**
 * The full compiled content bundle: the content-pack collections plus the
 * ship-building catalogue, under one inert, hash-pinned artifact. `generatedBy`
 * is the do-not-edit marker (BW-RUL-002, DESIGN-05).
 */
export interface ContentBundle {
  generatedBy: string;
  manifest: unknown;
  rulesets: unknown[];
  nations: unknown[];
  areas: unknown[];
  routes: unknown[];
  possessions: unknown[];
  ports: unknown[];
  technologies: unknown[];
  shipBuilding?: ShipBuildingCatalogue;
}

export interface CompilerOutput {
  /** The content-pack subset (unchanged shape; the `bwc compile` wire format). */
  pack: ContentPack;
  rawHash: string;
  envelopeHash: string;
  /**
   * The full bundle, including the ship-building catalogue when the input
   * carried it. Always present; `shipBuilding` is absent for content-pack-only
   * inputs so `canonicalSerialize(bundle)` stays backwards-compatible.
   */
  bundle: ContentBundle;
  /** The semantic content version, from the pack manifest. */
  contentVersion: string;
}

export interface CompilerStage<I, O> {
  name: string;
  run(input: I, signal: AbortSignal, collector: DiagnosticCollector): O | undefined;
}

export { Compiler } from "./compiler.js";
export { BUNDLE_GENERATED_BY, CompileStage } from "./stages/compile.js";
export { NormalizeStage } from "./stages/normalize.js";
export { ParseStage } from "./stages/parse.js";
export { ValidateStage } from "./stages/validate.js";
export { safePath } from "./safePath.js";
export { discoverShipBuildingFiles, type ShipBuildingFileGroups } from "./shipBuildingDiscovery.js";
export { buildFullSurfaceInput } from "./fullSurface.js";
export {
  CONTENT_ARTIFACT_FILENAME,
  CONTENT_BUNDLE_ARTIFACT_KIND,
  CONTENT_BUNDLE_COMPATIBILITY_VERSION,
  CONTENT_BUNDLE_MANIFEST_VERSION,
  CONTENT_MANIFEST_FILENAME,
  buildContentBundleArtifact,
  verifyContentBundleArtifact,
  writeContentBundleArtifact,
  type ContentBundleArtifact,
  type ContentBundleLike,
  type ContentBundleManifest,
  type ContentBundleVerification,
} from "./artifact.js";
