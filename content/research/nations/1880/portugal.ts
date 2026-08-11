import type { Nation } from "../../schema/nations.ts";

export const portugal: Nation = {
  id: "portugal",
  tag: "POR",
  name: "Kingdom of Portugal",
  displayNameKey: "nation.portugal",
  isPlayable: false,
  slot: { id: "portugal", order: 16, participation: "active" },
  presentation: { colorBg: "#006600", colorFg: "#FF0000" },
  identity: {
    oneSentence:
      "Portugal in January 1880 is the old, small colonial survivor: poor but geographically privileged, clinging to Angola, Mozambique, Goa, and Atlantic islands with a tiny, scattered navy that relies on British alliance and neutrality to survive.",
    fullIdentity:
      "Constitutional monarchy under Luís I. Oldest colonial empire, now small and poor. Controls Angola, Mozambique, Goa, Macau, Atlantic islands (Azores, Madeira, Cape Verde). Oldest ally of Britain (Treaty of Windsor).",
    strategicProblem:
      "Must defend scattered, exposed colonies with tiny fleet and weak industry, relying on British alliance and colonial cruisers. Vulnerable to stronger colonial powers.",
  },
  regime: {
    type: "monarchy",
    politicalSystem: "constitutional_monarchy",
    headOfState: "King Luís I",
    headOfGovernment: "Anselmo José Braamcamp",
    leaderTitle: "King",
    navalPolicyActors: [
      "King",
      "Parliament",
      "Colonial Ministry",
      "British Alliance",
      "Colonial Lobbies",
    ],
    governmentModifiers: [
      "rotativismo",
      "colonial_empire",
      "anglo_portuguese_alliance",
      "economic_backwardness",
    ],
    navyMinister: {
      name: "Jose Vicente Barbosa du Bocage",
      title: "Minister of Marine and Colonies",
      traits:
        "Zoologist and scientist; committed colonial expansionist; key architect of Pink Map policy",
    },
    stabilityProfile: {
      level: "moderate",
      factors: ["Constitutional monarchy", "Chronic debt", "Colonial overstretch"],
    },
    description: "Constitutional monarchy. Oldest British ally.",
  },
  strategicObjectives: {
    primary: "Colonial Empire (Pink Map — link Angola and Mozambique)",
    secondary: "Trade Protection and maintain the Anglo-Portuguese Alliance",
  },
  baseResources: {
    gdpTier: "minor_power",
    gdpDescription:
      "Poorest in Western Europe after Spain; subsistence agriculture dominates; wine, cork, copper are main exports",
    population: "~4.5 million (metropolitan); ~5 million (colonies)",
    industrialization: "pre_industrial",
    industrializationDescription:
      "Very limited; cotton textiles, food processing, ship repair; no steel industry or heavy engineering; all capital goods imported",
  },
  navalAppropriation: {
    budgetLevel: "low",
    justification:
      "Portugal allocates a significant share of its tight budget to the navy and colonial administration. However, the absolute sum is small by European standards. The navy competes with the army (colonial campaigns) and with Fontismo infrastructure spending. The 1880 naval construction program is funded by foreign loans from London banks.",
  },
  economy: {
    description:
      "Poor, agrarian, debt-ridden, dependent on colonial trade and remittances. Weak industry.",
    character: "poor agrarian, colonial dependent",
    strengths: ["Colonial trade", "Atlantic islands as coaling stations", "British alliance"],
    weaknesses: ["Weak industry", "Debt", "Scattered colonies", "Small fleet"],
    industrialBase: "agrarian_colonial",
  },
  navalInstitution: {
    description:
      "Small, scattered, colonial patrol focused. Gunboats, small cruisers, station vessels. Relies on British protection.",
    character: ["small", "scattered", "colonial_patrol", "british_dependent"],
    seniority: "prestige_service",
  },
  doctrine: {
    summary:
      "Colonial patrol, station presence, gunboat diplomacy, port defense, trade protection. No fleet battle capability.",
    schools: ["colonial_patrol", "station_presence", "gunboat_diplomacy", "port_defense"],
  },
  shipDesign: {
    summary:
      "Small cruisers, gunboats, colonial station vessels. Limited range, tropical optimization.",
    principles: ["colonial_patrol", "small_size"],
    favoredTypes: ["gunboat", "small_cruiser", "colonial_patrol_vessel"],
  },
  military: {
    description:
      "Small, poorly equipped, underfunded army. Bulk deployed in African colonies with reliance on indigenous colonial troops. Navy is colonial patrol force.",
    size: "~25,000–30,000; colonial troops augment",
    character: ["underfunded", "colonial_garrison", "british_dependent"],
    armyNavyBalance: "army_heavy",
  },
  ai: {
    archetype: "small_colonial_survivor",
    behavior: [
      "rely_on_british_alliance",
      "patrol_colonies",
      "avoid_great_power_war",
      "seek_protection_for_angola_mozambique",
    ],
    aiRole: "colonial_power",
  },
  navalPurpose: "defend_coast_colonies",
  coreAnxiety: "loss_of_angola_mozambique",
  gameplayFeel: "survive_as_small_colonial",
  historicalAssumptions: [
    "Oldest British ally",
    "Controls Angola, Mozambique, Goa, Macau, Atlantic islands",
    "Small scattered navy",
    "Poor and debt-ridden",
  ],
} as const;
