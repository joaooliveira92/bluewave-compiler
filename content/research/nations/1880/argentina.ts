import type { Nation } from "../../schema/nations.ts";

export const argentina: Nation = {
  id: "argentina",
  name: "Argentina",
  displayNameKey: "nation.argentina",
  isPlayable: false,
  slot: { id: "argentina", order: 20, participation: "active" },
  presentation: { colorBg: "#74ACDF", colorFg: "#FFFFFF" },
  identity: {
    oneSentence:
      "Argentina in January 1880 is the rapidly growing South Atlantic power: wealthy from beef and grain, modernizing fast, with a small but growing navy focused on the Plate basin and Patagonia, rival to Brazil and Chile for southern cone dominance.",
    fullIdentity:
      "Presidential republic under Avellaneda (Roca from Oct 1880). Conquest of the Desert ongoing. Wealthy from agricultural exports, European immigration boom, modernizing. Small but growing navy.",
    strategicProblem:
      "Must secure Plate basin, Patagonia, and long Atlantic coast with small fleet, balancing between Brazil (larger) and Chile (more modern) while managing rapid growth and frontier wars.",
  },
  regime: {
    type: "republic",
    politicalSystem: "presidential_republic",
    headOfState: "President Nicolás Avellaneda",
    headOfGovernment: "President Nicolás Avellaneda",
    leaderTitle: "President",
    navalPolicyActors: [
      "President",
      "Congress",
      "Agricultural Oligarchs",
      "Military",
      "European Immigrants",
    ],
    governmentModifiers: ["federal_structure"],
    stabilityProfile: {
      level: "moderate",
      factors: [
        "Rapid growth",
        "Conquest of the Desert",
        "Oligarchic republic",
        "Immigration boom",
      ],
    },
    description: "Presidential republic. Oligarchic, rapidly growing, frontier expansion.",
  },
  strategicObjectives: {
    primary: "Regional Hegemony (challenge Brazil)",
    secondary: "Trade Protection",
  },
  baseResources: {
    gdpTier: "regional_power",
    gdpDescription: "Developing — agricultural export-driven economy",
    population: "~2.5 million (rapidly increasing via immigration)",
    industrialization: "pre_industrial",
    industrializationDescription: "Pre-industrial; meatpacking, flour milling, textiles nascent",
  },
  navalAppropriation: {
    budgetLevel: "moderate",
    justification:
      "Increasing; naval arms race with Brazil beginning. Argentina is investing in modern warships to challenge Brazilian dominance in the Plate basin.",
  },
  economy: {
    description:
      "Beef, grain, and wool export boom, rapid growth, European investment, but limited heavy industry.",
    character: "agricultural export boom",
    strengths: ["Beef", "Grain", "Wool", "European investment", "Immigration"],
    weaknesses: ["Limited heavy industry", "Regional inequality", "Dependent on export routes"],
    industrialBase: "resource_export",
  },
  navalInstitution: {
    description:
      "Small but growing, river and coastal focused, with British and French-built cruisers and gunboats. Professionalizing.",
    character: ["small_but_growing", "river_and_coastal", "professionalizing"],
    seniority: "junior_to_army",
  },
  doctrine: {
    summary:
      "River control (Plate basin), coastal defense, Patagonia control, fleet-in-being vs Brazil/Chile, trade protection for agricultural exports.",
    schools: ["river_control", "coastal_defense", "patagonia_control", "fleet_in_being"],
  },
  shipDesign: {
    summary:
      "Cruisers, gunboats, river monitors. British/French-built, limited numbers, coastal and river optimization.",
    principles: ["river_optimization", "coastal_defense"],
    favoredTypes: ["cruiser", "gunboat", "river_monitor"],
  },
  military: {
    description:
      "Army oriented toward internal security and frontier expansion (Conquest of the Desert), not peer war. Small regular force with larger National Guard.",
    size: "~8,000 regulars, ~30,000 National Guard",
    character: ["frontier_expansion", "internal_security"],
    armyNavyBalance: "army_heavy",
  },
  ai: {
    archetype: "growing_plate_power",
    behavior: [
      "control_plate_basin",
      "secure_patagonia",
      "balance_brazil_and_chile",
      "protect_agricultural_exports",
    ],
    aiRole: "southern_cone_rival",
  },
  navalPurpose: "contest_southern_cone",
  coreAnxiety: "brazilian_chilean_encirclement",
  gameplayFeel: "grow_between_giants",
  historicalAssumptions: [
    "Rapid agricultural export growth",
    "Conquest of the Desert 1878-85",
    "Rival to Brazil and Chile",
    "Small but growing navy",
  ],
} as const;
