// packages/campaign/src/campaignInput.ts
// Untrusted campaign-input adapter: secure YAML file loading plus the primitive
// coercions every campaign data builder uses when reading raw records. Keeping
// the filesystem/path-traversal boundary and the coercion contract in one place
// means builders depend on a single explicit input boundary rather than on
// ambient I/O.
import { readFileSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { SafeInt } from "@bluewave/contracts";
import type { DiagnosticCollector } from "@bluewave/diagnostics";
import { parse } from "yaml";

export function toSafeInt(value: unknown): SafeInt {
  if (typeof value === "number") return SafeInt(value);
  return SafeInt(0);
}

export function toSafeIntOpt(value: unknown, fallback: SafeInt): SafeInt {
  if (typeof value === "number") return SafeInt(value);
  return fallback;
}

export function toStr(value: unknown, fallback = ""): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

function isInside(parentResolved: string, childResolved: string): boolean {
  const rel = relative(parentResolved, childResolved);
  if (!rel) return true; // same dir
  if (isAbsolute(rel)) return false;
  if (rel === ".." || rel.startsWith(`..${sep}`)) return false;
  return childResolved === parentResolved || childResolved.startsWith(parentResolved + sep);
}

function parseYamlFile(
  filePath: string,
  contentDir: string,
  collector: DiagnosticCollector,
): unknown[] | undefined {
  const contentDirResolved = resolve(contentDir);
  const fullPath = resolve(contentDirResolved, filePath);

  // secure: reject absolute escapes & traversal
  if (!isInside(contentDirResolved, fullPath)) {
    collector.addError("CAMPAIGN-PATH", `Path traversal rejected for campaign file: ${filePath}`, {
      stage: "campaign-compile",
    });
    return undefined;
  }

  try {
    const content = readFileSync(fullPath, "utf8");
    const doc = parse(content);
    if (Array.isArray(doc)) return doc;
    collector.addError("CAMPAIGN-PARSE", `Expected array in campaign file: ${filePath}`, {
      stage: "campaign-compile",
    });
    return undefined;
  } catch (err) {
    const msg = err instanceof Error ? err.message : toStr(err);
    collector.addError("CAMPAIGN-READ", `Failed to read campaign file ${filePath}: ${msg}`, {
      stage: "campaign-compile",
    });
    return undefined;
  }
}

export function loadCampaignFiles(
  files: string[],
  contentDir: string,
  collector: DiagnosticCollector,
  signal?: AbortSignal,
): unknown[] {
  const all: unknown[] = [];
  for (const file of files) {
    if (signal?.aborted) break;
    const data = parseYamlFile(file, contentDir, collector);
    if (data) all.push(...data);
  }
  return all;
}

/** Authored campaign file groups consumed by a campaign compile. */
export interface CampaignFiles {
  fleetFiles: string[];
  economyFiles: string[];
  constructionFiles: string[];
  diplomacyFiles: string[];
  researchFiles: string[];
  designFiles: string[];
}

/** Authored campaign data, each group flattened in declared file order. */
export interface CampaignFileData {
  fleets: unknown[];
  economies: unknown[];
  constructions: unknown[];
  diplomacy: unknown[];
  research: unknown[];
  designs: unknown[];
}

export function loadAllCampaignData(
  files: CampaignFiles,
  contentDir: string,
  collector: DiagnosticCollector,
  signal?: AbortSignal,
): CampaignFileData {
  return {
    fleets: loadCampaignFiles(files.fleetFiles, contentDir, collector, signal),
    economies: loadCampaignFiles(files.economyFiles, contentDir, collector, signal),
    constructions: loadCampaignFiles(files.constructionFiles, contentDir, collector, signal),
    diplomacy: loadCampaignFiles(files.diplomacyFiles, contentDir, collector, signal),
    research: loadCampaignFiles(files.researchFiles, contentDir, collector, signal),
    designs: loadCampaignFiles(files.designFiles, contentDir, collector, signal),
  };
}
