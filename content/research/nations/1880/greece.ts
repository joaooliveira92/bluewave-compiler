import type { Nation } from "../../schema/nations.ts";

export const greece: Nation = {
  id: "greece",
  tag: "GRC",
  name: "Kingdom of Greece",
  displayNameKey: "nation.greece",
  isPlayable: false,
  slot: { id: "greece", order: 17, participation: "active" },
  presentation: { colorBg: "#0D5EAF", colorFg: "#FFFFFF" },
  identity: {
    oneSentence:
      "Greece in January 1880 is the small, irredentist Mediterranean kingdom: poor, ambitious, strategically located in the Aegean and Ionian seas, dreaming of Megali Idea while relying on British/French protection and a tiny coastal navy.",
    fullIdentity:
      "Constitutional monarchy under George I. Irredentist, wants Ottoman territories with Greek populations. Controls Aegean islands, strategically located at entrance to Black Sea approaches.",
    strategicProblem:
      "Must pursue irredentist ambitions against Ottoman Empire with tiny fleet and weak industry, relying on great power patronage and coastal defense.",
  },
  regime: {
    type: "monarchy",
    politicalSystem: "constitutional_monarchy",
    headOfState: "King George I",
    headOfGovernment: "Charilaos Trikoupis",
    leaderTitle: "King",
    navalPolicyActors: [
      "King",
      "Parliament",
      "Irredentist Movements",
      "Great Power Patrons (Britain/France/Russia)",
      "Military",
    ],
    governmentModifiers: ["constitutional_monarchy", "irredentist", "great_power_dependent"],
    navyMinister: {
      name: "Dimitrios Voulgaris",
      title: "Navy Minister",
      traits: "Elder statesman, former PM, placeholder",
    },
    stabilityProfile: {
      level: "brittle",
      factors: ["Irredentism", "Debt", "Great power dependence", "Frequent coups"],
    },
    description: "Constitutional monarchy. Megali Idea drives policy.",
  },
  strategicObjectives: {
    primary: "Irredentist expansion (Megali Idea)",
    secondary: "Great Power patronage and survival",
  },
  baseResources: {
    gdpTier: "minor_power",
    gdpDescription: "Small, poor agrarian economy; shipping and diaspora remittances important",
    population: "~1.8 million",
    industrialization: "pre_industrial",
    industrializationDescription:
      "Pre-industrial; no domestic arms or warship production; all military equipment imported",
  },
  navalAppropriation: {
    budgetLevel: "low",
    justification:
      "Greece maintains a small coastal defense fleet. The navy receives a modest share of a tight budget dominated by debt service and army costs. The fleet relies on a few ironclads (Vasilefs Georgios, Vasilissa Olga) and torpedo boats. Major acquisitions require foreign loans.",
  },
  economy: {
    description: "Poor, agrarian, shipping-based, debt-ridden, dependent on great power loans.",
    character: "poor agrarian, shipping",
    strengths: ["Shipping", "Aegean location", "Diaspora"],
    weaknesses: ["Weak industry", "Debt", "Small base"],
    industrialBase: "agrarian_colonial",
  },
  navalInstitution: {
    description:
      "Tiny, coastal defense focused, gunboats, small ironclads, torpedo craft. Relies on geography and great power protection.",
    character: ["small", "coastal_defense", "irredentist", "great_power_dependent"],
    seniority: "prestige_service",
  },
  doctrine: {
    summary:
      "Coastal defense, Aegean control, commerce raiding vs Ottoman, torpedo craft, island defense. No blue-water capability.",
    schools: ["coastal_defense", "aegean_control", "commerce_raiding", "torpedo_craft"],
  },
  shipDesign: {
    summary: "Small ironclads, gunboats, torpedo craft optimized for Aegean narrow waters.",
    principles: ["aegean_optimization", "small_size"],
    favoredTypes: ["ironclad", "gunboat", "torpedo_craft"],
  },
  military: {
    description:
      "Small army with partial mobilization since 1878. Poorly supplied. Navy is tiny coastal defense force. Heavily dependent on great power loans and patronage.",
    size: "35,000 under arms (above 12,000 peacetime); partial mobilization",
    character: ["under_supplied", "irredentist", "great_power_dependent"],
    armyNavyBalance: "army_heavy",
  },
  ai: {
    archetype: "irredentist_small_power",
    behavior: [
      "pursue_megali_idea",
      "seek_great_power_patronage",
      "harass_ottoman",
      "defend_aegean_islands",
    ],
    aiRole: "regional_balancer",
  },
  navalPurpose: "contest_southern_cone",
  coreAnxiety: "ottoman_retention_of_greek_lands",
  gameplayFeel: "irredentist_gamble",
  historicalAssumptions: [
    "Megali Idea drives policy",
    "Controls Aegean islands",
    "Tiny coastal navy",
    "Dependent on great power patronage",
  ],
} as const;
