import type { PlayableNationId } from "./nations/shared.ts";

/**
 * DESIGN-04's ten permanent playable-slot identities, already used throughout
 * CampaignConfiguration/IPC contracts/UI. The canon's `Nation.slot.id` is just
 * the bare nation id, not this scheme, so it's kept as a small companion
 * table instead — matches content/nations/scen_1880_nations.json's
 * `playerSlot` values exactly (kept in sync manually; both are "immutable").
 */
export const PLAYER_SLOT_IDS: Record<PlayableNationId, string> = {
  uk: "slot_01_united_kingdom",
  germany: "slot_02_german_empire",
  usa: "slot_03_united_states",
  japan: "slot_04_empire_of_japan",
  france: "slot_05_french_republic",
  italy: "slot_06_kingdom_of_italy",
  russia: "slot_07_russian_empire",
  austria_hungary: "slot_08_austro_hungarian_empire",
  spain: "slot_09_kingdom_of_spain",
  qing: "slot_10_qing_dynasty",
};
