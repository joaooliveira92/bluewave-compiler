import { useId, type ReactNode } from "react";
import { ArrowRight, X } from "lucide-react";
import type { Finding } from "@bluewave/ship-design";
import { Badge } from "../../../../components/ui/badge.js";
import { Button } from "../../../../components/ui/button.js";
import { sectionFacts, SECTIONS } from "../panels/hull-plan/sections.js";
import {
  entityFindings,
  fittingFacts,
  machineryRooms,
  sectionOfZone,
  type EntityContext,
} from "./facts.js";
import { destinationFor, type Destination } from "./navigation.js";
import type { ShipEntity } from "./store.js";
import { useSelectionStore, useShipSelection } from "./useShipSelection.js";

const num = (v: number, digits = 0) =>
  v.toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const pct = (bp: number) => `${num(bp / 100)}%`;
const tonnes = (kg: number | undefined) =>
  kg === undefined ? undefined : `${num(kg / 1000, 1)} t`;
const SIDE = { CENTRE: "centreline", PORT: "port", STBD: "starboard" } as const;
/** Shown wherever the design model has no value: explicit, never blank or guessed. */
const UNAVAILABLE = "Not available for this design";
const FINDINGS_MAX = 3;

function Facts({ rows }: { readonly rows: readonly (readonly [string, ReactNode | undefined])[] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs tabular-nums">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd>{value ?? <span className="text-muted-foreground">{UNAVAILABLE}</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

function Findings({
  findings,
  subject,
}: {
  readonly findings: readonly Finding[];
  readonly subject: string;
}) {
  if (findings.length === 0)
    return <p className="text-xs text-muted-foreground">No findings name this {subject}.</p>;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium">Findings that name this {subject}</p>
      <ul className="space-y-1 text-xs">
        {findings.slice(0, FINDINGS_MAX).map((f) => (
          <li key={`${f.id}-${f.what}`} className="flex items-start gap-2">
            <Badge variant={f.severity === "ADVISORY" ? "outline" : "destructive"}>
              {f.severity}
            </Badge>
            <span>{f.what}</span>
          </li>
        ))}
        {findings.length > FINDINGS_MAX && (
          <li className="text-muted-foreground">
            and {findings.length - FINDINGS_MAX} more on the Analysis tab
          </li>
        )}
      </ul>
    </div>
  );
}

/** A selectable item in the inspector's lists: the keyboard route to fittings and rooms of a section. */
function SelectLink({
  entity,
  children,
}: {
  readonly entity: ShipEntity;
  readonly children: ReactNode;
}) {
  const store = useSelectionStore();
  return (
    <button
      type="button"
      className="rounded-sm text-left underline decoration-dotted underline-offset-2 outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      onClick={() => store.select(entity)}
    >
      {children}
    </button>
  );
}

interface Body {
  readonly kind: string;
  readonly title: string;
  readonly subject: string;
  readonly content: ReactNode;
  readonly findings: readonly Finding[];
}

function bodyFor(entity: ShipEntity, ctx: EntityContext): Body | null {
  switch (entity.kind) {
    case "section": {
      const f = sectionFacts(entity.id, ctx);
      const z = f.zone;
      return {
        kind: "Section",
        title: f.meta.name,
        subject: "section",
        findings: entityFindings(entity, ctx),
        content: (
          <div className="space-y-2">
            <Facts
              rows={[
                [
                  "Range",
                  z &&
                    `${z.startPermille}–${z.endPermille}‰ · ${num(f.fromBowM, 1)}–${num(f.fromBowM + f.lengthM, 1)} m from the bow`,
                ],
                ["Weight fitted", tonnes(f.load?.weightKg)],
                [
                  "Internal volume",
                  f.load &&
                    `${num(f.load.volumeUsedLitre / 1000)} of ${num(f.load.volumeCapacityLitre / 1000)} m³ used`,
                ],
                [
                  "Deck area",
                  f.load &&
                    `${num(f.load.deckUsedMm2 / 1e6)} of ${num(f.load.deckCapacityMm2 / 1e6)} m² used`,
                ],
                [
                  "Machinery",
                  f.machineryRooms.length === 0
                    ? "None in this section"
                    : f.machineryRooms.map((r) => {
                        const index = machineryRooms(ctx.draft).findIndex(
                          (x) =>
                            x.stationPermille === r.stationPermille &&
                            x.zoneId === SECTIONS[entity.id].zoneId,
                        );
                        return (
                          <span key={r.stationPermille} className="mr-2">
                            <SelectLink entity={{ kind: "machinery-room", index }}>
                              Room at {r.stationPermille}‰
                            </SelectLink>{" "}
                            ({pct(r.shareBp)} of plant)
                          </span>
                        );
                      }),
                ],
                [
                  "Fuel",
                  f.fuelStationPermille === undefined
                    ? "Not stowed in this section"
                    : `Bunkers at ${f.fuelStationPermille}‰`,
                ],
              ]}
            />
            {f.fittings.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No fittings are placed in this section.
              </p>
            ) : (
              <ul
                className="flex flex-wrap gap-x-3 gap-y-1 text-xs"
                aria-label="Fittings in this section"
              >
                {f.fittings.map((x) => (
                  <li key={x.instanceId}>
                    <SelectLink entity={{ kind: "fitting", instanceId: x.instanceId }}>
                      {x.name}
                    </SelectLink>{" "}
                    <span className="text-muted-foreground">({x.instanceId})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ),
      };
    }
    case "fitting": {
      const f = fittingFacts(entity.instanceId, ctx);
      if (!f) return null;
      const armed = f.kind === "gun" || f.kind === "torpedo";
      return {
        kind: "Fitting",
        title: f.battery ? `${f.name} · mount ${f.battery.mount}` : f.name,
        subject: "fitting",
        findings: f.findings,
        content: (
          <Facts
            rows={[
              ["Type", f.category],
              [
                "Battery",
                f.battery ? f.battery.title : armed ? undefined : "Not part of a battery",
              ],
              [
                "Position",
                `${f.section ? SECTIONS[f.section].name : "Outside the drawn sections"} · ${f.stationPermille}‰ · ${SIDE[f.side]}`,
              ],
              ["Weight", tonnes(f.weightKg)],
              ...(armed
                ? ([
                    [
                      "Magazine",
                      f.magazine ? `${f.magazine.name} (${f.magazine.instanceId})` : undefined,
                    ],
                    ["Beam arc", f.arcDeg === undefined ? undefined : `${num(f.arcDeg)}°`],
                  ] as const)
                : []),
              ...(f.kind === "magazine"
                ? ([
                    [
                      "Protection margin",
                      f.protectionBp === undefined ? undefined : pct(f.protectionBp),
                    ],
                  ] as const)
                : []),
            ]}
          />
        ),
      };
    }
    case "machinery-room": {
      const room = machineryRooms(ctx.draft)[entity.index];
      if (!room) return null;
      const section = sectionOfZone(room.zoneId);
      return {
        kind: "Machinery room",
        title: `Machinery room ${entity.index + 1}`,
        subject: "room",
        findings: [],
        content: (
          <Facts
            rows={[
              ["Plant", ctx.draft.machinery.plantId.replaceAll("_", " ")],
              ["Section", section ? SECTIONS[section].name : undefined],
              ["Station", `${room.stationPermille}‰`],
              ["Share of plant", pct(room.shareBp)],
            ]}
          />
        ),
      };
    }
  }
}

/**
 * Compact facts about the pinned ship element, above the active tab. Read-only: the full controls stay in the
 * forms, reached with the "Go to … settings" action.
 */
export function SelectionInspector({
  ctx,
  onGoTo,
  onClear,
}: {
  readonly ctx: EntityContext;
  readonly onGoTo: (d: Destination) => void;
  readonly onClear: () => void;
}) {
  const selected = useShipSelection((s) => s.selected);
  const headingId = useId();
  if (selected === null) return null;
  const body = bodyFor(selected, ctx);
  if (!body) return null;
  const destination = destinationFor(selected, ctx);
  return (
    <section
      aria-labelledby={headingId}
      data-testid="selection-inspector"
      data-selection-scope=""
      className="mt-3 space-y-2 rounded-lg border border-primary/40 bg-card p-3 text-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">Selected {body.kind.toLowerCase()}</p>
          <h2 id={headingId} className="font-medium">
            {body.title}
          </h2>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Clear selection" onClick={onClear}>
          <X aria-hidden="true" />
        </Button>
      </div>
      {body.content}
      <Findings findings={body.findings} subject={body.subject} />
      {destination && (
        <Button variant="outline" size="sm" onClick={() => onGoTo(destination)}>
          {destination.label}
          <ArrowRight aria-hidden="true" className="ml-1 size-4" />
        </Button>
      )}
    </section>
  );
}
