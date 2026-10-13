import type {
  ComponentCategory,
  ComponentDef,
  DesignDraft,
  DraftEdit,
  ZoneId,
} from "@bluewave/ship-design";
import type { DrawingBoardContent } from "../../components/design-workspace/content.js";

/**
 * The Systems section's availability view model. Pure: each catalogue installation is offered only when the design
 * year and the nation's unlocked technology allow it, and locked ones are named with a reason. Nothing here edits
 * the design except `addSystemEdit`, which returns one ordinary draft edit.
 */

export interface SystemItem {
  readonly componentId: string;
  readonly name: string;
  readonly available: boolean;
  /** Why the installation is unavailable (introduction month or missing technology); null when available. */
  readonly reason: string | null;
  /** How many of this component the design currently carries. */
  readonly fitted: number;
}

export interface SystemGroup {
  readonly category: ComponentCategory;
  readonly label: string;
  readonly items: readonly SystemItem[];
}

const words = (s: string) => s.replaceAll("_", " ").toLowerCase();

/** Whether a component may be fitted at `month` with `unlockedTechs`; null when available, else the reason. */
export function unavailableReason(
  def: ComponentDef,
  month: string,
  unlockedTechs: ReadonlySet<string>,
): string | null {
  if (def.introduction.fromMonth > month) return `Unavailable until ${def.introduction.fromMonth}`;
  const missing = def.requires.filter((t) => !unlockedTechs.has(t));
  if (missing.length > 0) return `Requires ${missing.map(words).join(", ")}`;
  return null;
}

/**
 * The installations of the given categories, grouped by category. Unavailable ones are kept (disabled with a reason)
 * only when `showUnavailable` is set; they are hidden otherwise.
 */
export function systemsModel(
  categories: ReadonlySet<ComponentCategory>,
  draft: DesignDraft,
  content: DrawingBoardContent,
  month: string,
  unlockedTechs: ReadonlySet<string>,
  showUnavailable: boolean,
): SystemGroup[] {
  const fittedCount = new Map<string, number>();
  for (const p of draft.placements)
    fittedCount.set(p.componentId, (fittedCount.get(p.componentId) ?? 0) + 1);
  const groups = new Map<ComponentCategory, SystemItem[]>();
  for (const def of content.components) {
    if (!categories.has(def.category)) continue;
    const reason = unavailableReason(def, month, unlockedTechs);
    if (reason !== null && !showUnavailable) continue;
    groups.set(def.category, [
      ...(groups.get(def.category) ?? []),
      {
        componentId: def.id,
        name: def.displayName,
        available: reason === null,
        reason,
        fitted: fittedCount.get(def.id) ?? 0,
      },
    ]);
  }
  return [...groups].map(([category, items]) => ({ category, label: words(category), items }));
}

function midStation(content: DrawingBoardContent, draft: DesignDraft, zoneId: string): number {
  const z = content.hullForms
    .find((f) => f.id === draft.hull.hullFormId)
    ?.zones.find((q) => q.id === zoneId);
  return z ? Math.floor((z.startPermille + z.endPermille) / 2) : 500;
}

/** One draft edit adding an installation in its first allowed zone (or the superstructure). Returns null if unknown. */
export function addSystemEdit(
  componentId: string,
  draft: DesignDraft,
  content: DrawingBoardContent,
): DraftEdit | null {
  const def = content.components.find((c) => c.id === componentId);
  if (def === undefined) return null;
  const zoneId = (def.allowedZones?.[0] ?? "SUPERSTRUCTURE") as ZoneId;
  let n = 1;
  while (draft.placements.some((p) => p.instanceId === `${componentId}_${n}`)) n++;
  return {
    kind: "add_placement",
    placement: {
      instanceId: `${componentId}_${n}`,
      componentId,
      zoneId,
      stationPermille: midStation(content, draft, zoneId),
    },
  };
}
