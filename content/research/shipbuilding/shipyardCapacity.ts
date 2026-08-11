// content/shipbuilding/shipyardCapacity.ts - Shipyard Capacity Rules
// RTW3: capacity = dock size, limits total tonnage under construction. Subs count, rebuilds don't, AMC/KE exceptions

export interface ShipTypeCapacityRule {
  shipTypeDefinitionId: string; // BB, BC, CA, CL, DD, SS, etc.
  countsAgainstCapacity: boolean;
  capacityTonnageMultiplier: number; // 1.0 = full, 0 = exception
  countsWhenNewBuild: boolean;
  countsWhenRebuild: boolean;
  wartimeOnly?: boolean;
  minimumDisplacement?: number;
  maximumDisplacement?: number;
  notes?: string;
}

export const SHIP_TYPE_CAPACITY_RULES: ShipTypeCapacityRule[] = [
  {
    shipTypeDefinitionId: "BB",
    countsAgainstCapacity: true,
    capacityTonnageMultiplier: 1.0,
    countsWhenNewBuild: true,
    countsWhenRebuild: false,
    notes: "Battleship - full tonnage",
  },
  {
    shipTypeDefinitionId: "BC",
    countsAgainstCapacity: true,
    capacityTonnageMultiplier: 1.0,
    countsWhenNewBuild: true,
    countsWhenRebuild: false,
  },
  {
    shipTypeDefinitionId: "CA",
    countsAgainstCapacity: true,
    capacityTonnageMultiplier: 1.0,
    countsWhenNewBuild: true,
    countsWhenRebuild: false,
  },
  {
    shipTypeDefinitionId: "CL",
    countsAgainstCapacity: true,
    capacityTonnageMultiplier: 1.0,
    countsWhenNewBuild: true,
    countsWhenRebuild: false,
  },
  {
    shipTypeDefinitionId: "DD",
    countsAgainstCapacity: true,
    capacityTonnageMultiplier: 1.0,
    countsWhenNewBuild: true,
    countsWhenRebuild: false,
  },
  {
    shipTypeDefinitionId: "SS",
    countsAgainstCapacity: true,
    capacityTonnageMultiplier: 1.0,
    countsWhenNewBuild: true,
    countsWhenRebuild: false,
    notes: "Submarines count per manual",
  },
  {
    shipTypeDefinitionId: "rebuild",
    countsAgainstCapacity: false,
    capacityTonnageMultiplier: 0,
    countsWhenNewBuild: false,
    countsWhenRebuild: false,
    notes: "Rebuilds do not count",
  },
  {
    shipTypeDefinitionId: "AMC",
    countsAgainstCapacity: false,
    capacityTonnageMultiplier: 0,
    countsWhenNewBuild: true,
    countsWhenRebuild: false,
    notes: "AMC exception",
  },
  {
    shipTypeDefinitionId: "KE_small",
    countsAgainstCapacity: false,
    capacityTonnageMultiplier: 0,
    countsWhenNewBuild: true,
    countsWhenRebuild: false,
    notes: "Small corvette/KE exception",
  },
] as const;

export interface ShipyardCapacityState {
  nationId: string;
  dockSize: number; // largest ship buildable
  maxTonnageCapacity: number; // derived from dock size
  currentTonnageUnderConstruction: number;
  isOverloaded: boolean;
  overloadRatio: number; // current / max
}

export const isOverloaded = (state: ShipyardCapacityState) =>
  state.currentTonnageUnderConstruction > state.maxTonnageCapacity;
export const getDelayRisk = (overloadRatio: number) => Math.max(0, (overloadRatio - 1) * 0.3); // 30% per 100% overload
