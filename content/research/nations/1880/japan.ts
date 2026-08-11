import type { Nation } from "../../schema/nations.ts";

export const japan: Nation = {
  id: "japan",
  tag: "JPN",
  name: "Empire of Japan",
  displayNameKey: "nation.japan",
  isPlayable: true,
  slot: { id: "japan", order: 4, participation: "active" },
  presentation: { colorBg: "#FFFFFF", colorFg: "#BC002D" },
  identity: {
    oneSentence:
      "The Empire of Japan in January 1880 is an urgent Meiji island modernizer: politically centralized, strategically insecure, resource-constrained, and determined to build a modern navy fast enough to secure Korea, resist Qing and Russian pressure, and force recognition as a sovereign great power in an imperial world.",
    fullIdentity:
      "Rapidly modernizing island state in Meiji era. Modernized via foreign study, imported ships, officer training.",
    strategicProblem:
      "Needs modern navy before it has industrial base. Island geography, urgent interest in Korea, fear of Qing/Russian/Western pressure.",
  },
  regime: {
    type: "monarchy",
    politicalSystem: "meiji_constitutional_monarchy",
    headOfState: "Emperor Meiji",
    headOfGovernment: "Meiji Oligarchs",
    leaderTitle: "Emperor",
    navalPolicyActors: [
      "Imperial Authority",
      "Meiji Oligarchs",
      "Ministries",
      "Army-Navy Rivalry",
      "Emerging Diet",
    ],
    governmentModifiers: [
      "autocratic_executive",
      "rapid_modernisation",
      "meiji_consensus",
      "samurai_discontent",
    ],
    navyMinister: {
      name: "Kawamura Sumiyoshi (Jan–Apr) / Enomoto Takeaki (Apr onward)",
      title: "Minister of the Navy",
      traits:
        "Enomoto is Japan's most experienced naval officer; former Tokugawa retainer with political baggage",
    },
    stabilityProfile: {
      level: "high",
      factors: ["Politically centralized", "Elite commitment"],
    },
    description:
      "Entering Meiji constitutional order. Diet created while preserving imperial/oligarchic authority.",
  },
  strategicObjectives: {
    primary:
      "Ensure national survival against European colonisation by building a modern navy and securing control of Korea",
    secondary:
      "Revise unequal treaties and develop domestic heavy industry to reduce import dependence",
  },
  baseResources: {
    gdpTier: "minor_power",
    gdpDescription: "~GBP 1.8 billion (est. 1880, comparable to Italy or Austria-Hungary)",
    population: "~35 million",
    industrialization: "pre_industrial",
    industrializationDescription:
      "Pre-industrial transitioning to light industry; <1% heavy industry",
  },
  navalAppropriation: {
    budgetLevel: "very_low",
    justification:
      "Severely constrained; <5% of national budget (est.). Competing with army, railways, and industrial subsidies for limited fiscal capacity. Inflation eroding real spending power. Most naval spending goes to foreign purchases (ships, guns, machinery).",
  },
  economy: {
    description: "Industrializing quickly but constrained. Advantage is learning speed, not mass.",
    character: "industrializing quickly but constrained",
    strengths: ["Technical education", "State-directed modernization", "Learning speed"],
    weaknesses: ["Limited heavy industry", "Resource-constrained", "Relies on imported ships"],
    industrialBase: "constrained_regional",
  },
  navalInstitution: {
    description:
      "Young but purposeful. Adapts British professionalism and French Jeune École to East Asia.",
    character: ["disciplined", "ambitious", "adaptive", "regionally_focused"],
    seniority: "prestige_service",
  },
  doctrine: {
    summary:
      "Concentrated regional superiority, Korea Strait security, Yellow Sea operations, troop transport protection, torpedo equalizers, decisive local campaigns.",
    schools: [
      "concentrated_regional_superiority",
      "korea_strait_security",
      "yellow_sea_operations",
      "torpedo_equalizer",
    ],
  },
  shipDesign: {
    summary:
      "Protected cruisers, torpedo craft, efficient combatants, imported advanced vessels, high crew training. Battleships aspirational in 1880.",
    principles: ["efficiency", "imported_advanced_vessels", "high_crew_training"],
    favoredTypes: ["protected_cruiser", "torpedo_craft"],
  },
  military: {
    description:
      "Prussian-model conscript army, modernizing rapidly. Navy is prestige service with British doctrine. Army-navy rivalry is structural.",
    size: "peacetime ~40,000; mobilized ~120,000",
    character: ["prussian_model", "conscript", "modernizing"],
    armyNavyBalance: "balanced",
  },
  ai: {
    archetype: "urgent_regional_modernizer",
    behavior: [
      "prioritize_korea",
      "modernize_fast",
      "avoid_premature_war_with_west",
      "concentrate_limited_forces",
    ],
  },
  navalPurpose: "secure_sovereignty_ascent",
  coreAnxiety: "domination_before_ready",
  gameplayFeel: "modernize_under_pressure",
  historicalAssumptions: [
    "Not yet great naval power",
    "Korea central",
    "Learns faster than builds",
  ],
} as const;
