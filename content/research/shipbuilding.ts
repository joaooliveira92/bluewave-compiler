// content/shipbuilding.ts
// Phase 5/7 Shipbuilding Canon - IMMUTABLE - January 1880
// Defines how nations design, build, maintain and evolve warships
// Does NOT define individual ships, classes, rosters, budgets, queues, stats

import type { PlayableNationId } from "./nations/shared.ts";

// ============================================================================
// 1. UNIVERSAL FRAMEWORK TYPES
// ============================================================================

export type IndustrialDependence =
  | "fully_domestic"
  | "mostly_domestic"
  | "mixed_domestic_foreign"
  | "dependent_on_imports"
  | "dependent_on_foreign_expertise";
export type StandardizationCulture =
  "high" | "moderate_to_high" | "moderate" | "low_to_moderate" | "low" | "fragmented";
export type DesignPriority =
  | "endurance"
  | "armor"
  | "speed"
  | "firepower"
  | "seaworthiness"
  | "maintainability"
  | "reliability"
  | "cost_efficiency"
  | "machinery_quality"
  | "structural_integrity"
  | "fleet_cohesion"
  | "innovation"
  | "prestige";
export type ShipArchetypeKey =
  | "battleship"
  | "coastal_battleship"
  | "armored_cruiser"
  | "protected_cruiser"
  | "colonial_cruiser"
  | "commerce_raider"
  | "torpedo_cruiser"
  | "torpedo_boat"
  | "gunboat"
  | "dispatch_vessel"
  | "auxiliary_support"
  | "training_vessel";

export interface ShipbuildingDoctrine {
  nation: PlayableNationId;
  shipbuildingIdentity: string;
  industrialDependence: IndustrialDependence;
  preferredFleetArchitecture: ShipArchetypeKey[];
  standardizationCulture: StandardizationCulture;
  operationalDesignPriorities: DesignPriority[];
  strategicProductionConstraint: string;
  notes?: string;
}

export interface DesignSchool {
  nation: PlayableNationId;
  name: string;
  coreBeliefs: string[];
  strengths: string[];
  weaknesses: string[];
  philosophy: string; // one-sentence
}

export type EcosystemTier = "first_tier" | "emerging" | "developing" | "modernizer";
export interface ConstructionEcosystem {
  tier: EcosystemTier;
  label: string;
  members: PlayableNationId[];
  characteristics: string[];
}

export interface ProcurementCulture {
  nation: PlayableNationId;
  drivenBy: string[];
}

export interface ShipArchetype {
  key: ShipArchetypeKey;
  name: string;
  purpose: string;
  typicalOperators: PlayableNationId[];
  strategicRole: string;
}

// ============================================================================
// 2. SHIPBUILDING DOCTRINE - 10 Playable Nations (Step 1)
// ============================================================================

export const SHIPBUILDING_DOCTRINES: Record<PlayableNationId, ShipbuildingDoctrine> = {
  uk: {
    nation: "uk",
    shipbuildingIdentity: "Industrial maritime hegemon",
    industrialDependence: "fully_domestic",
    preferredFleetArchitecture: [
      "battleship",
      "armored_cruiser",
      "colonial_cruiser",
      "protected_cruiser",
      "auxiliary_support",
    ],
    standardizationCulture: "high",
    operationalDesignPriorities: [
      "endurance",
      "seaworthiness",
      "reliability",
      "armor",
      "maintainability",
    ],
    strategicProductionConstraint: "Must build for every theater simultaneously",
    notes: "Global operability, balanced protection",
  },
  germany: {
    nation: "germany",
    shipbuildingIdentity: "Technical industrial challenger",
    industrialDependence: "fully_domestic",
    preferredFleetArchitecture: ["battleship", "armored_cruiser", "torpedo_boat"],
    standardizationCulture: "high",
    operationalDesignPriorities: [
      "armor",
      "machinery_quality",
      "structural_integrity",
      "fleet_cohesion",
    ],
    strategicProductionConstraint: "Must balance naval and army spending",
  },
  usa: {
    nation: "usa",
    shipbuildingIdentity: "Emerging mass-production naval power",
    industrialDependence: "mostly_domestic",
    preferredFleetArchitecture: ["protected_cruiser", "armored_cruiser", "battleship"],
    standardizationCulture: "moderate_to_high",
    operationalDesignPriorities: ["cost_efficiency", "endurance", "reliability", "maintainability"],
    strategicProductionConstraint: "Two-ocean geography without Panama",
  },
  japan: {
    nation: "japan",
    shipbuildingIdentity: "Imported modernity becoming domestic capability",
    industrialDependence: "dependent_on_foreign_expertise",
    preferredFleetArchitecture: ["protected_cruiser", "torpedo_boat", "battleship"],
    standardizationCulture: "moderate",
    operationalDesignPriorities: ["firepower", "reliability", "cost_efficiency"],
    strategicProductionConstraint: "Industrial immaturity",
  },
  france: {
    nation: "france",
    shipbuildingIdentity: "Experimental great-power constructor",
    industrialDependence: "fully_domestic",
    preferredFleetArchitecture: [
      "battleship",
      "armored_cruiser",
      "protected_cruiser",
      "torpedo_boat",
      "torpedo_cruiser",
    ],
    standardizationCulture: "low_to_moderate",
    operationalDesignPriorities: ["innovation", "speed", "firepower"],
    strategicProductionConstraint: "Doctrinal fragmentation",
  },
  italy: {
    nation: "italy",
    shipbuildingIdentity: "Prestige-focused naval gambler",
    industrialDependence: "mostly_domestic",
    preferredFleetArchitecture: ["battleship", "torpedo_boat", "armored_cruiser"],
    standardizationCulture: "moderate",
    operationalDesignPriorities: ["speed", "firepower", "prestige"],
    strategicProductionConstraint: "Budget limitations",
  },
  russia: {
    nation: "russia",
    shipbuildingIdentity: "Fragmented multi-theater constructor",
    industrialDependence: "mixed_domestic_foreign",
    preferredFleetArchitecture: [
      "battleship",
      "coastal_battleship",
      "armored_cruiser",
      "torpedo_boat",
    ],
    standardizationCulture: "low",
    operationalDesignPriorities: ["armor", "firepower", "prestige"],
    strategicProductionConstraint: "Geographic fragmentation - Baltic/Black Sea/Pacific separate",
  },
  austria_hungary: {
    nation: "austria_hungary",
    shipbuildingIdentity: "Efficient regional fleet builder",
    industrialDependence: "mostly_domestic",
    preferredFleetArchitecture: ["battleship", "coastal_battleship", "torpedo_boat"],
    standardizationCulture: "moderate_to_high",
    operationalDesignPriorities: ["cost_efficiency", "armor", "maintainability"],
    strategicProductionConstraint: "Political and budgetary constraints (Dual Monarchy)",
  },
  spain: {
    nation: "spain",
    shipbuildingIdentity: "Declining imperial maintainer",
    industrialDependence: "mixed_domestic_foreign",
    preferredFleetArchitecture: ["protected_cruiser", "colonial_cruiser", "gunboat", "battleship"],
    standardizationCulture: "low",
    operationalDesignPriorities: ["cost_efficiency", "maintainability", "endurance"],
    strategicProductionConstraint: "Industrial weakness and imperial overstretch",
  },
  qing: {
    nation: "qing",
    shipbuildingIdentity: "Regionally fragmented modernization program",
    industrialDependence: "dependent_on_imports",
    preferredFleetArchitecture: [
      "battleship",
      "coastal_battleship",
      "gunboat",
      "protected_cruiser",
    ],
    standardizationCulture: "low",
    operationalDesignPriorities: ["firepower", "prestige", "armor"],
    strategicProductionConstraint: "Institutional fragmentation - regional fleets",
  },
} as const;

// ============================================================================
// 3. NATIONAL DESIGN SCHOOLS (Part II)
// ============================================================================

export const DESIGN_SCHOOLS: Record<PlayableNationId, DesignSchool> = {
  uk: {
    nation: "uk",
    name: "Imperial Balanced Design School",
    coreBeliefs: [
      "Survive long deployments",
      "Operate far from home",
      "Maintainable overseas",
      "Function across multiple theaters",
    ],
    strengths: ["balance", "reliability", "endurance", "seaworthiness", "class standardization"],
    weaknesses: [
      "institutional conservatism",
      "expensive global requirements",
      "slower innovation adoption",
    ],
    philosophy: "No ship should be excellent in one theater if that makes it unreliable in five.",
  },
  germany: {
    nation: "germany",
    name: "Technical Concentration School",
    coreBeliefs: ["Ships fight as a system", "Fleet cohesion over individual excellence"],
    strengths: [
      "engineering discipline",
      "armor integration",
      "machinery quality",
      "internal compartmentalization",
    ],
    weaknesses: ["limited colonial utility", "narrower operational assumptions"],
    philosophy: "Every ship is part of a fleet weapon.",
  },
  usa: {
    nation: "usa",
    name: "Industrial Expansion School",
    coreBeliefs: [
      "Construction experience matters",
      "Industry can solve future strategic problems",
    ],
    strengths: ["scalability", "adaptability", "industrial practicality"],
    weaknesses: ["incomplete doctrine", "evolving strategic requirements"],
    philosophy: "Build today's fleet while preparing for tomorrow's navy.",
  },
  japan: {
    nation: "japan",
    name: "Accelerated Modernization School",
    coreBeliefs: ["Modern ships required before self-sufficiency"],
    strengths: ["adaptability", "rapid learning", "disciplined adoption of foreign technology"],
    weaknesses: ["foreign dependence", "limited industrial depth"],
    philosophy: "Acquire capability first, independence later.",
  },
  france: {
    nation: "france",
    name: "Experimental Competition School",
    coreBeliefs: ["Innovation can compensate for inferiority", "Multiple solutions coexist"],
    strengths: ["creativity", "willingness to experiment", "early adoption of disruptive ideas"],
    weaknesses: ["inconsistency", "fragmentation"],
    philosophy: "If one concept cannot defeat Britain, perhaps three competing concepts can.",
  },
  italy: {
    nation: "italy",
    name: "Prestige Optimization School",
    coreBeliefs: ["Smaller fleet must appear larger than it is"],
    strengths: ["bold designs", "aggressive innovation", "powerful flagship concepts"],
    weaknesses: ["budget stress", "maintenance concerns"],
    philosophy: "Every major ship must prove Italy belongs among great powers.",
  },
  russia: {
    nation: "russia",
    name: "Theater-Specific Construction School",
    coreBeliefs: ["Fleet for one theater may not suit another"],
    strengths: ["regional specialization", "strategic flexibility"],
    weaknesses: ["poor standardization", "logistical complications"],
    philosophy:
      "The Baltic, Black Sea, and Pacific are different problems requiring different ships.",
  },
  austria_hungary: {
    nation: "austria_hungary",
    name: "Efficient Defensive School",
    coreBeliefs: ["Well-designed regional fleet can defeat larger opponent"],
    strengths: ["efficiency", "practicality", "operational focus"],
    weaknesses: ["limited scale", "political vulnerability"],
    philosophy: "Build only what is necessary, but build it well.",
  },
  spain: {
    nation: "spain",
    name: "Preservation School",
    coreBeliefs: ["Resources inadequate for equal competition"],
    strengths: ["colonial utility", "strategic caution"],
    weaknesses: ["industrial weakness", "slow modernization"],
    philosophy: "Conserve strength and avoid catastrophic losses.",
  },
  qing: {
    nation: "qing",
    name: "Imported Modernization School",
    coreBeliefs: ["Modern vessels can accelerate national modernization"],
    strengths: ["access to world-class foreign designs", "prestige capital ships"],
    weaknesses: ["institutional fragmentation", "maintenance inconsistencies"],
    philosophy: "Acquire capability externally while seeking internal modernization.",
  },
} as const;

// ============================================================================
// 4. CONSTRUCTION ECOSYSTEMS
// ============================================================================

export const CONSTRUCTION_ECOSYSTEMS: Record<EcosystemTier, ConstructionEcosystem> = {
  first_tier: {
    tier: "first_tier",
    label: "First-Tier Naval Industrial Powers",
    members: ["uk", "germany"],
    characteristics: [
      "armor production",
      "heavy gun production",
      "naval steel production",
      "marine engineering",
      "large private yards",
      "state dockyards",
    ],
  },
  emerging: {
    tier: "emerging",
    label: "Emerging Industrial Naval Powers",
    members: ["usa", "france"],
    characteristics: [
      "major industrial capacity",
      "domestic naval production",
      "growing specialization",
    ],
  },
  developing: {
    tier: "developing",
    label: "Developing Naval Producers",
    members: ["italy", "russia", "austria_hungary"],
    characteristics: [
      "selective specialization",
      "uneven industrial geography",
      "occasional import requirements",
    ],
  },
  modernizer: {
    tier: "modernizer",
    label: "Modernizers",
    members: ["japan", "qing", "spain"],
    characteristics: [
      "foreign machinery",
      "foreign designers",
      "imported warships",
      "foreign technical assistance",
    ],
  },
} as const;

// ============================================================================
// 5. PROCUREMENT CULTURES
// ============================================================================

export const PROCUREMENT_CULTURES: Record<PlayableNationId, ProcurementCulture> = {
  uk: {
    nation: "uk",
    drivenBy: ["strategic commitments", "naval superiority requirements", "imperial obligations"],
  },
  germany: {
    nation: "germany",
    drivenBy: ["prestige", "strategic planning", "concentrated force goals"],
  },
  usa: {
    nation: "usa",
    drivenBy: ["political consensus building", "naval reform movements", "industrial expansion"],
  },
  japan: { nation: "japan", drivenBy: ["urgent modernization", "regional threats"] },
  france: { nation: "france", drivenBy: ["doctrinal competition", "political change"] },
  italy: { nation: "italy", drivenBy: ["prestige projects", "Mediterranean rivalry"] },
  russia: { nation: "russia", drivenBy: ["theater requirements", "prestige considerations"] },
  austria_hungary: {
    nation: "austria_hungary",
    drivenBy: ["budget negotiation", "regional defense"],
  },
  spain: { nation: "spain", drivenBy: ["colonial preservation", "crisis response"] },
  qing: {
    nation: "qing",
    drivenBy: ["regional officials", "court politics", "foreign purchasing"],
  },
} as const;

// ============================================================================
// 6. CANONICAL SHIP ARCHETYPE FRAMEWORK (12)
// ============================================================================

export const SHIP_ARCHETYPES: Record<ShipArchetypeKey, ShipArchetype> = {
  battleship: {
    key: "battleship",
    name: "Battleship",
    purpose: "Fleet supremacy",
    typicalOperators: ["uk", "germany", "france", "russia"],
    strategicRole: "Decisive battle force",
  },
  coastal_battleship: {
    key: "coastal_battleship",
    name: "Coastal Battleship",
    purpose: "Defensive operations in confined waters",
    typicalOperators: ["russia", "austria_hungary", "qing"],
    strategicRole: "Protect enclosed seas and fortified zones",
  },
  armored_cruiser: {
    key: "armored_cruiser",
    name: "Armored Cruiser",
    purpose: "Independent heavy operations",
    typicalOperators: ["uk", "france", "germany", "russia"],
    strategicRole: "Scouting, protection, raiding, colonial presence",
  },
  protected_cruiser: {
    key: "protected_cruiser",
    name: "Protected Cruiser",
    purpose: "Versatile medium fleet vessel",
    typicalOperators: ["usa", "japan", "france"],
    strategicRole: "Patrol, escort, reconnaissance",
  },
  colonial_cruiser: {
    key: "colonial_cruiser",
    name: "Colonial Cruiser",
    purpose: "Empire maintenance",
    typicalOperators: ["uk", "spain", "france"],
    strategicRole: "Station duty and distant presence",
  },
  commerce_raider: {
    key: "commerce_raider",
    name: "Commerce Raider",
    purpose: "Trade disruption",
    typicalOperators: ["france", "russia", "germany"],
    strategicRole: "Attack enemy commerce",
  },
  torpedo_cruiser: {
    key: "torpedo_cruiser",
    name: "Torpedo Cruiser",
    purpose: "Fleet support and torpedo warfare",
    typicalOperators: ["france", "italy", "austria_hungary"],
    strategicRole: "Hybrid scouting and attack",
  },
  torpedo_boat: {
    key: "torpedo_boat",
    name: "Torpedo Boat",
    purpose: "Cheap asymmetric threat",
    typicalOperators: ["france", "italy", "japan", "austria_hungary", "russia"],
    strategicRole: "Sea denial",
  },
  gunboat: {
    key: "gunboat",
    name: "Gunboat",
    purpose: "Coastal and colonial control",
    typicalOperators: ["spain", "qing", "uk"],
    strategicRole: "Presence and sovereignty enforcement",
  },
  dispatch_vessel: {
    key: "dispatch_vessel",
    name: "Dispatch Vessel",
    purpose: "Communications and liaison",
    typicalOperators: [
      "uk",
      "germany",
      "usa",
      "japan",
      "france",
      "italy",
      "russia",
      "austria_hungary",
      "spain",
      "qing",
    ],
    strategicRole: "Fleet coordination and diplomatic transport",
  },
  auxiliary_support: {
    key: "auxiliary_support",
    name: "Auxiliary Support Vessel",
    purpose: "Logistical sustainment",
    typicalOperators: ["uk", "usa", "germany"],
    strategicRole: "Coal, repair support, towing, transport",
  },
  training_vessel: {
    key: "training_vessel",
    name: "Training Vessel",
    purpose: "Officer and crew development",
    typicalOperators: [
      "uk",
      "germany",
      "usa",
      "japan",
      "france",
      "italy",
      "russia",
      "austria_hungary",
      "spain",
      "qing",
    ],
    strategicRole: "Human-capital generation",
  },
} as const;

// ============================================================================
// 7. NATIONAL FLEET CONSTRUCTION TENDENCIES (1880) + PREFERENCES
// ============================================================================

export interface FleetTendency {
  nation: PlayableNationId;
  focus: string;
  primary: ShipArchetypeKey[];
  secondary: ShipArchetypeKey[];
}

export const FLEET_TENDENCIES: Record<PlayableNationId, FleetTendency> = {
  uk: {
    nation: "uk",
    focus: "Balanced fleet",
    primary: ["battleship", "armored_cruiser", "colonial_cruiser", "auxiliary_support"],
    secondary: ["torpedo_boat", "gunboat"],
  },
  germany: {
    nation: "germany",
    focus: "Concentrated fleet",
    primary: ["battleship", "armored_cruiser"],
    secondary: ["torpedo_boat", "torpedo_cruiser"],
  },
  usa: {
    nation: "usa",
    focus: "Development fleet",
    primary: ["protected_cruiser", "armored_cruiser", "battleship"],
    secondary: ["gunboat", "auxiliary_support"],
  },
  japan: {
    nation: "japan",
    focus: "Modernization fleet",
    primary: ["protected_cruiser", "torpedo_boat", "battleship"],
    secondary: ["gunboat"],
  },
  france: {
    nation: "france",
    focus: "Experimental fleet",
    primary: ["armored_cruiser", "protected_cruiser", "torpedo_boat", "battleship"],
    secondary: ["commerce_raider", "torpedo_cruiser"],
  },
  italy: {
    nation: "italy",
    focus: "Prestige fleet",
    primary: ["battleship", "torpedo_boat"],
    secondary: ["armored_cruiser", "torpedo_cruiser"],
  },
  russia: {
    nation: "russia",
    focus: "Regional fleets",
    primary: ["battleship", "coastal_battleship", "armored_cruiser"],
    secondary: ["protected_cruiser", "torpedo_boat", "gunboat"],
  },
  austria_hungary: {
    nation: "austria_hungary",
    focus: "Adriatic fleet",
    primary: ["battleship", "coastal_battleship", "torpedo_boat"],
    secondary: ["armored_cruiser"],
  },
  spain: {
    nation: "spain",
    focus: "Colonial fleet",
    primary: ["colonial_cruiser", "gunboat", "protected_cruiser"],
    secondary: ["battleship", "torpedo_boat"],
  },
  qing: {
    nation: "qing",
    focus: "Regional deterrent fleet",
    primary: ["battleship", "coastal_battleship", "gunboat"],
    secondary: ["protected_cruiser", "torpedo_boat"],
  },
} as const;

// ============================================================================
// 8. HELPERS & SCHEMA IMPACT PLAN (Step 2 - validate against SQLite before impl)
// ============================================================================

export const getDoctrine = (n: PlayableNationId) => SHIPBUILDING_DOCTRINES[n];
export const getDesignSchool = (n: PlayableNationId) => DESIGN_SCHOOLS[n];
export const getEcosystemForNation = (n: PlayableNationId) =>
  Object.values(CONSTRUCTION_ECOSYSTEMS).find((e) => (e.members as readonly string[]).includes(n))!;
export const getProcurement = (n: PlayableNationId) => PROCUREMENT_CULTURES[n];
export const getArchetype = (k: ShipArchetypeKey) => SHIP_ARCHETYPES[k];
export const getTendency = (n: PlayableNationId) => FLEET_TENDENCIES[n];
export const getPreferredArchetypes = (n: PlayableNationId) => [
  ...FLEET_TENDENCIES[n].primary,
  ...FLEET_TENDENCIES[n].secondary,
];

// One-sentence canon
export const SHIPBUILDING_CANON =
  "In January 1880, shipbuilding is the process by which each nation attempts to solve its geographic, industrial, political, and strategic problems through warship design, producing naval forces that reflect not merely technology, but the character and limitations of the states that create them." as const;
