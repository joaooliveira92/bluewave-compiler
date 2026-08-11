import type {
  ChokepointId,
  CoreAnxiety,
  GameplayFeel,
  NationId,
  NavalPurpose,
  OceanId,
  TheaterId,
} from "../schema/nations.ids.ts";
import type {
  Ai,
  Doctrine,
  Economy,
  Identity,
  Nation,
  NationRegime,
  NationSlot,
  NavalInstitution,
  Presentation,
  NationsPack as SchemaNationsPack,
  ShipDesign,
  StabilityProfile,
} from "../schema/nations.ts";

export type {
  Ai,
  ChokepointId,
  CoreAnxiety,
  Doctrine,
  Economy,
  GameplayFeel,
  Identity,
  Nation,
  NationId,
  NationRegime,
  NationSlot,
  NavalInstitution,
  NavalPurpose,
  OceanId,
  Presentation,
  ShipDesign,
  StabilityProfile,
  TheaterId,
};

export const PLAYABLE_NATION_IDS = [
  "uk",
  "germany",
  "usa",
  "japan",
  "france",
  "italy",
  "russia",
  "austria_hungary",
  "spain",
  "qing",
] as const;

export const AI_NATION_IDS = [
  "ottoman_empire",
  "egypt",
  "netherlands",
  "denmark",
  "sweden_norway",
  "portugal",
  "greece",
  "brazil",
  "chile",
  "argentina",
  "korea",
  "siam",
  "belgium",
  "persia",
] as const;

export const ALL_NATION_IDS = [...PLAYABLE_NATION_IDS, ...AI_NATION_IDS] as const;

export type PlayableNationId = (typeof PLAYABLE_NATION_IDS)[number];
export type AiNationId = (typeof AI_NATION_IDS)[number];

export type NationsPack = Omit<SchemaNationsPack, "continuityMode"> & {
  continuityMode: "historical_1880_canon";
};
