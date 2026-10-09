import { CollapsiblePanel } from "../../../components/shared/CollapsiblePanel.js";
import type { MonthSummary } from "../../../lib/month-summary.js";
import { MonthReportCard } from "../MonthReportCard.js";

/**
 * The home screen's "Recent developments" panel: a collapsible host that owns
 * only the panel chrome. The card owns the month-report content and the screen
 * decides placement (CC-1, CC-2).
 */
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
