import {
  buildShipTypeRoster,
  nationProfileBrief,
  SHIP_TYPE_CATEGORIES,
  UNSIMULATED_ROLES,
  type RosterEntry,
  type StarterDesign,
  type WorkshopEnvironment,
} from "@bluewave/ship-design";
import { useMemo, useState } from "react";
import { Badge } from "../../ui/badge.js";
import { Button } from "../../ui/button.js";
import { plural } from "../plural.js";
import { CATEGORY_LABEL, describeRange } from "../shipTypes.js";
import { NationalIdentityPanel } from "./NationalIdentityPanel.js";
import { Panel } from "./Panel.js";

/** A relative 1-5 ordinal as text, so it never relies on a bar's colour or length alone. */
const LEVEL = ["Very low", "Low", "Moderate", "High", "Very high"] as const;
const level = (n: number): string => LEVEL[n - 1] ?? "Moderate";

/** The starter design's forecast build time as text. */
function months(n: number | null): string {
  return n === null ? "not forecast" : plural(n, "month");
}

function RosterRow({
  entry,
  current,
  onStart,
}: {
  readonly entry: RosterEntry;
  readonly current: boolean;
  readonly onStart: (starterId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const d = entry.definition;
  const detailsId = `ship-type-${d.id}-details`;
  const displacement = describeRange(entry.envelope.displacementKg, "t", 1000);
  const speed = describeRange(entry.envelope.speedKn, "kn");
  const starter = entry.starter;
  return (
    <li className="rounded-md border p-3" aria-current={current ? "true" : undefined}>
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-medium">
          {d.name} <span className="tabular-nums text-muted-foreground">({d.id})</span>
        </h4>
        {d.auxiliary && <Badge variant="outline">Auxiliary</Badge>}
        {current && <Badge variant="secondary">Current design</Badge>}
        <Badge variant="outline">Available</Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{d.recommendedUse}</p>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Relative cost</dt>
          <dd>{level(d.relativeCost)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Build time</dt>
          <dd>
            {level(d.relativeBuildTime)}
            {starter?.months != null && ` (${months(starter.months)})`}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Displacement</dt>
          <dd>{displacement ?? "Varies"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Speed</dt>
          <dd>{speed ?? "Varies"}</dd>
        </div>
      </dl>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          aria-expanded={open}
          aria-controls={detailsId}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide details" : `Details for ${d.name}`}
        </Button>
        <Button
          size="sm"
          disabled={starter === null || !starter.legal}
          onClick={() => starter !== null && onStart(starter.id)}
        >
          {starter === null ? "No starter design yet" : `Start from ${starter.name}`}
        </Button>
      </div>
      {open && (
        <div id={detailsId} className="mt-2 space-y-1 border-t pt-2 text-xs">
          <p>{d.description}</p>
          <p>
            <span className="text-muted-foreground">Armour: </span>
            {d.armourProfile}
          </p>
          <p>
            <span className="text-muted-foreground">Armament: </span>
            {d.armamentProfile}
          </p>
          <p>
            <span className="text-muted-foreground">Weaknesses: </span>
            {d.weaknesses}
          </p>
          <p>
            <span className="text-muted-foreground">Roles: </span>
            {d.roles.map((r) => r.replaceAll("_", " ").toLowerCase()).join(", ")}
          </p>
          {d.roles.some((r) => UNSIMULATED_ROLES.includes(r)) && (
            <p>
              <span className="text-muted-foreground">Not yet simulated: </span>
              {d.roles
                .filter((r) => UNSIMULATED_ROLES.includes(r))
                .map((r) => r.replaceAll("_", " ").toLowerCase())
                .join(", ")}
              . The campaign does not model these missions yet.
            </p>
          )}
          <p className="text-muted-foreground">
            {d.torpedoes === "REQUIRED"
              ? "Torpedoes are mandatory."
              : d.torpedoes === "PROHIBITED"
                ? "Torpedoes are not allowed."
                : "Torpedoes are optional."}{" "}
            The starter design is a legal starting point, not an optimal one.
          </p>
        </div>
      )}
    </li>
  );
}

/**
 * The ship-type roster: the types the campaign allows now, grouped by category, comparable at a glance with the
 * rule detail one step away. Locked future types are not listed (the application convention is to omit what is
 * unavailable); a single line says more arrive with later eras. Every number is read from the domain registry and
 * the compile, never restated here.
 */
export function ShipTypePanel({
  env,
  starters,
  currentCategory,
  onStart,
}: {
  readonly env: WorkshopEnvironment;
  readonly starters: readonly StarterDesign[];
  readonly currentCategory: string;
  readonly onStart: (starterId: string) => void;
}) {
  const roster = useMemo(() => buildShipTypeRoster(env, starters), [env, starters]);
  const available = roster.filter((e) => e.availability.available);
  const lockedCount = roster.length - available.length;
  const profile = env.ctx.navalProfile;
  return (
    <>
      {profile !== undefined && <NationalIdentityPanel brief={nationProfileBrief(profile)} />}
      <Panel title="Ship types">
        <p className="text-xs text-muted-foreground">
          Choose a type to start from its starter design. Starter designs are balanced starting
          points: edit them freely.
        </p>
        {SHIP_TYPE_CATEGORIES.map((cat) => {
          const rows = available.filter((e) => e.definition.category === cat);
          if (rows.length === 0) return null;
          const headingId = `ship-type-group-${cat}`;
          return (
            <section key={cat} aria-labelledby={headingId} className="space-y-2">
              <h3 id={headingId} className="text-xs font-semibold uppercase text-muted-foreground">
                {CATEGORY_LABEL[cat]}
              </h3>
              <ul className="space-y-2">
                {rows.map((e) => (
                  <RosterRow
                    key={e.definition.id}
                    entry={e}
                    current={e.definition.id === currentCategory}
                    onStart={onStart}
                  />
                ))}
              </ul>
            </section>
          );
        })}
        {lockedCount > 0 && (
          <p className="text-xs text-muted-foreground">
            Other kinds of ship are not available in this era.
          </p>
        )}
      </Panel>
    </>
  );
}
