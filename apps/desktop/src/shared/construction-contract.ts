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
