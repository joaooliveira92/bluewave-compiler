//packages/content-compiler/src/fullSurface.ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { CompilerInput } from "./index.js";
import { safePath } from "./safePath.js";
import { discoverShipBuildingFiles } from "./shipBuildingDiscovery.js";

/**
 * Builds the full-surface `CompilerInput` (content-pack collections **and** the
 * ship-building catalogue) from a pack manifest + content directory. Shared by
 * the compiler CLI's `content:check`/`content:build` and by the build-time
 * artifact generator, so there is one discovery path, not two.
 *
 * Throws a descriptive `Error` on a missing manifest/content directory or an
 * unparseable manifest; every resolved path is `safePath`-checked.
 */
export function buildFullSurfaceInput(manifestPath: string, contentDir: string): CompilerInput {
  const resolvedManifest = resolve(manifestPath);
  const resolvedContentDir = resolve(contentDir);
  if (!existsSync(resolvedManifest)) {
    throw new Error(`Manifest not found: ${resolvedManifest}`);
  }
  if (!existsSync(resolvedContentDir)) {
    throw new Error(`Content directory not found: ${resolvedContentDir}`);
  }

  let manifest: { files?: Record<string, string[]> };
  try {
    manifest = JSON.parse(readFileSync(resolvedManifest, "utf8")) as {
      files?: Record<string, string[]>;
    };
  } catch {
    throw new Error(`Failed to parse manifest: ${resolvedManifest}`);
  }

  const toAbsolute = (file: string) => resolve(resolvedContentDir, safePath(file));
  const files = manifest.files ?? {};
  const groups = discoverShipBuildingFiles(resolvedContentDir);

  return {
    manifestPath: resolvedManifest,
    contentDir: resolvedContentDir,
    rulesetFiles: (files.rulesets ?? []).map(toAbsolute),
    countryFiles: (files.countries ?? []).map(toAbsolute),
    areaFiles: (files.areas ?? []).map(toAbsolute),
    routeFiles: (files.routes ?? []).map(toAbsolute),
    possessionFiles: (files.possessions ?? []).map(toAbsolute),
    portFiles: (files.ports ?? []).map(toAbsolute),
    technologyFiles: (files.technologies ?? []).map(toAbsolute),
    shipComponentFiles: groups.shipComponentFiles.map(toAbsolute),
    propulsionPlantFiles: groups.propulsionPlantFiles.map(toAbsolute),
    hullFormFiles: groups.hullFormFiles.map(toAbsolute),
    shipBalanceFiles: groups.shipBalanceFiles.map(toAbsolute),
    gunFamilyFiles: groups.gunFamilyFiles.map(toAbsolute),
    gunModelFiles: groups.gunModelFiles.map(toAbsolute),
    gunMountFiles: groups.gunMountFiles.map(toAbsolute),
    ammunitionFiles: groups.ammunitionFiles.map(toAbsolute),
    navalProfileFiles: groups.navalProfileFiles.map(toAbsolute),
    referenceDesignFiles: groups.referenceDesignFiles.map(toAbsolute),
  };
}
