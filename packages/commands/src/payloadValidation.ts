import type { CampaignSnapshot } from "@bluewave/campaign";
import {
  APPROPRIATION_RATE_MAX_BP,
  APPROPRIATION_RATE_MIN_BP,
  RESEARCH_BUDGET_MAX,
  RESEARCH_BUDGET_MIN,
  fleetMoveProblem,
  isShipOperational,
} from "@bluewave/campaign";
import {
  CANONICAL_RESEARCH_FIELD_IDS,
  MAX_HIGH_PRIORITY_FIELDS,
  RESEARCH_FIELD_PRIORITY_WEIGHTS,
} from "@bluewave/content-schema";
import { validateDraftShape } from "@bluewave/ship-design";
import {
  validateAcceptPeace,
  validateBreakAlliance,
  validateBreakNap,
  validateDeclareBlockade,
  validateDeclareWar,
  validateFormAlliance,
  validateFormNap,
} from "./diplomacyValidation.js";
import {
  validateAddShipToDivision,
  validateAssignOfficer,
  validateChangeDivisionFlagship,
  validateCreateDivision,
  validateDissolveDivision,
  validateRelieveOfficer,
  validateRemoveShipFromDivision,
} from "./divisionValidation.js";
import type { BudgetProjectCommand, CommandBody, CommandEnvelope } from "./envelope.js";
import type { LifecycleStepResult } from "./types.js";
import { rejectValidation } from "./validation.js";

/**
 * Issue-time payload rules for every command type, dispatched on `body.type`.
 * Envelope-level checks (version, expected snapshot hash) stay in
 * `CommandLifecycle.validate`; this function owns the per-command rules only.
 */
export function validatePayloadRules(
  envelope: CommandEnvelope<CommandBody>,
  snapshot: CampaignSnapshot,
): LifecycleStepResult {
  if (envelope.body.type === "SetResearchPriority")
    return validateSetResearchPriority(envelope, snapshot);
  if (envelope.body.type === "SetBudgetAllocation")
    return validateSetBudgetAllocation(envelope, snapshot);
  if (envelope.body.type === "AssignOfficer") return validateAssignOfficer(envelope, snapshot);
  if (envelope.body.type === "RelieveOfficer") return validateRelieveOfficer(envelope, snapshot);
  if (envelope.body.type === "SubmitDesign") return validateSubmitDesign(envelope, snapshot);
  if (envelope.body.type === "ReviseProject") return validateReviseProject(envelope, snapshot);
  if (envelope.body.type === "StartRebuild") return validateStartRebuild(envelope, snapshot);
  if (envelope.body.type === "MoveFleet") {
    const move = envelope.body;
    const problem = fleetMoveProblem(snapshot, move.nationId, move.fleetId, move.toAreaId);
    return problem === null
      ? { ok: true }
      : rejectValidation(envelope, snapshot, problem.code, problem.message);
  }
  if (envelope.body.type === "DeclareWar") return validateDeclareWar(envelope, snapshot);
  if (envelope.body.type === "AcceptPeace") return validateAcceptPeace(envelope, snapshot);
  if (envelope.body.type === "FormAlliance") return validateFormAlliance(envelope, snapshot);
  if (envelope.body.type === "BreakAlliance") return validateBreakAlliance(envelope, snapshot);
  if (envelope.body.type === "FormNonAggressionPact") return validateFormNap(envelope, snapshot);
  if (envelope.body.type === "BreakNonAggressionPact") return validateBreakNap(envelope, snapshot);
  if (envelope.body.type === "DeclareBlockade") return validateDeclareBlockade(envelope, snapshot);
  if (envelope.body.type === "CreateDivision") return validateCreateDivision(envelope, snapshot);
  if (envelope.body.type === "AddShipToDivision")
    return validateAddShipToDivision(envelope, snapshot);
  if (envelope.body.type === "RemoveShipFromDivision")
    return validateRemoveShipFromDivision(envelope, snapshot);
  if (envelope.body.type === "DissolveDivision")
    return validateDissolveDivision(envelope, snapshot);
  if (envelope.body.type === "ChangeDivisionFlagship")
    return validateChangeDivisionFlagship(envelope, snapshot);
  if (envelope.body.type !== "budget_project") {
    return rejectValidation(
      envelope,
      snapshot,
      "UNKNOWN_COMMAND_TYPE",
      `Unknown command type: ${String((envelope.body as CommandBody).type)}`,
    );
  }
  const body = envelope.body as BudgetProjectCommand;
  if (typeof body.nationId !== "string" || body.nationId.length === 0)
    return rejectValidation(
      envelope,
      snapshot,
      "INVALID_NATION_ID",
      "nationId must be a non-empty string",
    );
  if (typeof body.projectId !== "string" || body.projectId.length === 0)
    return rejectValidation(
      envelope,
      snapshot,
      "INVALID_PROJECT_ID",
      "projectId must be a non-empty string",
    );
  return { ok: true };
}

function validateSetResearchPriority(
  envelope: CommandEnvelope<CommandBody>,
  snapshot: CampaignSnapshot,
): LifecycleStepResult {
  const body = envelope.body as Extract<CommandBody, { type: "SetResearchPriority" }>;
  if (typeof body.nationId !== "string" || body.nationId.length === 0)
    return rejectValidation(
      envelope,
      snapshot,
      "INVALID_NATION_ID",
      "nationId must be a non-empty string",
    );
  if (body.exactTechId !== undefined && typeof body.exactTechId === "string") {
    return rejectValidation(
      envelope,
      snapshot,
      "EXACT_TECHNOLOGY_SELECTION_PROHIBITED",
      `Exact technology selection is prohibited: ${body.exactTechId}`,
    );
  }
  const priorities = body.fieldPriorities ?? {};
  const missingFields = CANONICAL_RESEARCH_FIELD_IDS.filter((f) => priorities[f] === undefined);
  const validWeights = new Set<number>([
    RESEARCH_FIELD_PRIORITY_WEIGHTS.HIGH,
    RESEARCH_FIELD_PRIORITY_WEIGHTS.MEDIUM,
    RESEARCH_FIELD_PRIORITY_WEIGHTS.LOW,
  ]);
  const invalidWeightFields = CANONICAL_RESEARCH_FIELD_IDS.filter(
    (f) => priorities[f] !== undefined && !validWeights.has(priorities[f] as number),
  );
  const highCount = CANONICAL_RESEARCH_FIELD_IDS.filter(
    (f) => priorities[f] === RESEARCH_FIELD_PRIORITY_WEIGHTS.HIGH,
  ).length;
  if (
    missingFields.length > 0 ||
    invalidWeightFields.length > 0 ||
    highCount < 1 ||
    highCount > MAX_HIGH_PRIORITY_FIELDS
  ) {
    return rejectValidation(
      envelope,
      snapshot,
      "RESEARCH_PRIORITY_CONSTRAINT_VIOLATED",
      `Invalid field priorities: missing=${missingFields.join(",")} invalidWeight=${invalidWeightFields.join(",")} highCount=${String(highCount)}`,
    );
  }
  return { ok: true };
}

function validateSetBudgetAllocation(
  envelope: CommandEnvelope<CommandBody>,
  snapshot: CampaignSnapshot,
): LifecycleStepResult {
  const body = envelope.body as Extract<CommandBody, { type: "SetBudgetAllocation" }>;
  const reject = (code: string, message: string): LifecycleStepResult =>
    rejectValidation(envelope, snapshot, code, message);
  if (typeof body.nationId !== "string" || body.nationId.length === 0)
    return reject("INVALID_NATION_ID", "nationId must be a non-empty string");
  if (!snapshot.nations.has(body.nationId))
    return reject("INVALID_NATION_ID", `Nation ${body.nationId} not found`);
  const rate = body.appropriationRateBp as number;
  if (
    !Number.isSafeInteger(rate) ||
    rate < APPROPRIATION_RATE_MIN_BP ||
    rate > APPROPRIATION_RATE_MAX_BP
  )
    return reject(
      "INVALID_COMMAND_PAYLOAD",
      `appropriationRateBp must be an integer in ${String(APPROPRIATION_RATE_MIN_BP)}..${String(APPROPRIATION_RATE_MAX_BP)}`,
    );
  const research = body.researchBudget as number;
  if (
    !Number.isSafeInteger(research) ||
    research < RESEARCH_BUDGET_MIN ||
    research > RESEARCH_BUDGET_MAX
  )
    return reject(
      "INVALID_COMMAND_PAYLOAD",
      `researchBudget must be an integer in ${String(RESEARCH_BUDGET_MIN)}..${String(RESEARCH_BUDGET_MAX)}`,
    );
  return { ok: true };
}

function validateStartRebuild(
  envelope: CommandEnvelope<CommandBody>,
  snapshot: CampaignSnapshot,
): LifecycleStepResult {
  const body = envelope.body as Extract<CommandBody, { type: "StartRebuild" }>;
  const reject = (code: string, message: string) =>
    rejectValidation(envelope, snapshot, code, message);
  const nation = snapshot.nations.get(body.nationId);
  if (!nation) return reject("INVALID_NATION_ID", `Nation ${body.nationId} not found`);
  const ship = nation.fleets.flatMap((f) => f.ships).find((s) => s.id === body.shipId);
  if (!ship)
    return reject("INVALID_COMMAND_PAYLOAD", `Ship ${body.shipId} is not ${body.nationId}'s`);
  if (!isShipOperational(ship))
    return reject(
      "SHIP_NOT_OPERATIONAL",
      `Ship ${body.shipId} is under construction or already unavailable and cannot be rebuilt`,
    );
  if (ship.inBattleId !== undefined)
    return reject(
      "INVALID_COMMAND_PAYLOAD",
      `Ship ${body.shipId} is in a battle and cannot be rebuilt`,
    );
  for (const [label, id] of [
    ["Design", body.newDesignVersionId],
    ["Project", body.projectId],
  ] as const)
    if (!/^[a-z][a-z0-9_-]{1,63}$/.test(id))
      return reject(
        "INVALID_COMMAND_PAYLOAD",
        `${label} id must be lower snake_case (2-64 characters)`,
      );
  if (snapshot.designs.has(body.newDesignVersionId))
    return reject("INVALID_COMMAND_PAYLOAD", `Design ${body.newDesignVersionId} already exists`);
  if (nation.constructionProjects.some((p) => p.id === body.projectId))
    return reject("INVALID_COMMAND_PAYLOAD", `Project ${body.projectId} already exists`);
  if (snapshot.designs.get(ship.designVersionId)?.sourceDraft === undefined)
    return reject(
      "INVALID_COMMAND_PAYLOAD",
      `Ship ${body.shipId} was built from an authored design with no source draft and cannot be rebuilt`,
    );
  const problems = validateDraftShape(body.draft);
  if (problems.length > 0)
    return reject("INVALID_COMMAND_PAYLOAD", `Design draft is malformed: ${problems.join("; ")}`);
  if ((body.draft as { nationId?: unknown }).nationId !== body.nationId)
    return reject("INVALID_COMMAND_PAYLOAD", "The draft belongs to a different nation");
  return { ok: true };
}

function validateReviseProject(
  envelope: CommandEnvelope<CommandBody>,
  snapshot: CampaignSnapshot,
): LifecycleStepResult {
  const body = envelope.body as Extract<CommandBody, { type: "ReviseProject" }>;
  const nation = snapshot.nations.get(body.nationId);
  if (!nation)
    return rejectValidation(
      envelope,
      snapshot,
      "INVALID_NATION_ID",
      `Nation ${body.nationId} not found`,
    );
  const project = nation.constructionProjects.find((p) => p.id === body.projectId);
  if (!project)
    return rejectValidation(
      envelope,
      snapshot,
      "INVALID_COMMAND_PAYLOAD",
      `Project ${body.projectId} not found`,
    );
  if (project.status === "COMPLETED")
    return rejectValidation(
      envelope,
      snapshot,
      "INVALID_COMMAND_PAYLOAD",
      `Project ${body.projectId} is complete and cannot be revised`,
    );
  if (!/^[a-z][a-z0-9_]{1,63}$/.test(body.newDesignVersionId))
    return rejectValidation(
      envelope,
      snapshot,
      "INVALID_COMMAND_PAYLOAD",
      "Design id must be lower snake_case (2-64 characters)",
    );
  if (snapshot.designs.has(body.newDesignVersionId))
    return rejectValidation(
      envelope,
      snapshot,
      "INVALID_COMMAND_PAYLOAD",
      `Design ${body.newDesignVersionId} already exists`,
    );
  if (snapshot.designs.get(project.designVersionId)?.sourceDraft === undefined)
    return rejectValidation(
      envelope,
      snapshot,
      "INVALID_COMMAND_PAYLOAD",
      `Project ${body.projectId} was built from an authored design with no source draft and cannot be revised`,
    );
  const problems = validateDraftShape(body.draft);
  if (problems.length > 0)
    return rejectValidation(
      envelope,
      snapshot,
      "INVALID_COMMAND_PAYLOAD",
      `Design draft is malformed: ${problems.join("; ")}`,
    );
  if ((body.draft as { nationId?: unknown }).nationId !== body.nationId)
    return rejectValidation(
      envelope,
      snapshot,
      "INVALID_COMMAND_PAYLOAD",
      "The draft belongs to a different nation",
    );
  return { ok: true };
}

function validateSubmitDesign(
  envelope: CommandEnvelope<CommandBody>,
  snapshot: CampaignSnapshot,
): LifecycleStepResult {
  const body = envelope.body as Extract<CommandBody, { type: "SubmitDesign" }>;
  if (!snapshot.nations.has(body.nationId))
    return rejectValidation(
      envelope,
      snapshot,
      "INVALID_NATION_ID",
      `Nation ${body.nationId} not found`,
    );
  const idPattern = /^[a-z][a-z0-9_]{1,63}$/;
  if (!idPattern.test(body.designVersionId) || !idPattern.test(body.designFamilyId))
    return rejectValidation(
      envelope,
      snapshot,
      "INVALID_COMMAND_PAYLOAD",
      "Design and family ids must be lower snake_case (2-64 characters)",
    );
  if (
    body.className.trim() === "" ||
    body.hullType.trim() === "" ||
    body.machineryType.trim() === ""
  )
    return rejectValidation(
      envelope,
      snapshot,
      "INVALID_COMMAND_PAYLOAD",
      "className, hullType and machineryType are required",
    );
  if (snapshot.designs.has(body.designVersionId))
    return rejectValidation(
      envelope,
      snapshot,
      "INVALID_COMMAND_PAYLOAD",
      `Design ${body.designVersionId} already exists`,
    );
  const problems = validateDraftShape(body.draft);
  if (problems.length > 0)
    return rejectValidation(
      envelope,
      snapshot,
      "INVALID_COMMAND_PAYLOAD",
      `Design draft is malformed: ${problems.join("; ")}`,
    );
  if ((body.draft as { nationId?: unknown }).nationId !== body.nationId)
    return rejectValidation(
      envelope,
      snapshot,
      "INVALID_COMMAND_PAYLOAD",
      "The draft belongs to a different nation",
    );
  return { ok: true };
}
