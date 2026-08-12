//packages/content-compiler/src/compiler.ts
import type { DiagnosticCollector } from "@bluewave/diagnostics";
import type { CompilerInput, CompilerOutput, CompilerStage } from "./index.js";

import { CompileStage } from "./stages/compile.js";
import { NormalizeStage } from "./stages/normalize.js";
import { ParseStage } from "./stages/parse.js";
import { ValidateStage } from "./stages/validate.js";

export class Compiler {
  private stages: CompilerStage<unknown, unknown>[];

  constructor() {
    this.stages = [new ParseStage(), new ValidateStage(), new NormalizeStage(), new CompileStage()];
  }

  compile(
    input: CompilerInput,
    signal: AbortSignal,
    collector: DiagnosticCollector,
  ): CompilerOutput | undefined {
    let currentInput: unknown = input;

    for (const stage of this.stages) {
      if (signal.aborted) {
        collector.addInfo("ABORT", `Compilation aborted during stage '${stage.name}'`);
        return undefined;
      }

      const output = (stage as CompilerStage<unknown, unknown>).run(
        currentInput,
        signal,
        collector,
      );

      if (collector.hasErrors || output === undefined) {
        return undefined;
      }

      currentInput = output;
    }

    return currentInput as CompilerOutput;
  }
}
