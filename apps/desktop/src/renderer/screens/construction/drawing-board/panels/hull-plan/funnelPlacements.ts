import type { DesignDraft } from "@bluewave/ship-design";
import type { DrawingBoardContent } from "../../content.js";
import type { FunnelInput } from "./profile-structures.js";

/** The placed funnels (components tagged "funnel"), keyed by instance id so both views show the same ones. */
export function funnelPlacements(draft: DesignDraft, content: DrawingBoardContent): FunnelInput[] {
  const funnelIds = new Set(
    content.components.filter((c) => c.tags.includes("funnel")).map((c) => c.id),
  );
  return draft.placements
    .filter((p) => funnelIds.has(p.componentId))
    .map((p) => ({ instanceId: p.instanceId, stationPermille: p.stationPermille }));
}
