/**
 * Presentation-layer region grouping for the area tree (CC-4, decision 08).
 *
 * The content pack has no area hierarchy, and the engine must not learn one, so the
 * grouping lives here: a hand-authored table from production-pack area id to a display
 * region. `area-regions.test.ts` checks it against `content/production/1880/areas.yaml`, so a
 * new area without a region fails a test instead of landing in a catch-all.
 */

export type RegionId =
  | "northern_europe"
  | "mediterranean"
  | "black_sea"
  | "atlantic_africa"
  | "americas"
  | "indian_ocean"
  | "southeast_asia"
  | "east_asia"
  | "pacific";

/** Display order is the array order. */
export const REGIONS: readonly { readonly id: RegionId; readonly label: string }[] = [
  { id: "northern_europe", label: "Northern Europe" },
  { id: "mediterranean", label: "The Mediterranean" },
  { id: "black_sea", label: "The Black Sea" },
  { id: "atlantic_africa", label: "Atlantic and Africa" },
  { id: "americas", label: "Americas and Caribbean" },
  { id: "indian_ocean", label: "Indian Ocean" },
  { id: "southeast_asia", label: "South-East Asia" },
  { id: "east_asia", label: "East Asia" },
  { id: "pacific", label: "The Pacific" },
];

export const AREA_REGION: Readonly<Record<string, RegionId>> = {
  // Northern Europe
  eng_home_coast: "northern_europe",
  fra_chan_coast: "northern_europe",
  ger_baltic_coast: "northern_europe",
  ger_ndgermany_coast: "northern_europe",
  rus_baltic_coast: "northern_europe",
  ned_home_coast: "northern_europe",
  sea_english_channel: "northern_europe",
  sea_north_sea: "northern_europe",
  sea_baltic: "northern_europe",
  // The Mediterranean
  med_gibraltar: "mediterranean",
  med_malta: "mediterranean",
  med_cyprus: "mediterranean",
  fra_med_coast: "mediterranean",
  africa_algeria: "mediterranean",
  auh_adriatic_coast: "mediterranean",
  auh_dalmatia: "mediterranean",
  ita_tyrrhenian_coast: "mediterranean",
  ita_adriatic_coast: "mediterranean",
  ott_marmara_coast: "mediterranean",
  ott_aegean_coast: "mediterranean",
  ott_eg_coast: "mediterranean",
  spa_med_coast: "mediterranean",
  sea_mediterranean_w: "mediterranean",
  sea_mediterranean_c: "mediterranean",
  sea_mediterranean_e: "mediterranean",
  // The Black Sea
  rus_blacksea_coast: "black_sea",
  ott_blacksea_coast: "black_sea",
  sea_black_sea: "black_sea",
  // Atlantic and Africa
  spa_atlantic_coast: "atlantic_africa",
  por_home_coast: "atlantic_africa",
  africa_cape: "atlantic_africa",
  africa_senegal: "atlantic_africa",
  africa_angola: "atlantic_africa",
  sea_atlantic_n: "atlantic_africa",
  sea_atlantic_s: "atlantic_africa",
  // Americas and Caribbean
  atlantic_bermuda: "americas",
  americas_halifax: "americas",
  americas_martinique: "americas",
  americas_cuba: "americas",
  americas_puertorico: "americas",
  americas_suriname: "americas",
  usa_atlantic_coast: "americas",
  usa_gulf_coast: "americas",
  bra_rio_coast: "americas",
  bra_ne_coast: "americas",
  sea_caribbean: "americas",
  // Indian Ocean
  india_west_coast: "indian_ocean",
  india_east_coast: "indian_ocean",
  indian_ceylon: "indian_ocean",
  indian_adden: "indian_ocean",
  indian_reunion: "indian_ocean",
  sea_mauritius: "indian_ocean",
  africa_mozambique: "indian_ocean",
  asia_goa: "indian_ocean",
  sea_red_sea: "indian_ocean",
  sea_arabian_sea: "indian_ocean",
  sea_bayofbengal: "indian_ocean",
  sea_indian_ocean: "indian_ocean",
  // South-East Asia
  sea_singapore: "southeast_asia",
  indochina_cochinchina: "southeast_asia",
  philippines_luzon: "southeast_asia",
  dei_java: "southeast_asia",
  sea_java_sea: "southeast_asia",
  // East Asia
  sea_hong_kong: "east_asia",
  asia_macau: "east_asia",
  chi_north_coast: "east_asia",
  chi_weihaiwei: "east_asia",
  chi_south_coast: "east_asia",
  chi_yangtze: "east_asia",
  jpn_home_coast: "east_asia",
  jpn_inland_sea: "east_asia",
  jpn_kyushu_coast: "east_asia",
  rus_pacific_coast: "east_asia",
  sea_south_china: "east_asia",
  // The Pacific
  pacific_australia: "pacific",
  pacific_newcaledonia: "pacific",
  pacific_tahiti: "pacific",
  usa_pacific_coast: "pacific",
  sea_pacific_n: "pacific",
  sea_pacific_s: "pacific",
};

/** Area ids with no region sit under this label rather than vanishing (fixture fallback, future areas). */
export const OTHER_REGION_LABEL = "Other waters";
