import { memo } from "react";
import type { ProjectRow } from "../project-progress.js";

export interface ProjectReadoutProps {
  readonly row: ProjectRow;
}

/** One label/value pair of a project's compiled cost and schedule readout. */
function ReadoutItem({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </li>
  );
}

/**
 * The compiled cost and schedule figures for one construction row (SB3-R31): the monthly instalment, remaining months,
 * total cost and launch month, plus the half-mothball carrying cost on a halted project (DESIGN-23 section 7). Every
 * figure is a compiled engine value rendered verbatim — this component derives and authors none of them. When the
 * projection carried no readout it says so; it never invents a zero or a completion.
 */
export const ProjectReadout = memo(function ProjectReadout({ row }: ProjectReadoutProps) {
  const readout = row.readout;
  return (
    <ul
      className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2 lg:grid-cols-4"
      aria-label={`${row.className} cost and schedule`}
    >
      {readout === null ? (
        <ReadoutItem label="Schedule" value="unavailable" />
      ) : (
        <>
          <ReadoutItem
            label="Instalment"
            value={`${readout.monthlyInstalmentUnits.toLocaleString()}/mo`}
          />
          <ReadoutItem label="Months left" value={readout.remainingMonths.toLocaleString()} />
          <ReadoutItem label="Total cost" value={readout.totalCostUnits.toLocaleString()} />
          <ReadoutItem label="Launch" value={readout.launchMonth ?? "complete"} />
          {readout.haltedCarryingCostUnits !== null && (
            <ReadoutItem
              label="Carrying cost"
              value={`${readout.haltedCarryingCostUnits.toLocaleString()}/mo`}
            />
          )}
        </>
      )}
    </ul>
  );
});
