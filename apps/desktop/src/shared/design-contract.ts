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
