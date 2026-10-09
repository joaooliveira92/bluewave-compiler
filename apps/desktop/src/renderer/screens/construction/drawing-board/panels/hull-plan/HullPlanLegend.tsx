import { Badge } from "../../../../../components/ui/badge.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../components/ui/popover.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../../../components/ui/tooltip.js";
import { type LegendEntry, type LegendSource } from "./legend.js";

const SOURCE_LABEL: Record<LegendSource, string> = {
  data: "Hull-form data",
  convention: "Drawing convention",
  mixed: "Data + convention",
};

/** One keyboard-reachable chip: hover or focus shows a one-line tooltip, activating it opens the details. */
function LegendChip({ entry }: { readonly entry: LegendEntry }) {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={<button type="button" />}
              aria-label={`${entry.title} (${entry.label}), explain`}
              className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          }
        >
          <Badge variant="outline" className="cursor-pointer text-xs">
            {entry.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top">{entry.tooltip}</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-72 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{entry.title}</span>
          <Badge variant="secondary" className="text-xs">
            {SOURCE_LABEL[entry.source]}
          </Badge>
        </div>
        {entry.rows.length > 0 && (
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
            {entry.rows.map(([key, value]) => (
              <div key={key} className="contents">
                <dt className="text-muted-foreground">{key}</dt>
                <dd className="text-right tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        )}
        <p className="text-xs text-muted-foreground">{entry.note}</p>
      </PopoverContent>
    </Popover>
  );
}

/** What each part of the drawings means, and whether it is data or a drawing convention. */
export function HullPlanLegend({ entries }: { readonly entries: readonly LegendEntry[] }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Drawing legend">
      {entries.map((entry) => (
        <LegendChip key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
