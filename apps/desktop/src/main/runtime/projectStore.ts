// The campaign save package (`SaveStore`) + the app-owned session sidecar, as one
// service (INC-3; ADR-0159). Owns every persistence seam: save/load/list/
// integrity, the per-save month input, and the session sidecar.
import type { CampaignState } from "@bluewave/campaign";
import type { DiagnosticCollector } from "@bluewave/diagnostics";
import { SaveStore, type SaveMetadata } from "@bluewave/persistence";
import { Context, Effect, Layer } from "effect";
import {
  readSessionMetadata,
  writeSessionMetadata,
  type SessionMetadata,
} from "../campaignSessionMetadata.js";
import { CommandFailed } from "./commandError.js";

function failure(reason: string, error: unknown): CommandFailed {
  return new CommandFailed({
    reason,
    diagnostics: [error instanceof Error ? error.message : String(error)],
  });
}

export interface LoadedMonthInput {
  readonly status: "present" | "missing" | "corrupt";
  readonly value?: unknown;
}

export class ProjectStore extends Context.Service<
  ProjectStore,
  {
    readonly isCurrent: (
      state: CampaignState,
      saveDir: string,
    ) => Effect.Effect<boolean, CommandFailed>;
    readonly save: (state: CampaignState, saveDir: string) => Effect.Effect<void, CommandFailed>;
    readonly load: (
      saveDir: string,
      collector: DiagnosticCollector,
    ) => Effect.Effect<CampaignState | null, CommandFailed>;
    readonly list: (saveDir: string) => Effect.Effect<readonly SaveMetadata[], CommandFailed>;
    readonly loadById: (
      saveDir: string,
      saveId: string,
      collector: DiagnosticCollector,
    ) => Effect.Effect<CampaignState | null, CommandFailed>;
    readonly loadMonthInput: (
      saveDir: string,
      saveId: string,
      collector: DiagnosticCollector,
    ) => Effect.Effect<LoadedMonthInput, CommandFailed>;
    readonly getActiveSaveId: (saveDir: string) => Effect.Effect<string | null, CommandFailed>;
    readonly getPreviousSaveId: (saveDir: string) => Effect.Effect<string | null, CommandFailed>;
    readonly readSessionMetadata: (
      saveDir: string,
    ) => Effect.Effect<SessionMetadata | null, CommandFailed>;
    readonly writeSessionMetadata: (
      saveDir: string,
      metadata: SessionMetadata,
    ) => Effect.Effect<void, CommandFailed>;
  }
>()("bluewave/desktop/ProjectStore") {}

export function projectStoreLayer(): Layer.Layer<ProjectStore> {
  const store = new SaveStore();
  return Layer.succeed(ProjectStore, {
    isCurrent: (state, saveDir) =>
      Effect.try({
        try: () => store.isCurrent(state, saveDir),
        catch: (e) => failure("SAVE_FAILED", e),
      }),
    save: (state, saveDir) =>
      Effect.try({
        try: () => {
          store.save(state, saveDir);
        },
        catch: (e) => failure("SAVE_FAILED", e),
      }),
    load: (saveDir, collector) =>
      Effect.try({
        try: () => store.load(saveDir, collector),
        catch: (e) => failure("LOAD_FAILED", e),
      }),
    list: (saveDir) =>
      Effect.try({
        try: () => store.list(saveDir),
        catch: (e) => failure("LOAD_FAILED", e),
      }),
    loadById: (saveDir, saveId, collector) =>
      Effect.try({
        try: () => store.loadById(saveDir, saveId, collector),
        catch: (e) => failure("LOAD_FAILED", e),
      }),
    loadMonthInput: (saveDir, saveId, collector) =>
      Effect.try({
        try: () => {
          const stored = store.loadMonthInput(saveDir, saveId, collector);
          if (stored.status === "present") {
            return { status: "present" as const, value: stored.value };
          }
          return {
            status: stored.status === "corrupt" ? ("corrupt" as const) : ("missing" as const),
          };
        },
        catch: (e) => failure("LOAD_FAILED", e),
      }),
    getActiveSaveId: (saveDir) =>
      Effect.try({
        try: () => store.getActiveSaveId(saveDir),
        catch: (e) => failure("LOAD_FAILED", e),
      }),
    getPreviousSaveId: (saveDir) =>
      Effect.try({
        try: () => store.getPreviousSaveId(saveDir),
        catch: (e) => failure("LOAD_FAILED", e),
      }),
    readSessionMetadata: (saveDir) =>
      Effect.try({
        try: () => readSessionMetadata(saveDir),
        catch: (e) => failure("SESSION_METADATA_INVALID", e),
      }),
    writeSessionMetadata: (saveDir, metadata) =>
      Effect.try({
        try: () => {
          writeSessionMetadata(saveDir, metadata);
        },
        catch: (e) => failure("SAVE_FAILED", e),
      }),
  });
}
