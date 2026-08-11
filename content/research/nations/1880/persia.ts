import type { Nation } from "../../schema/nations.ts";

export const persia: Nation = {
  id: "persia",
  name: "Persia",
  displayNameKey: "nation.persia",
  isPlayable: false,
  slot: { id: "persia", order: 24, participation: "active" },
  presentation: { colorBg: "#239F40", colorFg: "#FFFFFF" },
  identity: {
    oneSentence:
      "Persia in January 1880 is the ancient Qajar kingdom caught in the Great Game between Russia and Britain: weak, agrarian, strategically located on the Persian Gulf and Caspian Sea, with no navy and limited ability to resist great-power encroachment.",
    fullIdentity:
      "Qajar dynasty under Naser al-Din Shah. Weakening, caught between Russian pressure in the north (Caspian, Caucasus, Central Asia) and British influence in the south (Persian Gulf, India approaches). No modern navy, minimal army modernisation.",
    strategicProblem:
      "Must survive between Russia (seeking warm-water ports and northern influence) and Britain (seeking buffer for India and Persian Gulf control) with a weak army, no navy, and an economy dependent on foreign loans and concessions.",
  },
  regime: {
    type: "monarchy",
    politicalSystem: "absolute_monarchy",
    headOfState: "Naser al-Din Shah Qajar",
    headOfGovernment: "Naser al-Din Shah Qajar",
    leaderTitle: "Shah",
    navalPolicyActors: [
      "Shah",
      "Court",
      "Russian Advisers",
      "British Advisers",
      "Religious Authorities",
    ],
    governmentModifiers: ["autocratic_executive", "great_game_buffer", "qajar_dynasty"],
    stabilityProfile: {
      level: "fragile",
      factors: [
        "Great Game pressure",
        "Debt and concessions",
        "Tribal divisions",
        "Weak central authority",
      ],
    },
    description: "Absolute monarchy under Qajar dynasty. Caught in Russo-British Great Game.",
  },
  strategicObjectives: {
    primary: "Survive between Russian and British pressure in the Great Game",
    secondary: "Preserve territorial integrity and avoid partition",
  },
  baseResources: {
    gdpTier: "small_power",
    gdpDescription: "Agrarian, weak industry, dependent on foreign loans and concession revenues",
    population: "~8 million (estimated)",
    industrialization: "pre_industrial",
    industrializationDescription: "Pre-industrial; no modern navy; oil discovered later (1908)",
  },
  navalAppropriation: {
    budgetLevel: "very_low",
    justification:
      "No modern navy exists. Traditional coastal craft in the Persian Gulf and Caspian Sea. Persia relies on the great-power balance (the Great Game) for security at sea.",
  },
  economy: {
    description:
      "Agrarian, weak industry, dependent on foreign loans and concession revenues. Oil discovered later (1908).",
    character: "agrarian, foreign-dependent",
    strengths: [
      "Strategic location",
      "Persian Gulf coast",
      "Caspian coast",
      "Traditional trade routes",
    ],
    weaknesses: ["No industry", "Foreign debt", "Weak army", "No navy", "Capitulations"],
    industrialBase: "agrarian_colonial",
  },
  navalInstitution: {
    description:
      "No modern navy. Traditional coastal craft in Persian Gulf and Caspian. Relies on great-power navies for sea control.",
    character: ["no_modern_navy", "traditional", "gulf_coastal"],
    seniority: "coastal_only",
  },
  doctrine: {
    summary:
      "No naval doctrine. Coastal defense with traditional craft in Persian Gulf and Caspian. Entirely dependent on great-power balance.",
    schools: ["traditional_coastal_defense"],
  },
  shipDesign: {
    summary: "Traditional dhows and coastal craft. No modern warship capability.",
    principles: ["traditional"],
    favoredTypes: ["traditional_craft"],
  },
  military: {
    description:
      "Weak army with no modern navy. Qajar dynasty weakening. Caught between Russian pressure in north and British influence in south. Survival via playing both in the Great Game.",
    size: "traditional forces; no modern standing army",
    character: ["weak_army", "no_modern_navy", "great_game_buffer"],
    armyNavyBalance: "army_dominant",
  },
  ai: {
    archetype: "great_game_buffer",
    behavior: [
      "play_russia_vs_britain",
      "avoid_provoking_either",
      "focus_on_army_not_navy",
      "grant_concessions_for_survival",
      "resist_full_domination",
    ],
    aiRole: "buffer_state",
    triggers: ["russian_pressure", "british_pressure", "concession_crisis"],
  },
  navalPurpose: "defend_coast_colonies",
  coreAnxiety: "russian_british_partition",
  gameplayFeel: "survive_great_game",
  historicalAssumptions: [
    "Central arena of the Great Game",
    "Qajar dynasty weakening",
    "No modern navy",
    "Russian pressure in north, British in south",
    "Oil is future (1908)",
    "Anglo-Russian Convention of 1907 will partition spheres",
  ],
} as const;
