import type { PlayerProjection } from "@bluewave/campaign-engine";
import type { WorldMapController } from "../../../components/world-map/useWorldMapController.js";
import { useWorldMapController } from "../../../components/world-map/useWorldMapController.js";
import type { MonthSummary } from "../../../lib/month-summary.js";
import { humanizeId } from "../../../lib/humanize-id.js";
import { useCampaignProjection } from "../../../lib/use-campaign-projection.js";
import { useMinWidth } from "../../../lib/use-min-width.js";
import { useMonthHistory } from "../../../shell/CampaignShellContext.js";
import { useDensity } from "../../../shell/DensityContext.js";
import { useNationRail, type NationRailLoad } from "../useNationRail.js";
import { usePriorities, type PrioritiesState } from "../usePriorities.js";

/** Below this width the panels stack under the map instead of floating over it (CC-9). */
export const COMMAND_OVERLAY_MIN_WIDTH = 1024;

/** Everything the Overview screen renders, loaded and derived in one place. */
export interface OverviewModel {
  /** Why the base campaign read failed, or null when it succeeded. */
  readonly loadError: string | null;
  readonly projection: PlayerProjection | null;
  /** Resolves a strategic-area id to its display name, falling back to a humanized id. */
  readonly areaName: (id: string) => string;
  /** False under compact density: every panel starts collapsed until the player opens it. */
  readonly roomy: boolean;
  /** Ready-state priority count for the panel badge, or null while loading/unavailable. */
  readonly priorityCount: number | null;
  readonly priorities: PrioritiesState;
  readonly nationRail: NationRailLoad;
  readonly monthHistory: readonly MonthSummary[];
  readonly map: WorldMapController;
  /** True when the viewport is wide enough for panels to float over the map (CC-9). */
  readonly wide: boolean;
}

/**
 * Loads everything the Overview screen shows (projection, priorities, the
 * Diplomacy & War inspect view for the rail, session month history, and the
 * world-map controller) and derives the presentation facts the panels need
 * (area-name resolution, density, viewport width) — so the screen itself only
 * gates on load state and composes the layout.
 */
export function useOverviewModel(sessionId: string): OverviewModel {
  const priorities = usePriorities(sessionId);
  const nationRail = useNationRail(sessionId);
  const monthHistory = useMonthHistory();
  const map = useWorldMapController(sessionId);
  const { density } = useDensity();
  const wide = useMinWidth(COMMAND_OVERLAY_MIN_WIDTH);
  const { projection, loadError } = useCampaignProjection(sessionId);

  const areaNames = new Map(
    (projection?.strategicAreas ?? []).map((area) => [area.id, area.name] as const),
  );
  const areaName = (id: string): string => areaNames.get(id) ?? humanizeId(id);

  return {
    loadError,
    projection,
    areaName,
    roomy: density !== "compact",
    priorityCount: priorities.status === "ready" ? priorities.priorities.length : null,
    priorities,
    nationRail,
    monthHistory,
    map,
    wide,
  };
}
