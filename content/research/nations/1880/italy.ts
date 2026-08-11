import type { Nation } from "../../schema/nations.ts";

export const italy: Nation = {
  id: "italy",
  name: "Kingdom of Italy",
  displayNameKey: "nation.italy",
  isPlayable: true,
  slot: { id: "italy", order: 6, participation: "active" },
  presentation: { colorBg: "#009246", colorFg: "#FFFFFF" },
  identity: {
    oneSentence:
      "The Kingdom of Italy in January 1880 is a newly unified, prestige-hungry Mediterranean monarchy: exposed by geography, constrained by industry and finance, rivalrous with France, uneasy with Austria-Hungary, and determined to use bold naval design and selective colonial ambition to prove itself a true great power.",
    fullIdentity: "Young unified monarchy. Regia Marina formed 1861 from pre-unification navies.",
    strategicProblem:
      "Needs navy for great-power status, but economic base struggles to sustain fleet geography demands. Must protect long coastlines, islands, Adriatic, colonial footholds.",
  },
  regime: {
    type: "monarchy",
    politicalSystem: "constitutional_monarchy",
    headOfState: "King Umberto I",
    headOfGovernment: "Benedetto Cairoli",
    leaderTitle: "King",
    navalPolicyActors: [
      "Parliamentary Politics",
      "Regional Divisions",
      "Fiscal Limits",
      "Prestige Ambitions",
    ],
    governmentModifiers: ["parliamentary_dominance", "regional_divisions"],
    navyMinister: {
      name: "Ferdinand Acton",
      title: "Minister of Marine",
      traits:
        "Serving admiral; gives navy independent cabinet voice; competent administrator driving naval expansion",
    },
    stabilityProfile: { level: "brittle", factors: ["Regional divisions", "Fiscal limits"] },
    description: "Constitutional monarchy. Navy symbolizes national unity.",
  },
  strategicObjectives: {
    primary: "Mediterranean Naval Challenge",
    secondary: "Colonial Ambition",
  },
  baseResources: {
    gdpTier: "great_power",
    gdpDescription:
      "Smallest among great powers; well below UK, France, Germany; comparable to Austria-Hungary",
    population: "~28M",
    industrialization: "developing_industrial",
    industrializationDescription:
      "North industrializing rapidly; South pre-industrial; overall far behind the major powers",
  },
  navalAppropriation: {
    budgetLevel: "moderate",
    justification:
      "The Regia Marina is building some of the world's most advanced battleships (Duilio class completing 1880; Italia class under construction). This ambition strains the budget. The army also requires modernization (German model). Both services are underfunded relative to their tasks. The state carries heavy debt from the unification period.",
  },
  economy: {
    description: "Capable but uneven, north-concentrated. Ambitious ships strain state.",
    character: "capable but uneven, north-concentrated",
    strengths: ["Northern industry", "Bold design capability"],
    weaknesses: ["Uneven industry", "Fiscal constraints"],
    industrialBase: "uneven",
  },
  navalInstitution: {
    description: "Young, ambitious, haunted by Lissa.",
    character: ["young", "ambitious", "haunted_by_lissa"],
    seniority: "prestige_service",
    formativeExperience: "Defeat by Austria at Lissa 1866",
  },
  doctrine: {
    summary:
      "Mediterranean operations, fleet-in-being, coastal defense, local superiority, torpedo craft, deterrence vs France.",
    schools: ["mediterranean_operations", "fleet_in_being", "coastal_defense", "local_superiority"],
  },
  shipDesign: {
    summary:
      "Speed, heavy guns, bold concepts, selective armor trade-offs, Mediterranean optimization. Italia class discarded belt armor for speed.",
    principles: ["speed", "heavy_guns", "bold_concepts"],
    favoredTypes: ["battleship", "armored_cruiser", "torpedo_craft"],
    exemplarClass: "Italia class by Benedetto Brin",
  },
  military: {
    description:
      "Medium-sized army with Prussian-model reforms underway. Navy is the more advanced and prestigious branch. Army-navy rivalry for budget.",
    size: "peacetime ~200,000; mobilized ~500,000",
    character: ["prussian_model", "reforming"],
    armyNavyBalance: "navy_prestige",
  },
  ai: {
    archetype: "prestige_seeking_mediterranean_opportunist",
    behavior: [
      "anxious_about_france",
      "suspicious_of_austria_hungary",
      "attracted_to_bold_designs",
      "budget_constrained",
    ],
  },
  navalPurpose: "gain_mediterranean_credibility",
  coreAnxiety: "french_pressure_austrian_ambiguity",
  gameplayFeel: "gamble_intelligently",
  historicalAssumptions: ["Regional not global", "France immediate rival", "Innovation risky"],
} as const;
