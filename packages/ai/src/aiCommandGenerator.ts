
//packages/ai/src/aiCommandGenerator.ts
import type {
  BudgetProjectCommand,
  CommandEnvelope,
  SetResearchPriorityCommand,
} from "@bluewave/commands";
import type { SafeInt } from "@bluewave/contracts";
import { sha256Hex } from "@bluewave/deterministic";

export const AI_ENVELOPE_VERSION = "0.1.0" as const;
export const AI_COMMAND_TYPE_BUDGET = "budget_project" as const;
export const AI_COMMAND_TYPE_RESEARCH = "SetResearchPriority" as const;

/**
 * Context needed to build deterministic AI command envelopes.
 *
 * `expectedSnapshotHash` is the canonical hash of the snapshot the commands
 * are validated against, so replay produces byte-identical commands and the
 * CommandLifecycle's STALE_SNAPSHOT_HASH check passes.
 */
export interface AiCommandContext {
  campaignId: string;
  turnNumber: SafeInt;
  expectedSnapshotHash: string;
}

/**
 * Builds deterministic command envelopes for AI nations. Every field,
 * including commandId and timestamp, is derived solely from
 * (campaignId, turnNumber, nationId, commandType) so a given input state
 * always produces the same envelope.
 */
export class AiCommandGenerator {
  private readonly campaignId: string;
  private readonly turnNumber: SafeInt;
  private readonly expectedSnapshotHash: string;

  constructor(context: AiCommandContext) {
    this.campaignId = context.campaignId;
    this.turnNumber = context.turnNumber;
    this.expectedSnapshotHash = context.expectedSnapshotHash;
  }

  idempotencyKey(
    campaignId: string,
    turnNumber: SafeInt,
    nationId: string,
    commandType: string,
  ): string {
    return `${campaignId}/${String(turnNumber)}/${nationId}/${commandType}`;
  }

  private commandIdFromKey(key: string): string {
    return `ai-${sha256Hex(key).slice(0, 40)}`;
  }

  private deterministicTimestamp(): string {
    return new Date(Date.UTC(1910, 0, 1 + ((this.turnNumber as number) % 365))).toISOString();
  }

  buildBudgetCommand(
    nationId: string,
    projectId: string,
    amount: SafeInt,
  ): CommandEnvelope<BudgetProjectCommand> {
    const key = this.idempotencyKey(
      this.campaignId,
      this.turnNumber,
      nationId,
      AI_COMMAND_TYPE_BUDGET,
    );
    return {
      commandId: this.commandIdFromKey(key),
      version: AI_ENVELOPE_VERSION,
      expectedSnapshotHash: this.expectedSnapshotHash,
      idempotencyKey: key,
      timestamp: this.deterministicTimestamp(),
      body: { type: AI_COMMAND_TYPE_BUDGET, nationId, projectId, budget: amount },
      issuerClass: "AI",
      issuerParticipantId: nationId,
    };
  }

  buildResearchPriorityCommand(
    nationId: string,
    fieldPriorities: Record<string, SafeInt>,
  ): CommandEnvelope<SetResearchPriorityCommand> {
    const key = this.idempotencyKey(
      this.campaignId,
      this.turnNumber,
      nationId,
      AI_COMMAND_TYPE_RESEARCH,
    );
    return {
      commandId: this.commandIdFromKey(key),
      version: AI_ENVELOPE_VERSION,
      expectedSnapshotHash: this.expectedSnapshotHash,
      idempotencyKey: key,
      timestamp: this.deterministicTimestamp(),
      body: { type: AI_COMMAND_TYPE_RESEARCH, nationId, fieldPriorities },
      issuerClass: "AI",
      issuerParticipantId: nationId,
    };
  }
}
