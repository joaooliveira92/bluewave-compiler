import type { NationId } from "../../nations/shared.ts";

export const THEATERS = {
  home_waters_north_atlantic: {
    id: "home_waters_north_atlantic",
    name: "Home Waters and North Atlantic",
    primaryPowers: ["uk", "germany", "france"] as const satisfies readonly NationId[],
    designRule: "Britain's most politically sensitive theater",
  },
  mediterranean: {
    id: "mediterranean",
    name: "Mediterranean Sea",
    primaryPowers: [
      "uk",
      "france",
      "italy",
      "austria_hungary",
      "spain",
    ] as const satisfies readonly NationId[],
    designRule: "Most politically dense - small crises draw multiple powers",
  },
  baltic: {
    id: "baltic",
    name: "Baltic Sea",
    primaryPowers: ["germany", "russia"] as const satisfies readonly NationId[],
    designRule: "Fortress sea - geography compensates for inferiority",
  },
  black_sea_turkish_straits: {
    id: "black_sea_turkish_straits",
    name: "Black Sea and Turkish Straits",
    primaryPowers: ["russia"] as const satisfies readonly NationId[],
    designRule: "Locally meaningful but globally constrained",
  },
  west_africa_south_atlantic: {
    id: "west_africa_south_atlantic",
    name: "West Africa and South Atlantic",
    primaryPowers: ["uk", "france", "germany"] as const satisfies readonly NationId[],
    designRule: "Rewards endurance over mass",
  },
  caribbean_gulf: {
    id: "caribbean_gulf",
    name: "Caribbean and Gulf of Mexico",
    primaryPowers: ["usa", "spain"] as const satisfies readonly NationId[],
    designRule: "Not American lake yet, but where US becomes imperial",
  },
  indian_ocean_red_sea: {
    id: "indian_ocean_red_sea",
    name: "Indian Ocean and Red Sea Route",
    primaryPowers: ["uk", "france", "italy"] as const satisfies readonly NationId[],
    designRule: "Britain's imperial artery",
  },
  southeast_asia_crossroads: {
    id: "southeast_asia_crossroads",
    name: "Southeast Asia and Maritime Crossroads",
    primaryPowers: ["uk", "france", "qing", "japan"] as const satisfies readonly NationId[],
    designRule: "Hinge Indian Ocean/East Asia",
  },
  east_asia_western_pacific: {
    id: "east_asia_western_pacific",
    name: "East Asia and Western Pacific",
    primaryPowers: ["japan", "qing", "russia"] as const satisfies readonly NationId[],
    designRule: "Institutional coherence > nominal power",
  },
  north_pacific: {
    id: "north_pacific",
    name: "North Pacific",
    primaryPowers: ["russia", "japan", "usa"] as const satisfies readonly NationId[],
    designRule: "Important before dense",
  },
  south_pacific: {
    id: "south_pacific",
    name: "South Pacific",
    primaryPowers: ["uk", "france", "germany", "usa"] as const satisfies readonly NationId[],
    designRule: "Small base > large fleet without coal",
  },
  south_american_southern_passage: {
    id: "south_american_southern_passage",
    name: "South American Southern Passage",
    primaryPowers: ["usa", "uk"] as const satisfies readonly NationId[],
    designRule: "Before Panama, two-ocean navy is not one navy",
  },
} as const;
export type TheaterId = keyof typeof THEATERS;

export const CHOKEPOINTS = {
  gibraltar: {
    id: "gibraltar",
    name: "Strait of Gibraltar",
    connects: ["Atlantic", "Mediterranean"] as const,
  },
  suez_canal: {
    id: "suez_canal",
    name: "Suez Canal",
    connects: ["Mediterranean", "Red Sea"] as const,
  },
  bab_el_mandeb: {
    id: "bab_el_mandeb",
    name: "Bab el-Mandeb",
    connects: ["Red Sea", "Gulf of Aden"] as const,
  },
  cape_of_good_hope: {
    id: "cape_of_good_hope",
    name: "Cape of Good Hope",
    connects: ["Atlantic", "Indian Ocean"] as const,
  },
  turkish_straits: {
    id: "turkish_straits",
    name: "Turkish Straits",
    connects: ["Black Sea", "Mediterranean"] as const,
    includes: ["Bosporus", "Dardanelles"] as const,
  },
  danish_straits: {
    id: "danish_straits",
    name: "Danish Straits",
    connects: ["Baltic", "North Sea"] as const,
  },
  english_channel: {
    id: "english_channel",
    name: "English Channel",
    connects: ["North Sea", "Atlantic"] as const,
  },
  otranto: {
    id: "otranto",
    name: "Strait of Otranto",
    connects: ["Adriatic", "Ionian Sea"] as const,
  },
  malacca_singapore: {
    id: "malacca_singapore",
    name: "Malacca and Singapore Passage",
    connects: ["Indian Ocean", "South China Sea"] as const,
  },
  korea_tsushima: {
    id: "korea_tsushima",
    name: "Korea/Tsushima Strait",
    connects: ["Sea of Japan", "Yellow Sea"] as const,
  },
  taiwan_strait: {
    id: "taiwan_strait",
    name: "Taiwan Strait",
    connects: ["East China Sea", "South China Sea"] as const,
  },
  luzon_strait: {
    id: "luzon_strait",
    name: "Luzon Strait",
    connects: ["South China Sea", "Philippine Sea"] as const,
  },
  caribbean_passages: {
    id: "caribbean_passages",
    name: "Caribbean Passages",
    connects: ["Atlantic", "Gulf-Caribbean"] as const,
    includes: ["Florida Straits", "Windward Passage", "Mona Passage", "Yucatán Channel"] as const,
  },
  magellan_cape_horn: {
    id: "magellan_cape_horn",
    name: "Magellan / Cape Horn",
    connects: ["Atlantic", "Pacific"] as const,
    includes: ["Strait of Magellan", "Cape Horn", "Drake Passage"] as const,
  },
} as const;
export type ChokepointId = keyof typeof CHOKEPOINTS;
