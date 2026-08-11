import type { Nation } from "../../schema/nations.ts";

export const germany: Nation = {
  id: "germany",
  name: "German Empire",
  displayNameKey: "nation.germany",
  isPlayable: true,
  slot: { id: "germany", order: 2, participation: "active" },
  presentation: { colorBg: "#000000", colorFg: "#FFCC00" },
  identity: {
    oneSentence:
      "The German Empire in January 1880 is a rising continental-industrial power at a strategic crossroads: still army-dominated and diplomatically shaped by Bismarckian restraint, but increasingly tempted by naval expansion, colonial prestige, and the pursuit of world-power status through a concentrated, technically sophisticated fleet.",
    fullIdentity:
      "Young, powerful, rapidly industrializing continental empire. Not yet Britain’s inevitable naval rival. Army-dominated.",
    strategicProblem:
      "Every mark spent on navy competes with army, but without navy cannot act as world power. Vulnerable North Sea/Baltic access, limited overseas infrastructure. Aspirational before existential.",
  },
  regime: {
    type: "monarchy",
    politicalSystem: "federal_constitutional_monarchy",
    headOfState: "Kaiser Wilhelm I",
    headOfGovernment: "Otto von Bismarck",
    leaderTitle: "Chancellor",
    navalPolicyActors: [
      "Kaiser",
      "Chancellor",
      "Reichstag",
      "Army Interests",
      "Industrial Lobbying",
      "Nationalist Pressure",
    ],
    governmentModifiers: ["federal_structure", "military_influence"],
    navyMinister: {
      name: "Albrecht von Stosch",
      title: "Chief of the Imperial Admiralty",
      traits:
        "Army general serving as navy chief; reflects navy's subordination to army; competent administrator",
    },
    stabilityProfile: {
      level: "high",
      factors: ["Prussian dominance", "Bismarckian restraint until 1890"],
    },
    description: "Imperial federal monarchy dominated by Prussia.",
  },
  strategicObjectives: {
    primary: "Continental Army Focus",
    secondary: "Colonial Empire",
  },
  baseResources: {
    gdpTier: "great_power",
    gdpDescription: "Second in Europe after UK; growing rapidly",
    population: "~45M",
    industrialization: "industrial",
    industrializationDescription:
      "Rapidly approaching Great Power tier; world leader in chemicals and electrical",
  },
  navalAppropriation: {
    budgetLevel: "low",
    justification:
      "The army is the priority, with guaranteed funding through the septennial military budget (next renewal 1881). The navy is funded as a secondary concern. Bismarck sees no need for a large navy and is skeptical of navalist arguments. The 1880 navy budget reflects the prevailing view: Germany is a land power, and the navy exists for coastal defense.",
  },
  economy: {
    description: "Fast-rising industrial power, more dynamic and technically focused than Britain.",
    character: "fast-rising industrial power",
    strengths: ["Steel", "Coal", "Chemicals", "Engineering", "Optics", "Electrical"],
    weaknesses: ["Limited overseas infrastructure", "Army-navy competition"],
    industrialBase: "rising_dynamic",
  },
  navalInstitution: {
    description: "Young, ambitious, technically serious, junior to army.",
    character: [
      "ambitious",
      "technically_serious",
      "methodical",
      "prestige_conscious",
      "junior_to_army",
    ],
    seniority: "junior_to_army",
    formativeExperience: "Grew from Prussian and North German forces",
  },
  doctrine: {
    summary:
      "Coastal and regional defense: North Sea, Baltic, commerce protection near Europe, deterrence. Future concentrated battle fleet (Tirpitz risk theory as evolution).",
    schools: ["north_sea_defense", "baltic_security", "coastal_defense", "deterrence"],
  },
  shipDesign: {
    summary:
      "Strong protection, internal subdivision, machinery quality, tactical cohesion, shorter radius than British, suitable for North Sea/Baltic.",
    principles: [
      "strong_protection",
      "internal_subdivision",
      "machinery_quality",
      "tactical_cohesion",
    ],
    favoredTypes: ["battleship", "coastal_defense_ship", "protected_cruiser"],
  },
  military: {
    description:
      "Finest army in Europe; General Staff is the premier institution. Army dominates military spending and strategic culture. Navy is a secondary concern.",
    size: "peacetime ~420,000; mobilized ~1.2M",
    character: ["continental_army", "general_staff", "army_dominant"],
    armyNavyBalance: "army_dominant",
  },
  ai: {
    archetype: "restless_industrial_challenger",
    behavior: [
      "avoid_encirclement",
      "modernize_rapidly",
      "seek_prestige",
      "build_concentrated_power_if_enabled",
    ],
  },
  navalPurpose: "gain_world_power_status",
  coreAnxiety: "encirclement_insufficient_recognition",
  gameplayFeel: "build_concentrated_relevance",
  historicalAssumptions: [
    "Not yet Britain’s scripted enemy",
    "Bismarckian restraint matters",
    "Naval power latent",
  ],
} as const;
