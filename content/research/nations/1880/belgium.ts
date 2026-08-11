import type { Nation } from "../../schema/nations.ts";

export const belgium: Nation = {
  id: "belgium",
  name: "Belgium",
  displayNameKey: "nation.belgium",
  isPlayable: false,
  slot: { id: "belgium", order: 23, participation: "active" },
  presentation: { colorBg: "#000000", colorFg: "#FDDA24" },
  identity: {
    oneSentence:
      "Belgium in January 1880 is the small, neutral, rapidly industrialising constitutional monarchy at the heart of European power politics: army-focused, geopolitically vulnerable, possessed of a tiny coastal navy and an emerging personal colony in the Congo.",
    fullIdentity:
      "Constitutional monarchy under Leopold II. Neutrality guaranteed by the great powers. One of the most industrialised countries in Europe (coal, steel, railways). Leopold II privately owns the Congo Free State (from 1885). Tiny navy for coastal and colonial patrol.",
    strategicProblem:
      "Must survive between France, Germany, and Britain with a tiny navy and guaranteed neutrality. The Congo colony is a personal project of the king, not a national asset for naval power.",
  },
  regime: {
    type: "monarchy",
    politicalSystem: "constitutional_monarchy",
    headOfState: "King Leopold II",
    headOfGovernment: "Walthère Frère-Orban",
    leaderTitle: "King",
    navalPolicyActors: ["King", "Parliament", "Neutrality Guarantee", "Congo Interests"],
    governmentModifiers: ["guaranteed_neutrality", "industrial_economy", "personal_colony"],
    navyMinister: {
      name: "Navy effectively nonexistent — Corps des Torpilleurs",
      title: "No dedicated Navy Minister",
      traits: "Belgian navy is ~4-6 small torpedo boats; naval matters handled by War Ministry",
    },
    stabilityProfile: {
      level: "high",
      factors: ["Constitutional monarchy", "Industrial wealth", "Guaranteed neutrality"],
    },
    description: "Constitutional monarchy. Neutral, industrial, with personal Congo colony.",
  },
  strategicObjectives: {
    primary: "Maintain armed neutrality",
    secondary: "Congo colony development (King Leopold II's personal project)",
  },
  baseResources: {
    gdpTier: "minor_power",
    gdpDescription:
      "One of the most industrialised nations in Europe; coal, steel, railways, finance; GDP per capita ~150% of European average",
    population: "~5.5 million",
    industrialization: "world_leading",
    industrializationDescription:
      "Booming industrial economy; coal output ~16-17 million tons/year; Cockerill-Seraing is Europe's largest integrated iron/steel/engineering works; densest railway network per capita in Europe",
  },
  navalAppropriation: {
    budgetLevel: "very_low",
    justification:
      "The Belgian Navy is effectively nonexistent as a seagoing force. The Corps des Torpilleurs (Torpedo Boat Corps) is a small riverine/coastal flotilla based at Antwerp and Ostend. Assets are ~4-6 small torpedo boats and a handful of training/patrol vessels. The naval budget is a negligible fraction of military spending.",
  },
  economy: {
    description:
      "One of the most industrialised nations in Europe: coal, steel, railways, finance.",
    character: "advanced industrial, small territory",
    strengths: ["Coal", "Steel", "Railways", "Finance", "Congo resources (emerging)"],
    weaknesses: ["Small territory", "Army priority over navy", "Dependent on neutrality"],
    industrialBase: "rising_dynamic",
  },
  navalInstitution: {
    description:
      "Tiny coastal navy focused on coast guard, fishery protection, and colonial patrol in Congo. No battle fleet.",
    character: ["tiny", "coastal_only", "neutral", "colonial_patrol"],
    seniority: "junior_to_army",
  },
  doctrine: {
    summary:
      "Coastal defense, neutrality patrol, fishery protection, Congo river patrol. No blue-water ambition.",
    schools: ["coastal_defense", "neutrality_patrol", "colonial_river_patrol"],
  },
  shipDesign: {
    summary: "Small gunboats, coastal defense vessels, Congo river craft. No capital ships.",
    principles: ["small_coastal", "river_optimization"],
    favoredTypes: ["gunboat", "coastal_defense_ship"],
  },
  military: {
    description:
      "Army-focused with fortress construction (Antwerp, Liège, Namur). Navy is a tiny coastal/torpedo force. Guaranteed neutrality shapes defense posture.",
    size: "active ~46,000; conscription annual contingent ~13,000; Garde Civique ~40,000 paper strength",
    character: ["fortress_defense", "neutrality_guarantee", "army_dominant"],
    armyNavyBalance: "army_dominant",
  },
  ai: {
    archetype: "neutral_industrial_minor",
    behavior: ["maintain_neutrality", "focus_on_army", "develop_congo", "avoid_great_power_war"],
    aiRole: "buffer_state",
  },
  navalPurpose: "defend_coast_colonies",
  coreAnxiety: "great_power_violation_of_neutrality",
  gameplayFeel: "survive_as_neutral_industrial",
  historicalAssumptions: [
    "Neutrality guaranteed by great powers",
    "Intensively industrialised",
    "Congo Free State is Leopold II's personal project (1885)",
    "Tiny coastal navy",
    "German invasion of 1914 is future, not scripted",
  ],
} as const;
