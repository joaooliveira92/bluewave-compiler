import type { DesignRequirement } from "@bluewave/ship-design";
import { Target } from "lucide-react";
import { Badge } from "../../../components/ui/badge.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover.js";
import { cn } from "../../../lib/utils.js";

const words = (s: string) => s.replaceAll("_", " ").toLowerCase();

/** The design brief as a compact chip; opening it shows every requirement the design is judged against. */
export function RequirementChip({
  requirement: r,
  className,
}: {
  readonly requirement: DesignRequirement;
  readonly className?: string;
}) {
  const rows: [string, string][] = [
    ["Class", r.category],
    ["Top speed", `${(r.requiredSpeedMilliKnots / 1000).toFixed(1)} kn`],
    ["Cruising speed", `${(r.cruiseSpeedMilliKnots / 1000).toFixed(1)} kn`],
    ["Range", `${r.requiredRangeNm.toLocaleString("en-US")} nm`],
    ["Designed against", words(r.designThreatId)],
    ["Expected modernisation", words(r.modernizationExpectation)],
    ["Crew quality", `${(r.crewQualityBp / 100).toFixed(0)}%`],
    ["Accommodation", words(r.accommodationStandard)],
    ["Protection goal", words(r.protectionGoal ?? "STANDARD")],
  ];
  const summary = `${r.category} · ${(r.requiredSpeedMilliKnots / 1000).toFixed(1)} kn · ${r.requiredRangeNm.toLocaleString("en-US")} nm`;
  return (
    <Popover>
      <PopoverTrigger
        aria-label={`Design requirement: ${summary}`}
        render={<button type="button" />}
        className={cn(
          "flex rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <Badge variant="outline" className="h-full cursor-pointer gap-1">
          <Target aria-hidden="true" className="size-3" />
          {summary}
        </Badge>
      </PopoverTrigger>
      <PopoverContent aria-label="Design requirement" className="w-72 text-sm">
        <div className="mb-2 font-medium">Design requirement</div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </PopoverContent>
    </Popover>
  );
}
