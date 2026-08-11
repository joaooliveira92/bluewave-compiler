// content/shipbuilding/treaties.ts - Arms Limitation Treaties
// RTW3: restrict displacement, calibre, total tonnage - may scrap non-compliant ships under construction

export type TreatyStatus = "proposed" | "active" | "violated" | "expired" | "withdrawn";
export type GovernmentCompliance = "strict" | "legalistic" | "cheating" | "openly_defiant"; // varies by government type

export interface Treaty {
  id: string;
  name: string;
  campaignId: string;
  status: TreatyStatus;
  signatoryNationIds: string[];
  startTurnId: string;
  endTurnId?: string | null;
  limits: TreatyLimits;
  complianceByNation: Record<string, GovernmentCompliance>;
}

export interface TreatyLimits {
  maxDisplacement?: number | null; // tons - null = no limit
  maxMainCalibre?: number | null; // inches/mm
  maxTotalTonnage?: number | null; // fleet total
  maxShipsPerType?: Record<string, number> | null;
  notes?: string;
}

export interface TreatyLegalityCheck {
  treatyId: string;
  shipClassDesignId: string;
  nationId: string;
  displacement: number;
  mainCalibre: number;
  isCompliant: boolean;
  violations: string[]; // e.g. "displacement 35000 > limit 30000"
  wouldBeScrappedIfUnderConstruction: boolean;
}

export const TREATY_RULES = {
  displacement: "New ships laid down must not exceed treaty displacement limit",
  calibre: "Main gun calibre must not exceed treaty limit",
  tonnage: "Total fleet tonnage may be capped - excess requires scrapping",
  scrapping: "Incompatible ships under construction may be scrapped on treaty ratification",
  cheating:
    "Government type affects compliance - democracies strict, autocracies may cheat, defiant may openly violate",
} as const;

export const checkTreatyLegality = (
  design: { displacement: number; mainCalibre: number },
  treaty: Treaty,
  compliance: GovernmentCompliance,
): TreatyLegalityCheck => {
  const violations: string[] = [];
  if (treaty.limits.maxDisplacement && design.displacement > treaty.limits.maxDisplacement) {
    violations.push(`displacement ${design.displacement} > limit ${treaty.limits.maxDisplacement}`);
  }
  if (treaty.limits.maxMainCalibre && design.mainCalibre > treaty.limits.maxMainCalibre) {
    violations.push(`calibre ${design.mainCalibre} > limit ${treaty.limits.maxMainCalibre}`);
  }
  // Cheating governments may ignore violations
  const isCompliant =
    compliance === "cheating" || compliance === "openly_defiant" ? true : violations.length === 0;
  return {
    treatyId: treaty.id,
    shipClassDesignId: "",
    nationId: "",
    displacement: design.displacement,
    mainCalibre: design.mainCalibre,
    isCompliant,
    violations: isCompliant ? [] : violations,
    wouldBeScrappedIfUnderConstruction: !isCompliant && treaty.status === "active",
  };
};

export const getComplianceForGovernment = (governmentType: string): GovernmentCompliance => {
  // Simplified - map from nation.governmentType
  if (["fascist", "autocratic"].includes(governmentType)) return "cheating";
  if (["communist"].includes(governmentType)) return "openly_defiant";
  return "strict";
};
