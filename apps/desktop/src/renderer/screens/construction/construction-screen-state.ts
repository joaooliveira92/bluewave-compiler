import { NEAR_COMPLETION_WORK_RATIO } from "@bluewave/campaign-engine";
import type { DeferredFeature } from "../../components/shared/DeferredFeaturesPanel.js";
import type {
  ConstructionCommandOutcome,
  ConstructionScreenProjection,
} from "../../../shared/construction-contract.js";
import type { RequestLifecycle } from "../../lib/command-screen-workflow.js";
import { commandNotice } from "../../lib/command-screen-workflow.js";

/**
 * Presentation state for the construction screen. Every number here is copied
 * from an engine response — the screen never derives costs, capacity, or
 * remaining treasury itself.
 */
export interface ConstructionScreenState extends RequestLifecycle {
  readonly month: ConstructionScreenProjection["month"] | null;
  readonly economy: ConstructionScreenProjection["economy"] | null;
  readonly designs: ConstructionScreenProjection["designs"];
  readonly projects: ConstructionScreenProjection["projects"];
  readonly workspace: ConstructionScreenProjection["workspace"] | null;
}

export function initialConstructionScreenState(): ConstructionScreenState {
  return {
    revision: 0,
    month: null,
    economy: null,
    designs: [],
    projects: [],
    workspace: null,
    pendingRequest: null,
    requiresRefresh: false,
    notice: null,
  };
}

/**
 * Map a construction projection's domain fields into the state. The command
 * screen module owns the lifecycle fields (revision, pending, refresh, notice).
 */
export function projectConstructionScreen(
  projection: ConstructionScreenProjection,
): Partial<ConstructionScreenState> {
  return {
    month: projection.month,
    economy: projection.economy,
    designs: projection.designs,
    projects: projection.projects,
    workspace: projection.workspace,
  };
}

export function acceptConstructionCommand(value: ConstructionCommandOutcome): {
  readonly patch: Partial<ConstructionScreenState>;
  readonly notice: string;
} {
  return {
    patch: { workspace: value.workspace },
    notice: commandNotice(value.command),
  };
}

/**
 * Projects that still count as "active construction" (anything not COMPLETED —
 * the same definition the engine uses). The single source of truth for every
 * surface that shows this number (Overview, Pre-turn review), so they cannot
 * drift apart.
 */
export function activeConstructionProjects<T extends { readonly status: string }>(
  projects: readonly T[],
): readonly T[] {
  return projects.filter((project) => project.status !== "COMPLETED");
}

/**
 * Active projects whose work is at least `NEAR_COMPLETION_WORK_RATIO` complete
 * — the same "expected completions" proxy the engine's priorities use (spec §7),
 * never a months-to-completion estimate. Kept beside `activeConstructionProjects`
 * so the definition cannot drift from the count of active projects.
 */
export function expectedConstructionCompletions(
  projects: readonly {
    readonly status: string;
    readonly totalWork: number;
    readonly completedWork: number;
  }[],
): number {
  return activeConstructionProjects(projects).filter((project) => {
    const total = project.totalWork;
    return total > 0 && project.completedWork / total >= NEAR_COMPLETION_WORK_RATIO;
  }).length;
}

/** Construction items the engine cannot supply yet (engine-surface note, sections D and E). */
export const DEFERRED_CONSTRUCTION_ITEMS: readonly DeferredFeature[] = [
  {
    id: "build-submarine",
    name: "Build submarine",
    reason: "1880 content has no submarine hull or design, so there is nothing to order.",
  },
  {
    id: "build-fort-base",
    name: "Build fort or base",
    reason: "Coastal defence exists only in tactical combat, not as campaign construction.",
  },
  {
    id: "coastal-fortifications",
    name: "Coastal fortifications",
    reason: "The campaign holds no fortification state, so none can be listed.",
  },
];
