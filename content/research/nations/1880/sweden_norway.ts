import type { Nation } from "../../schema/nations.ts";

export const sweden_norway: Nation = {
  id: "sweden_norway",
  tag: "SWE",
  name: "Sweden-Norway",
  displayNameKey: "nation.sweden_norway",
  isPlayable: false,
  slot: { id: "sweden_norway", order: 15, participation: "active" },
  presentation: { colorBg: "#006AA7", colorFg: "#FECC02" },
  identity: {
    oneSentence:
      "Sweden-Norway in January 1880 is the neutral Scandinavian union: sparsely populated, strategically located on the Baltic and North Atlantic, maintaining a modest coastal defense navy to preserve neutrality and control its long coastline and archipelagos.",
    fullIdentity:
      "Personal union under Oscar II. Neutral, sparsely populated, long coastlines, archipelagos, Bothnian and Norwegian Sea access. Union tensions growing (dissolved 1905).",
    strategicProblem:
      "Must defend long, fragmented coastline and neutrality with limited resources, balancing between Russia (Baltic pressure), Germany (Baltic ambition), and Britain (North Atlantic access).",
  },
  regime: {
    type: "monarchy",
    politicalSystem: "union_monarchy",
    headOfState: "King Oscar II",
    headOfGovernment: "Louis De Geer / Frederik Stang",
    leaderTitle: "King",
    navalPolicyActors: [
      "King",
      "Swedish Parliament",
      "Norwegian Parliament",
      "Union Tensions",
      "Neutrality Policy",
    ],
    governmentModifiers: [
      "personal_union",
      "neutrality_tradition",
      "baltic_focused_defense",
      "union_tensions",
    ],
    navyMinister: {
      name: "Fredrik Wilhelm von Otter",
      title: "Minister of Naval Defence",
      traits: "Vice-Admiral; professional naval officer; advocate of coastal defense doctrine",
    },
    stabilityProfile: {
      level: "moderate",
      factors: ["Union tensions", "Neutrality", "Sparse population"],
    },
    description: "Personal union under Oscar II. Two parliaments, growing union tensions.",
  },
  strategicObjectives: {
    primary: "Homeland Defense",
    secondary: "Trade Protection",
  },
  baseResources: {
    gdpTier: "minor_power",
    gdpDescription:
      "Minor European Power; industrializing rapidly; iron/steel/timber exports drive growth; per-capita industrial output comparable to Belgium",
    population: "~4.6 million (Sweden); ~2 million (Norway)",
    industrialization: "industrial",
    industrializationDescription:
      "Rapidly industrializing; iron and steel, timber, engineering, shipbuilding; coal imports essential",
  },
  navalAppropriation: {
    budgetLevel: "low",
    justification:
      "The Lantmanna Party and the Riksdag are fiscally conservative; the navy receives steady but limited funding. The coastal defense doctrine keeps costs moderate — monitors and torpedo boats are cheaper than seagoing ironclads. Total defense spending is a significant share of the budget but not burdensome by European standards.",
  },
  economy: {
    description:
      "Resource-based economy: timber, iron ore, shipping. Limited industry, sparse population.",
    character: "resource-based, sparse",
    strengths: ["Timber", "Iron ore", "Shipping", "Long coastline resources"],
    weaknesses: ["Sparse population", "Limited industry", "Union tensions"],
    industrialBase: "uneven",
  },
  navalInstitution: {
    description:
      "Coastal defense focused, archipelago specialist, small but adapted to narrow waters, mines, torpedo craft, coastal defense ships.",
    character: ["coastal_defense", "archipelago_specialist", "neutral", "mine_specialist"],
    seniority: "junior_to_army",
  },
  doctrine: {
    summary:
      "Coastal defense, archipelago defense, mine warfare, torpedo craft, neutrality defense. No blue-water ambition.",
    schools: ["coastal_defense", "archipelago_defense", "mine_warfare", "neutrality_defense"],
  },
  shipDesign: {
    summary:
      "Coastal defense ships, monitors, torpedo craft, gunboats optimized for archipelagos and narrow Baltic waters.",
    principles: ["archipelago_optimization", "coastal_defense"],
    favoredTypes: ["coastal_defense_ship", "monitor", "torpedo_craft", "gunboat"],
  },
  military: {
    description:
      "Defensive conscript army designed for homeland defense in forest/lake/archipelago terrain. Allotment system produces trained reserve. Navy is coastal defense focused.",
    size: "allotment system ~70,000 trained reserve; small professional cadre",
    character: ["defensive_conscript", "archipelago_defense", "neutrality"],
    armyNavyBalance: "army_heavy",
  },
  ai: {
    archetype: "neutral_archipelago_defender",
    behavior: [
      "maintain_neutrality",
      "defend_coast_and_archipelagos",
      "mine_coastal_waters",
      "avoid_entanglement",
    ],
    aiRole: "regional_balancer",
  },
  navalPurpose: "maintain_union_neutrality",
  coreAnxiety: "union_dissolution_and_great_power_pressure",
  gameplayFeel: "defend_long_coast_as_neutral",
  historicalAssumptions: [
    "Union under Oscar II, dissolved 1905",
    "Neutral",
    "Archipelago defense specialist",
    "Iron ore and timber economy",
  ],
} as const;
