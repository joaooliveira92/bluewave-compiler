// content/shipbuilding/rebuilds.ts - Rebuild and Conversion
// RTW3: machinery, fire control, bulges, deck armor, secondary/tertiary, main armament changes, carrier conversion, reclassification
// Separate from new construction - existing ship + allowed/forbidden changes + unavailable time

export type ModificationType =
  | "repair"
  | "minor_refit"
  | "major_rebuild"
  | "carrier_conversion"
  | "machinery_replacement"
  | "fire_control_upgrade"
  | "radar_installation"
  | "missile_refit"
  | "bulge_addition"
  | "deck_armor_addition";
export type ModificationStatus = "planned" | "in_progress" | "completed" | "cancelled";

export interface ShipModificationProject {
  id: string;
  campaignId: string;
  nationId: string;
  shipId: string; // existing ship
  oldDesignId: string;
  newDesignId?: string | null; // resulting design after rebuild
  type: ModificationType;
  status: ModificationStatus;
  allowedChanges: AllowedChange[];
  forbiddenChanges: string[];
  cost: number;
  monthlyCost: number;
  totalMonths: number;
  remainingMonths: number;
  shipUnavailable: boolean; // ship cannot be used during rebuild
  reclassificationTo?: string | null; // e.g. BB -> CV after conversion
  startTurnId: string;
  completionTurnId?: string | null;
}

export interface AllowedChange {
  component:
    | "machinery"
    | "fire_control"
    | "bulges"
    | "deck_armor"
    | "secondary_guns"
    | "tertiary_guns"
    | "main_guns"
    | "carrier_conversion";
  description: string;
  requiresTechnology?: string | null;
}

export const REBUILD_RULES = {
  machinery: "Machinery can be replaced - may change speed/range",
  fireControl: "Fire control can be improved",
  bulges: "Bulges can be added - improves torpedo protection",
  deckArmor: "Deck armor can be added",
  secondaryTertiary: "Secondary/tertiary guns can be changed",
  mainArmament: "Certain main armament changes allowed - limited",
  carrierConversion:
    "Ships can be converted to carriers if technology permits - may change ship type",
  reclassification: "Ship type may change after rebuild - e.g. BC -> BB, BB -> CV",
  unavailable: "Ship is unavailable during rebuild - must be in dock",
} as const;

export const ALLOWED_CHANGES_BY_TYPE: Record<ModificationType, AllowedChange[]> = {
  repair: [{ component: "machinery", description: "Repair damage" }],
  minor_refit: [
    { component: "fire_control", description: "Fire control upgrade" },
    { component: "secondary_guns", description: "Secondary guns change" },
  ],
  major_rebuild: [
    { component: "machinery", description: "Machinery replacement" },
    { component: "fire_control", description: "Fire control improved" },
    { component: "bulges", description: "Bulges added" },
    { component: "deck_armor", description: "Deck armor added" },
    { component: "secondary_guns", description: "Secondary/tertiary changed" },
    { component: "main_guns", description: "Certain main armament changes allowed" },
  ],
  carrier_conversion: [
    {
      component: "carrier_conversion",
      description: "Convert to carrier",
      requiresTechnology: "carrier_conversion_tech",
    },
  ],
  machinery_replacement: [{ component: "machinery", description: "Machinery replaced" }],
  fire_control_upgrade: [{ component: "fire_control", description: "Fire control upgrade" }],
  radar_installation: [
    { component: "fire_control", description: "Radar installation", requiresTechnology: "radar" },
  ],
  missile_refit: [
    { component: "secondary_guns", description: "Missile refit", requiresTechnology: "missiles" },
  ],
  bulge_addition: [{ component: "bulges", description: "Bulges added" }],
  deck_armor_addition: [{ component: "deck_armor", description: "Deck armor added" }],
} as const;

export const isConversion = (p: ShipModificationProject) => p.type === "carrier_conversion";
export const requiresReclassification = (p: ShipModificationProject) => !!p.reclassificationTo;
