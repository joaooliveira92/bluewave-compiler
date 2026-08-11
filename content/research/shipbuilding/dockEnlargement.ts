// content/shipbuilding/dockEnlargement.ts - M7 Dock enlargement and yard capacity
// RTW3: dock size = largest ship buildable + basis for yard capacity

export type DockProjectStatus = "planned" | "in_progress" | "completed" | "cancelled";

export interface DockEnlargementProject {
  id: string;
  campaignId: string;
  nationId: string;
  shipyardId: string;
  fromSize: number;
  toSize: number;
  cost: number;
  monthlyCost: number;
  totalMonths: number; // ~12 months typical
  remainingMonths: number;
  status: DockProjectStatus;
  startTurnId: string;
  completionTurnId?: string | null;
}

export const canBuild = (designDisplacement: number, dockSize: number) =>
  designDisplacement <= dockSize;

export const createDockEnlargement = (params: {
  campaignId: string;
  nationId: string;
  shipyardId: string;
  fromSize: number;
  toSize: number;
  cost?: number;
  months?: number;
}): DockEnlargementProject => {
  const cost = params.cost ?? Math.round((params.toSize - params.fromSize) * 0.5);
  const months = params.months ?? 12;
  return {
    id: `dock_${params.shipyardId}_${Date.now()}`,
    campaignId: params.campaignId,
    nationId: params.nationId,
    shipyardId: params.shipyardId,
    fromSize: params.fromSize,
    toSize: params.toSize,
    cost,
    monthlyCost: Math.round(cost / months),
    totalMonths: months,
    remainingMonths: months,
    status: "planned",
    startTurnId: "current_turn",
  };
};

export const tickDockProject = (p: DockEnlargementProject): DockEnlargementProject => {
  if (p.status !== "in_progress") return p;
  const remaining = Math.max(0, p.remainingMonths - 1);
  return {
    ...p,
    remainingMonths: remaining,
    status: remaining === 0 ? "completed" : "in_progress",
    completionTurnId: remaining === 0 ? "next_turn" : null,
  };
};

// Yard capacity derived from dock size per manual
export const getMaxTonnageCapacity = (dockSize: number) => Math.round(dockSize * 8); // simplified: 8x dock size
export const getCurrentTonnage = (projects: { dockSizeRequired: number; status: string }[]) =>
  projects
    .filter((p) => p.status === "active" || p.status === "accelerated")
    .reduce((sum, p) => sum + p.dockSizeRequired, 0);
