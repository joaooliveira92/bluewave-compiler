//packages/campaign/src/division.ts
import type { SafeInt } from "@bluewave/contracts";

// DESIGN-26 §1 canonical division types.
export const DIVISION_TYPES = ["PERMANENT_DIVISION", "TACTICAL_DIVISION"] as const;
export type DivisionType = (typeof DIVISION_TYPES)[number];

// DESIGN-26 §13 canonical roles.
export const DIVISION_ROLES = [
  "INDEPENDENT",
  "CORE",
  "SUPPORT",
  "SCOUT",
  "SCREEN",
  "PATROL",
] as const;
export type DivisionRole = (typeof DIVISION_ROLES)[number];

// DESIGN-26 §17 canonical formations.
export const DIVISION_FORMATIONS = ["LINE_AHEAD", "LINE_ABREAST", "SEARCH_LINE", "SCREEN"] as const;
export type DivisionFormation = (typeof DIVISION_FORMATIONS)[number];

// DESIGN-26 §2 authoritative permanent division.
export const VACANT = "VACANT";
export type CommanderRef = string;

export interface PermanentDivision {
  divisionId: string;
  nationId: string;
  shipOrder: string[];
  flagshipShipId: string;
  commanderOfficerId: CommanderRef;
  divisionRole: DivisionRole;
  preferredFormation: DivisionFormation;
  experience: SafeInt; // 0..100
  cohesion: SafeInt; // 0..100
  locationAreaId: string;
  creationMonth: string;
  lastReorganizationMonth: string;
  provenanceRefs: string[];
  rulesetVersion: string;
  aggregateHash: string;
}

// DESIGN-26 §10 initial values.
export const INITIAL_DIVISION_EXPERIENCE = 20;
export const INITIAL_DIVISION_COHESION = 30;

// DESIGN-26 §3 size bounds.
export const DIVISION_MAX_SHIPS = 5;
export const DD_DIVISION_MAX_SHIPS = 6;

// DESIGN-26 §4 compatibility policy id.
export const DIVISION_TYPE_COMPATIBILITY_V1 = "division_type_compatibility_v1" as const;

// DESIGN-26 §12 reorganization penalties.
export const DIVISION_PENALTIES = {
  addShip: { experience: -5, cohesion: -10 },
  removeNonFlagship: { experience: -3, cohesion: -5 },
  commanderChange: { experience: -5, cohesion: -10 },
  flagshipChange: { experience: -5, cohesion: -10 },
  commanderAndFlagshipChange: { experience: -8, cohesion: -15 },
  reorderWithoutFlagship: { experience: 0, cohesion: -3 },
  changeMinHalfMembership: { experience: -10, cohesion: -15 },
  changeCanonicalType: { experience: -10, cohesion: -20 },
} as const;
