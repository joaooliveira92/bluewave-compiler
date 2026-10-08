import type { CommandEnvelope } from "./bridge-contract.js";

/**
 * Submit a component-level ship design (ADR-0066). The main process re-compiles the draft against the bundled
 * ship-building content for an immediate answer, then queues a real `SubmitDesign` engine envelope; the engine
 * compiles it again authoritatively when the month is committed.
 */
export interface SubmitDesignCommandPayload extends CommandEnvelope {
  readonly className: string;
  /** A `@bluewave/ship-design` DesignDraft as JSON. */
  readonly draft: Record<string, unknown>;
}

export interface DesignCommandOutcome {
  readonly commandId: string;
  readonly designVersionId: string;
  readonly appliedOnNextTurn: true;
}

/** Revise a construction project with a changed design (ADR-0070). The engine classifies and applies it at month end. */
export interface ReviseProjectCommandPayload extends CommandEnvelope {
  readonly projectId: string;
  /** The whole new `@bluewave/ship-design` DesignDraft as JSON. */
  readonly draft: Record<string, unknown>;
}

/** The immediate answer for a queued revision: what the engine will do with it (preflight with the same rules). */
export interface ReviseCommandOutcome {
  readonly commandId: string;
  readonly newDesignVersionId: string;
  readonly tier: "T0_FREE" | "T1_REVISION" | "T2_REDESIGN";
  readonly progressBp: number;
  readonly reworkWork: number;
  readonly reasonCodes: readonly string[];
  readonly appliedOnNextTurn: true;
}

export interface LoadProjectDraftPayload {
  readonly sessionId: string;
  readonly projectId: string;
}

export interface ProjectDraftView {
  readonly className: string;
  readonly draft: Record<string, unknown>;
}
