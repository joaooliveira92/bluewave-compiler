// content/shipbuilding/validator.ts - Priority System 1 - Ship Design Validator
// Input: campaign/nation/design/turn -> Output: legal | legal_with_warnings | illegal

import type { PlayableNationId } from "../nations/shared.ts";
import type { ShipArchetypeKey } from "../shipbuilding.ts";

export type ValidationStatus = "legal" | "legal_with_warnings" | "illegal";
export type InferredShipType = ShipArchetypeKey | "reclassified";

export interface ValidatorInput {
  campaignId: string;
  nationId: PlayableNationId;
  shipClassDesignId: string;
  campaignTurnId: string;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}
export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
}

export interface ValidatorOutput {
  validationStatus: ValidationStatus;
  inferredShipType: InferredShipType;
  usedDisplacement: number;
  designDisplacement: number;
  remainingDisplacement: number;
  overweightAmount: number; // >0 if overweight
  stabilityScore: number; // 0-100
  flotationScore: number; // 0-100
  topsidePointsUsed: number;
  topsidePointsLimit: number;
  estimatedCost: number;
  estimatedBuildTime: number; // months
  errors: ValidationError[];
  warnings: ValidationWarning[];
  notes: string[];
}

// Data-driven rule sources - validator must query these tables
export interface ValidationRuleSources {
  shipTypeDefinitions: string; // ship_type_definitions
  eraRules: string; // ship_type_era_rules
  armorRequirements: string; // ship_type_armor_requirements
  gunRequirements: string; // ship_type_main_gun_requirements
  torpedoRequirements: string; // ship_type_torpedo_requirements
  aircraftRequirements: string; // ship_type_aircraft_capacity_requirements
  techLimits: string; // ship_type_technology_limits
  dockInfrastructure: string; // dock_infrastructure - max displacement
  treaties: string; // treaties - displacement/calibre/tonnage
}

// Rules it must evaluate - per roadmap 2.1-2.4
export const VALIDATION_RULES = {
  shipTypeLegality:
    "AI relies on type classification - illegal/unrealistic types disallowed or reclassified",
  technologyLegality:
    "Features/weapons/machinery/aircraft/radar/missiles/armor gated by researched technologies",
  dockLegality: "Displacement > national dock size = not buildable domestically",
  treatyLegality:
    "Displacement, main calibre, total tonnage - may scrap incompatible ships under construction, government cheating varies",
} as const;

export interface ShipDesignValidationRun {
  id: string;
  campaignId: string;
  nationId: PlayableNationId;
  shipClassDesignId: string;
  campaignTurnId: string;
  output: ValidatorOutput;
  createdAt: string;
}
