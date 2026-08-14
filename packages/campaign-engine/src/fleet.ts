/**
 * Read-only for MVP, per the desktop-mvp map (ticket 10) — fleet movement
 * orders are out of scope. Typed accurately enough for
 * `MovementCommandsTable.tsx`/`OrderSection.tsx` to render existing
 * (never-submitted-by-this-app) commands; submit/replace/cancel stay
 * unimplemented at the bridge layer.
 */
export type MovementCommandStatus =
  | "submitted"
  | "accepted"
  | "rejected"
  | "superseded"
  | "cancelled";

export interface MovementCommand {
  readonly commandId: string;
  readonly divisionId: string;
  readonly fromAreaId: string;
  readonly toAreaId: string;
  readonly status: MovementCommandStatus;
  readonly submittedAtRevision: number;
}
