import type {
  CampaignSnapshot,
  ConstructionPlanRecord,
  ConstructionProject,
} from "@bluewave/campaign";
import { SafeInt } from "@bluewave/contracts";
import { constructionProjectIdForCommand } from "@bluewave/campaign-engine";

/**
 * Pure snapshot edits for construction orders: building the queued
 * `ConstructionProject` for a command and adding/removing it from a nation.
 * Kept free of persistence and session concerns so they can be unit-tested and
 * reused by any snapshot writer.
 */

/**
 * The per-package state a new project starts with (ADR-0077), from the design's construction plan: every package with no
 * work done and the yard that builds it. Only when the plan's packages add up to the project's total work, so the project's
 * invariants hold from the start; otherwise the project keeps the single-figure model.
 */
function packagesFor(
  plan: ConstructionPlanRecord | undefined,
  projectedCost: number,
): Pick<ConstructionProject, "packages" | "yardId"> {
  if (plan === undefined) return {};
  const total = plan.packages.reduce((sum, p) => sum + Number(p.totalWork), 0);
  if (total !== projectedCost) return {};
  return {
    packages: plan.packages.map((p) => ({
      id: p.id,
      kind: p.kind,
      line: p.line,
      totalWork: p.totalWork,
      doneWork: SafeInt.ZERO,
      dependsOn: [...p.dependsOn],
    })),
    yardId: plan.yardId,
  };
}

export function constructionProjectFor(
  commandId: string,
  designId: string,
  projectedCost: number,
  month: { month: number; year: number },
  plan?: ConstructionPlanRecord,
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
    ...packagesFor(plan, projectedCost),
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
