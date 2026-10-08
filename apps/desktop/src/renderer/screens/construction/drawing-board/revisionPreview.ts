import {
  changeKindOf,
  classifyRevision,
  type BuildProgress,
  type ChangeKind,
  type ComponentCategory,
  type DesignDraft,
  type DraftEdit,
  type RevisionBalance,
  type RevisionDecision,
} from "@bluewave/ship-design";

/** The slice of an engine construction project the preview needs (work figures are engine numbers). */
export interface RevisionProject {
  readonly projectId: string;
  readonly className: string;
  readonly status: string;
  readonly totalWork: number;
  readonly completedWork: number;
}

/** Only unfinished projects can be revised. */
export const revisableProjects = (projects: readonly RevisionProject[]): RevisionProject[] =>
  projects.filter((p) => p.status !== "COMPLETED");

/**
 * Progress for the classifier. The engine tracks one work figure per project, so hull progress is that ratio and
 * everything it does not track is stated here, not guessed: armour and machinery orders are treated as not started
 * and the ship as not launched. Rework is measured against all completed work (the conservative reading).
 */
export const progressOf = (p: RevisionProject): BuildProgress => ({
  hullDoneWork: p.completedWork,
  hullTotalWork: p.totalWork,
  armourStarted: false,
  machineryStarted: false,
  launched: false,
  affectedDoneWork: p.completedWork,
});

/** The distinct kinds of change the applied edits make, in a stable order. */
export function changeKinds(
  edits: readonly DraftEdit[],
  start: DesignDraft,
  current: DesignDraft,
  categoryOfComponent: (componentId: string) => ComponentCategory | undefined,
): ChangeKind[] {
  const placed = new Map<string, string>();
  for (const pl of [...start.placements, ...current.placements])
    placed.set(pl.instanceId, pl.componentId);
  const categoryOf = (instanceId: string) => {
    const cid = placed.get(instanceId);
    return cid === undefined ? undefined : categoryOfComponent(cid);
  };
  const order: ChangeKind[] = ["FITTINGS", "MAIN_ARMAMENT", "ARMOUR", "MACHINERY", "STRUCTURE"];
  const kinds = new Set(edits.map((e) => changeKindOf(e, categoryOf)));
  return order.filter((k) => kinds.has(k));
}

/** What these edits would cost if applied to this project today. Null when nothing changed. Pure. */
export function previewRevision(
  kinds: readonly ChangeKind[],
  project: RevisionProject,
  balance: RevisionBalance,
): RevisionDecision | null {
  return kinds.length === 0 ? null : classifyRevision(kinds, progressOf(project), balance);
}

export const TIER_LABEL: Record<RevisionDecision["tier"], string> = {
  T0_FREE: "Free change",
  T1_REVISION: "Revision",
  T2_REDESIGN: "Redesign",
  T3_RECONSTRUCTION: "Reconstruction",
};

export const REASON_TEXT: Record<string, string> = {
  REVISION_PROGRESS_T1_REVISION: "Hull work has passed the free-change window.",
  REVISION_PROGRESS_T2_REDESIGN: "Hull work is far enough along that changes mean a redesign.",
  REVISION_PROGRESS_T3_RECONSTRUCTION: "Too much hull work is done for a revision.",
  REVISION_ESCALATED_STRUCTURAL:
    "The change touches structure, machinery, main armament or armour, which escalates a revision to a redesign.",
  REVISION_COMPONENT_ORDERED: "Armour or machinery has already been ordered.",
  REVISION_HULL_GEOMETRY: "Hull geometry cannot change after work has started without a redesign.",
  REVISION_AFTER_LAUNCH: "The ship is launched.",
};
