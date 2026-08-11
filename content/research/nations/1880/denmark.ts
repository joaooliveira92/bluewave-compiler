import type { Nation } from "../../schema/nations.ts";

export const denmark: Nation = {
  id: "denmark",
  tag: "DEN",
  name: "Denmark",
  displayNameKey: "nation.denmark",
  isPlayable: false,
  slot: { id: "denmark", order: 14, participation: "active" },
  presentation: { colorBg: "#C60C30", colorFg: "#FFFFFF" },
  identity: {
    oneSentence:
      "Denmark in January 1880 is the small strait guardian: humbled by loss to Prussia/Austria in 1864, neutral, but controlling the Danish Straits that decide whether the Baltic is a German-Russian lake or open to British intervention.",
    fullIdentity:
      "Constitutional monarchy under Christian IX. Lost Schleswig-Holstein in 1864, now cautious neutral. Controls the Sound and Belts - the gate between Baltic and North Sea.",
    strategicProblem:
      "Must maintain neutrality and control of straits with tiny fleet, balancing between Germany (wants Baltic closed to Britain) and Britain (wants access) and Russia (wants exit).",
  },
  regime: {
    type: "monarchy",
    politicalSystem: "constitutional_monarchy",
    headOfState: "King Christian IX",
    headOfGovernment: "J.B.S. Estrup",
    leaderTitle: "King",
    navalPolicyActors: ["King", "Parliament", "Neutrality Policy", "Straits Interests"],
    governmentModifiers: ["post_1864_caution", "neutrality", "strait_guardian"],
    navyMinister: {
      name: "Not specified (PM Estrup governs; navy on station-keeping)",
      title: "Minister of the Navy",
      traits: "Navy funded for coastal defense and strait denial with limited budget",
    },
    stabilityProfile: {
      level: "high",
      factors: ["Constitutional monarchy", "Post-1864 caution", "Neutrality"],
    },
    description: "Constitutional monarchy. Neutral after 1864 defeat.",
  },
  strategicObjectives: {
    primary: "Homeland Defense — control of the Danish Straits",
    secondary: "Trade Protection",
  },
  baseResources: {
    gdpTier: "minor_power",
    gdpDescription: "Small agrarian and shipping economy; limited industry",
    population: "~1.9 million",
    industrialization: "developing_industrial",
    industrializationDescription:
      "Limited industrial base; Copenhagen dockyard capable of moderate ship repairs; dependent on imported coal",
  },
  navalAppropriation: {
    budgetLevel: "low",
    justification:
      "Defence budget ~12 million kroner (20% of state budget). Army receives ~8 million, Navy ~4 million. The navy is funded for coastal defense and strait denial with a small force of coastal ironclads, torpedo boats, and minelayers. No funds for capital ships.",
  },
  economy: {
    description: "Small agrarian and shipping economy, strong merchant marine, limited industry.",
    character: "small agrarian and shipping",
    strengths: ["Agriculture", "Shipping", "Straits tolls historically"],
    weaknesses: ["Small industrial base", "Limited resources", "Post-war constraints"],
    industrialBase: "uneven",
  },
  navalInstitution: {
    description:
      "Small, professional, strait and coastal defense focused. Mines, torpedo craft, coastal defense ships, fortresses at Copenhagen.",
    character: ["small", "professional", "strait_guardian", "mine_specialist"],
    seniority: "prestige_service",
  },
  doctrine: {
    summary:
      "Strait defense, coastal defense, mine warfare, torpedo craft, fortress support at Copenhagen. Fleet-in-being to deny easy passage.",
    schools: [
      "strait_defense",
      "coastal_defense",
      "mine_warfare",
      "torpedo_craft",
      "fortress_support",
    ],
  },
  shipDesign: {
    summary:
      "Coastal defense ships, torpedo craft, minelayers, small cruisers. Optimized for narrow waters, not open ocean.",
    principles: ["narrow_waters_optimization", "mine_torpedo_focus"],
    favoredTypes: ["coastal_defense_ship", "torpedo_craft", "minelayer", "gunboat"],
  },
  military: {
    description:
      "Active conscript army with fortress focus (Copenhagen). Navy is prestige service focused on strait denial with mines, torpedo craft, and coastal defense ships.",
    size: "active ~36,000 (conscripts + cadre); mobilized ~90,000",
    character: ["conscript", "fortress_defense", "strait_defense"],
    armyNavyBalance: "balanced",
  },
  ai: {
    archetype: "small_strait_guardian",
    behavior: [
      "maintain_neutrality",
      "fortify_copenhagen",
      "mine_straits_in_war",
      "deny_easy_passage",
      "seek_great_power_guarantee",
    ],
    aiRole: "strait_guardian",
  },
  navalPurpose: "guard_straits_survive",
  coreAnxiety: "great_power_pressure_over_straits",
  gameplayFeel: "leverage_geography_as_small_power",
  historicalAssumptions: [
    "Controls Danish Straits - classic chokepoint",
    "Lost 1864 war to Prussia/Austria",
    "Neutral",
    "Copenhagen fortified",
  ],
} as const;
