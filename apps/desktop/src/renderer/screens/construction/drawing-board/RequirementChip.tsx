import type { DesignRequirement } from "@bluewave/ship-design";
import { Badge } from "../../../components/ui/badge.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover.js";

const words = (s: string) => s.replaceAll("_", " ").toLowerCase();

/** The design brief as a compact chip; opening it shows every requirement the design is judged against. */
export function RequirementChip({ requirement: r }: { readonly requirement: DesignRequirement }) {
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
  return (
    <Popover>
      <PopoverTrigger
        aria-label="Design requirement"
        render={<button type="button" />}
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Badge variant="outline" className="cursor-pointer">
          Requirement: {r.category} · {(r.requiredSpeedMilliKnots / 1000).toFixed(1)} kn ·{" "}
          {r.requiredRangeNm.toLocaleString("en-US")} nm
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-72 text-sm">
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
