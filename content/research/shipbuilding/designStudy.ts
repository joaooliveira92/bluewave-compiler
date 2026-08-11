// content/shipbuilding/designStudy.ts - Priority System 3 - Design Study Lifecycle
// RTW3: 1-4 months, costs money, discount if derived from existing class

export type StudyStatus = "planned" | "in_progress" | "completed" | "cancelled" | "superseded";

export interface ShipDesignStudy {
  id: string;
  campaignId: string;
  nationId: string;
  shipClassDesignId: string;
  baseShipClassDesignId?: string | null; // null = clean sheet, else derived
  startTurnId: string;
  completionTurnId?: string | null;
  remainingMonths: number; // 1-4 typical
  studyStatus: StudyStatus;
  complexityScore: number; // 0-100
  baseCost: number;
  discountPercent: number; // 0-50 if derived and changes modest
  finalCost: number; // base * (1 - discount)
  monthlyCost: number; // final / totalMonths
  completed: boolean;
  notes?: string;
}

export const DESIGN_STUDY_RULES = {
  duration: "1-4 months per manual, complexity + national modifiers",
  cost: "Study costs money before lay down - must be paid",
  discount: "Derived from existing class with modest changes = discount",
  buildableGate:
    "Not buildable until validation=legal AND study=completed unless legacy design at campaign start",
} as const;

export const isBuildable = (
  validationStatus: string,
  study: ShipDesignStudy | null,
  isLegacy: boolean,
): boolean => {
  if (isLegacy) return true;
  if (!study) return false;
  return validationStatus === "legal" && study.studyStatus === "completed";
};

export const createStudy = (params: {
  campaignId: string;
  nationId: string;
  designId: string;
  baseDesignId?: string | null;
  complexity: number;
  baseCost: number;
  discountPercent?: number;
}): ShipDesignStudy => {
  const totalMonths = Math.max(1, Math.min(4, Math.ceil(params.complexity / 25)));
  const discount = params.discountPercent ?? 0;
  const finalCost = Math.round(params.baseCost * (1 - discount / 100));
  return {
    id: `study_${params.designId}`,
    campaignId: params.campaignId,
    nationId: params.nationId,
    shipClassDesignId: params.designId,
    baseShipClassDesignId: params.baseDesignId ?? null,
    startTurnId: "current_turn",
    completionTurnId: null,
    remainingMonths: totalMonths,
    studyStatus: "planned",
    complexityScore: params.complexity,
    baseCost: params.baseCost,
    discountPercent: discount,
    finalCost,
    monthlyCost: Math.round(finalCost / totalMonths),
    completed: false,
  };
};
