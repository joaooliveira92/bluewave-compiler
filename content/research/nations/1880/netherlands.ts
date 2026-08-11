import type { Nation } from "../../schema/nations.ts";

export const netherlands: Nation = {
  id: "netherlands",
  tag: "NLD",
  name: "Netherlands",
  displayNameKey: "nation.netherlands",
  isPlayable: false,
  slot: { id: "netherlands", order: 13, participation: "active" },
  presentation: { colorBg: "#21468B", colorFg: "#FFFFFF" },
  identity: {
    oneSentence:
      "The Netherlands in January 1880 is the small but wealthy colonial naval power: neutral, commercially sophisticated, guarding the vast Dutch East Indies and global trade routes with a modest but professional fleet optimized for colonial patrol and straits defense.",
    fullIdentity:
      "Constitutional monarchy under William III. Wealthy from colonial trade, especially Dutch East Indies. Neutral but must defend global colonial network and home waters at Danish Straits approaches.",
    strategicProblem:
      "Must defend far-flung colonial empire (East Indies is prize) and home waters with small industrial base, relying on neutrality, diplomacy, and colonial cruisers rather than battle fleet.",
  },
  regime: {
    type: "monarchy",
    politicalSystem: "constitutional_monarchy",
    headOfState: "King William III",
    headOfGovernment: "Theo van Lynden van Sandenburg",
    leaderTitle: "King",
    navalPolicyActors: [
      "King",
      "Parliament",
      "Colonial Ministry",
      "Merchant Interests",
      "East Indies Lobby",
    ],
    governmentModifiers: [
      "parliamentary_dominance",
      "colonial_administration_stress",
      "neutrality_tradition",
    ],
    navyMinister: {
      name: "Frederik Hendrik Alexander Sabron",
      title: "Minister of Marine",
      traits:
        "Lieutenant-General (ret.); professional military administrator; oversees modernization",
    },
    stabilityProfile: {
      level: "high",
      factors: ["Constitutional monarchy", "Wealthy, stable", "Neutrality policy"],
    },
    description: "Constitutional monarchy. Neutral, colonial-commercial focus.",
  },
  strategicObjectives: {
    primary: "Trade Protection",
    secondary: "Colonial Empire",
  },
  baseResources: {
    gdpTier: "minor_power",
    gdpDescription:
      "Disproportionately large relative to population due to trade, finance, and colonial wealth; comparable to Spain or Belgium in total output; per capita among highest in Europe",
    population: "~4 million (metropolitan); ~30 million (Dutch East Indies)",
    industrialization: "industrial",
    industrializationDescription:
      "Moderate by European standards; shipbuilding, food processing, textiles, chemicals; Limburg coal developing",
  },
  navalAppropriation: {
    budgetLevel: "moderate",
    justification:
      "Dutch military spending is shaped by two priorities: (1) the East Indies (naval squadron, KNIL, colonial administration, Aceh War) absorbs the bulk of the defense budget; (2) the home army receives the remainder, justified by neutrality enforcement and coastal defense. The navy's share is comparatively generous because it directly protects the national wealth (the Indies trade).",
  },
  economy: {
    description:
      "Wealthy trading and colonial economy, strong finance, but small industrial base vs great powers. East Indies is economic core.",
    character: "wealthy colonial trading power",
    strengths: [
      "Colonial trade (East Indies)",
      "Finance",
      "Merchant marine",
      "Agricultural exports",
    ],
    weaknesses: [
      "Small industrial base",
      "Dependent on neutral trade",
      "Vulnerable colonial concentration",
    ],
    industrialBase: "uneven",
  },
  navalInstitution: {
    description:
      "Professional, colonial-focused, modest. Excellent at colonial patrol, river and archipelago operations, less for fleet battle.",
    character: ["professional", "colonial_focused", "neutral", "archipelago_specialist"],
    seniority: "prestige_service",
  },
  doctrine: {
    summary:
      "Colonial patrol, archipelago defense, trade protection, neutrality defense, coastal defense at home. No battle fleet ambition.",
    schools: [
      "colonial_patrol",
      "archipelago_defense",
      "trade_protection",
      "coastal_defense",
      "neutrality_defense",
    ],
  },
  shipDesign: {
    summary:
      "Colonial cruisers, gunboats, shallow-draft vessels for East Indies, coastal defense ships for home waters. Endurance for colonial stations.",
    principles: ["colonial_endurance", "shallow_draft", "tropical_optimization"],
    favoredTypes: ["protected_cruiser", "gunboat", "colonial_cruiser", "coastal_defense_ship"],
  },
  military: {
    description:
      "Small homeland army, larger East Indies Army (KNIL). Neutrality policy shapes defense. Navy protects the East Indies trade.",
    size: "homeland ~25,000–30,000; KNIL ~35,000 (mostly indigenous)",
    character: ["colonial_military", "neutrality_defense"],
    armyNavyBalance: "balanced",
  },
  ai: {
    archetype: "wealthy_neutral_colonial",
    behavior: [
      "maintain_neutrality",
      "protect_east_indies",
      "protect_trade_routes",
      "avoid_great_power_war",
      "seek_british_guarantee",
    ],
    aiRole: "colonial_power",
  },
  navalPurpose: "sustain_colonial_network",
  coreAnxiety: "loss_of_east_indies",
  gameplayFeel: "defend_far_flung_empire_as_small_power",
  historicalAssumptions: [
    "Neutral",
    "Dutch East Indies is core colonial prize at Malacca approaches",
    "Small but professional colonial navy",
  ],
} as const;
