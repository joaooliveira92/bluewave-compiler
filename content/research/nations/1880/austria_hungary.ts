import type { Nation } from "../../schema/nations.ts";

export const austria_hungary: Nation = {
  id: "austria_hungary",
  name: "Austro-Hungarian Empire",
  displayNameKey: "nation.austria_hungary",
  isPlayable: true,
  slot: { id: "austria_hungary", order: 8, participation: "active" },
  presentation: { colorBg: "#ED2939", colorFg: "#FFFFFF" },
  identity: {
    oneSentence:
      "The Austro-Hungarian Empire in January 1880 is a multi-national land empire with a narrow but vital Adriatic sea window, relying on a compact, professional, politically constrained navy based around Pola to deter Italy, defend imperial prestige, and turn geography, mines, torpedoes, and local concentration into strategic survival.",
    fullIdentity:
      "Multi-national land empire with one narrow Adriatic window. Navy compact, professional, politically constrained.",
    strategicProblem:
      "Needs navy strong enough to prevent Adriatic humiliation, but political system/finances/army priorities make large ambitions difficult.",
  },
  regime: {
    type: "monarchy",
    politicalSystem: "dual_monarchy",
    headOfState: "Emperor Franz Joseph I",
    headOfGovernment: "Count Eduard Taaffe / Kálmán Tisza",
    leaderTitle: "Emperor",
    navalPolicyActors: [
      "Austrian Interests",
      "Hungarian Interests",
      "Imperial Ministries",
      "Army Dominance",
      "Habsburg Patronage",
    ],
    governmentModifiers: ["dual_budget_bargaining", "nationality_tensions", "army_dominance"],
    navyMinister: {
      name: "Adm. Friedrich von Pock",
      title: "Marinekommandant",
    },
    stabilityProfile: {
      level: "brittle",
      factors: ["Dual budget bargaining", "Army dominance", "Nationality tensions"],
    },
    description: "Dual monarchy. Naval appropriations must navigate Austrian/Hungarian interests.",
  },
  strategicObjectives: {
    primary: "Deter Italy in the Adriatic",
    secondary: "Preserve the Dual Monarchy through Balkan stability",
  },
  baseResources: {
    gdpTier: "great_power",
    gdpDescription: "~60% of UK level per capita, ~equal to Italy",
    population: "~38 million",
    industrialization: "developing_industrial",
    industrializationDescription:
      "Iron/steel (Bohemia, Moravia, Styria), arms (Steyr, Skoda), shipbuilding (Trieste, Fiume)",
  },
  navalAppropriation: {
    budgetLevel: "low",
    justification:
      "The navy is the junior service. The common army and the separate Landwehr/Honved forces consume the majority of the military budget. Ten-year budget cycles and dual-monarchy politics constrain naval spending. The fleet is maintained at a modest level sufficient for Adriatic deterrence, not for power projection.",
  },
  economy: {
    description: "Useful industrial pockets, later warship potential, but uneven and fragmented.",
    character: "uneven industrial pockets",
    strengths: ["Industrial pockets", "Warship potential"],
    weaknesses: ["Uneven base", "Politically fragmented"],
    industrialBase: "uneven",
  },
  navalInstitution: {
    description: "Compact, disciplined, defensive, professional, multi-national, centered on Pola.",
    character: ["compact", "disciplined", "defensive", "professional", "pola_centered"],
    seniority: "junior_to_army",
    formativeExperience: "Battle of Lissa 1866 - Tegetthoff defeated larger Italian fleet",
  },
  doctrine: {
    summary:
      "Adriatic sea denial, fleet-in-being, Pola defense, mines, torpedo craft, coastal fortifications, selective sorties.",
    schools: ["adriatic_sea_denial", "fleet_in_being", "pola_defense", "mines", "torpedo_craft"],
  },
  shipDesign: {
    summary: "Compact, efficient, theater-optimized, moderate range, suitable for Adriatic combat.",
    principles: ["compact", "efficient", "theater_optimized"],
    favoredTypes: ["battleship", "protected_cruiser", "torpedo_craft"],
  },
  military: {
    description:
      "Large multi-national conscript army. Army dominates military spending; navy is junior service. Dual monarchy structure complicates defense budget.",
    size: "peacetime ~300,000 (common army); mobilized ~800,000",
    character: ["multi_national", "conscript", "army_dominant"],
    armyNavyBalance: "army_dominant",
  },
  ai: {
    archetype: "defensive_adriatic_strategist",
    behavior: [
      "preserve_pola",
      "deter_italy",
      "avoid_global_commitments",
      "use_mines_and_torpedoes",
    ],
  },
  navalPurpose: "deny_adriatic_control",
  coreAnxiety: "italian_hostility_adriatic_vulnerability",
  gameplayFeel: "defend_narrow_sea",
  historicalAssumptions: ["Regional naval power", "Italy main rival", "Pola institutional core"],
} as const;
