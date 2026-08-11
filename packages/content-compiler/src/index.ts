//packages/content-compiler/src/index.ts
import type { DiagnosticCollector } from "@bluewave/diagnostics";
import type { ContentPack, PackManifest } from "@bluewave/content-schema";

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

export { ParseStage } from "./stages/parse.js";
export { ValidateStage } from "./stages/validate.js";
export { NormalizeStage } from "./stages/normalize.js";
export { CompileStage } from "./stages/compile.js";
export { Compiler } from "./compiler.js";
