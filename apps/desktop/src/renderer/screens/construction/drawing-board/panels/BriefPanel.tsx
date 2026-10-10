import {
  EARLY_SHIP_TYPES,
  type DesignDraft,
  type EarlyShipType,
  type WorkshopView,
} from "@bluewave/ship-design";
import type { ReactNode } from "react";
import { Badge } from "../../../../components/ui/badge.js";
import { shipTypeIcon } from "../../components/ship-type-icon.js";
import { NumberField, SelectField } from "../fields.js";
import { Panel } from "./Panel.js";
import type { Edit } from "./types.js";

/** Display names only: DESIGN-22 defines the codes, not the names. */
const TYPE_NAME: Record<EarlyShipType, string> = {
  BB: "Battleship",
  B: "Pre-dreadnought battleship",
  CA: "Armoured cruiser",
  CL: "Light cruiser",
  DD: "Destroyer",
};

/** One-line role of each type. General naval usage, not design data. */
const TYPE_ROLE: Record<EarlyShipType, string> = {
  BB: "The capital ship of the line: the heaviest guns and armour, and the fleet's centre of gravity.",
  B: "An early battleship: a mixed heavy and secondary battery, built for the battle line.",
  CA: "An armoured cruiser: fast and protected enough for the line, and a raider hunter on distant stations.",
  CL: "A light cruiser: a fast, lightly armoured scout and trade-protection cruiser.",
  DD: "A destroyer: a fast, lightly built torpedo craft and fleet screening vessel.",
};

/** The design brief: the ship type the design must qualify as, and the speed and range it is judged against. */
export function BriefPanel({
  draft,
  view,
  edit,
}: {
  readonly draft: DesignDraft;
  readonly view: WorkshopView;
  readonly edit: Edit;
}) {
  const r = draft.requirement;
  const icon = (t: string) => {
    const Icon = shipTypeIcon(t);
    return <Icon className="h-4 w-4" aria-hidden="true" />;
  };
  const options: {
    readonly value: string;
    readonly label: string;
    readonly icon: ReactNode;
    readonly description?: string;
  }[] = EARLY_SHIP_TYPES.map((t) => ({
    value: t,
    label: `${t} · ${TYPE_NAME[t]}`,
    icon: icon(t),
    description: TYPE_ROLE[t],
  }));
  // A type outside the early band (an authored brief) stays selectable so the control never lies about the draft.
  if (!(EARLY_SHIP_TYPES as readonly string[]).includes(r.category))
    options.unshift({ value: r.category, label: r.category, icon: icon(r.category) });
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
      <p className="text-xs text-muted-foreground">
        The type is what the ship must qualify as. A design that does not meet its type cannot be
        built; the natural class is the type it would actually qualify as.
      </p>
    </Panel>
  );
}
