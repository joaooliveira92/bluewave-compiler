import type { PlayableSlotCountryId } from "@/content/nationAssetManifest.js";

/**
 * Bridges the game's nation-record ids (e.g. `nation_uk`) to the presentation
 * catalog's country ids (e.g. `gb`). Nation identity is authoritative state;
 * the catalog keys presentation art/flavor/coordinates by stable country id
 * (ADR-0003). Only nations that exist in the campaign content are mapped.
 */
export const NATION_ID_TO_COUNTRY_ID: Readonly<Record<string, PlayableSlotCountryId>> = {
  nation_uk: "gb",
  nation_germany: "de",
  nation_france: "fr",
  nation_italy: "it",
};

export function nationIdToCountryId(nationId: string): PlayableSlotCountryId | null {
  return NATION_ID_TO_COUNTRY_ID[nationId] ?? null;
}

export function countryIdToNationId(countryId: PlayableSlotCountryId): string | null {
  const entry = Object.entries(NATION_ID_TO_COUNTRY_ID).find(([, cid]) => cid === countryId);
  return entry === undefined ? null : entry[0];
}
