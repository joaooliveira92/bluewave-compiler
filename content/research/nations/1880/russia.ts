import type { Nation } from "../../schema/nations.ts";

export const russia: Nation = {
  id: "russia",
  tag: "RUS",
  name: "Russian Empire",
  displayNameKey: "nation.russia",
  isPlayable: true,
  slot: { id: "russia", order: 7, participation: "active" },
  presentation: { colorBg: "#0039A6", colorFg: "#FFFFFF" },
  identity: {
    oneSentence:
      "The Russian Empire in January 1880 is a vast autocratic land empire with great-power naval ambitions, trapped by ice, distance, chokepoints, and disconnected fleets, seeking warm-water access and Far Eastern reach while struggling to turn immense resources into coherent maritime power.",
    fullIdentity: "Vast autocratic land empire. Many seas, no easy way to connect fleets.",
    strategicProblem:
      "Has many seas but no easy way to concentrate. Baltic, Black Sea, Pacific/Far East, Caspian, Arctic each different geography/enemies/logistics.",
  },
  regime: {
    type: "monarchy",
    politicalSystem: "autocratic_monarchy",
    headOfState: "Tsar Alexander II",
    headOfGovernment: "Tsar Alexander II",
    leaderTitle: "Tsar",
    navalPolicyActors: [
      "Imperial Court",
      "Bureaucracy",
      "Aristocratic Officer Culture",
      "Army Dominance",
    ],
    governmentModifiers: ["autocratic_executive", "reform_stalemate"],
    navyMinister: {
      name: "Ministry in transition (Grand Duke Konstantin removed 1880; Admiral Shestakov to be appointed 1882)",
      title: "Navy Minister (interim)",
      traits: "Navy Ministry in organizational uncertainty",
    },
    stabilityProfile: {
      level: "brittle",
      factors: ["Autocracy", "Bureaucracy", "Army dominance"],
    },
    description: "Autocracy. Naval policy reflects court politics.",
  },
  strategicObjectives: {
    primary: "Break the straits constraint",
    secondary: "Develop domestic naval industry and expand Pacific presence",
  },
  baseResources: {
    gdpTier: "great_power",
    gdpDescription:
      "Major Great Power by aggregate GDP, due to large population and resources; per capita GDP is lowest among European great powers",
    population: "~100M",
    industrialization: "developing_industrial",
    industrializationDescription:
      "Early stage; 30-40 years behind Britain; Donbass coal/iron developing rapidly; Baku oil in first boom",
  },
  navalAppropriation: {
    budgetLevel: "moderate",
    justification:
      "Russia maintains the largest army in Europe (peacetime ~900,000), which consumes the majority of the military budget. The navy is rebuilding after the Crimean War. The Baltic Fleet is the best-funded theater. The Pacific Squadron is the smallest and most recent. Naval construction programs are multi-year and affected by budget uncertainty.",
  },
  economy: {
    description: "Immense resources but weak integration. Railways are naval infrastructure.",
    character: "immense resources but weak integration",
    strengths: ["Immense resources", "Growing industrialization"],
    weaknesses: ["Weak transport", "Skilled labor shortage", "Administrative inefficiency"],
    industrialBase: "vast_unintegrated",
  },
  navalInstitution: {
    description:
      "Old and prestigious (Peter the Great 1696) but geographically fragmented, locally capable, globally clumsy.",
    character: ["geographically_fragmented", "locally_capable", "globally_clumsy", "ambitious"],
    seniority: "junior_to_army",
  },
  doctrine: {
    summary:
      "Theater-specific: Baltic defense, Black Sea pressure vs Ottoman, Pacific expansion, fortresses, mining, torpedo craft, fleet-in-being.",
    schools: [
      "baltic_defense",
      "black_sea_pressure",
      "pacific_expansion",
      "mining",
      "fleet_in_being",
    ],
    isTheaterSpecific: true,
  },
  shipDesign: {
    summary:
      "Theater-specific, heterogeneous, often armored for prestige, difficult to transfer between fleets.",
    principles: ["theater_specific", "heterogeneous", "prestige_armor"],
    favoredTypes: ["battleship", "armored_cruiser", "coastal_defense_ship"],
  },
  military: {
    description:
      "Largest army in Europe but poorly equipped; slow to mobilize across vast distances. Army dominates the military budget and strategic culture.",
    size: "peacetime ~900,000; mobilized ~2.5M",
    character: ["continental_giant", "poorly_equipped", "slow_mobilization"],
    armyNavyBalance: "army_dominant",
  },
  ai: {
    archetype: "fragmented_continental_giant",
    behavior: ["ambitious", "slow_to_coordinate", "prestige_sensitive", "prone_to_overextension"],
  },
  navalPurpose: "escape_geographic_confinement",
  coreAnxiety: "warm_water_failure_fragmentation",
  gameplayFeel: "integrate_disconnected_theaters",
  historicalAssumptions: [
    "Fleet fragmentation core constraint",
    "Far East important but not mature",
    "Trans-Siberian (1891) is future infrastructure",
  ],
} as const;
