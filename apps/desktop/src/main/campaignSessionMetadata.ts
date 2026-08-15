import { readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import { join } from "node:path";
import { CANONICAL_SCENARIO_IDS } from "@bluewave/campaign";
import { z } from "zod";

/**
 * App-owned `session.json` sidecar at a `SaveStore` package's root directory
 * (desktop-mvp ticket 16). `SaveStore`'s package stores the authoritative
 * `CampaignState` (hash/envelope/sig/pointer), but three fields a loaded
 * `CampaignSessionRecord` needs are NOT part of the compiled snapshot:
 *
 * - `playerSlotId` — which nation the player chose (the snapshot's `slots`
 *   aren't authored as the player pick),
 * - `campaignSeed` — the player-chosen `CampaignConfiguration.campaignSeed`,
 *   the deterministic root `commitMonth` and `replayCampaign` derive every
 *   month seed from; unrecoverable from state alone,
 * - `scenarioId` — whose canonical start date ({startYear,startMonth}) the
 *   current calendar month is derived from as start + `turnNumber` months.
 *
 * The sidecar lives next to `pointer.json` (a root-level file, invisible to
 * `SaveStore.save`/`load`/`list`, which only read the per-save directories
 * and the pointer), so it neither changes `SaveStore`'s semantics nor trips
 * its integrity envelope. `compileCampaign` writes it once; `loadCampaign`
 * reads it to restore a real session; `replayCampaign` reads it for the
 * replay seed. Saves are trust-class data (ENGINEERING-CONTRACT "Security"),
 * so reads are Zod-validated; writes go through tmp+rename like
 * `SaveStore`'s own `updatePointer`, never leaving a partial file.
 */
export const SESSION_METADATA_FILENAME = "session.json";

export const SessionMetadataSchema = z.object({
  schemaVersion: z.literal("session_meta_v1"),
  scenarioId: z.enum(CANONICAL_SCENARIO_IDS),
  playerSlotId: z.string().min(1),
  campaignSeed: z.string().min(1),
});

export type SessionMetadata = z.infer<typeof SessionMetadataSchema>;

export function writeSessionMetadata(saveDir: string, metadata: SessionMetadata): void {
  const target = join(saveDir, SESSION_METADATA_FILENAME);
  const tmp = `${target}.tmp`;
  writeFileSync(tmp, JSON.stringify(metadata, null, 2), "utf8");
  renameSync(tmp, target);
}

/** `null` when the sidecar is missing or fails Zod/structure validation. */
export function readSessionMetadata(saveDir: string): SessionMetadata | null {
  const target = join(saveDir, SESSION_METADATA_FILENAME);
  if (!existsSync(target)) return null;
  try {
    const parsed = SessionMetadataSchema.safeParse(JSON.parse(readFileSync(target, "utf8")));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
