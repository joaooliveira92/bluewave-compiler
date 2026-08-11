// content/shipbuilding/calculator.ts - Priority System 3 - Cost/Weight/Build-Time Engine
// Behavioral shape > exact RTW3 math

export interface WeightBreakdown {
  hullWeight: number;
  machineryWeight: number;
  armorWeight: number;
  mainArmamentWeight: number;
  secondaryArmamentWeight: number;
  tertiaryArmamentWeight: number;
  torpedoWeight: number;
  fireControlWeight: number;
  aircraftFacilityWeight: number;
  featureWeight: number;
  miscWeight: number;
  totalWeight: number;
  designDisplacement: number;
  remainingDisplacement: number; // design - total
}

export interface CostBreakdown {
  baseHullCost: number;
  componentCosts: number;
  technologyModifiers: number;
  nationalModifiers: number;
  totalCost: number;
  monthlyCost: number; // total / buildTime
}

export interface BuildTimeBreakdown {
  baseTypeTime: number; // by archetype
  displacementFactor: number;
  complexityFactor: number;
  nationalModifiers: number; // efficient = - , undeveloped = +
  totalMonths: number;
}

export interface CalculationInput {
  designDisplacement: number;
  speed: number;
  armor: Record<string, number>;
  mainGuns: { calibre: number; count: number }[];
  features: string[];
  nationId: string;
  shipyardCapacityLoad?: number; // 0-1
}

export interface CalculationOutput {
  weight: WeightBreakdown;
  cost: CostBreakdown;
  buildTime: BuildTimeBreakdown;
  isOverweight: boolean;
  overweightAmount: number;
}

// National traits affect time/reliability per manual
export const NATIONAL_SHIPBUILDING_TRAITS = {
  efficient: {
    timeModifier: -0.15,
    faultRisk: -0.1,
    note: "Efficient shipbuilding - faster, fewer faults",
  },
  standard: { timeModifier: 0, faultRisk: 0, note: "Standard" },
  undeveloped: {
    timeModifier: 0.25,
    faultRisk: 0.2,
    note: "Undeveloped - slower, higher fault risk",
  },
} as const;

export const calculateWeight = (input: CalculationInput): WeightBreakdown => {
  // Deterministic stub - replace with real component weights
  const totalWeight = 0; // sum all components
  return {
    hullWeight: 0,
    machineryWeight: 0,
    armorWeight: 0,
    mainArmamentWeight: 0,
    secondaryArmamentWeight: 0,
    tertiaryArmamentWeight: 0,
    torpedoWeight: 0,
    fireControlWeight: 0,
    aircraftFacilityWeight: 0,
    featureWeight: 0,
    miscWeight: 0,
    totalWeight,
    designDisplacement: input.designDisplacement,
    remainingDisplacement: input.designDisplacement - totalWeight,
  };
};
