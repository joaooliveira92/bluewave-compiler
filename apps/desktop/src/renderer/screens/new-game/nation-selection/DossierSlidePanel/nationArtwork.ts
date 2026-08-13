import type { MediaAsset } from "@/content/mediaAsset.ts";
import type { PlayableSlotCountryId } from "@/content/nationAssetManifest.ts";
import { getNationPresentation } from "@/content/nationPresentationCatalog.ts";

export function resolveNationColours(
  countryId: PlayableSlotCountryId,
): MediaAsset | null {
  const colours = getNationPresentation(countryId).nationalColours;
  return colours.status === "resolved" ? colours.asset : null;
}

export function resolveNationShip(
  countryId: PlayableSlotCountryId,
): MediaAsset | null {
  const ship = getNationPresentation(countryId).shipArtwork;
  return ship.status === "resolved" ? ship.asset : null;
}

export function getCountryCode(countryId: PlayableSlotCountryId): string {
  return getNationPresentation(countryId).code;
}
