import type { NationId } from "../../nations/shared.ts";

export const GEOGRAPHIC_REGIONS = {
  british_isles: "Home Waters / North Atlantic",
  north_sea_coast: "Home Waters / North Atlantic",
  channel_coast: "Home Waters / North Atlantic",
  baltic_littoral: "Europe and Adjacent Waters",
  adriatic_region: "Europe and Adjacent Waters",
  italian_peninsula_islands: "Europe and Adjacent Waters",
  north_africa: "Africa and Middle East",
  west_africa: "Africa and Middle East",
  cape_southern_africa: "Africa and Middle East",
  east_africa: "Africa and Middle East",
  red_sea_littoral: "Africa and Middle East",
  nile_suez_region: "Africa and Middle East",
  eastern_north_america: "Americas",
  gulf_coast: "Americas",
  caribbean_basin: "Americas",
  central_america_isthmian: "Americas",
  southern_passage_region: "Americas",
  alaska_north_pacific_coast: "Americas",
  indian_subcontinent: "Asia-Pacific",
  ceylon_bay_of_bengal: "Asia-Pacific",
  southeast_asian_maritime_crossroads: "Asia-Pacific",
  indochina: "Asia-Pacific",
  south_china_coast: "Asia-Pacific",
  yangtze_central_china_coast: "Asia-Pacific",
  bohai_yellow_sea_region: "Asia-Pacific",
  korea: "Asia-Pacific",
  manchuria: "Asia-Pacific",
  japanese_home_islands: "Asia-Pacific",
  russian_far_east: "Asia-Pacific",
  philippine_archipelago: "Asia-Pacific",
  micronesia: "Asia-Pacific",
  polynesia: "Asia-Pacific",
  australia_new_zealand_approaches: "Asia-Pacific",
} as const;
export type GeographicRegionId = keyof typeof GEOGRAPHIC_REGIONS;

export type TerritoryCategory =
  | "sovereign_metropole"
  | "dominion"
  | "colony"
  | "protectorate"
  | "naval_station"
  | "coaling_station"
  | "chokepoint_territory"
  | "treaty_port"
  | "buffer_state"
  | "prestige_possession"
  | "exposed_colony"
  | "integrated_territory"
  | "occupied_territory";

export type SovereignId =
  | NationId
  | "ottoman_empire"
  | "netherlands"
  | "portugal"
  | "belgium"
  | "congo_free_state"
  | "denmark"
  | "sweden_norway"
  | "greece"
  | "korea"
  | "siam"
  | "mexico"
  | "colombia"
  | "independent";
