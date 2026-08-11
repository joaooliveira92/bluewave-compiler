import type { Nation } from "../../schema/nations.ts";

export const korea: Nation = {
  id: "korea",
  name: "Joseon Korea",
  displayNameKey: "nation.korea",
  isPlayable: false,
  slot: { id: "korea", order: 21, participation: "active" },
  presentation: { colorBg: "#FFFFFF", colorFg: "#0047A0" },
  identity: {
    oneSentence:
      "Joseon Korea in January 1880 is the isolated hermit kingdom at the center of the storm: weak, agrarian, strategically located between Qing China, Japan, and Russia, whose ports, straits, and neutrality are the prize of East Asian rivalry.",
    fullIdentity:
      "Kingdom under Gojong, with Queen Min and Daewongun influence. Isolationist but forced open by Japan (Treaty of Ganghwa 1876) and facing Qing, Japanese, and Russian pressure. No modern navy.",
    strategicProblem:
      "Must survive between three empires that all want to control Korea, with no modern navy, weak army, and isolationist tradition, while reforms and foreign pressure destabilize the court.",
  },
  regime: {
    type: "monarchy",
    politicalSystem: "absolute_monarchy",
    headOfState: "King Gojong",
    headOfGovernment: "King Gojong / Queen Min",
    leaderTitle: "King",
    navalPolicyActors: [
      "King Gojong",
      "Queen Min",
      "Daewongun",
      "Conservative Officials",
      "Reformists",
      "Qing Influence",
      "Japanese Pressure",
    ],
    governmentModifiers: ["hermit_kingdom", "isolationist", "court_factionalism"],
    stabilityProfile: {
      level: "fragile",
      factors: [
        "Isolationist tradition",
        "Qing vs Japan rivalry",
        "Court factionalism",
        "Imo Incident coming 1882",
      ],
    },
    description:
      "Absolute monarchy. Hermit kingdom forced open, court divided between conservatives and reformists, Qing and Japanese influence struggle.",
  },
  strategicObjectives: {
    primary: "Survive between Qing, Japan, and Russia",
    secondary: "Preserve isolationist tradition while managing foreign pressure",
  },
  baseResources: {
    gdpTier: "small_power",
    gdpDescription: "Agrarian, isolated, poor, minimal industry, closed to trade until recently",
    population: "~13 million (estimated)",
    industrialization: "pre_industrial",
    industrializationDescription: "Pre-industrial; no modern industry or naval-industrial base",
  },
  navalAppropriation: {
    budgetLevel: "very_low",
    justification:
      "No modern navy exists. Traditional coastal defense relies on small junks. No budget allocated for modern warships. Korea cannot build or maintain a modern fleet without foreign assistance.",
  },
  economy: {
    description:
      "Agrarian, isolated, poor, minimal industry, closed to trade until recently. No naval-industrial base.",
    character: "agrarian isolated",
    strengths: ["Strategic location", "Agriculture", "Ports"],
    weaknesses: ["No industry", "Isolated", "No navy", "Dependent on great powers"],
    industrialBase: "agrarian_colonial",
  },
  navalInstitution: {
    description:
      "No modern navy. Traditional coastal defense, small junks, no blue-water capability. Relies on Qing or Japanese protection.",
    character: ["no_modern_navy", "traditional", "coastal_only"],
    seniority: "coastal_only",
  },
  doctrine: {
    summary:
      "No doctrine. Coastal defense with traditional craft. Survival depends on playing Qing, Japan, and Russia against each other.",
    schools: ["traditional_coastal_defense"],
  },
  shipDesign: {
    summary: "No modern ships. Traditional junks and small coastal craft. No capability.",
    principles: ["traditional"],
    favoredTypes: ["junk", "coastal_craft"],
  },
  military: {
    description:
      "No modern military. Traditional forces, minimal modernization. No navy. Survival depends on playing Qing, Japan, and Russia against each other.",
    size: "traditional forces only; no modern standing army",
    character: ["traditional", "no_modern_navy", "buffer_dependent"],
    armyNavyBalance: "army_dominant",
  },
  ai: {
    archetype: "hermit_kingdom_flashpoint",
    behavior: [
      "seek_qing_protection",
      "resist_japanese_pressure",
      "play_powers_against_each_other",
      "avoid_modernization",
      "survive_as_buffer",
    ],
    aiRole: "crisis_flashpoint",
    triggers: ["imo_incident", "sino_japanese_rivalry", "russian_port_demand"],
  },
  navalPurpose: "survive_as_buffer",
  coreAnxiety: "loss_of_sovereignty_to_qing_japan_or_russia",
  gameplayFeel: "survive_between_empires",
  historicalAssumptions: [
    "Hermit kingdom forced open 1876",
    "Central to Qing-Japan rivalry",
    "Imo Incident 1882 will trigger Qing intervention",
    "No modern navy",
    "First Sino-Japanese War fought over Korea",
  ],
} as const;
