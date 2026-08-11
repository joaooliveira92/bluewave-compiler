import type { Nation } from "../../schema/nations.ts";

export const egypt: Nation = {
  id: "egypt",
  tag: "EGY",
  name: "Khedivate of Egypt",
  displayNameKey: "nation.egypt",
  isPlayable: false,
  slot: { id: "egypt", order: 12, participation: "active" },
  presentation: { colorBg: "#CE1126", colorFg: "#FFFFFF" },
  identity: {
    oneSentence:
      "The Khedivate of Egypt in January 1880 is the autonomous guardian of the Suez Canal: nominally Ottoman, practically independent, financially bankrupt, and strategically central, whose canal and debts make it the prize of Anglo-French rivalry and the key to Britain’s route to India.",
    fullIdentity:
      "Autonomous khedivate under Tewfik Pasha, successor to Isma'il. Suez Canal completed 1869. Dual Control by Britain and France over finances. Controls the most important shortcut in the world.",
    strategicProblem:
      "Must survive between Ottoman suzerainty, Anglo-French financial control, and strategic importance that invites intervention. Canal must stay open to remain relevant, but openness invites occupation.",
  },
  regime: {
    type: "monarchy",
    politicalSystem: "khedivate_autonomous",
    headOfState: "Khedive Tewfik Pasha",
    headOfGovernment: "Khedive Tewfik Pasha",
    leaderTitle: "Khedive",
    navalPolicyActors: [
      "Khedive",
      "Ottoman Suzerainty",
      "British Dual Control",
      "French Dual Control",
      "Army (Urabi movement emerging)",
      "Foreign Creditors",
    ],
    governmentModifiers: ["autonomous_khedivate", "dual_control", "bankrupt", "ottoman_suzerainty"],
    stabilityProfile: {
      level: "fragile",
      factors: [
        "Bankruptcy 1876",
        "Dual Control",
        "Urabi nationalist movement rising",
        "Ottoman vs European pressure",
      ],
    },
    description:
      "Autonomous hereditary khedivate, nominally Ottoman. Anglo-French Dual Control over finances after bankruptcy.",
  },
  strategicObjectives: {
    primary: "Survive between Ottoman suzerainty and Anglo-French control",
    secondary: "Keep the Suez Canal open and maintain strategic relevance",
  },
  baseResources: {
    gdpTier: "regional_power",
    gdpDescription: "Cotton export economy, bankrupt, under foreign financial control",
    population: "~7 million (estimated)",
    industrialization: "pre_industrial",
    industrializationDescription: "Agrarian; cotton is the primary export; limited modern industry",
  },
  navalAppropriation: {
    budgetLevel: "very_low",
    justification:
      "Egypt is bankrupt (1876) and under Anglo-French Dual Control over its finances. The navy is a small coastal force focused on port defense and canal security. Any significant naval expenditure requires foreign creditor approval.",
  },
  economy: {
    description:
      "Cotton export economy, bankrupt, under foreign financial control. Suez Canal revenues largely to foreign shareholders.",
    character: "cotton export, bankrupt",
    strengths: ["Suez Canal tolls", "Cotton", "Nile agriculture", "Strategic location"],
    weaknesses: ["Massive foreign debt", "Dual Control", "Canal shares sold to Britain 1875"],
    industrialBase: "agrarian_colonial",
  },
  navalInstitution: {
    description:
      "Small coastal force, port defense, canal security. Relies on foreign protection. Alexandria as fortified port.",
    character: ["coastal_only", "canal_guardian", "foreign_dependent"],
    seniority: "coastal_only",
  },
  doctrine: {
    summary:
      "Port defense, canal security, coastal patrol. Cannot contest Mediterranean. Relies on British/French fleets for protection.",
    schools: ["port_defense", "canal_security", "coastal_patrol"],
  },
  shipDesign: {
    summary: "Small gunboats, coastal defense, port craft. No blue-water capability.",
    principles: ["coastal_only", "port_defense"],
    favoredTypes: ["gunboat", "coastal_defense_ship"],
  },
  military: {
    description:
      "Army is primary institution with Urabi nationalist movement rising. Navy is a small coastal force. Foreign Dual Control constrains military spending.",
    size: "army ~30,000 (Egyptian); navy is minimal coastal force",
    character: ["army_dominant", "nationalist_movement", "foreign_controlled"],
    armyNavyBalance: "army_dominant",
  },
  ai: {
    archetype: "canal_guardian_in_debt",
    behavior: [
      "keep_canal_open",
      "balance_britain_and_france",
      "avoid_provoking_occupation",
      "rely_on_foreign_protection",
    ],
    aiRole: "colonial_power",
    triggers: ["debt_crisis", "nationalist_revolt", "canal_closure_threat"],
  },
  navalPurpose: "control_canal_survive",
  coreAnxiety: "foreign_occupation_and_loss_of_autonomy",
  gameplayFeel: "survive_between_empires",
  historicalAssumptions: [
    "Suez operational since 1869 - central to global routing",
    "Dual Control by Britain/France",
    "Urabi movement rising, will trigger 1882 occupation",
    "Canal shares sold to Britain 1875",
  ],
} as const;
