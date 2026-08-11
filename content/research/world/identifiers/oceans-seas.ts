import type { NationId } from "../../nations/shared.ts";

export const OCEANS = {
  atlantic: {
    id: "atlantic",
    name: "Atlantic Ocean",
    subdivisions: [
      "north_atlantic",
      "mid_atlantic",
      "south_atlantic",
      "western_approaches",
      "caribbean_approaches",
      "west_african_atlantic",
      "cape_route_approaches",
    ] as const,
    primaryPowers: [
      "uk",
      "france",
      "germany",
      "usa",
      "spain",
    ] as const satisfies readonly NationId[],
  },
  pacific: {
    id: "pacific",
    name: "Pacific Ocean",
    subdivisions: [
      "north_pacific",
      "western_pacific",
      "central_pacific",
      "south_pacific",
      "eastern_pacific",
      "philippine_sea",
      "east_asian_marginal_seas",
    ] as const,
    primaryPowers: [
      "japan",
      "qing",
      "russia",
      "spain",
      "usa",
      "uk",
    ] as const satisfies readonly NationId[],
  },
  indian: {
    id: "indian",
    name: "Indian Ocean",
    subdivisions: [
      "western_indian_ocean",
      "arabian_sea",
      "bay_of_bengal",
      "central_indian_ocean",
      "mozambique_channel",
      "ceylon_approaches",
      "malacca_approaches",
    ] as const,
    primaryPowers: ["uk", "france", "italy"] as const satisfies readonly NationId[],
  },
  southern_ocean: {
    id: "southern_ocean",
    name: "Southern Ocean / High Southern Routes",
    subdivisions: ["cape_horn_waters", "drake_passage", "south_atlantic_storm_routes"] as const,
    primaryPowers: ["usa", "uk"] as const satisfies readonly NationId[],
  },
  arctic: {
    id: "arctic",
    name: "Arctic Ocean",
    subdivisions: ["white_sea", "barents_approaches"] as const,
    primaryPowers: ["russia"] as const satisfies readonly NationId[],
  },
} as const;
export type OceanId = keyof typeof OCEANS;

export const SEAS = {
  north_sea: { id: "north_sea", ocean: "atlantic", type: "enclosed" as const },
  english_channel: { id: "english_channel", ocean: "atlantic", type: "chokepoint" as const },
  baltic_sea: { id: "baltic_sea", ocean: "atlantic", type: "enclosed" as const },
  gulf_of_finland: { id: "gulf_of_finland", ocean: "atlantic", type: "enclosed" as const },
  mediterranean_sea: { id: "mediterranean_sea", ocean: "atlantic", type: "enclosed" as const },
  adriatic_sea: { id: "adriatic_sea", ocean: "atlantic", type: "enclosed" as const },
  aegean_sea: { id: "aegean_sea", ocean: "atlantic", type: "enclosed" as const },
  black_sea: { id: "black_sea", ocean: "atlantic", type: "enclosed" as const },
  caribbean_sea: { id: "caribbean_sea", ocean: "atlantic", type: "enclosed" as const },
  gulf_of_mexico: { id: "gulf_of_mexico", ocean: "atlantic", type: "enclosed" as const },
  red_sea: { id: "red_sea", ocean: "indian", type: "enclosed" as const },
  gulf_of_aden: { id: "gulf_of_aden", ocean: "indian", type: "chokepoint" as const },
  arabian_sea: { id: "arabian_sea", ocean: "indian", type: "open" as const },
  bay_of_bengal: { id: "bay_of_bengal", ocean: "indian", type: "open" as const },
  sea_of_japan: { id: "sea_of_japan", ocean: "pacific", type: "enclosed" as const },
  yellow_sea: { id: "yellow_sea", ocean: "pacific", type: "enclosed" as const },
  bohai_gulf: { id: "bohai_gulf", ocean: "pacific", type: "enclosed" as const },
  east_china_sea: { id: "east_china_sea", ocean: "pacific", type: "enclosed" as const },
  south_china_sea: { id: "south_china_sea", ocean: "pacific", type: "enclosed" as const },
  philippine_sea: { id: "philippine_sea", ocean: "pacific", type: "open" as const },
  sea_of_okhotsk: { id: "sea_of_okhotsk", ocean: "pacific", type: "enclosed" as const },
  bering_sea: { id: "bering_sea", ocean: "pacific", type: "enclosed" as const },
} as const;
export type SeaId = keyof typeof SEAS;
