import type {
  CompiledDesignVersion,
  ConstructionCommand,
  ConstructionProjectQueueEntry,
} from "@bluewave/campaign-engine";
import type { CommandEnvelope } from "./bridge-contract.js";

/**
 * Grounded in `construction-screen-state.ts`, `StatsPanel.tsx`, and
 * `CommandTable.tsx` — every field here is copied from an engine response;
 * the screen never derives costs, capacity, or remaining treasury itself.
 */
export interface ConstructionScreenProjection {
  readonly revision: number;
  readonly month: { readonly month: number; readonly year: number };
  readonly economy: {
    readonly treasury: number;
    readonly monthlyAppropriation: number;
    readonly shipyardCapacity: number;
  };
  readonly designs: readonly CompiledDesignVersion[];
  /** The nation's real construction projects (authored starting builds AND
   * order-queued projects), keyed by project id. */
  readonly projects: readonly ConstructionProjectQueueEntry[];
  readonly workspace: {
    readonly commands: readonly ConstructionCommand[];
    readonly treasuryReserved: number;
    readonly capacityReserved: number;
  };
}

export interface ConstructionCommandOutcome {
  readonly workspace: ConstructionScreenProjection["workspace"];
  readonly command: { readonly commandId: string; readonly status: string };
}

export interface SubmitConstructionCommandPayload extends CommandEnvelope {
  readonly designId: string;
}

export interface ReplaceConstructionCommandPayload extends SubmitConstructionCommandPayload {
  readonly commandId: string;
}

export interface CancelConstructionCommandPayload extends CommandEnvelope {
  readonly commandId: string;
}

/**
 * The construction-status commands (DESIGN-23 sections 7-8; SB3-R5/R8): halt, resume and the acceleration toggle. They
 * queue a real engine command envelope through the shared pending-queue seam and apply on the next `commitMonth`, so
 * the engine's `command_collection` phase is the sole mutator of the project status/premium.
 */
export interface HaltConstructionCommandPayload extends CommandEnvelope {
  readonly projectId: string;
}

export interface ResumeConstructionCommandPayload extends CommandEnvelope {
  readonly projectId: string;
}

export interface SetAccelerationCommandPayload extends CommandEnvelope {
  readonly projectId: string;
  readonly accelerated: boolean;
}

/**
 * The class-order batch command (DESIGN-23 sections 3-5; SB3-R11): order `1..12` ships of one approved compiled design
 * version in a single command. The engine's `placeConstructionBatch` policy reserves the whole batch before adding any
 * project.
 */
export interface OrderConstructionBatchCommandPayload extends CommandEnvelope {
  readonly designVersionId: string;
  readonly quantity: number;
}

/** The dock-expansion authorization (DESIGN-16 sections 5-6; SB3-R16): a twelve-month step for one possession. */
export interface AuthorizeDockExpansionCommandPayload extends CommandEnvelope {
  readonly possessionId: string;
}

/**
 * The foreign-yard order (DESIGN-16 sections 13.1-13.4; SB3-R20..R22). `terms` is the complete contract input and
 * `capability` the builder's resolved predicates; both are validated by the engine's `placeForeignConstructionOrder`,
 * which forms the immutable contract and checks every builder-capability predicate.
 */
export interface PlaceForeignConstructionCommandPayload extends CommandEnvelope {
  readonly designVersionId: string;
  readonly builderNationId: string;
  readonly terms: unknown;
  readonly capability?: unknown;
}

/** The shape every queued construction command returns: the deterministic envelope id and the next-turn contract. */
export interface ConstructionCommandQueuedOutcome {
  readonly commandId: string;
  readonly bodyType: string;
  readonly appliedOnNextTurn: true;
}
