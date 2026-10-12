import {
  evaluateShipTypeAvailability,
  isShipTypeId,
  SHIP_TYPE_LIST,
  SHIP_TYPES,
  type DesignDraft,
  type ShipContext,
  type WorkshopView,
} from "@bluewave/ship-design";
import type { ReactNode } from "react";
import { Badge } from "../../ui/badge.js";
import { shipTypeIcon } from "../ship-type-icon.js";
import { NumberField, SelectField } from "../fields.js";
import { CATEGORY_LABEL } from "../shipTypes.js";
import { Panel } from "./Panel.js";
import type { Edit } from "./types.js";

/** The design brief: the ship type the design must qualify as, and the speed and range it is judged against. */
export function BriefPanel({
  draft,
  view,
  edit,
  ctx,
}: {
  readonly draft: DesignDraft;
  readonly view: WorkshopView;
  readonly edit: Edit;
  /** The rules context of the board's month, for which ship types are offered. */
  readonly ctx: ShipContext;
}) {
  const r = draft.requirement;
  const icon = (t: string) => {
    const Icon = shipTypeIcon(t);
    return <Icon className="h-4 w-4" aria-hidden="true" />;
  };
  // Only the types the campaign allows now are offered (the application convention omits what is unavailable). A
  // type outside that set (an authored brief, a stale draft) stays listed and marked, so the control never lies
  // about the draft and the finding next to it explains why it cannot be built.
  const offered = SHIP_TYPE_LIST.filter(
    (t) =>
      evaluateShipTypeAvailability(t.id, {
        month: ctx.month,
        unlockedTechs: ctx.unlockedTechs,
        capabilities: ctx.capabilities,
        restrictedTypes: ctx.restrictedShipTypes,
      }).available,
  );
  const options: {
    readonly value: string;
    readonly label: string;
    readonly icon: ReactNode;
    readonly description?: string;
  }[] = offered.map((t) => ({
    value: t.id,
    label: `${t.id} · ${t.name}`,
    icon: icon(t.id),
    description: `${CATEGORY_LABEL[t.category]}. ${t.recommendedUse}`,
  }));
  if (!offered.some((t) => t.id === r.category))
    options.unshift({
      value: r.category,
      label: isShipTypeId(r.category)
        ? `${r.category} · ${SHIP_TYPES[r.category].name} (not available)`
        : `${r.category} (unknown type)`,
      icon: icon(r.category),
    });
  // Findings about the brief itself (type unavailable, classification) sit next to the control that fixes them.
  const briefFindings = [
    ...view.findingsBySeverity.BLOCKING,
    ...view.findingsBySeverity.CRITICAL,
    ...view.findingsBySeverity.WARNING,
    ...view.findingsBySeverity.ADVISORY,
  ].filter((f) => f.subject?.settings === "brief");
  const mismatch = view.naturalClass !== null && view.naturalClass !== r.category;
  return (
    <Panel title="Design brief">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Class code</span>
        <Badge
          variant="outline"
          className="tabular-nums"
          aria-label={`Class code ${view.classCode}`}
        >
          {view.classCode}
        </Badge>
        <span className="text-muted-foreground">Natural class</span>
        <Badge variant={mismatch ? "destructive" : "secondary"}>
          {view.naturalClass ?? "none"}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Ship type"
          className="col-span-2"
          value={r.category}
          options={options}
          onChange={(v) => edit({ kind: "set_requirement", patch: { category: v } })}
        />
        <NumberField
          label="Required top speed"
          unit="kn"
          value={r.requiredSpeedMilliKnots}
          scale={1000}
          decimals={1}
          onCommit={(v) => edit({ kind: "set_requirement", patch: { requiredSpeedMilliKnots: v } })}
        />
        <NumberField
          label="Cruising speed"
          unit="kn"
          value={r.cruiseSpeedMilliKnots}
          scale={1000}
          decimals={1}
          onCommit={(v) => edit({ kind: "set_requirement", patch: { cruiseSpeedMilliKnots: v } })}
        />
        <NumberField
          label="Required range"
          unit="nm"
          value={r.requiredRangeNm}
          onCommit={(v) => edit({ kind: "set_requirement", patch: { requiredRangeNm: v } })}
        />
      </div>
      {briefFindings.length > 0 && (
        <ul aria-label="Findings about the ship type" className="space-y-1 text-xs">
          {briefFindings.map((f, i) => (
            <li key={`${f.id}-${i}`}>
              <span className="font-medium">
                {f.severity === "BLOCKING"
                  ? "Blocking: "
                  : `${f.severity[0]}${f.severity.slice(1).toLowerCase()}: `}
              </span>
              {f.what} {f.why}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        The type is what the ship must qualify as. A design that does not meet its type cannot be
        built; the natural class is the type it would actually qualify as.
      </p>
    </Panel>
  );
}
