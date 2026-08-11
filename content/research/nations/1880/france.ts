import type { Nation } from "../../schema/nations.ts";

export const france: Nation = {
  id: "france",
  name: "French Republic",
  displayNameKey: "nation.france",
  isPlayable: true,
  slot: { id: "france", order: 5, participation: "active" },
  presentation: { colorBg: "#002395", colorFg: "#FFFFFF" },
  identity: {
    oneSentence:
      "The French Republic in January 1880 is a politically unstable but resilient great power, wounded by defeat against Germany, active in colonial expansion, wary of British maritime supremacy, and unusually open to disruptive naval doctrines that promise to restore French influence without simply copying the Royal Navy.",
    fullIdentity:
      "Major naval and colonial power wounded by Franco-Prussian War. Open to Jeune École (torpedo craft, commerce raiding).",
    strategicProblem:
      "Needs army vs Germany, but needs navy to remain world power. Pulled between revanche, rivalry with Britain, colonial expansion, Jeune École vs battle fleet.",
  },
  regime: {
    type: "republic",
    politicalSystem: "parliamentary_republic",
    headOfState: "President Jules Grévy",
    headOfGovernment: "President Jules Grévy",
    leaderTitle: "President",
    navalPolicyActors: [
      "Cabinet Instability",
      "Parliamentary Budget Fights",
      "Nationalist Pressure",
      "Colonial Lobbies",
      "Jeune École Reformers",
    ],
    governmentModifiers: [
      "fragmented_legislature",
      "colonial_lobby_active",
      "ministerial_instability",
    ],
    navyMinister: {
      name: "Jean-Marie Jauréguiberry",
      title: "Minister of Marine",
      traits:
        "Vice Admiral; reformer; sympathetic to Jeune Ecole while maintaining traditionalist commitments; serves third non-consecutive term",
    },
    stabilityProfile: {
      level: "unstable",
      factors: ["Frequent factional instability", "Boulangist pressures"],
    },
    description: "Parliamentary republic with frequent instability.",
  },
  strategicObjectives: {
    primary: "Escalate Diplomatic Standing",
    secondary: "Colonial Empire",
  },
  baseResources: {
    gdpTier: "great_power",
    gdpDescription:
      "Fourth in Europe after Britain, Germany, Russia by total output; second by per capita wealth in some measures",
    population: "~37.5 million",
    industrialization: "industrial",
    industrializationDescription:
      "Diversified but behind Britain and Germany; strong in textiles, armaments, luxury goods; weak in coal",
  },
  navalAppropriation: {
    budgetLevel: "moderate",
    justification:
      "France maintains the world's second-largest navy but has not committed to a major building program. The naval budget is caught between army demands for fortifications against Germany, Jeune Ecole arguments that battleships are obsolete, and traditionalist demands for a battle fleet competitive with Britain. The result is a moderate but unstable budget.",
  },
  economy: {
    description:
      "Industrially sophisticated, financially capable, technologically creative. Weakness is continuity.",
    character: "industrially sophisticated but uneven",
    strengths: ["Sophisticated industry", "Financial capability", "Technological creativity"],
    weaknesses: ["Uneven policy continuity"],
    industrialBase: "uneven",
  },
  navalInstitution: {
    description:
      "Great navy in search of doctrine. Divided among traditionalists, colonial advocates, torpedo enthusiasts.",
    character: ["divided", "experimental", "innovative", "unstable"],
    seniority: "prestige_service",
  },
  doctrine: {
    summary:
      "Multiple competing: traditional battle fleet, Jeune École, guerre de course, torpedo coastal defense, colonial cruisers, Mediterranean strategy. Brilliant but unstable.",
    schools: [
      "traditional_battle_fleet",
      "jeune_ecole",
      "guerre_de_course",
      "torpedo_coastal_defense",
      "colonial_cruiser_operations",
    ],
    isFragmented: true,
  },
  shipDesign: {
    summary:
      "Experimentation, speed, unusual layouts, torpedoes, protected/armored cruisers, less standardization than Britain/Germany.",
    principles: ["experimentation", "speed", "unusual_layouts", "torpedo_emphasis"],
    favoredTypes: ["protected_cruiser", "armored_cruiser", "torpedo_craft"],
  },
  military: {
    description:
      "Continental army with revanchist focus after Franco-Prussian defeat. Primary service is the army; navy is a prestige service caught between doctrines.",
    size: "peacetime ~500,000; mobilized ~1.5M",
    character: ["continental_army", "revanchist", "conscript"],
    armyNavyBalance: "army_heavy",
  },
  ai: {
    archetype: "restless_revanchist_innovator",
    behavior: [
      "anti_german",
      "wary_of_britain",
      "colonial",
      "experimental",
      "prone_to_doctrinal_swings",
    ],
  },
  navalPurpose: "restore_status_offset_rivals",
  coreAnxiety: "germany_land_britain_sea",
  gameplayFeel: "forge_coherence",
  historicalAssumptions: [
    "Major power not hegemon",
    "Franco-Prussian defeat defines strategy",
    "Jeune École influential not total",
  ],
} as const;
