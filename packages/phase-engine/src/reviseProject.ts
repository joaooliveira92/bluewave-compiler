import type { CampaignSnapshot, ConstructionProject, NationState } from "@bluewave/campaign";
import { projectedConstructionOrderCosts } from "@bluewave/campaign-engine";
import type { ReviseProjectCommand } from "@bluewave/commands";
import { SafeInt } from "@bluewave/contracts";
import type { DiagnosticCollector } from "@bluewave/diagnostics";
import {
  classifyRevision,
  compileDesign,
  draftChangeKinds,
  progressFromWork,
  type DesignDraft,
  type ShipBuildingContent,
} from "@bluewave/ship-design";
import { buildDesignVersion } from "./designVersion.js";

/**
 * Canonical application of a ReviseProject command (ADR-0070). The new draft is compiled authoritatively, the change is
 * classified against the project's work with the spec 15.4 rules, and the outcome is applied:
 *
 * - free change (T0): the project switches to the new design; work done is kept.
 * - revision (T1): as T0, plus rework added to the work still owed.
 * - redesign (T2): as T0, but completed work shrinks to the share the rules keep.
 * - reconstruction (T3): refused (REVISION_REQUIRES_REBUILD); it needs a rebuild project, which does not exist yet.
 *
 * Not modelled (recorded in the ADR, not guessed): the T1/T2 delay in months (projects have no schedule), the T2 study
 * cost (design studies are not built), and armour/machinery-ordered or launched state (the engine does not track them).
 * A rejected revision leaves the snapshot untouched.
 */
export function applyReviseProject(
  currentSnapshot: CampaignSnapshot,
  body: ReviseProjectCommand,
  content: ShipBuildingContent | undefined,
  month: string,
  collector: DiagnosticCollector,
): CampaignSnapshot {
  const fail = (code: string, message: string): CampaignSnapshot => {
    collector.addError(code, message, { stage: "command_collection" });
    return currentSnapshot;
  };
  const nation = currentSnapshot.nations.get(body.nationId);
  if (!nation) return fail("INVALID_NATION_ID", `Nation ${body.nationId} not found`);
  const project = nation.constructionProjects.find((p) => p.id === body.projectId);
  if (!project) return fail("PROJECT_NOT_FOUND", `Project ${body.projectId} not found`);
  if (project.status === "COMPLETED")
    return fail("REVISION_REJECTED", `Project ${project.id} is complete`);
  if (currentSnapshot.designs.has(body.newDesignVersionId))
    return fail("REVISION_REJECTED", `Design ${body.newDesignVersionId} already exists`);
  const oldDesign = currentSnapshot.designs.get(project.designVersionId);
  const oldDraft = oldDesign?.sourceDraft as DesignDraft | undefined;
  if (oldDesign === undefined || oldDraft === undefined)
    return fail(
      "REVISION_REJECTED",
      `Project ${project.id} has no source draft (authored design); it cannot be revised`,
    );
  if (content === undefined)
    return fail(
      "SHIP_BUILDING_CONTENT_MISSING",
      "The engine was not given ship-building content; revision not compiled",
    );
  if (content.revision === null)
    return fail("REVISION_RULES_MISSING", "The ship-building content has no revision rules");

  const draft = body.draft as DesignDraft;
  const compiled = compileDesign(draft, content.environmentFor(month).ctx);
  if (!compiled.valid) {
    const blocking = compiled.findings.filter((f) => f.severity === "BLOCKING").map((f) => f.id);
    return fail(
      "REVISION_REJECTED",
      `Revised design ${body.newDesignVersionId} cannot be built: ${blocking.join(", ")}`,
    );
  }
  const categories = new Map(content.components.map((c) => [c.id, c.category]));
  const kinds = draftChangeKinds(oldDraft, draft, (id) => categories.get(id));
  if (kinds.length === 0) return fail("REVISION_REJECTED", "The revision changes nothing");

  const decision = classifyRevision(
    kinds,
    progressFromWork(Number(project.completedWork), Number(project.totalWork)),
    content.revision,
  );
  if (decision.requiresRebuildProject)
    return fail(
      "REVISION_REQUIRES_REBUILD",
      `Project ${project.id} is ${(decision.progressBp / 100).toFixed(1)}% built: this change would need a rebuild project (${decision.reasonCodes.join(", ")})`,
    );

  const design = buildDesignVersion(compiled, draft, {
    designVersionId: body.newDesignVersionId,
    designFamilyId: oldDesign.designFamilyId,
    className: oldDesign.className,
    hullType: oldDesign.hullType,
    machineryType: oldDesign.machineryType,
    contentVersion: currentSnapshot.rulesetVersion,
    kgPerHitPoint: content.kgPerHitPoint,
  });
  const newTotal = projectedConstructionOrderCosts(design).projectedCost;
  const total = newTotal + decision.reworkWorkMicro;
  const kept =
    decision.tier === "T2_REDESIGN" ? decision.hullDoneWorkAfter : Number(project.completedWork);
  const revised: ConstructionProject = {
    ...project,
    designVersionId: design.designVersionId,
    totalWork: SafeInt(total),
    completedWork: SafeInt(Math.min(kept, total)),
  };
  const updatedNation: NationState = {
    ...nation,
    constructionProjects: nation.constructionProjects.map((p) =>
      p.id === project.id ? revised : p,
    ),
  };
  const family = currentSnapshot.designFamilies.get(oldDesign.designFamilyId);
  return {
    ...currentSnapshot,
    nations: new Map([...currentSnapshot.nations, [body.nationId, updatedNation]]),
    designs: new Map([...currentSnapshot.designs, [design.designVersionId, design]]),
    designFamilies: family
      ? new Map([
          ...currentSnapshot.designFamilies,
          [
            family.designFamilyId,
            {
              ...family,
              memberDesignVersionIds: [...family.memberDesignVersionIds, design.designVersionId],
            },
          ],
        ])
      : currentSnapshot.designFamilies,
  };
}
