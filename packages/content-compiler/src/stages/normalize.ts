//packages/content-compiler/src/stages/normalize.ts
import type { DiagnosticCollector } from "@bluewave/diagnostics";

import type { CompilerStage } from "../index.js";
import type { ValidateOutput } from "./validate.js";

export interface NormalizeOutput {
  manifest: unknown;
  rulesets: Record<string, unknown>[];
  countries: Record<string, unknown>[];
  areas: Record<string, unknown>[];
  routes: Record<string, unknown>[];
  possessions: Record<string, unknown>[];
  ports: Record<string, unknown>[];
  technologies: Record<string, unknown>[];
}

function sortById<T extends Record<string, unknown>>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aId = a["id"];
    const bId = b["id"];
    if (typeof aId === "string" && typeof bId === "string") {
      return aId.localeCompare(bId);
    }
    return 0;
  });
}

export class NormalizeStage implements CompilerStage<ValidateOutput, NormalizeOutput> {
  readonly name = "normalize";

  run(
    input: ValidateOutput,
    _signal: AbortSignal,
    _collector: DiagnosticCollector,
  ): NormalizeOutput {
    return {
      manifest: input.manifest,
      rulesets: sortById(input.rulesets as Record<string, unknown>[]),
      countries: sortById(input.countries as Record<string, unknown>[]),
      areas: sortById(input.areas as Record<string, unknown>[]),
      routes: sortById(input.routes as Record<string, unknown>[]),
      possessions: sortById(input.possessions as Record<string, unknown>[]),
      ports: sortById(input.ports as Record<string, unknown>[]),
      technologies: sortById(input.technologies as Record<string, unknown>[]),
    };
  }
}
