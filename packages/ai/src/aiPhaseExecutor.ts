
//packages/ai/src/aiPhaseExecutor.ts
import type { CampaignSlot, CampaignSnapshot } from "@bluewave/campaign";
import type {
  CommandBody,
  CommandEnvelope,
  CommandIdempotencyMap,
  CommandLifecycle,
} from "@bluewave/commands";
import type { Diagnostic } from "@bluewave/diagnostics";
import type { RandomEngine } from "@bluewave/random";
import { AiPlanner } from "./aiPlanner.js";

export interface AiExecutionResult {
  /** The accepted AI command envelopes to apply through the canonical path. */
  commands: CommandEnvelope<CommandBody>[];
  /** Diagnostics for any rejected AI command. */
  diagnostics: Diagnostic[];
}

/**
 * Thin per-nation wrapper around {@link AiPlanner} so the phase engine can
 * drive a single AI slot without knowing the planning details.
 */
export class AiPhaseExecutor {
  private planner: AiPlanner;

  constructor(planner: AiPlanner = new AiPlanner()) {
    this.planner = planner;
  }

  run(
    slot: CampaignSlot,
    snapshot: CampaignSnapshot,
    engine: RandomEngine,
    lifecycle: CommandLifecycle,
    idempotencyMap: CommandIdempotencyMap,
  ): AiExecutionResult {
    const result = this.planner.generate(snapshot, engine, lifecycle, slot, idempotencyMap);
    return {
      commands: result.accepted,
      diagnostics: result.diagnostics,
    };
  }
}
