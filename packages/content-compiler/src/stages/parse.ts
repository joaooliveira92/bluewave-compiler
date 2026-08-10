import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { DiagnosticCollector } from "@bluewave/diagnostics";
import { parseYamlSafe } from "@bluewave/content-schema";
import type { CompilerStage, CompilerInput } from "../index.js";

export interface ParseOutput {
  manifest: unknown;
  collectionDocs: Map<string, unknown[]>;
}

export class ParseStage implements CompilerStage<CompilerInput, ParseOutput> {
  readonly name = "parse";

  run(
    input: CompilerInput,
    signal: AbortSignal,
    collector: DiagnosticCollector,
  ): ParseOutput | undefined {
    const collectionDocs = new Map<string, unknown[]>();

    const fileGroups: Record<string, string[]> = {
      manifest: [input.manifestPath],
      rulesets: input.rulesetFiles,
      countries: input.countryFiles,
      areas: input.areaFiles,
      routes: input.routeFiles,
      possessions: input.possessionFiles,
      ports: input.portFiles,
      technologies: input.technologyFiles,
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
            if (group === "manifest") {
              manifest = result.data;
            } else if (Array.isArray(result.data)) {
              const existing = collectionDocs.get(group) ?? [];
              existing.push(...result.data);
              collectionDocs.set(group, existing);
            } else {
              collector.addError("SCHEMA", `Expected array for '${group}', got object`, {
                stage: "parse",
                sourceLocation: { path: file, line: 1 },
              });
            }
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
    return { manifest, collectionDocs };
  }
}
