/**
 * Card artwork for the "Choose your archetype" preset picker, presentation
 * content only — never authoritative state (mirrors
 * `preferenceArtworkManifest.ts`).
 *
 * Asset filenames appear only here; callers resolve by a stable id, so renaming
 * a file can never break the screen. The ids match the engine's validated
 * `ARCHETYPE_PRESETS` ids (`packages/campaign-engine/src/archetype.ts`).
 */
import comerceArtwork from "../assets/player-preferences/comerce.jpg";
import fightingArtwork from "../assets/player-preferences/fighting.jpg";
import shipbuildingArtwork from "../assets/player-preferences/shipbuilding.jpg";

/** Archetype ids the artwork manifest answers for; kept here so content never imports a screen. */
export type ArchetypeArtworkId = "merchant_prince" | "shipyard_baron" | "grand_admiral";

export const ARCHETYPE_ARTWORK: Readonly<Record<ArchetypeArtworkId, string>> = {
  merchant_prince: comerceArtwork,
  shipyard_baron: shipbuildingArtwork,
  grand_admiral: fightingArtwork,
};

export function getArchetypeArtwork(artworkId: ArchetypeArtworkId): string {
  return ARCHETYPE_ARTWORK[artworkId];
}
