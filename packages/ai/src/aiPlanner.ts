import type { CampaignSnapshot, CampaignSlot, NationState } from "@bluewave/campaign";
import type {
  CommandEnvelope,
  CommandBody,
  CommandLifecycle,
  CommandIdempotencyMap,
} from "@bluewave/commands";
import type { RandomEngine } from "@bluewave/random";
import { drawUniform } from "@bluewave/random";
import type { Diagnostic, DiagnosticCode } from "@bluewave/diagnostics";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import { SafeInt } from "@bluewave/contracts";
import {
  CANONICAL_RESEARCH_FIELD_IDS,
  RESEARCH_FIELD_PRIORITY_WEIGHTS,
  MAX_HIGH_PRIORITY_FIELDS,
} from "@bluewave/content-schema";
import {
  AiCommandGenerator,
  AI_COMMAND_TYPE_BUDGET,
  AI_COMMAND_TYPE_RESEARCH,
} from "./aiCommandGenerator.js";

/**
 * RNG stream key prefix. The deterministic AI stream per (nation, command
 * type) is derived from the master seed via splitSeed(master, domain), so the
 * same input seed always yields the same stream regardless of how many engine
 * instances are created.
 */
export const AI_RNG_STREAM_PREFIX = "ai/planning:";

export interface AiPlanningResult {
  /** Every generated envelope, accepted or not, so callers can report diagnostics. */
  envelopes: CommandEnvelope<CommandBody>[];
  /** Only the envelopes whose lifecycle process returned `type: "success"`. */
  accepted: CommandEnvelope<CommandBody>[];
  /** Diagnostics for rejected envelopes (one per rejected command, no retry). */
  diagnostics: Diagnostic[];
}

/**
 * Generates legal, deterministic AI commands for a single AI nation and runs
 * each through the CommandLifecycle. State mutation happens ONLY through the
 * canonical application path in the phase engine; the planner never mutates
 * the snapshot.
 */
export class AiPlanner {
  generate(
    snapshot: CampaignSnapshot,
    engine: RandomEngine,
    lifecycle: CommandLifecycle,
    slot: CampaignSlot,
    idempotencyMap: CommandIdempotencyMap,
  ): AiPlanningResult {
    const nationId = slot.nationId;
    const envelopes: CommandEnvelope<CommandBody>[] = [];
    const accepted: CommandEnvelope<CommandBody>[] = [];
    const diagnostics: Diagnostic[] = [];

    const nation = snapshot.nations.get(nationId);
    if (!nation) {
      return {
        envelopes,
        accepted,
        diagnostics: [
          {
            code: "AI_NATION_MISSING" as DiagnosticCode,
            severity: "error",
            stage: "ai_planning",
            message: `Nation ${nationId} not found for AI planning`,
            entityId: nationId,
          },
        ],
      };
    }

    const generator = new AiCommandGenerator({
      campaignId: snapshot.campaignId,
      turnNumber: snapshot.turnNumber,
      expectedSnapshotHash: sha256Hex(canonicalSerialize(snapshot)),
    });

    const budgetCommand = this.buildBudgetCommand(nationId, nation, engine, generator);
    if (budgetCommand) {
      envelopes.push(budgetCommand);
      const outcome = lifecycle.process(budgetCommand, snapshot, slot, idempotencyMap);
      if (outcome.type === "success") {
        accepted.push(budgetCommand);
      } else if (outcome.type === "rejected" || outcome.type === "idempotency_conflict") {
        diagnostics.push(outcome.diagnostic);
      }
    }

    const researchCommand = this.buildResearchPriorityCommand(nationId, engine, generator);
    if (researchCommand) {
      envelopes.push(researchCommand);
      const outcome = lifecycle.process(researchCommand, snapshot, slot, idempotencyMap);
      if (outcome.type === "success") {
        accepted.push(researchCommand);
      } else if (outcome.type === "rejected" || outcome.type === "idempotency_conflict") {
        diagnostics.push(outcome.diagnostic);
      }
    }

    return { envelopes, accepted, diagnostics };
  }

  /**
   * Enumerates legal budget_project options: for every incomplete construction
   * project (completedWork < totalWork, status !== COMPLETED) with
   * treasury >= 0 and remainingWork > 0, the legal budget is any integer in
   * [1, min(treasury, remainingWork)]. Picks ONE project uniformly and ONE
   * amount uniformly from its legal range, then builds the envelope.
   */
  private buildBudgetCommand(
    nationId: string,
    nation: NationState,
    engine: RandomEngine,
    generator: AiCommandGenerator,
  ): CommandEnvelope<CommandBody> | undefined {
    const legal: Array<{ projectId: string; maxAmount: SafeInt }> = [];
    for (const project of nation.constructionProjects) {
      if (project.status === "COMPLETED") continue;
      const remainingWork = SafeIntSub(project.totalWork, project.completedWork);
      if ((remainingWork as number) <= 0) continue;
      if ((nation.treasury as number) < 0) continue;
      const maxAmount = minSafeInt(nation.treasury, remainingWork);
      if ((maxAmount as number) < 1) continue;
      legal.push({ projectId: project.id, maxAmount });
    }
    if (legal.length === 0) return undefined;

    const stream = engine.stream(`${AI_RNG_STREAM_PREFIX}${nationId}:${AI_COMMAND_TYPE_BUDGET}`);
    const index = drawUniform(stream, SafeInt.ZERO, SafeInt(legal.length - 1)) as number;
    const chosen = legal[index]!;
    const amount = drawUniform(stream, SafeInt.ONE, chosen.maxAmount);
    return generator.buildBudgetCommand(nationId, chosen.projectId, amount);
  }

  /**
   * Builds ONE valid SetResearchPriority assignment: chooses a high-count in
   * [1, MAX_HIGH_PRIORITY_FIELDS] and selects that many distinct fields
   * uniformly (partial Fisher-Yates over the canonical field order), grading
   * them HIGH and the rest MEDIUM so the lifecycle validator accepts it.
   */
  private buildResearchPriorityCommand(
    nationId: string,
    engine: RandomEngine,
    generator: AiCommandGenerator,
  ): CommandEnvelope<CommandBody> {
    const stream = engine.stream(`${AI_RNG_STREAM_PREFIX}${nationId}:${AI_COMMAND_TYPE_RESEARCH}`);
    const highCount = drawUniform(
      stream,
      SafeInt.ONE,
      SafeInt(MAX_HIGH_PRIORITY_FIELDS),
    ) as number;

    const fields: string[] = [...CANONICAL_RESEARCH_FIELD_IDS];
    const n = fields.length;
    for (let i = 0; i < highCount; i++) {
      const j = Math.floor(stream.next() * (n - i)) + i;
      const tmp = fields[i]!;
      fields[i] = fields[j]!;
      fields[j] = tmp;
    }
    const highSet = new Set(fields.slice(0, highCount));

    const fieldPriorities: Record<string, SafeInt> = {};
    for (const field of CANONICAL_RESEARCH_FIELD_IDS) {
      fieldPriorities[field] = highSet.has(field)
        ? SafeInt(RESEARCH_FIELD_PRIORITY_WEIGHTS.HIGH)
        : SafeInt(RESEARCH_FIELD_PRIORITY_WEIGHTS.MEDIUM);
    }

    return generator.buildResearchPriorityCommand(nationId, fieldPriorities);
  }
}

function SafeIntSub(a: SafeInt, b: SafeInt): SafeInt {
  return (a as number) - (b as number) as SafeInt;
}

function minSafeInt(a: SafeInt, b: SafeInt): SafeInt {
  return (a as number) <= (b as number) ? a : b;
}
