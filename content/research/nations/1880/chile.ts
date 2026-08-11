import type { Nation } from "../../schema/nations.ts";

export const chile: Nation = {
  id: "chile",
  name: "Chile",
  displayNameKey: "nation.chile",
  isPlayable: false,
  slot: { id: "chile", order: 19, participation: "active" },
  presentation: { colorBg: "#0039A6", colorFg: "#FFFFFF" },
  identity: {
    oneSentence:
      "Chile in January 1880 is the rising Pacific naval power: victorious in the War of the Pacific, with the most modern and battle-tested fleet in South America, controlling the nitrate-rich north and the Strait of Magellan gateway between Atlantic and Pacific.",
    fullIdentity:
      "Presidential republic under Aníbal Pinto. At war with Peru and Bolivia (War of the Pacific 1879-84), winning. Has British-built central battery ironclads Cochrane and Blanco Encalada - most powerful in Americas south of USA.",
    strategicProblem:
      "Must win War of the Pacific, secure nitrate fields, and control long, narrow coastline and Magellan Strait with small but modern fleet, while balancing Argentina and Brazil.",
  },
  regime: {
    type: "republic",
    politicalSystem: "presidential_republic",
    headOfState: "President Aníbal Pinto",
    headOfGovernment: "President Aníbal Pinto",
    leaderTitle: "President",
    navalPolicyActors: [
      "President",
      "Congress",
      "Nitrate Interests",
      "British Advisers",
      "War Leadership",
    ],
    governmentModifiers: ["presidential_system", "at_war"],
    navyMinister: {
      name: "Navy C-in-C: Rear Admiral Juan Jose Latorre",
      title: "Navy Commander (wartime)",
      traits: "Aggressive, competent; no civilian Navy Minister listed in 1880",
    },
    stabilityProfile: {
      level: "brittle",
      factors: ["War of the Pacific - winning", "Nitrate wealth", "Strong navy"],
    },
    description: "Presidential republic. At war, winning, with strong British-influenced navy.",
  },
  strategicObjectives: {
    primary: "Win the War of the Pacific",
    secondary: "Secure nitrate fields and control the Strait of Magellan",
  },
  baseResources: {
    gdpTier: "regional_power",
    gdpDescription: "Nitrate and copper export-driven economy; wealthy for the region",
    population: "~2.5 million",
    industrialization: "developing_industrial",
    industrializationDescription: "Limited but growing; mining and nitrate processing dominate",
  },
  navalAppropriation: {
    budgetLevel: "high",
    justification:
      "Chile is at war (War of the Pacific, 1879-1884) and the navy is the decisive service. The budget prioritizes maintaining the British-built ironclads Cochrane and Blanco Encalada, purchasing torpedo boats, and funding blockade operations against Peru. Naval expenditure is at crisis levels for a wartime footing.",
  },
  economy: {
    description:
      "Nitrate and copper export boom from War of the Pacific conquests. Wealthy for region, but war-dependent.",
    character: "nitrate export boom, at war",
    strengths: ["Nitrates", "Copper", "British investment", "War booty"],
    weaknesses: ["War costs", "Long coastline", "Dependent on sea control for war"],
    industrialBase: "resource_export",
  },
  navalInstitution: {
    description:
      "Most modern and battle-tested in South America. British-built ironclads, professional, combat-experienced from War of the Pacific. Excellent gunnery.",
    character: [
      "most_modern_in_region",
      "battle_tested",
      "british_built",
      "professional",
      "combat_experienced",
    ],
    seniority: "senior_service",
    formativeExperience: "War of the Pacific - naval victories at Iquique and Angamos 1879",
  },
  doctrine: {
    summary:
      "Sea control, blockade of Peru, coastal bombardment, troop transport protection, commerce raiding, Magellan control. Most aggressive in South America.",
    schools: ["sea_control", "blockade", "coastal_bombardment", "troop_transport_protection"],
  },
  shipDesign: {
    summary:
      "British-built central battery ironclads, cruisers, torpedo craft. Modern, well-maintained, high crew training. Best in region.",
    principles: ["british_built", "modern", "high_training"],
    favoredTypes: ["ironclad", "cruiser", "torpedo_craft"],
    exemplarClass: "Cochrane class central battery ironclads",
  },
  military: {
    description:
      "At war in War of the Pacific (1879-84). Navy is the decisive service. Army divided between I Division (~8,000 effectives in Tarapaca) and II Division (~2,000 garrison). National Guard ~20,000 but mostly untrained.",
    size: "I Division ~8,000, II Division ~2,000, National Guard ~20,000",
    character: ["wartime", "battle_tested", "nitrate_funded"],
    armyNavyBalance: "navy_focused",
  },
  ai: {
    archetype: "battle_tested_pacific_power",
    behavior: [
      "win_war_of_the_pacific",
      "blockade_peru",
      "control_magellan",
      "balance_argentina",
      "leverage_nitrate_wealth",
    ],
    aiRole: "southern_cone_rival",
    triggers: ["war_of_the_pacific"],
  },
  navalPurpose: "contest_southern_cone",
  coreAnxiety: "argentine_intervention_and_loss_of_nitrates",
  gameplayFeel: "win_pacific_war_and_control_magellan",
  historicalAssumptions: [
    "At war in War of the Pacific 1879-84, winning",
    "Has most modern fleet in South America - Cochrane/Blanco Encalada",
    "Controls nitrate fields",
    "Magellan Strait is vital before Panama",
  ],
} as const;
