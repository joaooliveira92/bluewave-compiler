import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import type { Diagnostic, DiagnosticCode } from "@bluewave/diagnostics";
import type { CampaignSnapshot, CampaignSlot } from "@bluewave/campaign";
import {
  CANONICAL_RESEARCH_FIELD_IDS,
  RESEARCH_FIELD_PRIORITY_WEIGHTS,
  MAX_HIGH_PRIORITY_FIELDS,
} from "@bluewave/content-schema";
import type { CommandEnvelope, CommandBody, BudgetProjectCommand } from "./envelope.js";

export type CommandOutcome =
  | {
      type: "success";
      commandId: string;
      snapshotHash: string;
      result?: unknown;
    }
  | {
      type: "rejected";
      commandId: string;
      snapshotHash: string;
      diagnostic: Diagnostic;
    }
  | {
      type: "idempotency_match";
      commandId: string;
      snapshotHash: string;
      result?: unknown;
    }
  | {
      type: "idempotency_conflict";
      commandId: string;
      snapshotHash: string;
      diagnostic: Diagnostic;
    };

type LifecycleStepResult = { ok: true } | { ok: false; outcome: CommandOutcome };

export class CommandLifecycle {
  private currentVersion = "0.1.0" as const;

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

    if (envelope.body.type === "SetResearchPriority") {
      return this.validateSetResearchPriority(envelope, snapshot);
    }

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
    if (typeof body.nationId !== "string" || body.nationId.length === 0) {
      return {
        ok: false,
        outcome: this.makeRejected(
          envelope,
          snapshot,
          "INVALID_NATION_ID",
          "nationId must be a non-empty string",
        ),
      };
    }
    if (typeof body.projectId !== "string" || body.projectId.length === 0) {
      return {
        ok: false,
        outcome: this.makeRejected(
          envelope,
          snapshot,
          "INVALID_PROJECT_ID",
          "projectId must be a non-empty string",
        ),
      };
    }

    return { ok: true };
  }

  private validateSetResearchPriority(
    envelope: CommandEnvelope<CommandBody>,
    snapshot: CampaignSnapshot,
  ): LifecycleStepResult {
    const body = envelope.body as Extract<CommandBody, { type: "SetResearchPriority" }>;

    if (typeof body.nationId !== "string" || body.nationId.length === 0) {
      return {
        ok: false,
        outcome: this.makeRejected(
          envelope,
          snapshot,
          "INVALID_NATION_ID",
          "nationId must be a non-empty string",
        ),
      };
    }

    // DESIGN-20 §5: a command naming a specific technology as the next
    // discovery MUST be rejected.
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
    const missingFields = CANONICAL_RESEARCH_FIELD_IDS.filter(
      (fieldId) => priorities[fieldId] === undefined,
    );
    const validWeights = new Set<number>([
      RESEARCH_FIELD_PRIORITY_WEIGHTS.HIGH,
      RESEARCH_FIELD_PRIORITY_WEIGHTS.MEDIUM,
      RESEARCH_FIELD_PRIORITY_WEIGHTS.LOW,
    ]);
    const invalidWeightFields = CANONICAL_RESEARCH_FIELD_IDS.filter(
      (fieldId) =>
        priorities[fieldId] !== undefined && !validWeights.has(priorities[fieldId] as number),
    );
    const highCount = CANONICAL_RESEARCH_FIELD_IDS.filter(
      (fieldId) => priorities[fieldId] === RESEARCH_FIELD_PRIORITY_WEIGHTS.HIGH,
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
    if (!nation) {
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
            message: `Nation ${body.nationId} not found in snapshot`,
          },
        },
      };
    }

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
    if (body.type === "SetResearchPriority") {
      return {
        type: "success",
        commandId: envelope.commandId,
        snapshotHash,
        result: {
          nationId: body.nationId,
          fieldPriorities: body.fieldPriorities,
        },
      };
    }
    const budgetBody = body as BudgetProjectCommand;
    return {
      type: "success",
      commandId: envelope.commandId,
      snapshotHash,
      result: {
        budget: budgetBody.budget,
        nationId: budgetBody.nationId,
        projectId: budgetBody.projectId,
      },
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
      if (existing.commandId === envelope.commandId) {
        return {
          type: "idempotency_match",
          commandId: envelope.commandId,
          snapshotHash: envelope.expectedSnapshotHash,
          result:
            existing.type === "success" || existing.type === "idempotency_match"
              ? existing.result
              : undefined,
        };
      }
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
      diagnostic: {
        code: code as DiagnosticCode,
        severity: "error",
        stage: "validate",
        message,
      },
    };
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
