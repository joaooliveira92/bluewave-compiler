import type { Nation } from "../../schema/nations.ts";

export const usa: Nation = {
  id: "usa",
  name: "United States",
  displayNameKey: "nation.usa",
  isPlayable: true,
  slot: { id: "usa", order: 3, participation: "active" },
  presentation: { colorBg: "#002868", colorFg: "#BF0A30" },
  identity: {
    oneSentence:
      "The United States of America in January 1880 is a secure continental republic with enormous industrial potential and limited overseas commitments, beginning to transform its neglected navy into a modern instrument of hemispheric defense, commercial expansion, and eventual blue-water great-power status.",
    fullIdentity:
      "Secure continental republic. Navy transforming from post-Civil War neglect toward New Navy. Congress supported modernization from 1881.",
    strategicProblem:
      "Has resources to become naval giant, but must decide overseas power is compatible with republican identity. Two ocean frontiers, no canal, cannot easily concentrate.",
  },
  regime: {
    type: "republic",
    politicalSystem: "presidential_republic",
    headOfState: "President Rutherford B. Hayes",
    headOfGovernment: "President Rutherford B. Hayes",
    leaderTitle: "President",
    navalPolicyActors: [
      "Congress",
      "President",
      "Public Opinion",
      "Newspapers",
      "Naval Reformers",
      "Business Expansionists",
    ],
    governmentModifiers: ["federal_structure"],
    navyMinister: {
      name: "Richard W. Thompson",
      title: "Secretary of the Navy",
      traits: "Political appointee, no naval experience, former Congressman",
    },
    stabilityProfile: {
      level: "high",
      factors: ["Federal republic", "Can underfund in peace then mobilize dramatically"],
    },
    description: "Federal republic. Mahan and Naval War College as intellectual catalyst.",
  },
  strategicObjectives: {
    primary: "Continental Consolidation",
    secondary: "Economic Growth",
  },
  baseResources: {
    gdpTier: "great_power",
    gdpDescription: "#2 globally, fastest growth rate among great powers",
    population: "~50 million",
    industrialization: "world_leading",
    industrializationDescription:
      "Second-largest industrial economy; will overtake Britain within 10-15 years",
  },
  navalAppropriation: {
    budgetLevel: "very_low",
    justification:
      "The US faces no perceived naval threat. Congress sees no reason to spend on a modern navy. The navy's primary function (coastal defense) is theoretically met by the existing obsolete fleet and coastal fortifications. The first modern naval appropriations (the ABCD ships) are three years in the future.",
  },
  economy: {
    description: "Industrial giant in formation. Capacity ahead of doctrine.",
    character: "industrial giant in formation",
    strengths: ["Steel", "Coal", "Railroads", "Finance", "Scalable production"],
    weaknesses: ["Limited overseas bases", "Doctrine lag"],
    industrialBase: "latent_giant",
  },
  navalInstitution: {
    description:
      "Intellectually ambitious but materially incomplete. Britain has lived sea power, America is theorizing.",
    character: ["intellectually_ambitious", "materially_incomplete", "mahanian"],
    seniority: "junior_to_army",
    formativeExperience: "Post-Civil War neglect to New Navy",
  },
  doctrine: {
    summary:
      "Transitioning from coastal defense toward Mahanian sea control, concentrated battle fleets, overseas bases, Caribbean security, canal strategy.",
    schools: [
      "coastal_defense",
      "mahanian_sea_control",
      "concentrated_battle_fleet",
      "caribbean_security",
    ],
    isFragmented: true,
  },
  shipDesign: {
    summary:
      "Evolve from coastal defense and protected cruisers toward blue-water battleships, larger cruisers, two-ocean endurance.",
    principles: ["industrial_scale", "evolving_endurance"],
    favoredTypes: ["protected_cruiser", "armored_cruiser", "battleship", "auxiliary"],
  },
  military: {
    description:
      "Tiny army focused on Indian Wars, no expeditionary capability. Navy is in post-Civil War neglect transitioning toward New Navy.",
    size: "~25,000 men",
    character: ["frontier_constabulary", "civil_war_legacy"],
    armyNavyBalance: "army_heavy",
  },
  ai: {
    archetype: "cautious_industrial_giant_awakening",
    behavior: [
      "slow_starting",
      "crisis_reactive",
      "hemispheric",
      "industrially_powerful",
      "prone_to_two_ocean_problems",
    ],
  },
  navalPurpose: "defend_hemisphere_expand",
  coreAnxiety: "foreign_interference_americas",
  gameplayFeel: "awaken_latent_power",
  historicalAssumptions: [
    "Not yet finished naval power",
    "Mahan is catalyst",
    "Hemispheric before global",
  ],
} as const;
