/**
 * Card artwork for the Starting-fleet method picker (spec §5b), presentation
 * content only — never authoritative state (mirrors
 * `preferenceArtworkManifest`).
 *
 * Asset filenames appear only here; callers resolve by a stable id, so renaming
 * a file can never break the screen. The ids match the engine's validated
 * `legacyFleetModeId`s (`packages/campaign/src/scenario.ts`).
 *
 * The cards point at the downscaled `*-card.avif` derivatives (564×376, i.e.
 * twice the 188 px display box on the short side), not the ~700 KB originals;
 * regenerate them from the JPGs with `node scripts/optimize-artwork.mjs`.
 */
import blueprintArtwork from "../assets/player-preferences/blueprint-card.avif";
import cannonsArtwork from "../assets/player-preferences/cannons-card.avif";
import dockyardArtwork from "../assets/player-preferences/dockyard-card.avif";

/** Fleet-method ids the artwork manifest answers for. */
export type FleetMethodArtworkId = "generated" | "disabled" | "historical";

export const FLEET_METHOD_ARTWORK: Readonly<Record<FleetMethodArtworkId, string>> = {
  generated: dockyardArtwork,
  disabled: blueprintArtwork,
  historical: cannonsArtwork,
};

export function getFleetMethodArtwork(artworkId: FleetMethodArtworkId): string {
  return FLEET_METHOD_ARTWORK[artworkId];
}
