// content/shipbuilding/completion.ts - M4 Complete one ship
// Construction project -> completion event -> commissioned ship

import type { ConstructionCompletionEvent, ConstructionProject } from "./construction.ts";

export interface Ship {
  id: string;
  name: string;
  nationId: string;
  shipClassDesignId: string;
  status: "commissioned" | "fitting_out" | "mothballed";
  campaignTurnId: string;
  projectId: string;
}

export const completeShip = (
  project: ConstructionProject,
  turnId: string,
  shipName: string,
): { event: ConstructionCompletionEvent; ship: Ship; updatedProject: ConstructionProject } => {
  if (project.remainingMonths > 0)
    throw new Error(`Cannot complete - ${project.remainingMonths} months remaining`);
  const shipId = `ship_${project.orderId}`;
  const event: ConstructionCompletionEvent = {
    id: `evt_${project.id}`,
    campaignId: project.campaignId,
    campaignTurnId: turnId,
    projectId: project.id,
    orderId: project.orderId,
    shipId,
    shipName,
    shipClassDesignId: project.shipClassDesignId,
    nationId: project.nationId,
  };
  const ship: Ship = {
    id: shipId,
    name: shipName,
    nationId: project.nationId,
    shipClassDesignId: project.shipClassDesignId,
    status: "commissioned",
    campaignTurnId: turnId,
    projectId: project.id,
  };
  const updatedProject: ConstructionProject = {
    ...project,
    status: "completed",
    completionTurnId: turnId,
    remainingMonths: 0,
  };
  return { event, ship, updatedProject };
};

export const tickMonth = (project: ConstructionProject): ConstructionProject => {
  if (project.status !== "active" && project.status !== "accelerated") return project;
  if (project.isHalted) return project; // halted = no progress, reduced cost handled by processor
  if (project.isDelayedThisMonth) return { ...project, isDelayedThisMonth: false }; // RTW3: delayed = skip cost and progress this month
  const decrement = project.isAccelerated ? 2 : 1; // accelerated = faster
  return { ...project, remainingMonths: Math.max(0, project.remainingMonths - decrement) };
};
