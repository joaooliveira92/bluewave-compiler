import type { CampaignSlot, CampaignSnapshot } from "@bluewave/campaign";
import {
  fleetMoveProblem,
  APPROPRIATION_RATE_MAX_BP,
  APPROPRIATION_RATE_MIN_BP,
  RESEARCH_BUDGET_MAX,
  RESEARCH_BUDGET_MIN,
  DIVISION_FORMATIONS,
  DIVISION_MAX_SHIPS,
  DIVISION_ROLES,
  MAXIMUM_CONCURRENT_WARS,
} from "@bluewave/campaign";
import {
  CANONICAL_RESEARCH_FIELD_IDS,
  MAX_HIGH_PRIORITY_FIELDS,
  RESEARCH_FIELD_PRIORITY_WEIGHTS,
} from "@bluewave/content-schema";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import type { Diagnostic, DiagnosticCode } from "@bluewave/diagnostics";
import { AuditChain } from "./audit.js";
import { hashCommandRecord } from "./canonicalization.js";
import type {
  AcceptPeaceCommand,
  AddShipToDivisionCommand,
  BreakAllianceCommand,
  BreakNonAggressionPactCommand,
  BudgetProjectCommand,
  ChangeDivisionFlagshipCommand,
  CommandBody,
  CommandEnvelope,
  CreateDivisionCommand,
  DeclareBlockadeCommand,
  DeclareWarCommand,
  DissolveDivisionCommand,
  FormAllianceCommand,
  FormNonAggressionPactCommand,
  RemoveShipFromDivisionCommand,
} from "./envelope.js";
import type {
  CommandRecord,
  CommandResult,
  CommandStatus,
  CommandStatusTransitionRecord,
  CommandTypeDefinition,
} from "./types.js";
import { TERMINAL_STATUSES } from "./types.js";

// --- Permitted transitions per §5 ---
export const PERMITTED_TRANSITIONS: Record<CommandStatus, CommandStatus[]> = {
  SUBMITTED: ["VALIDATED", "REJECTED", "CANCELLED"],
  VALIDATED: ["AUTHORIZED", "REJECTED", "CANCELLED"],
  AUTHORIZED: ["RESERVED", "ACCEPTED", "REJECTED", "CANCELLED"],
  RESERVED: ["ACCEPTED", "REJECTED", "CANCELLED"],
  ACCEPTED: ["LOCKED", "CANCELLED", "SUPERSEDED"],
  LOCKED: ["RESOLVING", "SUPERSEDED"],
  RESOLVING: ["COMPLETED", "PARTIALLY_COMPLETED", "REJECTED", "CANCELLED", "SUPERSEDED"],
  COMPLETED: [],
  PARTIALLY_COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
  SUPERSEDED: [],
};

export function canTransition(
  from: CommandStatus,
  to: CommandStatus,
  def?: CommandTypeDefinition,
): boolean {
  const allowed = PERMITTED_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) return false;
  // LOCKED -> SUPERSEDED only when explicitly permitted
  if (from === "LOCKED" && to === "SUPERSEDED") {
    if (!def?.supersessionPolicy || def.supersessionPolicy.lockBoundaryBehavior !== "ALLOW_LOCKED")
      return false;
  }
  // RESOLVING -> REJECTED only when no effect applied (caller must enforce)
  // RESOLVING -> CANCELLED only before irreversible phase (caller must enforce)
  return true;
}

export function transitionRecord(
  rec: CommandRecord,
  to: CommandStatus,
  phaseId: string,
  actorId: string,
  reasonCode: string,
  previousHash: string,
): CommandStatusTransitionRecord {
  if (!canTransition(rec.status, to)) {
    throw Object.assign(new Error(`INVALID_COMMAND_STATUS_TRANSITION: ${rec.status} -> ${to}`), {
      code: "INVALID_COMMAND_STATUS_TRANSITION",
    });
  }
  if (TERMINAL_STATUSES.has(rec.status)) {
    throw Object.assign(
      new Error(`INVALID_COMMAND_STATUS_TRANSITION: terminal ${rec.status} cannot transition`),
      { code: "INVALID_COMMAND_STATUS_TRANSITION" },
    );
  }
  const tr: CommandStatusTransitionRecord = {
    commandId: rec.commandId,
    fromStatus: rec.status,
    toStatus: to,
    phaseId,
    actorId,
    reasonCode,
    previousHash,
    recordHash: "",
    timestamp: new Date().toISOString(),
  };
  return { ...tr, recordHash: sha256Hex(canonicalSerialize(tr)) };
}

// --- Legacy CommandOutcome for backward compat ---
export type CommandOutcome =
  | { type: "success"; commandId: string; snapshotHash: string; result?: unknown }
  | { type: "rejected"; commandId: string; snapshotHash: string; diagnostic: Diagnostic }
  | { type: "idempotency_match"; commandId: string; snapshotHash: string; result?: unknown }
  | {
      type: "idempotency_conflict";
      commandId: string;
      snapshotHash: string;
      diagnostic: Diagnostic;
    };

type LifecycleStepResult = { ok: true } | { ok: false; outcome: CommandOutcome };

export class CommandLifecycle {
  private currentVersion = "0.1.0" as const;
  private audit = new AuditChain();

  validate(
    envelope: CommandEnvelope<CommandBody>,
    snapshot: CampaignSnapshot,
  ): LifecycleStepResult {
    if (envelope.version !== this.currentVersion) {
      return {
        ok: false,
        outcome: this.makeRejected(
          envelope,
          snapshot,
          "VERSION_MISMATCH",
          `Expected version ${this.currentVersion}, got ${envelope.version}`,
        ),
      };
    }
    const computedHash = sha256Hex(canonicalSerialize(snapshot));
    if (envelope.expectedSnapshotHash !== computedHash) {
      return {
        ok: false,
        outcome: this.makeRejected(
          envelope,
          snapshot,
          "STALE_SNAPSHOT_HASH",
          "Expected snapshot hash does not match current snapshot",
        ),
      };
    }
    if (envelope.body.type === "SetResearchPriority")
      return this.validateSetResearchPriority(envelope, snapshot);
    if (envelope.body.type === "SetBudgetAllocation")
      return this.validateSetBudgetAllocation(envelope, snapshot);
    if (envelope.body.type === "MoveFleet") {
      const move = envelope.body;
      const problem = fleetMoveProblem(snapshot, move.nationId, move.fleetId, move.toAreaId);
      return problem === null
        ? { ok: true }
        : {
            ok: false,
            outcome: this.makeRejected(envelope, snapshot, problem.code, problem.message),
          };
    }
    if (envelope.body.type === "DeclareWar") return this.validateDeclareWar(envelope, snapshot);
    if (envelope.body.type === "AcceptPeace") return this.validateAcceptPeace(envelope, snapshot);
    if (envelope.body.type === "FormAlliance") return this.validateFormAlliance(envelope, snapshot);
    if (envelope.body.type === "BreakAlliance")
      return this.validateBreakAlliance(envelope, snapshot);
    if (envelope.body.type === "FormNonAggressionPact")
      return this.validateFormNap(envelope, snapshot);
    if (envelope.body.type === "BreakNonAggressionPact")
      return this.validateBreakNap(envelope, snapshot);
    if (envelope.body.type === "DeclareBlockade")
      return this.validateDeclareBlockade(envelope, snapshot);
    if (envelope.body.type === "CreateDivision")
      return this.validateCreateDivision(envelope, snapshot);
    if (envelope.body.type === "AddShipToDivision")
      return this.validateAddShipToDivision(envelope, snapshot);
    if (envelope.body.type === "RemoveShipFromDivision")
      return this.validateRemoveShipFromDivision(envelope, snapshot);
    if (envelope.body.type === "DissolveDivision")
      return this.validateDissolveDivision(envelope, snapshot);
    if (envelope.body.type === "ChangeDivisionFlagship")
      return this.validateChangeDivisionFlagship(envelope, snapshot);
    if (envelope.body.type !== "budget_project") {
      return {
        ok: false,
        outcome: this.makeRejected(
          envelope,
          snapshot,
          "UNKNOWN_COMMAND_TYPE",
          `Unknown command type: ${String((envelope.body as CommandBody).type)}`,
        ),
      };
    }
    const body = envelope.body as BudgetProjectCommand;
    if (typeof body.nationId !== "string" || body.nationId.length === 0)
      return {
        ok: false,
        outcome: this.makeRejected(
          envelope,
          snapshot,
          "INVALID_NATION_ID",
          "nationId must be a non-empty string",
        ),
      };
    if (typeof body.projectId !== "string" || body.projectId.length === 0)
      return {
        ok: false,
        outcome: this.makeRejected(
          envelope,
          snapshot,
          "INVALID_PROJECT_ID",
          "projectId must be a non-empty string",
        ),
      };
    return { ok: true };
  }

  private validateSetResearchPriority(
    envelope: CommandEnvelope<CommandBody>,
    snapshot: CampaignSnapshot,
  ): LifecycleStepResult {
    const body = envelope.body as Extract<CommandBody, { type: "SetResearchPriority" }>;
    if (typeof body.nationId !== "string" || body.nationId.length === 0)
      return {
        ok: false,
        outcome: this.makeRejected(
          envelope,
          snapshot,
          "INVALID_NATION_ID",
          "nationId must be a non-empty string",
        ),
      };
    if (body.exactTechId !== undefined && typeof body.exactTechId === "string") {
      return {
        ok: false,
        outcome: this.makeRejected(
          envelope,
          snapshot,
          "EXACT_TECHNOLOGY_SELECTION_PROHIBITED",
          `Exact technology selection is prohibited: ${body.exactTechId}`,
        ),
      };
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
      return {
        ok: false,
        outcome: this.makeRejected(
          envelope,
          snapshot,
          "RESEARCH_PRIORITY_CONSTRAINT_VIOLATED",
          `Invalid field priorities: missing=${missingFields.join(",")} invalidWeight=${invalidWeightFields.join(",")} highCount=${String(highCount)}`,
        ),
      };
    }
    return { ok: true };
  }

  private validateSetBudgetAllocation(
    envelope: CommandEnvelope<CommandBody>,
    snapshot: CampaignSnapshot,
  ): LifecycleStepResult {
    const body = envelope.body as Extract<CommandBody, { type: "SetBudgetAllocation" }>;
    const reject = (code: string, message: string): LifecycleStepResult => ({
      ok: false,
      outcome: this.makeRejected(envelope, snapshot, code, message),
    });
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

  // --- B10c diplomacy & war validators ---

  private pairKey(a: string, b: string): string {
    return [a, b].sort().join("\u0000");
  }

  private findRelation(snapshot: CampaignSnapshot, a: string, b: string) {
    const key = this.pairKey(a, b);
    return (
      snapshot.politics.relations.find((r) => this.pairKey(r.nationA, r.nationB) === key) ?? null
    );
  }

  private activeWarsFor(snapshot: CampaignSnapshot, nationId: string) {
    return snapshot.wars.wars.filter(
      (w) =>
        w.status !== "ENDED" &&
        (w.attackerSideMembers.includes(nationId) || w.defenderSideMembers.includes(nationId)),
    );
  }

  private isActiveSharedWar(snapshot: CampaignSnapshot, a: string, b: string): boolean {
    return snapshot.wars.wars.some(
      (w) =>
        (w.status === "ACTIVE" || w.status === "DECLARED_NOT_ACTIVE") &&
        (w.attackerSideMembers.includes(a) || w.defenderSideMembers.includes(a)) &&
        (w.attackerSideMembers.includes(b) || w.defenderSideMembers.includes(b)),
    );
  }

  private validateDeclareWar(
    envelope: CommandEnvelope<CommandBody>,
    snapshot: CampaignSnapshot,
  ): LifecycleStepResult {
    const body = envelope.body as DeclareWarCommand;
    if (typeof body.nationId !== "string" || body.nationId.length === 0)
      return this.rejectValidate(
        envelope,
        snapshot,
        "INVALID_NATION_ID",
        "nationId must be non-empty",
      );
    if (typeof body.targetNationId !== "string" || body.targetNationId.length === 0)
      return this.rejectValidate(
        envelope,
        snapshot,
        "DECLARE_WAR_INVALID_TARGET",
        "targetNationId must be non-empty",
      );
    if (body.nationId === body.targetNationId)
      return this.rejectValidate(
        envelope,
        snapshot,
        "DECLARE_WAR_INVALID_TARGET",
        "Cannot declare war on yourself",
      );
    if (!snapshot.nations.has(body.targetNationId))
      return this.rejectValidate(
        envelope,
        snapshot,
        "DECLARE_WAR_INVALID_TARGET",
        `Target nation ${body.targetNationId} does not exist`,
      );
    if (!snapshot.nations.has(body.nationId))
      return this.rejectValidate(
        envelope,
        snapshot,
        "INVALID_NATION_ID",
        `Nation ${body.nationId} not found`,
      );
    const relation = this.findRelation(snapshot, body.nationId, body.targetNationId);
    if (relation && relation.relation === "at_war")
      return this.rejectValidate(
        envelope,
        snapshot,
        "ALREADY_AT_WAR",
        `${body.nationId} is already at war with ${body.targetNationId}`,
      );
    if (this.activeWarsFor(snapshot, body.nationId).length >= MAXIMUM_CONCURRENT_WARS)
      return this.rejectValidate(
        envelope,
        snapshot,
        "MAXIMUM_CONCURRENT_WARS_REACHED",
        `${body.nationId} already at maximum concurrent wars`,
      );
    return { ok: true };
  }

  private validateAcceptPeace(
    envelope: CommandEnvelope<CommandBody>,
    snapshot: CampaignSnapshot,
  ): LifecycleStepResult {
    const body = envelope.body as AcceptPeaceCommand;
    if (typeof body.warId !== "string" || body.warId.length === 0)
      return this.rejectValidate(envelope, snapshot, "PEACE_INVALID", "warId must be non-empty");
    const war = snapshot.wars.wars.find((w) => w.id === body.warId);
    if (!war)
      return this.rejectValidate(
        envelope,
        snapshot,
        "PEACE_INVALID",
        `War ${body.warId} not found`,
      );
    if (war.status !== "ACTIVE")
      return this.rejectValidate(
        envelope,
        snapshot,
        "PEACE_NO_ACTIVE_WAR",
        `War ${body.warId} is not active`,
      );
    const isMember =
      war.attackerSideMembers.includes(body.nationId) ||
      war.defenderSideMembers.includes(body.nationId);
    if (!isMember)
      return this.rejectValidate(
        envelope,
        snapshot,
        "PEACE_NO_ACTIVE_WAR",
        `${body.nationId} is not a member of war ${body.warId}`,
      );
    return { ok: true };
  }

  private validateFormAlliance(
    envelope: CommandEnvelope<CommandBody>,
    snapshot: CampaignSnapshot,
  ): LifecycleStepResult {
    const body = envelope.body as FormAllianceCommand;
    if (body.nationId === body.partnerNationId)
      return this.rejectValidate(
        envelope,
        snapshot,
        "ALLIANCE_FORMATION_INELIGIBLE",
        "Cannot ally with yourself",
      );
    const relation = this.findRelation(snapshot, body.nationId, body.partnerNationId);
    if (relation && relation.relation === "allied")
      return this.rejectValidate(
        envelope,
        snapshot,
        "ALLIANCE_ALREADY_EXISTS",
        `${body.nationId} is already allied with ${body.partnerNationId}`,
      );
    if (relation && relation.relation !== "neutral")
      return this.rejectValidate(
        envelope,
        snapshot,
        "ALLIANCE_TARGET_NOT_NEUTRAL",
        `Relation must be neutral to form alliance`,
      );
    return { ok: true };
  }

  private validateBreakAlliance(
    envelope: CommandEnvelope<CommandBody>,
    snapshot: CampaignSnapshot,
  ): LifecycleStepResult {
    const body = envelope.body as BreakAllianceCommand;
    const relation = this.findRelation(snapshot, body.nationId, body.partnerNationId);
    if (!relation || relation.relation !== "allied")
      return this.rejectValidate(
        envelope,
        snapshot,
        "ALLIANCE_ALREADY_EXISTS",
        `${body.nationId} is not allied with ${body.partnerNationId}`,
      );
    if (this.isActiveSharedWar(snapshot, body.nationId, body.partnerNationId))
      return this.rejectValidate(
        envelope,
        snapshot,
        "ALLIANCE_LOCKED_BY_WAR",
        `Alliance cannot be broken during an active shared war`,
      );
    return { ok: true };
  }

  private validateFormNap(
    envelope: CommandEnvelope<CommandBody>,
    snapshot: CampaignSnapshot,
  ): LifecycleStepResult {
    const body = envelope.body as FormNonAggressionPactCommand;
    if (body.nationId === body.partnerNationId)
      return this.rejectValidate(
        envelope,
        snapshot,
        "NAP_ALREADY_EXISTS",
        "Cannot NAP with yourself",
      );
    const relation = this.findRelation(snapshot, body.nationId, body.partnerNationId);
    if (relation && relation.nap)
      return this.rejectValidate(
        envelope,
        snapshot,
        "NAP_ALREADY_EXISTS",
        `A NAP already exists between ${body.nationId} and ${body.partnerNationId}`,
      );
    return { ok: true };
  }

  private validateBreakNap(
    envelope: CommandEnvelope<CommandBody>,
    snapshot: CampaignSnapshot,
  ): LifecycleStepResult {
    const body = envelope.body as BreakNonAggressionPactCommand;
    const relation = this.findRelation(snapshot, body.nationId, body.partnerNationId);
    if (!relation || !relation.nap)
      return this.rejectValidate(
        envelope,
        snapshot,
        "NAP_ALREADY_EXISTS",
        `No NAP exists between ${body.nationId} and ${body.partnerNationId}`,
      );
    return { ok: true };
  }

  private validateDeclareBlockade(
    envelope: CommandEnvelope<CommandBody>,
    snapshot: CampaignSnapshot,
  ): LifecycleStepResult {
    const body = envelope.body as DeclareBlockadeCommand;
    if (body.nationId === body.targetNationId)
      return this.rejectValidate(
        envelope,
        snapshot,
        "BLOCKADE_INVALID_TARGET",
        "Cannot blockade yourself",
      );
    const relation = this.findRelation(snapshot, body.nationId, body.targetNationId);
    if (!relation || relation.relation !== "at_war")
      return this.rejectValidate(
        envelope,
        snapshot,
        "BLOCKADE_NOT_AT_WAR",
        `${body.nationId} is not at war with ${body.targetNationId}`,
      );
    if (typeof body.areaId !== "string" || body.areaId.length === 0)
      return this.rejectValidate(
        envelope,
        snapshot,
        "BLOCKADE_INVALID_TARGET",
        "areaId must be non-empty",
      );
    const existing = snapshot.wars.blockadeState.some(
      (b) =>
        b.blockaderId === body.nationId &&
        b.blockadedNationId === body.targetNationId &&
        b.areaId === body.areaId,
    );
    if (existing)
      return this.rejectValidate(
        envelope,
        snapshot,
        "BLOCKADE_ALREADY_EXISTS",
        `A blockade already exists for ${body.nationId} on ${body.targetNationId} in area ${body.areaId}`,
      );
    return { ok: true };
  }

  private divisionById(snapshot: CampaignSnapshot, nationId: string, divisionId: string) {
    const nation = snapshot["nations"].get(nationId);
    if (!nation) return undefined;
    return nation["divisions"].find((d) => d["divisionId"] === divisionId);
  }

  private shipsOf(nationId: string, snapshot: CampaignSnapshot, shipIds: string[]) {
    const nation = snapshot["nations"].get(nationId);
    if (!nation) return [];
    const all = nation["fleets"].flatMap((f) => f["ships"]);
    const byId = new Map(all.map((s) => [s["id"], s]));
    return shipIds.map((id) => byId.get(id)).filter((s): s is NonNullable<typeof s> => !!s);
  }

  private validateCreateDivision(
    envelope: CommandEnvelope<CommandBody>,
    snapshot: CampaignSnapshot,
  ): LifecycleStepResult {
    const body = envelope.body as CreateDivisionCommand;
    if (typeof body.divisionId !== "string" || body.divisionId.length === 0)
      return this.rejectValidate(
        envelope,
        snapshot,
        "DIVISION_INVALID_ID",
        "divisionId must be non-empty",
      );
    if (this.divisionById(snapshot, body.nationId, body.divisionId))
      return this.rejectValidate(
        envelope,
        snapshot,
        "DIVISION_ALREADY_EXISTS",
        `Division ${body.divisionId} already exists`,
      );
    if (!Array.isArray(body.shipOrder) || body.shipOrder.length === 0)
      return this.rejectValidate(
        envelope,
        snapshot,
        "DIVISION_SIZE_LIMIT_EXCEEDED",
        "A division must contain 1..5 commissioned ships",
      );
    if (!DIVISION_ROLES.includes(body.divisionRole as any))
      return this.rejectValidate(
        envelope,
        snapshot,
        "DIVISION_ROLE_INELIGIBLE",
        `Invalid role ${body.divisionRole}`,
      );
    if (!DIVISION_FORMATIONS.includes(body.preferredFormation as any))
      return this.rejectValidate(
        envelope,
        snapshot,
        "DIVISION_FORMATION_INELIGIBLE",
        `Invalid formation ${body.preferredFormation}`,
      );
    if (new Set(body.shipOrder).size !== body.shipOrder.length)
      return this.rejectValidate(
        envelope,
        snapshot,
        "DIVISION_SHIP_TYPE_INCOMPATIBLE",
        "Duplicate ship in division",
      );
    const ships = this.shipsOf(body.nationId, snapshot, body.shipOrder);
    if (ships.length !== body.shipOrder.length)
      return this.rejectValidate(
        envelope,
        snapshot,
        "DIVISION_MEMBERSHIP_CHANGE_INELIGIBLE",
        "One or more ships not found in nation fleets",
      );
    const anyInDivision = ships.filter((s) =>
      (snapshot["nations"].get(body.nationId)?.divisions ?? []).some((d) =>
        d["shipOrder"].includes(s.id),
      ),
    );
    if (anyInDivision.length > 0)
      return this.rejectValidate(
        envelope,
        snapshot,
        "DIVISION_MEMBERSHIP_CHANGE_INELIGIBLE",
        `Ship already in another division: ${anyInDivision[0]!.id}`,
      );
    return { ok: true };
  }

  private validateAddShipToDivision(
    envelope: CommandEnvelope<CommandBody>,
    snapshot: CampaignSnapshot,
  ): LifecycleStepResult {
    const body = envelope.body as AddShipToDivisionCommand;
    const division = this.divisionById(snapshot, body.nationId, body.divisionId);
    if (!division)
      return this.rejectValidate(
        envelope,
        snapshot,
        "DIVISION_MEMBERSHIP_CHANGE_INELIGIBLE",
        `Division ${body.divisionId} not found`,
      );
    if (division["shipOrder"].includes(body.shipId))
      return this.rejectValidate(
        envelope,
        snapshot,
        "DIVISION_SHIP_TYPE_INCOMPATIBLE",
        `Ship ${body.shipId} already in division`,
      );
    const ships = this.shipsOf(body.nationId, snapshot, [body.shipId]);
    if (ships.length === 0)
      return this.rejectValidate(
        envelope,
        snapshot,
        "DIVISION_MEMBERSHIP_CHANGE_INELIGIBLE",
        `Ship ${body.shipId} not found`,
      );
    if (
      (snapshot["nations"].get(body.nationId)?.divisions ?? []).some(
        (d) => d.divisionId !== body.divisionId && d.shipOrder.includes(body.shipId),
      )
    )
      return this.rejectValidate(
        envelope,
        snapshot,
        "DIVISION_MEMBERSHIP_CHANGE_INELIGIBLE",
        `Ship ${body.shipId} in another division`,
      );
    if (division["shipOrder"].length >= DIVISION_MAX_SHIPS)
      return this.rejectValidate(
        envelope,
        snapshot,
        "DIVISION_SIZE_LIMIT_EXCEEDED",
        `Division ${body.divisionId} is full`,
      );
    return { ok: true };
  }

  private validateRemoveShipFromDivision(
    envelope: CommandEnvelope<CommandBody>,
    snapshot: CampaignSnapshot,
  ): LifecycleStepResult {
    const body = envelope.body as RemoveShipFromDivisionCommand;
    const division = this.divisionById(snapshot, body.nationId, body.divisionId);
    if (!division)
      return this.rejectValidate(
        envelope,
        snapshot,
        "DIVISION_MEMBERSHIP_CHANGE_INELIGIBLE",
        `Division ${body.divisionId} not found`,
      );
    if (!division["shipOrder"].includes(body.shipId))
      return this.rejectValidate(
        envelope,
        snapshot,
        "DIVISION_MEMBERSHIP_CHANGE_INELIGIBLE",
        `Ship ${body.shipId} not in division`,
      );
    if (division["shipOrder"].length === 1)
      return this.rejectValidate(
        envelope,
        snapshot,
        "DIVISION_SIZE_LIMIT_EXCEEDED",
        "Removing the final ship requires DissolveDivisionCommand",
      );
    return { ok: true };
  }

  private validateDissolveDivision(
    envelope: CommandEnvelope<CommandBody>,
    snapshot: CampaignSnapshot,
  ): LifecycleStepResult {
    const body = envelope.body as DissolveDivisionCommand;
    const division = this.divisionById(snapshot, body.nationId, body.divisionId);
    if (!division)
      return this.rejectValidate(
        envelope,
        snapshot,
        "DIVISION_MEMBERSHIP_CHANGE_INELIGIBLE",
        `Division ${body.divisionId} not found`,
      );
    return { ok: true };
  }

  private validateChangeDivisionFlagship(
    envelope: CommandEnvelope<CommandBody>,
    snapshot: CampaignSnapshot,
  ): LifecycleStepResult {
    const body = envelope.body as ChangeDivisionFlagshipCommand;
    const division = this.divisionById(snapshot, body.nationId, body.divisionId);
    if (!division)
      return this.rejectValidate(
        envelope,
        snapshot,
        "DIVISION_FLAGSHIP_INVALID",
        `Division ${body.divisionId} not found`,
      );
    if (!division["shipOrder"].includes(body.newFlagshipShipId))
      return this.rejectValidate(
        envelope,
        snapshot,
        "DIVISION_FLAGSHIP_INVALID",
        `Ship ${body.newFlagshipShipId} not in division`,
      );
    return { ok: true };
  }

  private rejectValidate(
    envelope: CommandEnvelope<CommandBody>,
    snapshot: CampaignSnapshot,
    code: string,
    message: string,
  ): LifecycleStepResult {
    return { ok: false, outcome: this.makeRejected(envelope, snapshot, code, message) };
  }

  authorize(envelope: CommandEnvelope<CommandBody>, slot: CampaignSlot): LifecycleStepResult {
    if (envelope.body.nationId !== slot.nationId) {
      return {
        ok: false,
        outcome: {
          type: "rejected",
          commandId: envelope.commandId,
          snapshotHash: envelope.expectedSnapshotHash,
          diagnostic: {
            code: "UNAUTHORIZED" as DiagnosticCode,
            severity: "error",
            stage: "authorize",
            message: `Nation ${envelope.body.nationId} is not authorized for slot ${slot.nationId}`,
          },
        },
      };
    }
    return { ok: true };
  }

  reserve(envelope: CommandEnvelope<CommandBody>, snapshot: CampaignSnapshot): LifecycleStepResult {
    const body = envelope.body;
    const nation = snapshot.nations.get(body.nationId);
    if (!nation)
      return {
        ok: false,
        outcome: {
          type: "rejected",
          commandId: envelope.commandId,
          snapshotHash: envelope.expectedSnapshotHash,
          diagnostic: {
            code: "NATION_NOT_FOUND" as DiagnosticCode,
            severity: "error",
            stage: "reserve",
            message: `Nation ${body.nationId} not found`,
          },
        },
      };
    if (body.type === "budget_project" && nation.treasury < body.budget) {
      return {
        ok: false,
        outcome: {
          type: "rejected",
          commandId: envelope.commandId,
          snapshotHash: envelope.expectedSnapshotHash,
          diagnostic: {
            code: "INSUFFICIENT_TREASURY" as DiagnosticCode,
            severity: "error",
            stage: "reserve",
            message: `Insufficient treasury: ${String(nation.treasury)} < ${String(body.budget)}`,
          },
        },
      };
    }
    return { ok: true };
  }

  accept(_envelope: CommandEnvelope<CommandBody>): void {}
  reject(envelope: CommandEnvelope<CommandBody>, reason: string): CommandOutcome {
    return {
      type: "rejected",
      commandId: envelope.commandId,
      snapshotHash: envelope.expectedSnapshotHash,
      diagnostic: {
        code: "REJECTED" as DiagnosticCode,
        severity: "error",
        stage: "lifecycle",
        message: reason,
      },
    };
  }
  lock(_envelope: CommandEnvelope<CommandBody>): void {}
  resolve(envelope: CommandEnvelope<CommandBody>, snapshot: CampaignSnapshot): CommandOutcome {
    const body = envelope.body;
    const snapshotHash = sha256Hex(canonicalSerialize(snapshot));
    if (body.type === "SetResearchPriority")
      return {
        type: "success",
        commandId: envelope.commandId,
        snapshotHash,
        result: { nationId: body.nationId, fieldPriorities: body.fieldPriorities },
      };
    if (body.type === "MoveFleet")
      return {
        type: "success",
        commandId: envelope.commandId,
        snapshotHash,
        result: { nationId: body.nationId, fleetId: body.fleetId, toAreaId: body.toAreaId },
      };
    if (body.type === "SetBudgetAllocation")
      return {
        type: "success",
        commandId: envelope.commandId,
        snapshotHash,
        result: {
          nationId: body.nationId,
          appropriationRateBp: body.appropriationRateBp,
          researchBudget: body.researchBudget,
        },
      };
    if (body.type === "DeclareWar")
      return {
        type: "success",
        commandId: envelope.commandId,
        snapshotHash,
        result: { nationId: body.nationId, targetNationId: body.targetNationId },
      };
    if (body.type === "AcceptPeace")
      return {
        type: "success",
        commandId: envelope.commandId,
        snapshotHash,
        result: { nationId: body.nationId, warId: body.warId },
      };
    if (body.type === "FormAlliance" || body.type === "BreakAlliance")
      return {
        type: "success",
        commandId: envelope.commandId,
        snapshotHash,
        result: { nationId: body.nationId, partnerNationId: body.partnerNationId },
      };
    if (body.type === "FormNonAggressionPact" || body.type === "BreakNonAggressionPact")
      return {
        type: "success",
        commandId: envelope.commandId,
        snapshotHash,
        result: { nationId: body.nationId, partnerNationId: body.partnerNationId },
      };
    if (body.type === "DeclareBlockade")
      return {
        type: "success",
        commandId: envelope.commandId,
        snapshotHash,
        result: {
          nationId: body.nationId,
          targetNationId: body.targetNationId,
          areaId: body.areaId,
        },
      };
    if (
      body.type === "CreateDivision" ||
      body.type === "AddShipToDivision" ||
      body.type === "RemoveShipFromDivision" ||
      body.type === "DissolveDivision" ||
      body.type === "ChangeDivisionFlagship"
    )
      return {
        type: "success",
        commandId: envelope.commandId,
        snapshotHash,
        result: { nationId: body.nationId, divisionId: body.divisionId },
      };
    const b = body as BudgetProjectCommand;
    return {
      type: "success",
      commandId: envelope.commandId,
      snapshotHash,
      result: { budget: b.budget, nationId: b.nationId, projectId: b.projectId },
    };
  }

  process(
    envelope: CommandEnvelope<CommandBody>,
    snapshot: CampaignSnapshot,
    slot: CampaignSlot,
    idempotencyMap: CommandIdempotencyMap,
  ): CommandOutcome {
    const existing = idempotencyMap.get(envelope.idempotencyKey);
    if (existing) {
      if (existing.commandId === envelope.commandId)
        return {
          type: "idempotency_match",
          commandId: envelope.commandId,
          snapshotHash: envelope.expectedSnapshotHash,
          result:
            existing.type === "success" || existing.type === "idempotency_match"
              ? existing.result
              : undefined,
        };
      return {
        type: "idempotency_conflict",
        commandId: envelope.commandId,
        snapshotHash: envelope.expectedSnapshotHash,
        diagnostic: {
          code: "IDEMPOTENCY_CONFLICT" as DiagnosticCode,
          severity: "error",
          stage: "lifecycle",
          message: `Idempotency key ${envelope.idempotencyKey} already used by command ${existing.commandId}`,
        },
      };
    }
    const validation = this.validate(envelope, snapshot);
    if (!validation.ok) {
      idempotencyMap.set(envelope.idempotencyKey, validation.outcome);
      return validation.outcome;
    }
    const auth = this.authorize(envelope, slot);
    if (!auth.ok) {
      idempotencyMap.set(envelope.idempotencyKey, auth.outcome);
      return auth.outcome;
    }
    const reserveResult = this.reserve(envelope, snapshot);
    if (!reserveResult.ok) {
      idempotencyMap.set(envelope.idempotencyKey, reserveResult.outcome);
      return reserveResult.outcome;
    }
    this.accept(envelope);
    this.lock(envelope);
    const outcome = this.resolve(envelope, snapshot);
    idempotencyMap.set(envelope.idempotencyKey, outcome);
    this.audit.append(
      snapshot.campaignId,
      envelope.commandId,
      "process",
      slot.nationId,
      envelope.expectedSnapshotHash,
      sha256Hex(canonicalSerialize(outcome)),
      "0.1.0",
      "0.1.0",
      [outcome.type],
    );
    return outcome;
  }

  private makeRejected(
    envelope: CommandEnvelope<CommandBody>,
    snapshot: CampaignSnapshot,
    code: string,
    message: string,
  ): CommandOutcome {
    const snapshotHash = sha256Hex(canonicalSerialize(snapshot));
    return {
      type: "rejected",
      commandId: envelope.commandId,
      snapshotHash,
      diagnostic: { code: code as DiagnosticCode, severity: "error", stage: "validate", message },
    };
  }

  // --- New spec-compliant helpers ---

  createCommandRecord(
    envelope: CommandEnvelope<CommandBody>,
    definition: CommandTypeDefinition,
    campaignId: string,
    campaignMonth: string,
    issuerClass: CommandRecord["issuerClass"],
    issuerParticipantId: string,
    targetAggregateId: string,
    submissionPhaseId: string,
    submissionOrdinal: number,
    snapshotHash: string,
  ): CommandRecord {
    const canonicalPayloadHash = sha256Hex(canonicalSerialize(envelope.body));
    const rec: CommandRecord = {
      commandId: envelope.commandId,
      commandTypeId: definition.commandTypeId,
      commandSchemaVersion: definition.commandSchemaVersion,
      campaignId,
      campaignMonth,
      issuerClass,
      issuerParticipantId,
      targetAggregateType: definition.targetAggregateType,
      targetAggregateId,
      submissionPhaseId,
      submissionOrdinal,
      idempotencyKey: envelope.idempotencyKey,
      canonicalPayload: envelope.body,
      canonicalPayloadHash,
      declaredPreconditions: {},
      status: "SUBMITTED",
      authorizationRecord: "NONE",
      validationRecord: "NONE",
      reservationRecordIds: [],
      cancellationRequestId: "NONE",
      resolutionRecord: "NONE",
      settlementRecord: "NONE",
      resultRecord: "NONE",
      createdFromSnapshotHash: snapshotHash,
      lastTransitionAtPhaseId: submissionPhaseId,
      causalRecordId: `causal-${envelope.commandId}`,
      commandHash: "",
    };
    return { ...rec, commandHash: hashCommandRecord(rec) };
  }

  enforceLockImmutability(rec: CommandRecord, attemptedMutation: string): never {
    if (rec.status === "LOCKED" || rec.status === "RESOLVING") {
      throw Object.assign(
        new Error(
          `LOCKED_COMMAND_IMMUTABLE: cannot ${attemptedMutation} on ${rec.status} command ${rec.commandId}`,
        ),
        { code: "LOCKED_COMMAND_IMMUTABLE" },
      );
    }
    throw Object.assign(new Error(`LOCKED_COMMAND_IMMUTABLE`), {
      code: "LOCKED_COMMAND_IMMUTABLE",
    });
  }

  checkCancellationWindow(
    rec: CommandRecord,
    def: CommandTypeDefinition,
    currentPhaseId: string,
    currentStatus: CommandStatus,
  ): { allowed: boolean; reasonCode: string } {
    if (TERMINAL_STATUSES.has(currentStatus))
      return { allowed: false, reasonCode: "CANCELLATION_NOT_ALLOWED" };
    if (def.cancellationPolicyId === "NOT_CANCELLABLE")
      return { allowed: false, reasonCode: "CANCELLATION_NOT_ALLOWED" };
    if (def.cancellationPolicyId === "UNTIL_LOCK") {
      const allowedStatuses: CommandStatus[] = [
        "SUBMITTED",
        "VALIDATED",
        "AUTHORIZED",
        "RESERVED",
        "ACCEPTED",
      ];
      if (!allowedStatuses.includes(currentStatus))
        return { allowed: false, reasonCode: "CANCELLATION_WINDOW_CLOSED" };
      return { allowed: true, reasonCode: "COMMAND_CANCELLED" };
    }
    if (def.cancellationPolicyId === "UNTIL_IRREVERSIBLE_PHASE") {
      if (currentPhaseId === def.irreversiblePhaseId)
        return { allowed: false, reasonCode: "IRREVERSIBLE_EFFECT_ALREADY_APPLIED" };
      // also check status
      const allowed: CommandStatus[] = [
        "SUBMITTED",
        "VALIDATED",
        "AUTHORIZED",
        "RESERVED",
        "ACCEPTED",
        "LOCKED",
        "RESOLVING",
      ];
      if (!allowed.includes(currentStatus))
        return { allowed: false, reasonCode: "CANCELLATION_WINDOW_CLOSED" };
      return { allowed: true, reasonCode: "COMMAND_CANCELLED" };
    }
    // CUSTOM_EXPLICIT - delegate to handler branch (here we allow but require explicit)
    return { allowed: false, reasonCode: "CANCELLATION_NOT_ALLOWED" };
  }

  produceResult(
    commandId: string,
    terminalStatus: CommandStatus,
    primaryReasonCode: string,
    preHash: string,
    postHash: string,
    settlementIds: string[],
  ): CommandResult {
    const res: CommandResult = {
      commandId,
      terminalStatus,
      primaryReasonCode,
      diagnosticReasonCodes: [],
      appliedEffectRecordIds: [],
      reservationSettlementIds: settlementIds,
      refundAmountByResource: {},
      consumedAmountByResource: {},
      lostAmountByResource: {},
      domainEventIds: [],
      randomDecisionRecordIds: [],
      preResolutionStateHash: preHash,
      postResolutionStateHash: postHash,
      explanationTrace: [primaryReasonCode],
      resultHash: "",
    };
    return { ...res, resultHash: sha256Hex(canonicalSerialize(res)) };
  }

  handleImpossibility(
    command: CommandRecord,
    failedPredicateIds: string[],
    inputSnapshotHash: string,
    effectsApplied: string[],
    def: CommandTypeDefinition,
  ): { outcome: import("./types.js").CommandImpossibilityOutcome; terminalStatus: CommandStatus } {
    const allowsPartial = def.partialCompletionAllowed === true && effectsApplied.length > 0;
    const terminalStatus: CommandStatus =
      effectsApplied.length === 0 ? "REJECTED" : allowsPartial ? "PARTIALLY_COMPLETED" : "REJECTED";
    const outcome: import("./types.js").CommandImpossibilityOutcome = {
      commandId: command.commandId,
      failedPredicateIds,
      primaryReasonCode: "VOLATILE_PRECONDITION_FAILED",
      diagnosticReasonCodes: failedPredicateIds,
      inputSnapshotHash,
      effectsAlreadyApplied: effectsApplied,
      reservedResourceDisposition: {},
      refundCalculation: {},
      lostCostCalculation: {},
      resultingTerminalStatus: terminalStatus,
      explanationTrace: [`Volatile precondition failed: ${failedPredicateIds.join(",")}`],
    };
    return { outcome, terminalStatus };
  }

  // Architecture validation: direct mutation prohibited
  assertNoDirectMutation(caller: string): void {
    const prohibited = [
      "DTO",
      "UI handler",
      "AI planner",
      "preload bridge",
      "renderer",
      "IPC handler",
      "CommandEnvelope",
    ];
    if (prohibited.some((p) => caller.includes(p))) {
      throw Object.assign(
        new Error(
          `DIRECT_COMMAND_STATE_MUTATION_PROHIBITED: ${caller} must not mutate authoritative state`,
        ),
        { code: "DIRECT_COMMAND_STATE_MUTATION_PROHIBITED" },
      );
    }
  }

  // Failure atomicity
  handleInternalFailure(command: CommandRecord, preHash: string, _error: unknown): CommandResult {
    // roll back is caller's responsibility; here we produce result
    return this.produceResult(
      command.commandId,
      "REJECTED",
      "COMMAND_RESOLUTION_INTERNAL_FAILURE",
      preHash,
      preHash,
      [],
    );
  }

  // Replay verification
  verifyReplay(expected: CommandResult, actual: CommandResult): void {
    if (
      expected.resultHash !== actual.resultHash ||
      expected.terminalStatus !== actual.terminalStatus
    ) {
      throw Object.assign(
        new Error(
          `COMMAND_REPLAY_MISMATCH: expected ${expected.resultHash} got ${actual.resultHash}`,
        ),
        { code: "COMMAND_REPLAY_MISMATCH" },
      );
    }
  }
}

export class CommandIdempotencyMap {
  private map = new Map<string, CommandOutcome>();
  has(key: string): boolean {
    return this.map.has(key);
  }
  get(key: string): CommandOutcome | undefined {
    return this.map.get(key);
  }
  set(key: string, outcome: CommandOutcome): void {
    this.map.set(key, outcome);
  }
}

export class CommandLedger {
  private records: CommandOutcome[] = [];
  add(outcome: CommandOutcome): void {
    this.records.push(outcome);
  }
  get all(): readonly CommandOutcome[] {
    return this.records;
  }
  hash(): string {
    return sha256Hex(canonicalSerialize(this.records));
  }
}

// Scoped idempotency per §4
export class ScopedIdempotencyStore {
  private store = new Map<string, CommandRecord>(); // scopeKey -> record
  private keyFor(def: CommandTypeDefinition, idempotencyKey: string): string {
    return `${def.idempotencyScope}:${def.commandTypeId}:${idempotencyKey}`;
  }
  get(def: CommandTypeDefinition, idempotencyKey: string): CommandRecord | undefined {
    return this.store.get(this.keyFor(def, idempotencyKey));
  }
  set(def: CommandTypeDefinition, rec: CommandRecord): void {
    const k = this.keyFor(def, rec.idempotencyKey);
    if (this.store.has(k)) {
      const existing = this.store.get(k)!;
      if (existing.commandId !== rec.commandId) {
        throw Object.assign(
          new Error(`Idempotency key ${rec.idempotencyKey} already used by ${existing.commandId}`),
          { code: "IDEMPOTENCY_CONFLICT" },
        );
      }
      return; // idempotent return existing
    }
    this.store.set(k, rec);
  }
  // duplicate must return existing result and not submit second
  checkDuplicate(
    def: CommandTypeDefinition,
    idempotencyKey: string,
    commandId: string,
  ): CommandRecord | undefined {
    const existing = this.get(def, idempotencyKey);
    if (existing && existing.commandId !== commandId) return existing;
    if (existing && existing.commandId === commandId) return existing;
    return undefined;
  }
}
