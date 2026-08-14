import type {
  CompiledDesignVersion,
  ConstructionCommand,
} from "@bluewave/campaign-engine";

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

export interface SubmitConstructionCommandPayload {
  readonly sessionId: string;
  readonly designId: string;
  readonly expectedRevision: number;
  readonly transportRequestId: string;
}

export interface ReplaceConstructionCommandPayload
  extends SubmitConstructionCommandPayload {
  readonly commandId: string;
}

export interface CancelConstructionCommandPayload {
  readonly sessionId: string;
  readonly commandId: string;
  readonly expectedRevision: number;
  readonly transportRequestId: string;
}
