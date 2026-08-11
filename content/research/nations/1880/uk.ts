import type { Nation } from "../../schema/nations.ts";

export const uk: Nation = {
  id: "uk",
  name: "United Kingdom",
  displayNameKey: "nation.uk",
  isPlayable: true,
  slot: { id: "uk", order: 1, participation: "active" },
  presentation: { colorBg: "#C8102E", colorFg: "#FFFFFF" },
  identity: {
    oneSentence:
      "The United Kingdom in January 1880 is the mature maritime hegemon of the world: rich, experienced, globally based, politically navalist, logistically sophisticated, and strategically overextended, with its empire, economy, and prestige all dependent on the Royal Navy’s continued command of the sea.",
    fullIdentity:
      "The world’s dominant maritime, imperial, commercial, and financial power. The 1889 Naval Defence Act formalized the two-power standard vs France and Russia.",
    strategicProblem:
      "Must be strong everywhere, but decisive strength requires concentration. Must defend British Isles, Channel/North Sea, Atlantic commerce, Mediterranean, route to India via Gibraltar/Malta/Suez/Aden, Indian Ocean, East Asia, Caribbean, coaling stations. Powerful but overstretched.",
  },
  regime: {
    type: "monarchy",
    politicalSystem: "constitutional_monarchy",
    headOfState: "Queen Victoria",
    headOfGovernment: "William E. Gladstone",
    leaderTitle: "Prime Minister",
    navalPolicyActors: [
      "Parliament",
      "Admiralty",
      "Treasury",
      "Public Opinion",
      "Press",
      "Navalist Scares",
      "Colonial Lobbies",
    ],
    governmentModifiers: ["parliamentary_dominance"],
    navyMinister: {
      name: "W.H. Smith",
      title: "First Lord of the Admiralty",
      traits: "Competent administrator, not a naval specialist; political appointee",
    },
    stabilityProfile: {
      level: "high",
      factors: [
        "Parliamentary government",
        "Navalist pressure",
        "Emergency construction on perceived decline",
      ],
    },
    description:
      "Constitutional monarchy with parliamentary government. Royal Navy is politically central.",
  },
  strategicObjectives: {
    primary: "Trade Protection",
    secondary: "Naval Parity",
  },
  baseResources: {
    gdpTier: "great_power",
    gdpDescription: "Largest in Europe, #1 globally",
    population: "~35M (UK proper); ~300M (empire)",
    industrialization: "world_leading",
    industrializationDescription: "Most industrialized economy globally",
  },
  navalAppropriation: {
    budgetLevel: "moderate",
    justification:
      "The Royal Navy is uncontested; peacetime economy has reduced pressure for naval expenditure. The Two-Power Standard is maintained without difficulty against current rivals (France and Russia are the nominal second and third navies).",
  },
  economy: {
    description: "Mature industrial and financial power.",
    character: "mature industrial and financial power",
    strengths: [
      "World-class shipyards",
      "Advanced marine engineering",
      "High-quality naval coal",
      "Global finance",
      "Merchant shipping",
      "Naval dockyards",
    ],
    weaknesses: ["Cost of dominance", "Conservatism", "Global obligations"],
    industrialBase: "mature_global",
  },
  navalInstitution: {
    description: "The senior service. Globally experienced and logistically sophisticated.",
    character: [
      "professional",
      "globally_experienced",
      "logistically_sophisticated",
      "institutionally_conservative",
      "prestige_conscious",
    ],
    seniority: "senior_service",
    cruiserRole:
      "Working ships of empire: trade protectors, scouts, colonial enforcers, station vessels.",
    formativeExperience: "Two-power standard psychology",
  },
  doctrine: {
    summary:
      "Command of the sea, blockade, trade protection, decisive battle fleet superiority, cruiser coverage, colonial station presence, global logistics, deterrence through visible superiority.",
    schools: [
      "command_of_the_sea",
      "blockade",
      "trade_protection",
      "decisive_battle",
      "cruiser_coverage",
      "colonial_station_presence",
    ],
  },
  shipDesign: {
    summary:
      "Seaworthiness, endurance, reliability, maintainability, balanced armament and armor, operational range, standardized classes, large cruiser forces.",
    principles: [
      "seaworthiness",
      "endurance",
      "reliability",
      "balanced_armament_armor",
      "standardization",
    ],
    favoredTypes: ["battleship", "protected_cruiser", "armored_cruiser"],
    exemplarClass: "Royal Sovereign class",
  },
  military: {
    description:
      "Small army (Continental Abstention trait — avoids European land wars). Royal Navy is the primary service. Army focused on colonial garrisons and imperial policing.",
    size: "peacetime ~150,000 regulars; ~70,000 in India",
    character: ["colonial_garrison", "imperial_policing"],
    armyNavyBalance: "navy_prestige",
  },
  ai: {
    archetype: "status_quo_maritime_hegemon",
    behavior: [
      "protect_home_waters",
      "maintain_capital_ship_superiority",
      "preserve_cruiser_coverage",
      "defend_routes_and_coaling_stations",
      "avoid_continental_entanglement",
    ],
    triggers: ["naval_scare", "threat_to_suez"],
  },
  navalPurpose: "sustain_global_empire",
  coreAnxiety: "loss_of_sea_control_overstretch",
  gameplayFeel: "manage_supremacy",
  historicalAssumptions: [
    "Begins as naval benchmark",
    "Two-power standard is policy and psychology",
    "Coal logistics central",
  ],
} as const;
