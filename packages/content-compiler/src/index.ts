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
}

export interface CompilerOutput {
  pack: ContentPack;
  rawHash: string;
  envelopeHash: string;
}

export interface CompilerStage<I, O> {
  name: string;
  run(input: I, signal: AbortSignal, collector: DiagnosticCollector): O | undefined;
}

export { Compiler } from "./compiler.js";
export { CompileStage } from "./stages/compile.js";
export { NormalizeStage } from "./stages/normalize.js";
export { ParseStage } from "./stages/parse.js";
export { ValidateStage } from "./stages/validate.js";
