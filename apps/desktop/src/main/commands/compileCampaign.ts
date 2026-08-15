import { randomUUID } from "node:crypto";
import { createInitialCampaignState } from "@bluewave/campaign";
import { supportedPlayerSlotIds, type CampaignConfiguration } from "@bluewave/campaign-engine";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { SaveStore } from "@bluewave/persistence";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type { CompileCampaignResult } from "../../shared/campaign-command-contract.js";
import { registerCampaignSession } from "../campaignSessions.js";
import { writeSessionMetadata } from "../campaignSessionMetadata.js";
import { compileProductionCampaign } from "../compiler.js";
import { resolveProductionPackDir } from "../contentPack.js";
import { toSaveableState } from "../saveHelpers.js";

export interface CompileCampaignDeps {
  /** Directory of the content pack to compile against. */
  readonly contentDir: string;
  /**
   * Prompts the user for a directory to write the campaign's `SaveStore`
   * package into. Returns `null` if the user cancels. Main-process-driven,
   * same native-dialog pattern the retired `project:open`/`project:new`
   * handlers used (`dialog.showSaveDialog`/`showOpenDialog`) — ticket 08's
   * answer for `compileCampaign`'s save-location prompt.
   */
  readonly chooseSaveDirectory: (suggestedName: string) => Promise<string | null>;
  readonly generateSessionId: () => string;
}

/**
 * `compileCampaign(configuration) -> { sessionId }` (ticket 08/12): validates
 * the configuration, compiles `content/production/1880` for real, rejects an
 * unsupported/zero-content player slot, prompts for a save location, writes
 * the initial save immediately via `SaveStore.save` (so there's always
 * something recoverable), and registers the live session so `inspectCampaign`
 * can serve it.
 *
 * Judgment call (ticket 12): `configuration` is validated and its session
 * bookkeeping (start year/month, turn number) is derived via
 * `createInitialCampaignState` — but is *not* threaded into
 * `CampaignCompiler.compile()`'s `campaignConfiguration` input. That input
 * triggers a stricter DESIGN-03 precondition gate requiring the full
 * canonical scenario/fleet-size/research-speed catalogs to be supplied
 * alongside it; nothing in the compiler actually *consumes*
 * `campaignConfiguration` to parameterize the compiled snapshot (it's a
 * precondition gate, not an input to snapshot construction) — fleets,
 * economies, designs, etc. come entirely from the content pack's YAML.
 * `packages/cross-process-test/src/run-child.ts` (the one proven
 * compile->advance->save/load reference loop in the repo) does the same:
 * compiles without `campaignConfiguration`. Matching that precedent avoids
 * a validation path nothing in the actual compile step depends on.
 */
export async function compileCampaign(
  configuration: CampaignConfiguration,
  deps: CompileCampaignDeps,
): Promise<BridgeResult<CompileCampaignResult>> {
  const sessionCollector = new DiagnosticCollector();
  const session = createInitialCampaignState(configuration, sessionCollector);
  if (!session) {
    return {
      outcome: "rejected",
      reason: "INVALID_CAMPAIGN_CONFIGURATION",
      diagnostics: sessionCollector.all.map((d) => d.message),
    };
  }

  const signal = new AbortController().signal;
  const compileCollector = new DiagnosticCollector();
  let output: ReturnType<typeof compileProductionCampaign>;
  try {
    // B-6/ADR-0025: thread the scenario's start calendar date into the compile
    // so the snapshot stamps authoritative startYear/startMonth (the month ids
    // every later campaign month — incl. the weather stream — derive from).
    output = compileProductionCampaign(deps.contentDir, signal, compileCollector, {
      startYear: session.currentYear,
      startMonth: session.currentMonth,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { outcome: "error", reason: "COMPILE_FAILED", diagnostics: [message] };
  }
  if (!output || compileCollector.hasErrors) {
    return {
      outcome: "error",
      reason: "COMPILE_FAILED",
      diagnostics: compileCollector.all.map((d) => d.message),
    };
  }

  const nation = output.state.snapshot.nations.get(configuration.playerSlotId);
  if (!nation) {
    return {
      outcome: "rejected",
      reason: "UNKNOWN_PLAYER_SLOT",
      diagnostics: [`No nation ${configuration.playerSlotId} in the compiled campaign.`],
    };
  }
  if (!supportedPlayerSlotIds(output.state.snapshot).includes(configuration.playerSlotId)) {
    return {
      outcome: "rejected",
      reason: "PLAYER_SLOT_NOT_SUPPORTED",
      diagnostics: [
        `Nation ${configuration.playerSlotId} has no ship designs or construction projects and cannot be played (desktop-mvp Empty-Nation Content Gap).`,
      ],
    };
  }

  const saveDir = await deps.chooseSaveDirectory(
    `bluewave-${configuration.playerSlotId}-${configuration.scenarioId}`,
  );
  if (saveDir === null) {
    return { outcome: "rejected", reason: "SAVE_LOCATION_CANCELLED", diagnostics: [] };
  }

  // `CampaignCompiler.compile()`'s `rawHash` is computed over `snapshot`
  // alone, but `SaveStore.save`/`load` verify a hash computed over the whole
  // state (`{snapshot, envelope}`) — the two don't agree, so saving the
  // compiler's own `rawHash` as-is fails `SaveStore.load`'s integrity check.
  // `packages/cross-process-test/src/run-child.ts` (the one proven
  // compile->save/load loop in the repo) already recomputes `rawHash` this
  // same way immediately before calling `store.save`; this repeats that
  // precedent rather than inventing a new hashing convention.
  const saveableState = toSaveableState(output.state);

  const store = new SaveStore();
  try {
    store.save(saveableState, saveDir);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { outcome: "error", reason: "SAVE_FAILED", diagnostics: [message] };
  }

  // Ticket 16: the continuance sidecar. `SaveStore`'s package stores the
  // authoritative `CampaignState`, but a session restored on load also needs
  // the player's slot, seed, and scenario — none of which live in the
  // snapshot. This app-owned file (invisible to SaveStore, outside its
  // integrity envelope) is what makes a later `loadCampaign`/
  // `replayCampaign` able to restore the real campaign instead of a hollow
  // shell. `writeSessionMetadata` is atomic (tmp+rename); a failure here
  // means the package is incomplete and the command reports SAVE_FAILED.
  try {
    writeSessionMetadata(saveDir, {
      schemaVersion: "session_meta_v1",
      scenarioId: configuration.scenarioId,
      playerSlotId: configuration.playerSlotId,
      campaignSeed: configuration.campaignSeed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      outcome: "error",
      reason: "SAVE_FAILED",
      diagnostics: [`Package saved but session metadata could not be written: ${message}`],
    };
  }

  const sessionId = deps.generateSessionId();
  registerCampaignSession({
    sessionId,
    saveDir,
    playerSlotId: configuration.playerSlotId,
    campaignSeed: configuration.campaignSeed,
    month: { month: session.currentMonth, year: session.currentYear },
    state: saveableState,
  });

  return { outcome: "success", value: { sessionId }, diagnostics: [] };
}

export const defaultCompileCampaignDeps: CompileCampaignDeps = {
  contentDir: resolveProductionPackDir(),
  generateSessionId: () => randomUUID(),
  chooseSaveDirectory: async (suggestedName: string) => {
    const { dialog } = await import("electron");
    const result = await dialog.showSaveDialog({
      title: "Choose a location to save this campaign",
      defaultPath: suggestedName,
      buttonLabel: "Create Campaign",
    });
    if (result.canceled || !result.filePath) return null;
    return result.filePath;
  },
};
