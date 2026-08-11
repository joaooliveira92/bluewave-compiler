import type { Nation } from "../../schema/nations.ts";

export const brazil: Nation = {
  id: "brazil",
  name: "Empire of Brazil",
  displayNameKey: "nation.brazil",
  isPlayable: false,
  slot: { id: "brazil", order: 18, participation: "active" },
  presentation: { colorBg: "#009739", colorFg: "#FEDF00" },
  identity: {
    oneSentence:
      "Brazil in January 1880 is the vast, stable South American empire: the largest navy in South America, wealthy from coffee and rubber, strategically located on the South Atlantic and Cape route, balancing between modernization and slavery while dominating its neighbors.",
    fullIdentity:
      "Constitutional monarchy under Pedro II. Stable, vast, wealthy from coffee. Largest fleet in South America, with ocean-going ironclads. Controls Amazon and long Atlantic coast.",
    strategicProblem:
      "Must defend vast coastline and river systems, maintain dominance over Argentina and Chile, and modernize while managing slavery and vast distances with limited industry.",
  },
  regime: {
    type: "monarchy",
    politicalSystem: "constitutional_monarchy",
    headOfState: "Emperor Pedro II",
    headOfGovernment: "Viscount of Sinimbu",
    leaderTitle: "Emperor",
    navalPolicyActors: ["Emperor", "Parliament", "Coffee Oligarchs", "Military", "Slavery Debate"],
    governmentModifiers: ["parliamentary_system", "imperial_moderating_power"],
    navyMinister: {
      name: "Adm. Luiz Antonio de Sousa Neto",
      title: "Minister of Marine",
      traits: "Career naval officer; focused on modernizing the fleet with British-built ironclads",
    },
    stabilityProfile: {
      level: "high",
      factors: ["Stable monarchy under Pedro II", "Coffee wealth", "Slavery tensions"],
    },
    description:
      "Constitutional monarchy. Stable under Pedro II, but slavery and military tensions growing.",
  },
  strategicObjectives: {
    primary: "Regional Hegemony",
    secondary: "Trade Protection",
  },
  baseResources: {
    gdpTier: "regional_power",
    gdpDescription: "Developing — largest economy in South America; commodity-export driven",
    population: "~11 million",
    industrialization: "developing_industrial",
    industrializationDescription:
      "Early industrial; textiles, food processing; no heavy industry; no domestic warship construction",
  },
  navalAppropriation: {
    budgetLevel: "moderate",
    justification:
      "Brazil has secured regional dominance through the Paraguayan War (1864-1870) and is investing in a modern ironclad fleet to maintain that position. The Riachuelo and Aquidaba (under construction in British yards) are the centerpieces of the naval modernization program. Naval expenditure is politically supported as a matter of national prestige and security.",
  },
  economy: {
    description:
      "Coffee and rubber export boom, vast resources, growing but still agrarian, limited heavy industry.",
    character: "coffee export boom",
    strengths: ["Coffee", "Rubber", "Vast resources", "Large population"],
    weaknesses: ["Slavery", "Limited heavy industry", "Vast distances", "Regional inequality"],
    industrialBase: "resource_export",
  },
  navalInstitution: {
    description:
      "Largest in South America, with ocean-going ironclads and cruisers. River and coastal defense plus blue-water ambition. Professional, British-influenced.",
    character: ["largest_in_region", "professional", "british_influenced", "river_and_blue_water"],
    seniority: "prestige_service",
  },
  doctrine: {
    summary:
      "Coastal defense, river control (Amazon, Plate), South Atlantic dominance, fleet-in-being vs Argentina/Chile, trade protection.",
    schools: ["coastal_defense", "river_control", "south_atlantic_dominance", "fleet_in_being"],
  },
  shipDesign: {
    summary:
      "Ironclads, cruisers, river monitors. Mix of British-built ocean-going and domestic river craft. Endurance for long coast.",
    principles: ["british_built", "river_and_ocean_mix"],
    favoredTypes: ["ironclad", "cruiser", "river_monitor", "gunboat"],
  },
  military: {
    description:
      "Post-Paraguayan War consolidation. Army politicizing ('Military Question'). Navy is prestige service with largest fleet in South America. Slavery tensions affect military cohesion.",
    size: "army ~15,000; National Guard ~200,000 paper",
    character: ["post_war_consolidation", "politicizing", "prestige_navy"],
    armyNavyBalance: "balanced",
  },
  ai: {
    archetype: "south_american_giant",
    behavior: [
      "dominate_south_atlantic",
      "control_rivers",
      "balance_argentina_chile",
      "modernize_with_coffee_wealth",
    ],
    aiRole: "southern_cone_rival",
  },
  navalPurpose: "contest_southern_cone",
  coreAnxiety: "argentine_chilean_challenge",
  gameplayFeel: "dominate_south_atlantic",
  historicalAssumptions: [
    "Largest navy in South America in 1880",
    "Coffee boom wealth",
    "Empire under Pedro II, republic in 1889",
    "River control vital",
  ],
} as const;
