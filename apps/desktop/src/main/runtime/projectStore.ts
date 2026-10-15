// The campaign save package (`SaveStore`) as a service (INC-3; ADR-0159). Wraps
// the synchronous persistence store so command programs persist through the
// Layer; a store throw on the authoritative path becomes a `SAVE_FAILED`
// `CommandFailed`.
import type { CampaignState } from "@bluewave/campaign";
import { SaveStore } from "@bluewave/persistence";
import { Context, Effect, Layer } from "effect";
import { CommandFailed } from "./commandError.js";

function saveFailed(error: unknown): CommandFailed {
  return new CommandFailed({
    reason: "SAVE_FAILED",
    diagnostics: [error instanceof Error ? error.message : String(error)],
  });
}

export class ProjectStore extends Context.Service<
  ProjectStore,
  {
    /** Whether the package's active save already matches `state` (no-op saves). */
    readonly isCurrent: (
      state: CampaignState,
      saveDir: string,
    ) => Effect.Effect<boolean, CommandFailed>;
    /** Writes `state` as a new versioned save in the package. */
    readonly save: (state: CampaignState, saveDir: string) => Effect.Effect<void, CommandFailed>;
  }
>()("bluewave/desktop/ProjectStore") {}

export function projectStoreLayer(): Layer.Layer<ProjectStore> {
  const store = new SaveStore();
  return Layer.succeed(ProjectStore, {
    isCurrent: (state, saveDir) =>
      Effect.try({ try: () => store.isCurrent(state, saveDir), catch: saveFailed }),
    save: (state, saveDir) =>
      Effect.try({
        try: () => {
          store.save(state, saveDir);
        },
        catch: saveFailed,
      }),
  });
}
