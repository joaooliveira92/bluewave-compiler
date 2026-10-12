import type {
  CampaignSnapshot,
  ConstructionProject,
  DesignFamily,
  NationState,
} from "@bluewave/campaign";
import {
  applyCommanderChange,
  ConstructionProjectTransitionError,
  DIVISION_MEMBERSHIP_CHANGE_INELIGIBLE,
  fleetMoveProblem,
  isTerminalConstructionProjectStatus,
  transitionConstructionProject,
  VACANT,
} from "@bluewave/campaign";
import type {
  AssignOfficerCommand,
  BudgetProjectCommand,
  HaltConstructionCommand,
  MoveFleetCommand,
  RelieveOfficerCommand,
  ResumeConstructionCommand,
  SetBudgetAllocationCommand,
  SubmitDesignCommand,
} from "@bluewave/commands";
import {
  compileDesign,
  HULL_TYPE_FOR_SHIP_TYPE,
  type DesignDraft,
  type ShipBuildingContent,
} from "@bluewave/ship-design";
import { SafeInt } from "@bluewave/contracts";
import type { DiagnosticCollector } from "@bluewave/diagnostics";
import { buildDesignVersion, pricingFor } from "./designVersion.js";
import { startDesignStudy, studyExists } from "./designStudies.js";
import { fundConstructionProject } from "./constructionFunding.js";
import {
  constructionResumeTarget,
  type ConstructionResumeTarget,
} from "./constructionHaltResume.js";
import { EventLedger } from "@bluewave/events";
import type { FinancialLedger } from "./financial-ledger.js";
import { budgetChangedEvent, makeLedgerEntry } from "./events.js";

export { applyDivisionCommandMonth } from "./divisionCommands.js";

/**
 * Shared canonical application of a SetResearchPriority command. Used by both
 * the human command_collection path and the AI_PLANNING path so behavior is
 * byte-identical.
 */
export function applySetResearchPriority(
  currentSnapshot: CampaignSnapshot,
  nationId: string,
  fieldPriorities: Record<string, SafeInt>,
  collector: DiagnosticCollector,
): CampaignSnapshot {
  const nation = currentSnapshot["nations"].get(nationId);
  if (!nation) {
    collector.addError("NATION_NOT_FOUND", `Nation ${nationId} not found`, {
      stage: "command_collection",
    });
    return currentSnapshot;
  }
  const updatedNation: NationState = {
    ...nation,
    research: {
      ...nation["research"],
      fieldPriorities,
    },
  };
  const updatedNations = new Map(currentSnapshot["nations"]);
  updatedNations.set(nationId, updatedNation);
  return { ...currentSnapshot, nations: updatedNations };
}

/**
 * Canonical application of AssignOfficer / RelieveOfficer (ADR-0065): sets the
 * division's commander. Re-checks the rules against the snapshot it applies to.
 */
export function applyOfficerCommand(
  currentSnapshot: CampaignSnapshot,
  body: AssignOfficerCommand | RelieveOfficerCommand,
  campaignMonth: string,
  collector: DiagnosticCollector,
): CampaignSnapshot {
  const nation = currentSnapshot["nations"].get(body["nationId"]);
  const idx = nation?.["divisions"].findIndex((d) => d["divisionId"] === body["divisionId"]) ?? -1;
  if (!nation || idx === -1) {
    collector.addError(
      DIVISION_MEMBERSHIP_CHANGE_INELIGIBLE,
      `Division ${body["divisionId"]} not found`,
      { stage: "command_collection" },
    );
    return currentSnapshot;
  }
  let commanderId = VACANT;
  if (body["type"] === "AssignOfficer") {
    const known = (nation["officers"] ?? []).some((o) => o["id"] === body["officerId"]);
    const elsewhere = nation["divisions"].some(
      (d) =>
        d["commanderOfficerId"] === body["officerId"] && d["divisionId"] !== body["divisionId"],
    );
    if (!known || elsewhere) {
      collector.addError(
        "INVALID_COMMAND_PAYLOAD",
        `Officer ${body["officerId"]} cannot be assigned to ${body["divisionId"]}`,
        { stage: "command_collection" },
      );
      return currentSnapshot;
    }
    commanderId = body["officerId"];
  }
  const divisions = [...nation["divisions"]];
  divisions[idx] = applyCommanderChange(divisions[idx]!, commanderId, campaignMonth).division;
  const nations = new Map(currentSnapshot["nations"]);
  nations.set(body["nationId"], { ...nation, divisions });
  return { ...currentSnapshot, nations };
}

/**
 * Canonical application of a MoveFleet command (ADR-0062): the fleet, its ships and
 * any division founded on one of its ships relocate to the destination area. The
 * move is re-checked against the snapshot it applies to, so a stale order is skipped
 * with a diagnostic rather than teleporting a fleet.
 */
export function applyMoveFleet(
  currentSnapshot: CampaignSnapshot,
  body: MoveFleetCommand,
  collector: DiagnosticCollector,
): CampaignSnapshot {
  const problem = fleetMoveProblem(
    currentSnapshot,
    body["nationId"],
    body["fleetId"],
    body["toAreaId"],
  );
  if (problem !== null) {
    collector.addError(problem.code, problem.message, { stage: "command_collection" });
    return currentSnapshot;
  }
  const nation = currentSnapshot["nations"].get(body["nationId"])!;
  const moved = nation["fleets"].find((f) => f["id"] === body["fleetId"])!;
  const movedShipIds = new Set(moved["ships"].map((s) => s["id"]));
  const updatedNation: NationState = {
    ...nation,
    fleets: nation["fleets"].map((fleet) =>
      fleet["id"] === body["fleetId"]
        ? {
            ...fleet,
            locationAreaId: body["toAreaId"],
            ships: fleet["ships"].map((s) => ({ ...s, locationAreaId: body["toAreaId"] })),
          }
        : fleet,
    ),
    divisions: nation["divisions"].map((d) =>
      movedShipIds.has(d["flagshipShipId"]) ? { ...d, locationAreaId: body["toAreaId"] } : d,
    ),
  };
  const updatedNations = new Map(currentSnapshot["nations"]);
  updatedNations.set(body["nationId"], updatedNation);
  return { ...currentSnapshot, nations: updatedNations };
}

/**
 * Canonical application of a SetBudgetAllocation command (ADR-0060): sets the
 * naval appropriation rate and the standing monthly research budget.
 */
export function applySetBudgetAllocation(
  currentSnapshot: CampaignSnapshot,
  body: SetBudgetAllocationCommand,
  collector: DiagnosticCollector,
): CampaignSnapshot {
  const nation = currentSnapshot["nations"].get(body["nationId"]);
  if (!nation) {
    collector.addError("NATION_NOT_FOUND", `Nation ${body["nationId"]} not found`, {
      stage: "command_collection",
    });
    return currentSnapshot;
  }
  const updatedNation: NationState = {
    ...nation,
    navalAppropriationRateBp: body["appropriationRateBp"],
    research: {
      ...nation["research"],
      researchBudget: body["researchBudget"],
      standingResearchBudget: body["researchBudget"],
    },
  };
  const updatedNations = new Map(currentSnapshot["nations"]);
  updatedNations.set(body["nationId"], updatedNation);
  return { ...currentSnapshot, nations: updatedNations };
}

/**
 * Shared canonical application of a budget_project command. Used by both the
 * human command_collection path and the AI_PLANNING path so behavior is
 * byte-identical.
 */
export function applyBudgetProject(
  currentSnapshot: CampaignSnapshot,
  body: BudgetProjectCommand,
  campaignMonth: string,
  turnNumber: SafeInt,
  nextSeq: () => SafeInt,
  financialLedger: FinancialLedger,
  eventLedger: EventLedger,
  collector: DiagnosticCollector,
): CampaignSnapshot {
  const nation = currentSnapshot["nations"].get(body["nationId"]);
  if (!nation) {
    collector.addError("NATION_NOT_FOUND", `Nation ${body["nationId"]} not found`, {
      stage: "command_collection",
    });
    return currentSnapshot;
  }

  const project = nation["constructionProjects"].find((p) => p["id"] === body["projectId"]);
  if (!project) {
    collector.addError("PROJECT_NOT_FOUND", `Project ${body["projectId"]} not found`, {
      stage: "command_collection",
    });
    return currentSnapshot;
  }

  // DESIGN-23 section 7: a halted or delayed project receives exactly zero work and zero ordinary charge, so an explicit
  // budget for one is refused rather than silently spent. A terminal project cannot be funded at all.
  if (isTerminalConstructionProjectStatus(project["status"])) {
    collector.addError(
      "INVALID_DOCKYARD_PROJECT_TRANSITION",
      `Project ${body["projectId"]} is ${project["status"]} and cannot receive work`,
      { stage: "command_collection", entityId: body["projectId"] },
    );
    return currentSnapshot;
  }
  if (project["status"] === "HALTED" || project["status"] === "DELAYED") {
    collector.addError(
      "PROJECT_NOT_ACTIVE",
      `Project ${body["projectId"]} is ${project["status"]} and receives no ordinary work charge`,
      { stage: "command_collection", entityId: body["projectId"] },
    );
    return currentSnapshot;
  }

  if (project["holdUntilMonth"] !== undefined && campaignMonth < project["holdUntilMonth"]) {
    collector.addError(
      "PROJECT_ON_HOLD",
      `Project ${body["projectId"]} is on hold after a revision until ${project["holdUntilMonth"]}`,
      { stage: "command_collection" },
    );
    return currentSnapshot;
  }

  const requested = body["budget"];
  let budget = requested;
  const previousTreasury = nation["treasury"];
  let fundedProject: ConstructionProject | undefined;
  if (project["packages"] !== undefined) {
    // Per-package construction (ADR-0077): only the work the yard can do this month is applied and charged.
    const capacity = currentSnapshot["designs"].get(project["designVersionId"])?.constructionPlan
      ?.capacityUnits;
    const funded = fundConstructionProject(
      project,
      capacity === undefined
        ? undefined
        : Object.fromEntries(Object.entries(capacity).map(([line, v]) => [line, v as number])),
      requested as number,
      campaignMonth,
    );
    if (funded.applied <= 0) {
      collector.addWarning(
        "PROJECT_CAPACITY_EXHAUSTED",
        `Project ${body["projectId"]} could use none of the ${String(requested)} units offered this month: the yard's capacity or the package order leaves nothing to do`,
        { stage: "command_collection", entityId: body["projectId"] },
      );
      return currentSnapshot;
    }
    budget = SafeInt(funded.applied);
    fundedProject = funded.project;
  }
  const newTreasury = SafeInt.sub(previousTreasury, budget);
  const rawNewWork = SafeInt.add(project["completedWork"], budget);
  const clampedWork = rawNewWork > project["totalWork"] ? project["totalWork"] : rawNewWork;

  const updatedNation: NationState = {
    ...nation,
    treasury: newTreasury,
    constructionProjects: nation["constructionProjects"].map((p) =>
      p["id"] !== body["projectId"]
        ? p
        : (fundedProject ?? {
            ...transitionConstructionProject(p, "ACTIVE"),
            completedWork: clampedWork,
            paidWork: SafeInt.add(p["paidWork"], budget),
          }),
    ),
  };
  const updatedNations = new Map(currentSnapshot["nations"]);
  updatedNations.set(body["nationId"], updatedNation);
  const next = { ...currentSnapshot, nations: updatedNations };

  financialLedger.append(
    makeLedgerEntry(
      body["nationId"],
      "command_collection",
      "CONSTRUCTION_BUDGET",
      budget,
      budget,
      previousTreasury,
      newTreasury,
      `Player budget for project ${body["projectId"]}`,
      campaignMonth,
    ),
  );

  eventLedger.append(
    budgetChangedEvent(
      body["nationId"],
      previousTreasury,
      newTreasury,
      SafeInt.mul(budget, SafeInt(-1)),
      `Player budget for project ${body["projectId"]}`,
      nextSeq(),
      campaignMonth,
    ),
  );

  return next;
}

/**
 * Canonical application of a SubmitDesign command (ADR-0066). The design is compiled here, with the ship-building
 * content supplied to the engine, never trusted from the caller. A rejected design leaves the snapshot untouched and
 * records a DESIGN_REJECTED diagnostic naming every blocking finding; an accepted one becomes an immutable
 * CompiledDesignVersion that the existing construction flow can order.
 */
export function applySubmitDesign(
  currentSnapshot: CampaignSnapshot,
  body: SubmitDesignCommand,
  content: ShipBuildingContent | undefined,
  month: string,
  collector: DiagnosticCollector,
): CampaignSnapshot {
  const fail = (code: string, message: string): CampaignSnapshot => {
    collector.addError(code, message, { stage: "command_collection" });
    return currentSnapshot;
  };
  if (!currentSnapshot["nations"].has(body["nationId"]))
    return fail("INVALID_NATION_ID", `Nation ${body["nationId"]} not found`);
  if (
    currentSnapshot["designs"].has(body["designVersionId"]) ||
    studyExists(currentSnapshot, body["designVersionId"])
  )
    return fail("DESIGN_REJECTED", `Design ${body["designVersionId"]} already exists`);
  if (content === undefined)
    return fail(
      "SHIP_BUILDING_CONTENT_MISSING",
      "The engine was not given ship-building content; design not compiled",
    );
  const draft = body["draft"] as DesignDraft;
  const env = content.environmentFor(month);
  const compiled = compileDesign(draft, env.ctx);
  if (!compiled.valid) {
    const blocking = compiled.findings.filter((f) => f.severity === "BLOCKING").map((f) => f.id);
    return fail(
      "DESIGN_REJECTED",
      `Design ${body["designVersionId"]} cannot be built: ${blocking.join(", ")}`,
    );
  }
  // The engine stores the hull type the command names; it must be the one the design's ship type maps to, or a
  // caller could file a corvette as a battleship (ADR-0088). Authored legacy labels stay valid for their types.
  const expectedHull = (HULL_TYPE_FOR_SHIP_TYPE as Readonly<Record<string, string | undefined>>)[
    draft.requirement.category
  ];
  if (expectedHull === undefined || body["hullType"] !== expectedHull)
    return fail(
      "DESIGN_REJECTED",
      `Design ${body["designVersionId"]}: hull type '${body["hullType"]}' does not match ship type '${draft.requirement.category}'`,
    );
  const design = buildDesignVersion(
    compiled,
    draft,
    {
      designVersionId: body["designVersionId"],
      designFamilyId: body["designFamilyId"],
      className: body["className"],
      hullType: body["hullType"],
      machineryType: body["machineryType"],
      contentVersion: currentSnapshot["rulesetVersion"],
      kgPerHitPoint: content.kgPerHitPoint,
    },
    pricingFor(content, month),
  );
  // DESIGN-21 section 3: with study rules in the content, the design is approved only when its study is done (ADR-0085).
  if (content.study !== null)
    return startDesignStudy(
      currentSnapshot,
      body["nationId"],
      design,
      { compiled, draft },
      content,
      month,
    );
  const existing = currentSnapshot["designFamilies"].get(body["designFamilyId"]);
  const family: DesignFamily = existing
    ? {
        ...existing,
        memberDesignVersionIds: [...existing.memberDesignVersionIds, design.designVersionId],
      }
    : {
        designFamilyId: body["designFamilyId"],
        nationId: body["nationId"],
        rootDesignVersionId: design.designVersionId,
        memberDesignVersionIds: [design.designVersionId],
        familyCreationMonth: month,
      };
  return {
    ...currentSnapshot,
    designs: new Map([...currentSnapshot["designs"], [design.designVersionId, design]]),
    designFamilies: new Map([
      ...currentSnapshot["designFamilies"],
      [family.designFamilyId, family],
    ]),
  };
}

/** The nation's project, or a diagnostic naming what was missing. */
function dockyardProject(
  currentSnapshot: CampaignSnapshot,
  nationId: string,
  projectId: string,
  collector: DiagnosticCollector,
): { nation: NationState; project: ConstructionProject } | undefined {
  const nation = currentSnapshot["nations"].get(nationId);
  if (!nation) {
    collector.addError("NATION_NOT_FOUND", `Nation ${nationId} not found`, {
      stage: "command_collection",
    });
    return undefined;
  }
  const project = nation["constructionProjects"].find((p) => p["id"] === projectId);
  if (!project) {
    collector.addError("INVALID_DOCKYARD_PROJECT", `Project ${projectId} is not ${nationId}'s`, {
      stage: "command_collection",
      entityId: projectId,
    });
    return undefined;
  }
  return { nation, project };
}

/**
 * Moves a project's status through the shared transition table. The single status write path for halt and resume, so no
 * engine site can invent a state DESIGN-23 section 2 does not allow; an illegal move fails closed with
 * `INVALID_DOCKYARD_PROJECT_TRANSITION` and changes nothing.
 */
function setProjectStatus(
  currentSnapshot: CampaignSnapshot,
  nation: NationState,
  project: ConstructionProject,
  to: ConstructionResumeTarget["status"] | "HALTED",
  collector: DiagnosticCollector,
): CampaignSnapshot {
  let updated: ConstructionProject;
  try {
    updated = transitionConstructionProject(project, to);
  } catch (error) {
    if (error instanceof ConstructionProjectTransitionError) {
      collector.addError("INVALID_DOCKYARD_PROJECT_TRANSITION", error.message, {
        stage: "command_collection",
        entityId: project["id"],
      });
      return currentSnapshot;
    }
    throw error;
  }
  if (updated === project) return currentSnapshot;
  const updatedNation: NationState = {
    ...nation,
    constructionProjects: nation["constructionProjects"].map((p) =>
      p["id"] === project["id"] ? updated : p,
    ),
  };
  const updatedNations = new Map(currentSnapshot["nations"]);
  updatedNations.set(nation["id"], updatedNation);
  return { ...currentSnapshot, nations: updatedNations };
}

/**
 * Canonical application of a `HaltConstruction` command (DESIGN-23 section 7): the project becomes `HALTED`, so it
 * receives no work and no ordinary charge and pays the preservation cost until it is resumed. A halt of an already
 * halted project is a no-op.
 */
export function applyHaltConstruction(
  currentSnapshot: CampaignSnapshot,
  body: HaltConstructionCommand,
  collector: DiagnosticCollector,
): CampaignSnapshot {
  const found = dockyardProject(currentSnapshot, body["nationId"], body["projectId"], collector);
  if (found === undefined) return currentSnapshot;
  return setProjectStatus(currentSnapshot, found.nation, found.project, "HALTED", collector);
}

/**
 * Canonical application of a `ResumeConstruction` command (DESIGN-23 section 7): the project returns to `ACTIVE`, or to
 * `AWAITING_CAPACITY` when the design records no usable construction capacity. The chosen reason is recorded as an info
 * diagnostic, so a resume is never silent.
 */
export function applyResumeConstruction(
  currentSnapshot: CampaignSnapshot,
  body: ResumeConstructionCommand,
  collector: DiagnosticCollector,
): CampaignSnapshot {
  const found = dockyardProject(currentSnapshot, body["nationId"], body["projectId"], collector);
  if (found === undefined) return currentSnapshot;
  const design = currentSnapshot["designs"].get(found.project["designVersionId"]);
  const target = constructionResumeTarget(design);
  const next = setProjectStatus(
    currentSnapshot,
    found.nation,
    found.project,
    target.status,
    collector,
  );
  if (next !== currentSnapshot)
    collector.addInfo(target.reason, `Project ${body["projectId"]} resumed as ${target.status}`, {
      stage: "command_collection",
      entityId: body["projectId"],
    });
  return next;
}
