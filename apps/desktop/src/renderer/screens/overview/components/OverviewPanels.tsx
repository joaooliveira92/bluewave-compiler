import type { MonthSummary } from "../../../lib/month-summary.js";
import type { Screen } from "../../../shell/campaign-screen-registry.js";
import { CollapsiblePanel } from "../../../components/shared/CollapsiblePanel.js";
import { MonthReportCard } from "../MonthReportCard.js";
import { NationRail } from "../NationRail.js";
import { PrioritiesCard } from "../PrioritiesCard.js";
import type { NationRailLoad } from "../useNationRail.js";
import type { PrioritiesState } from "../usePriorities.js";

/**
 * The three home-screen panels, as collapsible hosts for the embedded cards.
 * Split from the screen so each panel owns only its chrome, title and badge;
 * the screen decides placement (map overlay vs stacked) and default openness.
 */

export function OverviewPrioritiesPanel({
  state,
  priorityCount,
  defaultOpen,
  onNavigate,
}: {
  readonly state: PrioritiesState;
  readonly priorityCount: number | null;
  readonly defaultOpen: boolean;
  readonly onNavigate: (screen: Screen) => void;
}) {
  return (
    <CollapsiblePanel
      panelId="home-priorities"
      title="Immediate priorities"
      badge={priorityCount === null ? undefined : `(${priorityCount})`}
      defaultOpen={defaultOpen}
      testId="home-priorities"
    >
      <PrioritiesCard state={state} onNavigate={onNavigate} embedded />
    </CollapsiblePanel>
  );
}

export function OverviewMonthReportPanel({
  history,
  areaName,
  defaultOpen,
}: {
  readonly history: readonly MonthSummary[];
  readonly areaName: (id: string) => string;
  readonly defaultOpen: boolean;
}) {
  return (
    <CollapsiblePanel
      panelId="home-month-report"
      title="Recent developments"
      defaultOpen={defaultOpen}
      testId="home-month-report"
    >
      <MonthReportCard history={history} areaName={areaName} embedded />
    </CollapsiblePanel>
  );
}

export function OverviewNationsPanel({
  state,
  playerName,
  defaultOpen,
  onNavigate,
}: {
  readonly state: NationRailLoad;
  readonly playerName: string;
  readonly defaultOpen: boolean;
  readonly onNavigate: (screen: Screen) => void;
}) {
  return (
    <CollapsiblePanel
      panelId="home-nations"
      title="Nations"
      defaultOpen={defaultOpen}
      testId="home-nations"
    >
      <NationRail state={state} playerName={playerName} onNavigate={onNavigate} embedded />
    </CollapsiblePanel>
  );
}
