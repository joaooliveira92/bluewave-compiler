// The compiled-content boundary as a service (INC-1; ADR-0159). Wraps the raw
// synchronous compiler call in an `Effect` method, so command programs resolve
// the artifact through the Layer rather than constructing it inline. Raw
// `node:*` stays inside the service; no platform services are adopted.
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { Context, Effect, Layer } from "effect";
import { compileProductionCampaignFromArtifact } from "../compiler.js";
import { resolveGeneratedContentDir } from "../contentPack.js";
import { CommandFailed } from "./commandError.js";

export type CompiledCampaign = NonNullable<
  ReturnType<typeof compileProductionCampaignFromArtifact>
>;

export class ContentArtifact extends Context.Service<
  ContentArtifact,
  {
    /** Compiles the production campaign, failing with `COMPILE_FAILED` diagnostics. */
    readonly compileProductionCampaign: () => Effect.Effect<CompiledCampaign, CommandFailed>;
  }
>()("bluewave/desktop/ContentArtifact") {}

/** The desktop main content-artifact layer; `artifactDir` defaults to the generated pack. */
export function contentArtifactLayer(
  artifactDir: string = resolveGeneratedContentDir(),
): Layer.Layer<ContentArtifact> {
  return Layer.succeed(ContentArtifact, {
    compileProductionCampaign: () =>
      Effect.gen(function* () {
        const collector = new DiagnosticCollector();
        const signal = new AbortController().signal;
        const output = yield* Effect.try({
          try: () => compileProductionCampaignFromArtifact(artifactDir, signal, collector),
          catch: (error) =>
            new CommandFailed({
              reason: "COMPILE_FAILED",
              diagnostics: [error instanceof Error ? error.message : String(error)],
            }),
        });
        if (!output || collector.hasErrors) {
          return yield* new CommandFailed({
            reason: "COMPILE_FAILED",
            diagnostics: collector.all.map((diagnostic) => diagnostic.message),
          });
        }
        return output;
      }),
  });
}
