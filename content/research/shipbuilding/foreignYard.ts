// content/shipbuilding/foreignYard.ts - Foreign Yard Processor
// RTW3: uses builder dock size, impoundment on war, tech insight

export interface ForeignYardContract {
  id: string;
  campaignId: string;
  buyerNationId: string;
  builderNationId: string;
  shipClassDesignId: string;
  projectId: string;
  status: "active" | "impounded" | "completed" | "cancelled";
  builderDockSize: number;
  builderTechAdvantage?: string | null;
  foreignConstructionModifier: number; // cost/time modifier
  impoundmentRisk: number; // 0-1 per turn based on tension/war
  techInsightChance: number; // 0-1 on completion
}

export const FOREIGN_YARD_RULES = {
  dockSize: "Validate builder nation dock size, not buyer",
  techAdvantage:
    "May bypass domestic tech/industrial limits, but not type/treaty/displacement legality vs builder yard",
  impoundment:
    "Risk impoundment if war breaks out with builder - check diplomatic/tension each turn",
  insight: "May grant insight into builder nation's technology on completion",
  transfer: "Transfer ship to buyer on completion",
} as const;

export const rollImpoundment = (
  contract: ForeignYardContract,
  isAtWar: boolean,
  tension: number,
): boolean => {
  if (!isAtWar && tension < 70) return false;
  return Math.random() < contract.impoundmentRisk;
};

export const rollTechInsight = (contract: ForeignYardContract): boolean =>
  Math.random() < contract.techInsightChance;
