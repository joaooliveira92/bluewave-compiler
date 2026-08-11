//packages/content-compiler/src/stages/compile.ts
import type { DiagnosticCollector } from "@bluewave/diagnostics";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import type { CompilerStage, CompilerOutput } from "../index.js";
import type { NormalizeOutput } from "./normalize.js";

export class CompileStage implements CompilerStage<NormalizeOutput, CompilerOutput> {
  readonly name = "compile";

  run(
    input: NormalizeOutput,
    _signal: AbortSignal,
    _collector: DiagnosticCollector,
  ): CompilerOutput {
    const artifact = {
      manifest: input.manifest,
      rulesets: input.rulesets,
      countries: input.countries,
      areas: input.areas,
      routes: input.routes,
      possessions: input.possessions,
      ports: input.ports,
      technologies: input.technologies,
    };

    const rawJson = canonicalSerialize(artifact);
    const rawHash = sha256Hex(rawJson);

    const envelope = {
      algorithm: "sha256",
      artifactKind: "content-pack",
      compatibilityVersion: "0.1.0",
      bodyHash: rawHash,
      bodyLength: Buffer.byteLength(rawJson, "utf8"),
    };

    const envelopeJson = canonicalSerialize(envelope);
    const envelopeHash = sha256Hex(envelopeJson);

    return {
      pack: artifact as unknown as import("@bluewave/content-schema").ContentPack,
      rawHash,
      envelopeHash,
    };
  }
}
