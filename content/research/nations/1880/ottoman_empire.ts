import type { Nation } from "../../schema/nations.ts";

export const ottoman_empire: Nation = {
  id: "ottoman_empire",
  name: "Ottoman Empire",
  displayNameKey: "nation.ottoman_empire",
  isPlayable: false,
  slot: { id: "ottoman_empire", order: 11, participation: "active" },
  presentation: { colorBg: "#E30A17", colorFg: "#FFFFFF" },
  identity: {
    oneSentence:
      "The Ottoman Empire in January 1880 is the besieged guardian of the Turkish Straits: vast but contracting, controlling the gate between the Black Sea and Mediterranean while struggling to modernize its fleet and administration under relentless pressure from Russia, Britain, and Balkan nationalism.",
    fullIdentity:
      "Sick Man of Europe but still controls the most strategic chokepoint in the game - the Bosporus and Dardanelles. Nominal suzerain of Egypt, controls access for Russian Black Sea Fleet.",
    strategicProblem:
      "Must defend the Straits and vast coastlines with limited industrial means, while balancing between Britain (who wants Straits closed to Russia) and Russia (who wants them open).",
  },
  regime: {
    type: "monarchy",
    politicalSystem: "absolute_monarchy",
    headOfState: "Sultan Abdul Hamid II",
    headOfGovernment: "Sultan Abdul Hamid II",
    leaderTitle: "Sultan",
    navalPolicyActors: [
      "Sultan",
      "Porte",
      "Military Reformers",
      "Foreign Advisers (British/French)",
      "Provincial Governors",
    ],
    governmentModifiers: [
      "autocratic_executive",
      "fragile_multicultural_empire",
      "financial_dependency",
    ],
    navyMinister: {
      name: "Kapudan Pasha (occupant changes frequently under Abdul Hamid II)",
      title: "Kapudan Pasha (Minister of the Navy)",
      traits:
        "Deliberately weakened; Sultan distrusts naval officer corps for constitutionalist sympathies; underfunded and in decline",
    },
    stabilityProfile: {
      level: "fragile",
      factors: ["Balkan nationalism", "Debt crisis", "Russian pressure", "British influence"],
    },
    description:
      "Absolute monarchy under Abdul Hamid II. Tanzimat reforms stalled, pan-Islamic autocracy.",
  },
  strategicObjectives: {
    primary: "Homeland Defense — preserve territorial integrity, defend the Straits against Russia",
    secondary:
      "Regional Hegemony — recover influence in the Balkans, assert authority over Arab provinces",
  },
  baseResources: {
    gdpTier: "great_power",
    gdpDescription:
      "Minor Great Power / Declining Empire — aggregate GDP modest relative to European great powers; per capita GDP low; heavily indebted",
    population: "~20M",
    industrialization: "pre_industrial",
    industrializationDescription:
      "No domestic steel, armor, or heavy gun production; all warships purchased abroad; Imperial Arsenal in decline; railway network minimal",
  },
  navalAppropriation: {
    budgetLevel: "low",
    justification:
      "The Ottoman Empire is bankrupt (defaulted 1875). The OPDA will place ~1/3 of state revenues under European control. The military budget is overwhelmingly allocated to the army. The navy budget barely covers maintenance, crew pay, and limited coal purchases. The fleet's existing inventory is aging and deteriorating without replacement.",
  },
  economy: {
    description:
      "Agrarian empire with debt crisis, limited modern industry, dependent on foreign loans and customs.",
    character: "agrarian with debt crisis",
    strengths: ["Straits tolls", "Anatolian resources", "Strategic location"],
    weaknesses: ["Capitulations", "Foreign debt", "Weak industry", "Loss of Balkan provinces"],
    industrialBase: "agrarian_colonial",
  },
  navalInstitution: {
    description:
      "Once great, now decaying but attempting modernization with British and French-built ships. Coastal and straits defense focused.",
    character: ["strait_guardian", "decaying", "foreign_dependent", "coastal_defense"],
    seniority: "junior_to_army",
    formativeExperience: "Loss of fleet at Sinop 1853, reliance on foreign-built ironclads",
  },
  doctrine: {
    summary:
      "Straits defense, coastal defense, fleet-in-being inside Black Sea and Sea of Marmara, mine and fortress reliance. Cannot contest open Mediterranean.",
    schools: ["straits_defense", "coastal_defense", "fortress_fleet", "mine_warfare"],
  },
  shipDesign: {
    summary:
      "Foreign-built ironclads and coastal defense ships, limited endurance, fortress support. British-built central battery ships.",
    principles: ["foreign_built", "coastal_optimization", "fortress_support"],
    favoredTypes: ["ironclad", "coastal_defense_ship", "gunboat"],
  },
  military: {
    description:
      "Large conscript army, German-aligned continental priority. Poorly equipped by European standards. Army dominates budget, navy decaying.",
    size: "peacetime ~200,000–300,000 (Muslim population)",
    character: ["conscript", "continental_priority", "poorly_equipped"],
    armyNavyBalance: "army_dominant",
  },
  ai: {
    archetype: "besieged_strait_guardian",
    behavior: [
      "close_straits_to_russia",
      "seek_british_protection",
      "fortify_dardanelles",
      "avoid_open_battle",
      "rely_on_fortresses_and_mines",
    ],
    aiRole: "strait_guardian",
    triggers: ["russian_pressure_on_straits", "balkan_crisis"],
  },
  navalPurpose: "guard_straits_survive",
  coreAnxiety: "russian_breakthrough_and_partition",
  gameplayFeel: "guard_the_gate",
  historicalAssumptions: [
    "Controls Turkish Straits - central to Russian warm-water obsession",
    "Nominal suzerain of Egypt",
    "Balkan losses define weakness",
    "Straits closure is strategic obsession for Russia",
  ],
} as const;
