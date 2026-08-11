// content/resources.ts
// Phase 4 Resources Canon Draft v1 - IMMUTABLE - 1880-01-01
// Built on PoC v0.2 + Errata - Qualitative structural layout, no DB rows/SQL/values/formulas
// 5 active + 1 future placeholder

import type { NationId, PlayableNationId } from "./nations/shared.ts";

// ============================================================================
// 1. CORE RESOURCE DEFINITIONS
// ============================================================================

export type ResourceId =
  "naval_coal" | "industrial_coal" | "iron_ore" | "alloy_metals" | "rubber" | "petroleum";
export type ResourceStatus = "active" | "future_placeholder";

export interface ResourceDef {
  id: ResourceId;
  name: string;
  status: ResourceStatus;
  definition: string;
  strategicUtility: string;
  industrialApplication: string;
}

export const RESOURCES = {
  naval_coal: {
    id: "naval_coal",
    name: "Naval Coal",
    status: "active",
    definition: "Premium, clean-burning, high-carbon anthracite or high-calorific bituminous coal.",
    strategicUtility:
      "Exclusively for warship propulsion. Minimizes visible smoke (tactical concealment) and optimizes boiler longevity/thermal efficiency.",
    industrialApplication:
      "Unusable for general metallurgical smelting due to combustion properties - dedicated strategic naval asset.",
  },
  industrial_coal: {
    id: "industrial_coal",
    name: "Industrial Coal",
    status: "active",
    definition: "Bituminous coking coal and standard steam-grade coal.",
    strategicUtility:
      "Primary fuel for heavy industrial machinery, civilian factories, railways, foundries.",
    industrialApplication:
      "Fundamental thermal input for steel production. Combustible in ship boilers but heavy soot/lower efficiency vs Naval Coal.",
  },
  iron_ore: {
    id: "iron_ore",
    name: "Iron Ore",
    status: "active",
    definition: "High-grade raw iron deposits (primarily hematite and magnetite).",
    strategicUtility: "Basic raw material for steelmaking, framing, heavy civil construction.",
    industrialApplication:
      "Constrains hull construction capacity, maritime repairs, armor plate foundations.",
  },
  alloy_metals: {
    id: "alloy_metals",
    name: "Alloy Metals",
    status: "active",
    definition: "Hardening agents, specifically nickel, chromium, and manganese.",
    strategicUtility:
      "Additives essential for high-tensile structural steel and hardened armor plating (Harveyized/Krupp cemented).",
    industrialApplication:
      "Restricts ability to manufacture modern protective belts, turrets, armored decks.",
  },
  rubber: {
    id: "rubber",
    name: "Rubber",
    status: "active",
    definition: "Natural latex harvested from wild or early-plantation rubber trees.",
    strategicUtility:
      "Emerging material for electrical insulation, steam gaskets, watertight hull fittings.",
    industrialApplication:
      "Constrains modern warship electrical systems, auxiliary machinery, internal watertight seals.",
  },
  petroleum: {
    id: "petroleum",
    name: "Petroleum",
    status: "future_placeholder",
    definition: "Liquid hydrocarbons (crude oil).",
    strategicUtility:
      "Inactive in 1880. Does not influence propulsion, fleet operations, or industrial throughput.",
    industrialApplication:
      "Cataloged solely to support future transitions (e.g., oil-fired boilers).",
  },
} as const satisfies Record<ResourceId, ResourceDef>;

export type ActiveResourceId = Exclude<ResourceId, "petroleum">;
export const ACTIVE_RESOURCES: ActiveResourceId[] = [
  "naval_coal",
  "industrial_coal",
  "iron_ore",
  "alloy_metals",
  "rubber",
] as const;

// ============================================================================
// 2. QUALITATIVE SCALES & INTERPRETIVE FRAMEWORK
// ============================================================================

export type Abundance = "absent" | "minor" | "moderate" | "major" | "exceptional";
export type Quality = "poor" | "standard" | "high" | "first_class";
export type Availability =
  "developed" | "partially_developed" | "undeveloped" | "imported_stockpile" | "absent";

// Architectural Rules - must be enforced by all consumers
export const RESOURCE_RULES = {
  separationOfExtractionAndLogistics:
    "imported_stockpile = logistics/maritime transit security, NOT domestic extraction. Depends on open sea lanes + merchant marine. Blockaded waterway disrupts it.",
  separationOfPresenceAndCapacity:
    "Abundance does NOT grant industrial capacity to refine/use. Governed by nation's industrial rating (excellent_mature vs fragmented_partial). Resource supplies capacity, does not replace it.",
  waterwayDeprivation:
    "If waterway (gibraltar, danish_straits, etc.) closed/contested, any metropolitan territory with imported_stockpile routed through it has shipyards/metallurgy incrementally throttled.",
  territorialControlTransition:
    "If control of territory changes or port infra damaged, availability transitions dynamically to represent disruption of flow to metropole.",
} as const;

export interface TerritoryResourceEntry {
  abundance: Abundance;
  quality: Quality;
  availability: Availability;
}
export type TerritoryResourceProfileMap = Record<ResourceId, TerritoryResourceEntry>;

export interface TerritoryResourceProfile {
  territoryId: string;
  controller: NationId;
  profile: TerritoryResourceProfileMap;
  strategicInterpretation: string;
}

// ============================================================================
// 3. TERRITORY RESOURCE MAP - 10 Canonical Territories
// ============================================================================

export const TERRITORY_RESOURCES: Record<string, TerritoryResourceProfile> = {
  uk_british_isles: {
    territoryId: "uk_british_isles",
    controller: "uk",
    profile: {
      naval_coal: { abundance: "exceptional", quality: "first_class", availability: "developed" },
      industrial_coal: { abundance: "major", quality: "high", availability: "developed" },
      iron_ore: { abundance: "moderate", quality: "standard", availability: "developed" },
      alloy_metals: { abundance: "minor", quality: "standard", availability: "developed" },
      rubber: { abundance: "absent", quality: "poor", availability: "imported_stockpile" },
      petroleum: { abundance: "absent", quality: "poor", availability: "absent" },
    },
    strategicInterpretation:
      "Home waters supplied by Welsh anthracite. General iron fully developed, but high-grade alloy metals and rubber entirely dependent on maritime imports.",
  },
  germany_metropole: {
    territoryId: "germany_metropole",
    controller: "germany",
    profile: {
      naval_coal: { abundance: "moderate", quality: "standard", availability: "developed" },
      industrial_coal: { abundance: "exceptional", quality: "high", availability: "developed" },
      iron_ore: { abundance: "moderate", quality: "standard", availability: "developed" },
      alloy_metals: { abundance: "minor", quality: "standard", availability: "developed" },
      rubber: { abundance: "absent", quality: "poor", availability: "imported_stockpile" },
      petroleum: { abundance: "absent", quality: "poor", availability: "absent" },
    },
    strategicInterpretation:
      "Massive coking coal in Ruhr/Silesia supports rapid heavy industrialization. Domestic naval coal quality is standard, requiring careful boiler efficiency management.",
  },
  france_metropole: {
    territoryId: "france_metropole",
    controller: "france",
    profile: {
      naval_coal: { abundance: "minor", quality: "standard", availability: "developed" },
      industrial_coal: { abundance: "moderate", quality: "standard", availability: "developed" },
      iron_ore: { abundance: "major", quality: "standard", availability: "developed" },
      alloy_metals: { abundance: "minor", quality: "high", availability: "developed" },
      rubber: { abundance: "absent", quality: "poor", availability: "imported_stockpile" },
      petroleum: { abundance: "absent", quality: "poor", availability: "absent" },
    },
    strategicInterpretation:
      "Rich metallurgical iron (Lorraine) and advanced alloying, but persistent domestic coal deficit forces reliance on imports.",
  },
  usa_atlantic: {
    territoryId: "usa_atlantic",
    controller: "usa",
    profile: {
      naval_coal: { abundance: "major", quality: "high", availability: "developed" },
      industrial_coal: { abundance: "exceptional", quality: "high", availability: "developed" },
      iron_ore: { abundance: "major", quality: "high", availability: "developed" },
      alloy_metals: { abundance: "minor", quality: "standard", availability: "developed" },
      rubber: { abundance: "absent", quality: "poor", availability: "imported_stockpile" },
      petroleum: {
        abundance: "moderate",
        quality: "standard",
        availability: "partially_developed",
      },
    },
    strategicInterpretation:
      "Highly self-sufficient, massive coking coal and high-purity iron feed rapidly modernizing defense industry.",
  },
  japan_kyushu: {
    territoryId: "japan_kyushu",
    controller: "japan",
    profile: {
      naval_coal: { abundance: "moderate", quality: "standard", availability: "developed" },
      industrial_coal: { abundance: "moderate", quality: "standard", availability: "developed" },
      iron_ore: { abundance: "minor", quality: "poor", availability: "partially_developed" },
      alloy_metals: { abundance: "absent", quality: "poor", availability: "imported_stockpile" },
      rubber: { abundance: "absent", quality: "poor", availability: "imported_stockpile" },
      petroleum: { abundance: "absent", quality: "poor", availability: "absent" },
    },
    strategicInterpretation:
      "Local coal active but fast-burning/high ash. Lack of domestic iron/alloy forces near-total reliance on foreign pipelines.",
  },
  russia_european: {
    territoryId: "russia_european",
    controller: "russia",
    profile: {
      naval_coal: { abundance: "minor", quality: "standard", availability: "partially_developed" },
      industrial_coal: {
        abundance: "major",
        quality: "standard",
        availability: "partially_developed",
      },
      iron_ore: { abundance: "major", quality: "standard", availability: "partially_developed" },
      alloy_metals: {
        abundance: "minor",
        quality: "standard",
        availability: "partially_developed",
      },
      rubber: { abundance: "absent", quality: "poor", availability: "imported_stockpile" },
      petroleum: {
        abundance: "moderate",
        quality: "standard",
        availability: "partially_developed",
      },
    },
    strategicInterpretation:
      "Vast iron/coking coal (Donets Basin), but extraction/transport constrained by underdeveloped infrastructure, separating resources from Baltic shipyards.",
  },
  spain_peninsula: {
    territoryId: "spain_peninsula",
    controller: "spain",
    profile: {
      naval_coal: { abundance: "minor", quality: "standard", availability: "developed" },
      industrial_coal: { abundance: "moderate", quality: "standard", availability: "developed" },
      iron_ore: { abundance: "major", quality: "high", availability: "developed" },
      alloy_metals: { abundance: "minor", quality: "standard", availability: "developed" },
      rubber: { abundance: "absent", quality: "poor", availability: "imported_stockpile" },
      petroleum: { abundance: "absent", quality: "poor", availability: "absent" },
    },
    strategicInterpretation:
      "Basque high-purity iron abundant and exported, but domestic manufacturing limited by standard-grade coal and foreign technology reliance.",
  },
  qing_manchuria: {
    territoryId: "qing_manchuria",
    controller: "qing",
    profile: {
      naval_coal: { abundance: "moderate", quality: "standard", availability: "undeveloped" },
      industrial_coal: { abundance: "major", quality: "standard", availability: "undeveloped" },
      iron_ore: { abundance: "major", quality: "standard", availability: "undeveloped" },
      alloy_metals: { abundance: "absent", quality: "poor", availability: "undeveloped" },
      rubber: { abundance: "absent", quality: "poor", availability: "absent" },
      petroleum: { abundance: "absent", quality: "poor", availability: "absent" },
    },
    strategicInterpretation:
      "Significant geological coal/iron reserves entirely undeveloped - separation of presence from extraction capacity.",
  },
  congo_free_state: {
    territoryId: "congo_free_state",
    controller: "belgium",
    profile: {
      naval_coal: { abundance: "absent", quality: "poor", availability: "absent" },
      industrial_coal: { abundance: "absent", quality: "poor", availability: "absent" },
      iron_ore: { abundance: "absent", quality: "poor", availability: "absent" },
      alloy_metals: { abundance: "absent", quality: "poor", availability: "absent" },
      rubber: { abundance: "exceptional", quality: "high", availability: "developed" },
      petroleum: { abundance: "absent", quality: "poor", availability: "absent" },
    },
    strategicInterpretation:
      "Exclusively wild rubber export. Lacks industrial base to utilize metals/coal.",
  },
  uk_gibraltar: {
    territoryId: "uk_gibraltar",
    controller: "uk",
    profile: {
      naval_coal: { abundance: "absent", quality: "poor", availability: "imported_stockpile" },
      industrial_coal: { abundance: "absent", quality: "poor", availability: "absent" },
      iron_ore: { abundance: "absent", quality: "poor", availability: "absent" },
      alloy_metals: { abundance: "absent", quality: "poor", availability: "absent" },
      rubber: { abundance: "absent", quality: "poor", availability: "absent" },
      petroleum: { abundance: "absent", quality: "poor", availability: "absent" },
    },
    strategicInterpretation:
      "No domestic base. Utility entirely as secure maritime coaling station stocking imported Welsh coal for Mediterranean logistics.",
  },
} as const;

// ============================================================================
// 4. NATIONAL RESOURCE PROFILES - 10 Playable Powers
// ============================================================================

export interface NationalResourceProfile {
  nation: NationId;
  domesticStrengths: string;
  colonialAccess: string;
  importDependencies: string;
  navalFuelSecurity: string;
  strategicVulnerability: string;
  flowNote?: string;
}

export const NATIONAL_PROFILES: Record<PlayableNationId, NationalResourceProfile> = {
  uk: {
    nation: "uk",
    domesticStrengths: "Exceptional Welsh naval coal. Mature steel-manufacturing infrastructure.",
    colonialAccess:
      "Global network of coaling stations and colonies providing raw materials and rubber.",
    importDependencies:
      "Increasingly reliant on high-purity iron ore imports (e.g., Spain, Sweden) to sustain massive steel production.",
    navalFuelSecurity:
      "Exceptional in home waters. Fortified pre-stocked overseas stations ensure global logistics.",
    strategicVulnerability:
      "Highly vulnerable to trade-route disruption. Merchant marine failure starves shipyards of raw materials/rubber.",
    flowNote:
      "[UK] <== (Spanish Iron Ore / Swedish Iron Ore) | [UK] --Coal Exports--> [Italy] (Vulnerable to Blockade)",
  },
  germany: {
    nation: "germany",
    domesticStrengths:
      "Major industrial coal basins (Ruhr, Silesia) and advanced metallurgical industries.",
    colonialAccess: "Highly limited overseas possessions with minimal extraction.",
    importDependencies:
      "Reliant on high-grade Scandinavian iron ore and foreign alloy metals (nickel, chromium) for armor plating.",
    navalFuelSecurity: "High within North Sea/Baltic, extremely limited for oceanic operations.",
    strategicVulnerability:
      "Vulnerable to blockade at Danish Straits severing Swedish iron imports, and land-based resource competition with army.",
  },
  usa: {
    nation: "usa",
    domesticStrengths:
      "Massive domestic coal and iron reserves, highly self-sufficient industrial base.",
    colonialAccess: "Minimal overseas presence in 1880.",
    importDependencies:
      "Self-sufficient in bulk steel, but reliant on foreign rubber and specific alloy metals.",
    navalFuelSecurity:
      "Secure domestic coastlines, but lacks far-flung coaling stations for long-range projection.",
    strategicVulnerability:
      "Two-ocean split divides fleet strength and complicates internal coal/material logistics.",
  },
  france: {
    nation: "france",
    domesticStrengths:
      "Large iron ore deposits and advanced metallurgical research in steel-armoring.",
    colonialAccess:
      "Extensive holdings (Indochina, West Africa) providing localized coaling outposts and rubber.",
    importDependencies: "Domestic coal deficit, requiring imports from Great Britain and Belgium.",
    navalFuelSecurity: "Moderate. Home ports secure, colonial stations vulnerable to interdiction.",
    strategicVulnerability:
      "Highly dependent on British coal and open sea lanes to keep armor mills/fleets active.",
  },
  italy: {
    nation: "italy",
    domesticStrengths:
      "Skilled naval architects and modern shipyards capable of fast, innovative designs.",
    colonialAccess: "Poor, low-yield East African outposts.",
    importDependencies: "Near-total reliance on imported naval coal and foreign steel components.",
    navalFuelSecurity: "Low. Active operations strictly limited by imported stockpiles.",
    strategicVulnerability:
      "High vulnerability to blockade. Closure of Mediterranean choke points quickly exhausts reserves.",
  },
  russia: {
    nation: "russia",
    domesticStrengths: "Massive continental reserves of coal/iron ore, plus early oil fields.",
    colonialAccess: "Vast contiguous landmass, but lacks global maritime outposts.",
    importDependencies:
      "Baltic shipyards cut off from southern coal fields, forcing reliance on British coal imports.",
    navalFuelSecurity: "Low. Assets permanently fragmented across non-contiguous seas.",
    strategicVulnerability:
      "High internal transport friction. Slow rail integration delays construction/repairs.",
  },
  austria_hungary: {
    nation: "austria_hungary",
    domesticStrengths:
      "High-purity domestic iron ore (Styria) and high-quality heavy steel manufacturing.",
    colonialAccess: "None.",
    importDependencies:
      "Almost entirely dependent on imported high-grade Silesian or Welsh naval coal.",
    navalFuelSecurity: "Secure but strictly localized to Adriatic.",
    strategicVulnerability:
      "Confinement behind Strait of Otranto. Fleet optimized for local defense, unable to sustain long-range operations.",
  },
  spain: {
    nation: "spain",
    domesticStrengths:
      "Abundant high-purity iron ore (Basque region) exported to fund state programs.",
    colonialAccess: "Scattered overseas empire (Caribbean, Philippines, Pacific islands).",
    importDependencies:
      "Reliant on British coal and foreign shipyards for modern armaments/boiler components.",
    navalFuelSecurity:
      "Low. Remote colonial garrisons rely on imported stockpiles, vulnerable to interdiction.",
    strategicVulnerability:
      "Extreme colonial overextension. Domestic industrial base insufficient to defend scattered holdings.",
  },
  japan: {
    nation: "japan",
    domesticStrengths: "Unified naval administration and highly motivated officer corps.",
    colonialAccess: "None in 1880.",
    importDependencies:
      "Near-total reliance on foreign (primarily British) suppliers for steel plate, alloy metals, armor, naval artillery.",
    navalFuelSecurity:
      "Very low. Japanese coal is standard-grade/smoky, requiring foreign imports for high-speed runs.",
    strategicVulnerability:
      "Extreme vulnerability to blockade/embargo, which would halt construction/operations.",
  },
  qing: {
    nation: "qing",
    domesticStrengths: "Localized Kaiping coal and regional steel foundries (Hanyang).",
    colonialAccess: "None.",
    importDependencies:
      "Complete reliance on foreign shipyards (German/British) for armored capital ships, Krupp ordnance, advanced armor. Lacks standard metallurgical processing.",
    navalFuelSecurity: "High along Bohai Gulf, but highly vulnerable to southern interdiction.",
    strategicVulnerability:
      "Deep administrative fragmentation and slow modernization. Regional fleets logistically isolated, cannot share resources/coal reserves.",
  },
} as const;

// Lightweight AI profiles for unified lookups (12 AI nations)
export const AI_NATIONAL_PROFILES: Record<string, Partial<NationalResourceProfile>> = {
  ottoman_empire: {
    nation: "ottoman_empire" as NationId,
    domesticStrengths: "Limited coal/iron, Straits leverage",
    colonialAccess: "None",
    importDependencies: "Dependent on British/French coal",
    navalFuelSecurity: "Low - fortress dependent",
    strategicVulnerability: "Debt, Balkan losses",
  },
  egypt: {
    nation: "egypt" as NationId,
    domesticStrengths: "Suez tolls, cotton",
    colonialAccess: "None - is the prize",
    importDependencies: "British coal via Suez",
    navalFuelSecurity: "Canal dependent",
    strategicVulnerability: "Dual Control, bankruptcy",
  },
  netherlands: {
    nation: "netherlands" as NationId,
    domesticStrengths: "East Indies rubber/tin",
    colonialAccess: "Dutch East Indies - Malacca/Sunda",
    importDependencies: "Coal/steel imports",
    navalFuelSecurity: "Colonial coaling network",
    strategicVulnerability: "Home vs East Indies split",
  },
  denmark: {
    nation: "denmark" as NationId,
    domesticStrengths: "Straits tolls historically",
    colonialAccess: "Iceland/Greenland/West Indies",
    importDependencies: "Coal/iron imports",
    navalFuelSecurity: "Strait guardian",
    strategicVulnerability: "Post-1864, German pressure",
  },
  sweden_norway: {
    nation: "sweden_norway" as NationId,
    domesticStrengths: "High-grade iron ore (Kiruna), timber",
    colonialAccess: "None",
    importDependencies: "Coal imports",
    navalFuelSecurity: "Baltic/Atlantic split",
    strategicVulnerability: "Union tensions, Russian pressure",
  },
  portugal: {
    nation: "portugal" as NationId,
    domesticStrengths: "Atlantic islands, colonial trade",
    colonialAccess: "Angola/Mozambique/Goa/Macao",
    importDependencies: "Coal/steel imports",
    navalFuelSecurity: "Scattered coaling",
    strategicVulnerability: "British dependent, debt",
  },
  greece: {
    nation: "greece" as NationId,
    domesticStrengths: "Shipping, Aegean position",
    colonialAccess: "None",
    importDependencies: "Coal/iron imports",
    navalFuelSecurity: "Aegean only",
    strategicVulnerability: "Ottoman rivalry, debt",
  },
  brazil: {
    nation: "brazil" as NationId,
    domesticStrengths: "Coffee/rubber, vast coast",
    colonialAccess: "None",
    importDependencies: "Coal/steel imports",
    navalFuelSecurity: "South Atlantic",
    strategicVulnerability: "River + blue water split",
  },
  chile: {
    nation: "chile" as NationId,
    domesticStrengths: "Nitrates/copper, battle-tested fleet",
    colonialAccess: "None",
    importDependencies: "Coal imports",
    navalFuelSecurity: "Magellan control",
    strategicVulnerability: "War of the Pacific",
  },
  argentina: {
    nation: "argentina" as NationId,
    domesticStrengths: "Grain/beef, growing",
    colonialAccess: "None",
    importDependencies: "Coal/steel imports",
    navalFuelSecurity: "Plate basin",
    strategicVulnerability: "Brazil/Chile rivalry",
  },
  korea: {
    nation: "korea" as NationId,
    domesticStrengths: "None - hermit kingdom",
    colonialAccess: "None",
    importDependencies: "Total import dependent",
    navalFuelSecurity: "No navy",
    strategicVulnerability: "Qing/Japan/Russia buffer",
  },
  siam: {
    nation: "siam" as NationId,
    domesticStrengths: "Rice/teak, buffer position",
    colonialAccess: "None",
    importDependencies: "Coal/steel imports",
    navalFuelSecurity: "River/coastal only",
    strategicVulnerability: "Britain/France buffer",
  },
} as const;

export const ALL_NATIONAL_PROFILES = { ...NATIONAL_PROFILES, ...AI_NATIONAL_PROFILES } as const;

// ============================================================================
// 5. STRUCTURAL SCHEMA INTEGRATION GUARDRAILS
// ============================================================================

export const SCHEMA_GUARDRAILS = {
  waterwaysAndChokePoints:
    "If waterway (gibraltar, danish_straits) closed/contested, any metropolitan territory with imported_stockpile routed through it must have shipyards/metallurgy incrementally throttled.",
  territoryAndNationLinks:
    "Territory availability tied to controlling nation's maritime logistics. If control changes or port infra damaged, availability transitions dynamically to represent disruption of flow to metropole.",
  industrialCapacitySeparation:
    "Having major/exceptional abundance does NOT allow warship building. Governed strictly by nation's industrial rating (excellent_mature vs fragmented_partial). Resource presence merely supplies capacity.",
} as const;

// ============================================================================
// 6. HELPERS
// ============================================================================

export const getTerritoryProfile = (id: string) => TERRITORY_RESOURCES[id];
export const getNationalProfile = (nation: PlayableNationId) => NATIONAL_PROFILES[nation];
export const getAnyNationalProfile = (nation: string) =>
  (ALL_NATIONAL_PROFILES as Record<string, any>)[nation];
export const getActiveResourceDefs = () => ACTIVE_RESOURCES.map((id) => RESOURCES[id]);
export const isFuturePlaceholder = (id: ResourceId) =>
  RESOURCES[id].status === "future_placeholder";
export const getImportedStockpileTerritories = () =>
  Object.values(TERRITORY_RESOURCES).filter((t) =>
    Object.values(t.profile).some((e) => e.availability === "imported_stockpile"),
  );
export const getUndevelopedReserves = () =>
  Object.values(TERRITORY_RESOURCES).filter((t) =>
    Object.values(t.profile).some((e) => e.availability === "undeveloped"),
  );
