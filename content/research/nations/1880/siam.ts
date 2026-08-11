import type { Nation } from "../../schema/nations.ts";

export const siam: Nation = {
  id: "siam",
  name: "Kingdom of Siam",
  displayNameKey: "nation.siam",
  isPlayable: false,
  slot: { id: "siam", order: 22, participation: "active" },
  presentation: { colorBg: "#A51931", colorFg: "#FFFFFF" },
  identity: {
    oneSentence:
      "Siam in January 1880 is the skillful buffer kingdom: independent, reforming under King Chulalongkorn, strategically located between British Burma and French Indochina, using diplomacy and selective modernization to survive as the only independent state in Southeast Asia.",
    fullIdentity:
      "Absolute monarchy under Chulalongkorn (Rama V). Reforming, modernizing, playing Britain and France against each other. Controls Chao Phraya basin and Malacca approaches.",
    strategicProblem:
      "Must survive between British Burma/Malaya and French Indochina with no modern navy, using buffer diplomacy and selective modernization to avoid colonization.",
  },
  regime: {
    type: "monarchy",
    politicalSystem: "absolute_monarchy",
    headOfState: "King Chulalongkorn (Rama V)",
    headOfGovernment: "King Chulalongkorn",
    leaderTitle: "King",
    navalPolicyActors: [
      "King Chulalongkorn",
      "Reformist Officials",
      "British Advisers",
      "French Pressure",
      "Conservative Nobility",
    ],
    governmentModifiers: ["autocratic_executive", "transitioning", "buffer_diplomacy"],
    stabilityProfile: {
      level: "moderate",
      factors: ["Reforming monarchy", "Buffer diplomacy", "British/French pressure"],
    },
    description:
      "Absolute monarchy under reforming Rama V. Selective modernization, buffer diplomacy.",
  },
  strategicObjectives: {
    primary: "Homeland Defense",
    secondary: "Trade Protection",
  },
  baseResources: {
    gdpTier: "small_power",
    gdpDescription: "Low; rice export economy",
    population: "8 million",
    industrialization: "pre_industrial",
    industrializationDescription: "Pre-industrial; no domestic industry",
  },
  navalAppropriation: {
    budgetLevel: "very_low",
    justification:
      "Minimal allocation reflects Siam's strategic priority on administrative reform and army modernisation. The navy receives only what the king can spare after funding civil government, infrastructure, and the army. Increase triggered by perceived French naval encroachment in the Gulf of Siam.",
  },
  economy: {
    description:
      "Rice export economy, reforming, limited industry, dependent on British/French trade. No naval industry.",
    character: "rice export, reforming",
    strengths: ["Rice", "Teak", "Strategic location at Malacca approaches", "Buffer status"],
    weaknesses: ["No industry", "No navy", "Dependent on great powers", "Unequal treaties"],
    industrialBase: "agrarian_colonial",
  },
  navalInstitution: {
    description:
      "Tiny river and coastal force, gunboats, no blue-water capability. Relies on diplomacy and British/French restraint.",
    character: ["tiny", "river_and_coastal", "buffer_dependent"],
    seniority: "coastal_only",
  },
  doctrine: {
    summary:
      "River control (Chao Phraya), coastal defense, port defense. No naval ambition. Survival via diplomacy.",
    schools: ["river_control", "coastal_defense", "port_defense"],
  },
  shipDesign: {
    summary: "Small gunboats, river craft, coastal patrol. No modern warships.",
    principles: ["river_optimization"],
    favoredTypes: ["gunboat", "river_craft"],
  },
  military: {
    description:
      "Adequate for internal security and limited border defense against non-European opponents. Cannot project power. No modern navy. Survival via buffer diplomacy.",
    size: "traditional army; no modern standing force",
    character: ["internal_security", "buffer_dependent", "no_modern_navy"],
    armyNavyBalance: "army_dominant",
  },
  ai: {
    archetype: "skillful_buffer_kingdom",
    behavior: [
      "play_britain_vs_france",
      "reform_selectively",
      "avoid_provoking_either",
      "modernize_to_survive",
      "keep_malacca_approaches_neutral",
    ],
    aiRole: "buffer_state",
  },
  navalPurpose: "survive_as_buffer",
  coreAnxiety: "partition_between_britain_and_france",
  gameplayFeel: "survive_as_buffer_via_diplomacy",
  historicalAssumptions: [
    "Only independent state in Southeast Asia",
    "Reforming under Rama V",
    "Buffer between British Burma/Malaya and French Indochina",
    "No modern navy",
    "Malacca approaches are vital",
  ],
} as const;
