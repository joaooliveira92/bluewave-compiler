import type { Nation } from "../../schema/nations.ts";

export const spain: Nation = {
  id: "spain",
  tag: "ESP",
  name: "Kingdom of Spain",
  displayNameKey: "nation.spain",
  isPlayable: true,
  slot: { id: "spain", order: 9, participation: "active" },
  presentation: { colorBg: "#AA151B", colorFg: "#F1BF00" },
  identity: {
    oneSentence:
      "The Kingdom of Spain in January 1880 is a restored but brittle monarchy guarding the last remnants of a once-global empire, with proud naval traditions, exposed colonies in the Caribbean and Pacific, limited industrial means, and a strategic future defined by whether it can reform quickly enough to avoid imperial humiliation at the hands of rising powers.",
    fullIdentity:
      "Restored but brittle monarchy guarding remnants of once-global empire. Still owns Cuba, Puerto Rico, Philippines, Guam.",
    strategicProblem:
      "Can preserve enough naval credibility to deter opportunistic powers without bankrupting Restoration state? Empire exposes weakness more than amplifies strength.",
  },
  regime: {
    type: "monarchy",
    politicalSystem: "constitutional_monarchy",
    headOfState: "King Alfonso XII",
    headOfGovernment: "Antonio Cánovas del Castillo",
    leaderTitle: "King",
    navalPolicyActors: [
      "Bourbon Restoration",
      "Conservatives/Liberals alternation",
      "Elite-managed system",
    ],
    governmentModifiers: ["turno_pacifico", "military_influence", "colonial_administration_stress"],
    navyMinister: {
      name: "Francisco de Paula y Pavía",
      title: "Minister of Marine",
      traits:
        "Rear Admiral; professional naval officer; faces constrained budget, aging fleet, colonial demands",
    },
    stabilityProfile: {
      level: "brittle",
      factors: ["Stable on surface, brittle underneath", "Colonial costs"],
    },
    description: "Bourbon Restoration. Regency of María Cristina after 1885.",
  },
  strategicObjectives: {
    primary: "Preserve the Colonial Empire",
    secondary: "Economic Modernization",
  },
  baseResources: {
    gdpTier: "minor_power",
    gdpDescription:
      "Smaller than Italy; comparable to Belgium or the Netherlands in industrial output; larger in agricultural terms",
    population: "~16.5 million",
    industrialization: "developing_industrial",
    industrializationDescription:
      "Semi-industrialized; Catalonia textiles, Basque steel, mining; small heavy industry; technologically dependent",
  },
  navalAppropriation: {
    budgetLevel: "low",
    justification:
      "Spain's military budget is heavily skewed toward the army, which must garrison Cuba (still over 50,000 troops in 1880), maintain internal order, and guard against Carlist resurgence. The navy's share is constrained by the army's larger political weight, the high cost of importing foreign-built ships, and competing demands from infrastructure investment and colonial administration.",
  },
  economy: {
    description: "Regional industrial capacity but weak national scaling. Fiscally constrained.",
    character: "regional capacity, weak scaling",
    strengths: ["Regional industrial capacity"],
    weaknesses: ["Weak national scaling", "Fiscally constrained", "Colonial costs"],
    industrialBase: "uneven",
  },
  navalInstitution: {
    description:
      "Proud tradition but modern weakness. Scattered, underfunded, honor-sensitive, logistically weak.",
    character: ["scattered", "underfunded", "honor_sensitive", "logistically_weak"],
    seniority: "prestige_service",
  },
  doctrine: {
    summary:
      "Colonial defense, port defense, cruiser patrol, gunboats, crisis deterrence, fleet preservation, avoidance of decisive battle.",
    schools: ["colonial_defense", "port_defense", "cruiser_patrol", "fleet_preservation"],
  },
  shipDesign: {
    summary:
      "Cruisers, gunboats, colonial patrol vessels, port defenses, selective armored ships, refits, logistics improvement.",
    principles: ["colonial_patrol", "port_defense"],
    favoredTypes: ["protected_cruiser", "gunboat", "colonial_patrol_vessel"],
  },
  military: {
    description:
      "Army-focused with large colonial garrison in Cuba. Navy has proud tradition but modern weakness. Military budget heavily skewed toward army.",
    size: "peacetime ~80,000–100,000; colonial garrison (Cuba) adds significant strength",
    character: ["colonial_garrison", "army_heavy"],
    armyNavyBalance: "army_heavy",
  },
  ai: {
    archetype: "defensive_declining_empire",
    behavior: [
      "preserve_cuba",
      "avoid_war_with_us_if_possible",
      "defend_colonies_for_honor",
      "modernize_slowly",
    ],
  },
  navalPurpose: "preserve_colonies_honor",
  coreAnxiety: "colonial_collapse_humiliation",
  gameplayFeel: "prevent_imperial_collapse",
  historicalAssumptions: [
    "Declining but not irrelevant",
    "Cuba central crisis",
    "Not scripted to collapse",
  ],
} as const;
