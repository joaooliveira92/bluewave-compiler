import type {
  CampaignSnapshot,
  CompiledDesignVersion,
  ConstructionPlanRecord,
  ConstructionProject,
} from "@bluewave/campaign";
import {
  constructionProjectIdForCommand,
  projectedConstructionOrderCosts,
  type ConstructionOrderCosts,
} from "@bluewave/campaign-engine";
import { SafeInt } from "@bluewave/contracts";
import { resolveNationalConstruction, type ShipBuildingContent } from "@bluewave/ship-design";
import { constructionOrderEligibility } from "./orderEligibility.js";

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

/** The queued new-construction project an order for `designId` starts as. Pure. */
export function constructionProjectFor(
  commandId: string,
  designId: string,
  projectedCost: number,
  month: { month: number; year: number },
  plan?: ConstructionPlanRecord,
  national?: { profileId: string; costMultiplierBp: number; buildTimeMultiplierBp: number },
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
    ...(national !== undefined
      ? {
          nationalProfileId: national.profileId,
          costMultiplierBp: national.costMultiplierBp,
          buildTimeMultiplierBp: national.buildTimeMultiplierBp,
        }
      : {}),
  };
}

export interface ConstructionOrderRequest {
  readonly nationId: string;
  readonly commandId: string;
  readonly designVersionId: string;
  readonly month: { readonly month: number; readonly year: number };
  /** The in-flight order this one replaces: its project leaves in the same step and does not count against limits. */
  readonly replacingCommandId?: string;
}

export type ConstructionOrderResult =
  | {
      readonly ok: true;
      readonly snapshot: CampaignSnapshot;
      readonly project: ConstructionProject;
      readonly design: CompiledDesignVersion;
      readonly costs: ConstructionOrderCosts;
    }
  | {
      readonly ok: false;
      /** Stable reason code: `NATION_NOT_FOUND`, `UNKNOWN_DESIGN`, `DESIGN_NOT_FOR_PLAYER` or an order rejection code. */
      readonly reason: string;
      readonly diagnostics: readonly string[];
    };

/**
 * The one way a construction project for a new ship enters a snapshot (ADR-0088). It checks that the design exists and
 * belongs to the nation, then the order eligibility policy (revalidation under today's rules, auxiliary fleet limits),
 * and only then returns the snapshot with the project. Platform-independent: a caller (the desktop main process, a
 * test, a future AI planner) cannot add a project without passing these checks.
 */
export function placeConstructionOrder(
  snapshot: CampaignSnapshot,
  request: ConstructionOrderRequest,
  content: ShipBuildingContent | undefined,
): ConstructionOrderResult {
  const nation = snapshot["nations"].get(request.nationId);
  if (!nation)
    return {
      ok: false,
      reason: "NATION_NOT_FOUND",
      diagnostics: [`Nation ${request.nationId} not found`],
    };
  const design = snapshot["designs"].get(request.designVersionId);
  if (!design)
    return {
      ok: false,
      reason: "UNKNOWN_DESIGN",
      diagnostics: [`No design ${request.designVersionId} in the compiled snapshot`],
    };
  if (design["nationId"] !== request.nationId)
    return {
      ok: false,
      reason: "DESIGN_NOT_FOR_PLAYER",
      diagnostics: [
        `Design ${request.designVersionId} belongs to ${design["nationId"]}, not player slot ${request.nationId}`,
      ],
    };
  const replacingProjectId =
    request.replacingCommandId === undefined
      ? undefined
      : constructionProjectIdForCommand(request.replacingCommandId);
  const monthId = `${String(request.month.year)}-${String(request.month.month).padStart(2, "0")}`;
  const eligibility = constructionOrderEligibility(
    snapshot,
    design,
    content,
    monthId,
    replacingProjectId,
  );
  if (!eligibility.eligible) {
    return {
      ok: false,
      reason: eligibility.rejections[0]!.code,
      diagnostics: eligibility.rejections.map((r) => r.message),
    };
  }
  const costs = (() => {
    // Resolve the nation's construction economics at order time (ADR-0090): cost/build-time multipliers are applied
    // once here and persisted on the project, so a later profile-content change never re-prices an existing order.
    const profile = content?.navalProfileFor(request.nationId, monthId) ?? null;
    if (profile === null)
      return { costs: projectedConstructionOrderCosts(design), national: undefined };
    let modifiers;
    try {
      modifiers = resolveNationalConstruction(profile, monthId);
    } catch {
      return null; // fail closed: the nation cannot obtain its main armament or armour under the current policy
    }
    return {
      costs: projectedConstructionOrderCosts(design, modifiers.costMultiplierBp),
      national: {
        profileId: profile.nationId,
        costMultiplierBp: modifiers.costMultiplierBp,
        buildTimeMultiplierBp: modifiers.buildTimeMultiplierBp,
      },
    };
  })();
  if (costs === null)
    return {
      ok: false,
      reason: "NATIONAL_SUPPLY_UNAVAILABLE",
      diagnostics: [`Nation ${request.nationId} cannot obtain its main armament or armour plate`],
    };
  const project = {
    ...constructionProjectFor(
      request.commandId,
      request.designVersionId,
      costs.costs.projectedCost,
      request.month,
      design["constructionPlan"],
      costs.national,
    ),
    // Persist the reservation the eligibility check computed, so the concurrency cap (SB3-R18) is enforced against
    // the order-time value even if content later changes.
    ...(eligibility.newConstructionReservedMassKg !== undefined
      ? { newConstructionReservedMassKg: eligibility.newConstructionReservedMassKg }
      : {}),
  };
  const kept = nation["constructionProjects"].filter((p) => p["id"] !== replacingProjectId);
  const nations = new Map(snapshot["nations"]).set(request.nationId, {
    ...nation,
    constructionProjects: [...kept, project],
  });
  return { ok: true, snapshot: { ...snapshot, nations }, project, design, costs: costs.costs };
}
