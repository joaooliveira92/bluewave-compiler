import type { CampaignSnapshot, ConstructionProject } from "@bluewave/campaign";
import { SafeInt } from "@bluewave/contracts";
import { constructionProjectIdForCommand } from "@bluewave/campaign-engine";

/**
 * Pure snapshot edits for construction orders: building the queued
 * `ConstructionProject` for a command and adding/removing it from a nation.
 * Kept free of persistence and session concerns so they can be unit-tested and
 * reused by any snapshot writer.
 */

export function constructionProjectFor(
  commandId: string,
  designId: string,
  projectedCost: number,
  month: { month: number; year: number },
): ConstructionProject {
  return {
    id: constructionProjectIdForCommand(commandId),
    type: "ship",
    projectType: "NEW_CONSTRUCTION",
    targetId: designId,
    designVersionId: designId,
    totalWork: SafeInt(projectedCost),
    completedWork: SafeInt.ZERO,
    paidWork: SafeInt.ZERO,
    status: "PLANNED",
    startedAt: `${String(month.year)}-${String(month.month).padStart(2, "0")}`,
  };
}

export function addProjectToNation(
  snapshot: CampaignSnapshot,
  playerSlotId: string,
  project: ConstructionProject,
): CampaignSnapshot {
  const nation = snapshot.nations.get(playerSlotId);
  if (!nation) return snapshot;
  const updatedNations = new Map(snapshot.nations).set(playerSlotId, {
    ...nation,
    constructionProjects: [...nation.constructionProjects, project],
  });
  return { ...snapshot, nations: updatedNations };
}

export function removeProjectForCommand(
  snapshot: CampaignSnapshot,
  playerSlotId: string,
  commandId: string,
): CampaignSnapshot {
  const nation = snapshot.nations.get(playerSlotId);
  if (!nation) return snapshot;
  const projectId = constructionProjectIdForCommand(commandId);
  const updatedNations = new Map(snapshot.nations).set(playerSlotId, {
    ...nation,
    constructionProjects: nation.constructionProjects.filter((project) => project.id !== projectId),
  });
  return { ...snapshot, nations: updatedNations };
}
