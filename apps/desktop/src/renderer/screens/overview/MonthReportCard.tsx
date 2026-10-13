import { Info } from "lucide-react";
import { campaignNationLabel } from "../../content/presentationContent.js";
import { CardShell } from "../../components/shared/CardShell.js";
import { CardDescription, CardTitle } from "../../components/ui/card.js";
import { humanizeId } from "../../lib/humanize-id.js";
import type { MonthSummary } from "../../lib/month-summary.js";
import { describeBattle, monthLabel, progressLine, signed } from "./month-report-format.js";

function Report({
  summary,
  areaName,
}: {
  readonly summary: MonthSummary;
  readonly areaName: (id: string) => string;
}) {
  const progress = progressLine(summary);
  return (
    <div className="space-y-2">
      <p className="font-medium">
        Treasury {summary.openingTreasury.toLocaleString()} →{" "}
        {summary.closingTreasury.toLocaleString()}{" "}
        <span className={summary.netChange < 0 ? "text-destructive" : "text-success"}>
          ({signed(summary.netChange)})
        </span>
      </p>
      <p className="text-muted-foreground">
        Fleet maintenance {summary.maintenanceCost.toLocaleString()} · New construction{" "}
        {summary.constructionSpending.toLocaleString()}
      </p>
      {progress !== null && <p>{progress}</p>}
      {summary.battles.length > 0 && (
        <ul className="space-y-1" aria-label="Battles this month">
          {summary.battles.map((battle) => (
            <li key={battle.battleId}>{describeBattle(battle, campaignNationLabel, areaName)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * What happened when you last advanced the month, plus the months before it in this session.
 * The history lives in memory only (the engine keeps no month history yet), and the card says so.
 */
export function MonthReportCard({
  history,
  areaName = humanizeId,
  embedded = false,
}: {
  readonly history: readonly MonthSummary[];
  readonly areaName?: (id: string) => string;
  /** Render only the body (a host panel supplies the chrome and title). */
  readonly embedded?: boolean;
}) {
  const [latest, ...earlier] = history;
  const description =
    latest === undefined
      ? "The monthly report appears here after you advance the month."
      : `Report for ${monthLabel(latest.month)}.`;
  return (
    <CardShell
      testId="month-report-card"
      embedded={embedded}
      header={
        <>
          <CardTitle className="flex items-center gap-1.5 text-sm font-medium">
            <Info className="h-4 w-4 text-muted-foreground" />
            Recent Developments
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </>
      }
      contentClassName="space-y-3 text-xs"
    >
      {embedded && <p className="text-muted-foreground">{description}</p>}
      {latest === undefined ? (
        <p className="text-muted-foreground">No months have been advanced yet this session.</p>
      ) : (
        <Report summary={latest} areaName={areaName} />
      )}
      {earlier.length > 0 && (
        <details>
          <summary className="cursor-pointer text-muted-foreground">
            Earlier months this session ({earlier.length})
          </summary>
          <ul className="mt-2 space-y-3">
            {earlier.map((summary) => (
              <li key={`${summary.month.year}-${summary.month.month}`} className="space-y-1">
                <p className="font-medium">{monthLabel(summary.month)}</p>
                <Report summary={summary} areaName={areaName} />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-muted-foreground">History is kept while the app is open.</p>
        </details>
      )}
    </CardShell>
  );
}
