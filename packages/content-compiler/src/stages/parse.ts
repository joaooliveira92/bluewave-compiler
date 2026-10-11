//packages/content-compiler/src/stages/parse.ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseYamlSafe } from "@bluewave/content-schema";
import type { DiagnosticCollector } from "@bluewave/diagnostics";

import type { CompilerInput, CompilerStage } from "../index.js";

export interface ParseOutput {
  manifest: unknown;
  /** Raw (unvalidated) items per array-shaped collection, in file order. */
  collectionDocs: Map<string, unknown[]>;
  /** The source file each `collectionDocs` item came from, index-aligned. */
  sourcePaths: Map<string, string[]>;
  /** Single-document collections (e.g. the ship-building balance mapping). */
  objectDocs: Map<string, unknown>;
}

/**
 * Collections whose files are a mapping wrapping a named sequence, e.g.
 * `components.yaml` is `{ components: [...] }`. The map value is the sequence
 * property to extract; the collection key is the map key.
 */
const WRAPPED_GROUPS: Readonly<Record<string, string>> = {
  shipComponents: "components",
  propulsionPlants: "plants",
  shipHullForms: "hullForms",
  gunFamilies: "gunFamilies",
  gunModels: "gunModels",
  gunMounts: "gunMounts",
  ammunition: "ammunition",
  navalProfiles: "navalProfiles",
  referenceDesigns: "designs",
};

/** Collections whose files are a single mapping, kept whole (e.g. balance.yaml). */
const OBJECT_GROUPS = ["shipBalance"] as const;

export class ParseStage implements CompilerStage<CompilerInput, ParseOutput> {
  readonly name = "parse";

  run(
    input: CompilerInput,
    signal: AbortSignal,
    collector: DiagnosticCollector,
  ): ParseOutput | undefined {
    const collectionDocs = new Map<string, unknown[]>();
    const sourcePaths = new Map<string, string[]>();
    const objectDocs = new Map<string, unknown>();

    const fileGroups: Record<string, string[]> = {
      manifest: [input.manifestPath],
      rulesets: input.rulesetFiles,
      countries: input.countryFiles,
      areas: input.areaFiles,
      routes: input.routeFiles,
      possessions: input.possessionFiles,
      ports: input.portFiles,
      technologies: input.technologyFiles,
      shipComponents: input.shipComponentFiles ?? [],
      propulsionPlants: input.propulsionPlantFiles ?? [],
      shipHullForms: input.hullFormFiles ?? [],
      shipBalance: input.shipBalanceFiles ?? [],
      gunFamilies: input.gunFamilyFiles ?? [],
      gunModels: input.gunModelFiles ?? [],
      gunMounts: input.gunMountFiles ?? [],
      ammunition: input.ammunitionFiles ?? [],
      navalProfiles: input.navalProfileFiles ?? [],
      referenceDesigns: input.referenceDesignFiles ?? [],
    };

    let manifest: unknown = undefined;

    for (const [group, files] of Object.entries(fileGroups)) {
      if (signal.aborted) return undefined;
      for (const file of files) {
        const fullPath = resolve(input.contentDir, file);
        try {
          const content = readFileSync(fullPath, "utf8");
          const result = parseYamlSafe(content, file, collector);
          if (result.success && result.data !== undefined) {
            this.collect(group, file, result.data, {
              manifest: (value) => {
                manifest = value;
              },
              collectionDocs,
              sourcePaths,
              objectDocs,
              collector,
            });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          collector.addError("FILE-READ", `Failed to read file: ${message}`, {
            stage: "parse",
            sourceLocation: { path: file, line: 1 },
          });
        }
      }
    }

    if (collector.hasErrors) return undefined;
    return { manifest, collectionDocs, sourcePaths, objectDocs };
  }

  private collect(
    group: string,
    file: string,
    data: unknown,
    sink: {
      manifest: (value: unknown) => void;
      collectionDocs: Map<string, unknown[]>;
      sourcePaths: Map<string, string[]>;
      objectDocs: Map<string, unknown>;
      collector: DiagnosticCollector;
    },
  ): void {
    if (group === "manifest") {
      sink.manifest(data);
      return;
    }

    if (OBJECT_GROUPS.includes(group as (typeof OBJECT_GROUPS)[number])) {
      sink.objectDocs.set(group, data);
      return;
    }

    const wrappedProperty = WRAPPED_GROUPS[group];
    if (wrappedProperty !== undefined) {
      if (typeof data !== "object" || data === null || Array.isArray(data)) {
        sink.collector.addError(
          "SCHEMA",
          `Expected object for '${group}' wrapping '${wrappedProperty}', got ${describe(data)}`,
          { stage: "parse", sourceLocation: { path: file, line: 1 } },
        );
        return;
      }
      const items = (data as Record<string, unknown>)[wrappedProperty];
      if (!Array.isArray(items)) {
        sink.collector.addError(
          "SCHEMA",
          `Expected array '${wrappedProperty}' in '${group}', got ${describe(items)}`,
          { stage: "parse", sourceLocation: { path: file, line: 1 } },
        );
        return;
      }
      pushItems(sink, group, file, items);
      return;
    }

    if (Array.isArray(data)) {
      pushItems(sink, group, file, data);
    } else {
      sink.collector.addError("SCHEMA", `Expected array for '${group}', got object`, {
        stage: "parse",
        sourceLocation: { path: file, line: 1 },
      });
    }
  }
}

function pushItems(
  sink: {
    collectionDocs: Map<string, unknown[]>;
    sourcePaths: Map<string, string[]>;
  },
  group: string,
  file: string,
  items: unknown[],
): void {
  const existing = sink.collectionDocs.get(group) ?? [];
  const existingSources = sink.sourcePaths.get(group) ?? [];
  existing.push(...items);
  existingSources.push(...items.map(() => file));
  sink.collectionDocs.set(group, existing);
  sink.sourcePaths.set(group, existingSources);
}

function describe(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}
