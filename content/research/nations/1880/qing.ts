import type { Nation } from "../../schema/nations.ts";

export const qing: Nation = {
  id: "qing",
  tag: "CHI",
  name: "Qing Dynasty",
  displayNameKey: "nation.qing",
  isPlayable: true,
  slot: { id: "qing", order: 10, participation: "active" },
  presentation: { colorBg: "#FFDE00", colorFg: "#000000" },
  identity: {
    oneSentence:
      "The Qing Dynasty in January 1880 is a vast imperial civilization under maritime siege, possessing impressive but regionally fragmented modernization — especially the Beiyang Fleet — while struggling to convert population, wealth, arsenals, and imported warships into a coherent national navy before Japan and Western powers exploit the gap between imperial scale and modern readiness.",
    fullIdentity:
      "Vast imperial civilization attempting selective modernization. Self-Strengthening Movement introduced Western methods but preserved older order.",
    strategicProblem:
      "Can acquire modern ships, but cannot easily convert into unified national navy because authority/finance/doctrine/command remain fragmented. Problem is institutional conversion, not scale.",
  },
  regime: {
    type: "monarchy",
    politicalSystem: "absolute_monarchy",
    headOfState: "Guangxu Emperor",
    headOfGovernment: "Empress Dowager Cixi / Li Hongzhang",
    leaderTitle: "Emperor",
    navalPolicyActors: [
      "Imperial Court",
      "Empress Dowager Cixi",
      "Regional Viceroys",
      "Li Hongzhang",
      "Conservative Officials",
    ],
    governmentModifiers: [
      "empress_dowager_regency",
      "self_strengthening",
      "confucian_bureaucracy",
      "unequal_treaties",
      "regional_fleet_fragmentation",
    ],
    stabilityProfile: {
      level: "fragile",
      factors: ["Court politics", "Regional viceroy power", "Fiscal diversion"],
    },
    description:
      "Ruled by imperial court, but modernization depends on regional viceroys. Li Hongzhang sponsors Beiyang Fleet.",
  },
  strategicObjectives: {
    primary: "Preserve territorial integrity and avoid partition by foreign powers",
    secondary: "Develop the Beiyang Fleet and defend tributary states (Korea, Vietnam)",
  },
  baseResources: {
    gdpTier: "great_power",
    gdpDescription: "~GBP 7-8 billion (largest in world by absolute measure; low per capita)",
    population: "~380 million",
    industrialization: "pre_industrial",
    industrializationDescription:
      "Pre-industrial; modern industry <0.5% of economy; concentrated in 4-5 treaty port/arsenal enclaves",
  },
  navalAppropriation: {
    budgetLevel: "very_low",
    justification:
      "Severely constrained. Central government revenue ~GBP 12 million/year total. Beiyang Fleet absorbs ~GBP 0.5-1 million/year (Li Hongzhang's provincial revenue, not central budget). Nanyang, Fujian, Guangdong fleets funded locally at lower levels. Corruption consumes an estimated 20-40% of naval procurement.",
  },
  economy: {
    description:
      "Immense potential but weak integration. Industrial islands, not integrated state.",
    character: "immense potential but weak integration",
    strengths: ["Immense population", "Vast resources", "Arsenals", "Imported warships"],
    weaknesses: ["Regionally uneven", "Institutionally limited", "After 1888 construction stopped"],
    industrialBase: "vast_unintegrated",
  },
  navalInstitution: {
    description:
      "Not one unified navy but regional fleets, Beiyang dominant. Included German/British-built warships.",
    character: [
      "regionally_fragmented",
      "beiyang_dominant",
      "import_dependent",
      "inconsistent_readiness",
    ],
    seniority: "fragmented",
    formativeExperience: "Self-Strengthening Movement; Beiyang Fleet",
  },
  doctrine: {
    summary:
      "Coastal defense, regional fleet deterrence, Bohai Gulf security, Yellow Sea operations, treaty-port defense. Lacks integrated doctrine unless reformed.",
    schools: [
      "coastal_defense",
      "regional_fleet_deterrence",
      "bohai_gulf_security",
      "treaty_port_defense",
    ],
    isFragmented: true,
  },
  shipDesign: {
    summary:
      "Relies on imported modernity: German/British capital ships, foreign advisers, regional arsenals, limited standardization.",
    principles: ["imported_modernity", "foreign_advisers"],
    favoredTypes: ["battleship", "armored_cruiser", "protected_cruiser", "gunboat"],
    exemplarClass: "Dingyuan class (German-built)",
  },
  military: {
    description:
      "Vast but fragmented military: Eight Banners in decline, Green Standard as local police, Huai and Chu armies as modern forces. No general staff or unified command. Beiyang Army emerging.",
    size: "Eight Banners ~60,000 (paper), Green Standard ~300,000, Huai Army ~25,000, Chu Army ~20,000",
    character: ["regionally_fragmented", "uneven_modernization", "banner_legacy"],
    armyNavyBalance: "army_dominant",
  },
  ai: {
    archetype: "vast_conservative_modernizer",
    behavior: [
      "cautious",
      "prestige_sensitive",
      "regionally_fragmented",
      "willing_to_buy_modern_ships",
      "reluctant_to_centralize",
    ],
  },
  navalPurpose: "defend_sovereignty_modernize",
  coreAnxiety: "foreign_encroachment_failed_modernization",
  gameplayFeel: "transform_vast_potential",
  historicalAssumptions: [
    "Not simply backward",
    "Beiyang Fleet central",
    "Regionalization core weakness",
  ],
} as const;
