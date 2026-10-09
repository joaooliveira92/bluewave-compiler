import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useBridge } from "../../lib/bridge-context.js";
import { CollapsiblePanel } from "../../components/shared/CollapsiblePanel.js";
import { Skeleton } from "../../components/ui/skeleton.js";
import { GlassCard } from "@/components/ui/glass-card.js";
import { CardContent } from "../../components/ui/card.js";
import { useWorldMapController } from "../../components/world-map/useWorldMapController.js";
import { useMinWidth } from "../../lib/use-min-width.js";
import { humanizeId } from "../../lib/humanize-id.js";
import type { Screen } from "../../shell/campaign-screen-registry.js";
import { useMonthHistory } from "../../shell/CampaignShellContext.js";
import { useDensity } from "../../shell/DensityContext.js";
import { DEBUG_MODE } from "../../shell/debug-flag.js";
import {
  applyLoadFailed,
  applyProjectionLoaded,
  initialOverviewScreenState,
  monthLabel,
} from "./overview-screen-state.js";
import { MonthReportCard } from "./MonthReportCard.js";
import { NationRail } from "./NationRail.js";
import { PrioritiesCard } from "./PrioritiesCard.js";
import { useNationRail } from "./useNationRail.js";
import { usePriorities } from "./usePriorities.js";

// The map (Canvas renderer + 2 MB coastline) is the heaviest thing on the home screen, so it loads
// lazily and never delays the panels.
const WorldMapChart = lazy(() =>
  import("../../components/world-map/WorldMapChart.js").then((module) => ({
    default: module.WorldMapChart,
  })),
);

/** Below this width the panels stack under the map instead of floating over it (CC-9). */
export const COMMAND_OVERLAY_MIN_WIDTH = 1024;

export interface OverviewScreenProps {
  readonly sessionId: string;
  readonly onNavigate: (screen: Screen) => void;
}

/**
 * The campaign command screen (CC-1, CC-2): a full-bleed world map with collapsible panels floating
 * at its edges (areas and layers at the left, month report and priorities under them, the nation rail
 * at the right). Budget and nation figures live in the status strip. Under 1024 px the map comes
 * first and the same panels stack beneath it.
 */
export function OverviewScreen({ sessionId, onNavigate }: OverviewScreenProps) {
  const priorities = usePriorities(sessionId);
  const nationRail = useNationRail(sessionId);
  const monthHistory = useMonthHistory();
  const map = useWorldMapController(sessionId);
  const { density } = useDensity();
  const wide = useMinWidth(COMMAND_OVERLAY_MIN_WIDTH);
  const bridge = useBridge();
  const [state, setState] = useState(initialOverviewScreenState);

  const loadScreen = useCallback(async () => {
    if (bridge === undefined) {
      setState((current) => applyLoadFailed(current, "Bluewave bridge not available"));
      return;
    }
    const result = await bridge.campaign.execute("inspectCampaign", sessionId);
    if (result.outcome !== "success") {
      setState((current) => applyLoadFailed(current, result.reason));
      return;
    }
    setState((current) => applyProjectionLoaded(current, result.value.projection));
  }, [bridge, sessionId]);

  useEffect(() => {
    void loadScreen();
  }, [loadScreen]);

  const { projection, loadError } = state;

  if (loadError !== null) {
    return (
      <div data-guided-target="overview" className="p-8">
        <GlassCard glassVariant="liquid-refract" className="border-destructive/50">
          <CardContent className="p-4 text-destructive">
            Failed to load campaign overview: {loadError}
          </CardContent>
        </GlassCard>
      </div>
    );
  }

  if (projection === null) {
    return (
      <div data-guided-target="overview" className="h-full min-h-[28rem] p-3">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    );
  }

  const areaNames = new Map(projection.strategicAreas.map((area) => [area.id, area.name]));
  const areaName = (id: string): string => areaNames.get(id) ?? humanizeId(id);

  // Compact density keeps every panel collapsed until the player opens it.
  const roomy = density !== "compact";
  const priorityCount = priorities.status === "ready" ? priorities.priorities.length : null;

  const monthReport = (
    <CollapsiblePanel
      panelId="home-month-report"
      title="Recent developments"
      defaultOpen={roomy && monthHistory.length > 0}
      testId="home-month-report"
    >
      <MonthReportCard history={monthHistory} areaName={areaName} embedded />
    </CollapsiblePanel>
  );
  const prioritiesPanel = (
    <CollapsiblePanel
      panelId="home-priorities"
      title="Immediate priorities"
      badge={priorityCount === null ? undefined : `(${priorityCount})`}
      defaultOpen={roomy}
      testId="home-priorities"
    >
      <PrioritiesCard state={priorities} onNavigate={onNavigate} embedded />
    </CollapsiblePanel>
  );
  const nationsPanel = (
    <CollapsiblePanel
      panelId="home-nations"
      title="Nations"
      defaultOpen={roomy}
      testId="home-nations"
    >
      <NationRail
        state={nationRail}
        playerName={projection.nationName}
        onNavigate={onNavigate}
        embedded
      />
    </CollapsiblePanel>
  );

  const heading = (
    <>
      <h1 className="sr-only">
        Campaign Overview, {monthLabel(projection.month)}
        {DEBUG_MODE && ` · Revision ${projection.revision} · Session ${sessionId}`}
      </h1>
      <p className="sr-only">{projection.campaignIdentity}</p>
    </>
  );

  if (wide) {
    return (
      <div data-guided-target="overview" className="relative h-full min-h-[28rem]">
        {heading}
        <Suspense fallback={<Skeleton className="h-full w-full" />}>
          <WorldMapChart
            className="h-full"
            variant="command"
            showMinimap={false}
            treeDefaultOpen={false}
            leftPanels={
              <>
                {prioritiesPanel}
                {monthReport}
              </>
            }
            rightPanels={nationsPanel}
            {...map}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div data-guided-target="overview" className="flex flex-col gap-3 p-3">
      {heading}
      <div className="h-[60vh] min-h-[22rem]">
        <Suspense fallback={<Skeleton className="h-full w-full rounded-lg" />}>
          <WorldMapChart className="h-full" variant="panel" {...map} />
        </Suspense>
      </div>
      {prioritiesPanel}
      {monthReport}
      {nationsPanel}
    </div>
  );
}
