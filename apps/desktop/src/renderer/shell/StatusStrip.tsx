import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import type { PlayerProjection } from "@bluewave/campaign-engine";
import { cn } from "../lib/utils.js";
import { useDensity } from "./DensityContext.js";
import {
  buildStatusStrip,
  NOT_YET_MODELLED,
  type StatusStripAreas,
  type StatusStripModel,
  type StripRow,
} from "./status-strip-state.js";

function StatusBadge({ status }: { readonly status: string }) {
  return <span className="ml-1.5 rounded border px-1 font-semibold uppercase">{status}</span>;
}

/** A dense stacked cell: label over value. Only real and derived rows use it. */
function Cell({ row }: { readonly row: StripRow }) {
  return (
    <div
      data-row={row.id}
      data-tone={row.tone}
      data-deferred={row.deferred}
      title={row.note === "" ? undefined : row.note}
      className="flex min-w-0 flex-col text-xs leading-tight"
    >
      <span className="truncate text-muted-foreground">{row.label}</span>
      <span
        className={cn(
          "tabular-nums font-medium",
          row.tone === "alert" && "font-semibold text-destructive",
        )}
      >
        {row.value}
        {row.status !== undefined && <StatusBadge status={row.status} />}
      </span>
    </div>
  );
}

function DeferredRow({ row }: { readonly row: StripRow }) {
  return (
    <li
      data-row={row.id}
      data-tone={row.tone}
      data-deferred={row.deferred}
      className="flex flex-col py-0.5 text-xs leading-tight"
    >
      <span className="font-medium">{row.label}</span>
      <span className="text-muted-foreground">{row.note}</span>
    </li>
  );
}

function Group({
  name,
  rows,
  className,
}: {
  readonly name: string;
  readonly rows: readonly StripRow[];
  readonly className: string;
}) {
  return (
    <div role="group" aria-label={name} className="flex min-w-0 items-start gap-3">
      <h3 className="w-12 shrink-0 text-xs font-semibold uppercase tracking-wide">{name}</h3>
      <div className={cn("grid min-w-0 gap-x-5 gap-y-0.5", className)}>
        {rows.map((row) => (
          <Cell key={row.id} row={row} />
        ))}
      </div>
    </div>
  );
}

/** One disclosure for every deferred row; the list floats above the strip so it never grows it. */
function DeferredDisclosure({ rows }: { readonly rows: readonly StripRow[] }) {
  const [open, setOpen] = useState(false);
  if (rows.length === 0) return null;
  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="status-strip-deferred"
        onClick={() => setOpen(!open)}
        className="flex min-h-6 items-center gap-1 rounded px-1.5 text-xs outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
      >
        {open ? (
          <ChevronDown className="size-3.5" aria-hidden="true" />
        ) : (
          <ChevronUp className="size-3.5" aria-hidden="true" />
        )}
        <span>
          {NOT_YET_MODELLED} ({rows.length})
        </span>
      </button>
      {open && (
        <ul
          id="status-strip-deferred"
          aria-label={NOT_YET_MODELLED}
          className="absolute bottom-full right-0 z-20 mb-1 max-h-[50svh] w-80 divide-y overflow-y-auto rounded-md border bg-background p-2 shadow-md"
        >
          {rows.map((row) => (
            <DeferredRow key={row.id} row={row} />
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * The collapsible bottom status strip. Expanded it shows the real Nation and Budget readouts in one dense band, with deferred rows behind one disclosure; collapsed
 * (the default in compact density) it is one line: balance, treasury, alerts. The deficit is
 * spelled out in text so colour is never the only signal.
 */
export function StatusStripView({ model }: { readonly model: StatusStripModel }) {
  const { density } = useDensity();
  const [chosen, setChosen] = useState<boolean | null>(null);
  const expanded = chosen ?? density !== "compact";
  const { summary } = model;

  return (
    <section
      aria-label="Status strip"
      data-testid="status-strip"
      data-expanded={expanded}
      className="relative shrink-0 border-t bg-background/70 px-3 py-1 backdrop-blur-md supports-[backdrop-filter]:bg-background/60"
    >
      <div className="flex items-center gap-4 text-xs">
        {!expanded && (
          <p className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-4 gap-y-0">
            <span data-tone={summary.balance.tone}>
              <span className="text-muted-foreground">Balance </span>
              <span
                className={cn(
                  "tabular-nums font-medium",
                  summary.balance.tone === "alert" && "font-semibold text-destructive",
                )}
              >
                {summary.balance.value}
              </span>{" "}
              <span className="font-semibold uppercase">{summary.balance.status}</span>
            </span>
            <span>
              <span className="text-muted-foreground">Treasury </span>
              <span className="tabular-nums font-medium">{summary.treasury}</span>
            </span>
            <span>{summary.alerts}</span>
          </p>
        )}
        {expanded && <span className="flex-1 font-semibold">Status</span>}
        <DeferredDisclosure rows={model.deferredRows} />
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse status strip" : "Expand status strip"}
          onClick={() => setChosen(!expanded)}
          className="flex min-h-6 items-center gap-1 rounded px-1.5 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        >
          {expanded ? (
            <ChevronDown className="size-3.5" aria-hidden="true" />
          ) : (
            <ChevronUp className="size-3.5" aria-hidden="true" />
          )}
          <span>{expanded ? "Collapse" : "Expand"}</span>
        </button>
      </div>
      {expanded && (
        <div className="flex flex-wrap items-start gap-x-8 gap-y-1 pb-0.5">
          <Group
            name="Nation"
            rows={model.nation.filter((r) => !r.deferred)}
            className="grid-cols-2"
          />
          <Group
            name="Budget"
            rows={model.budget.filter((r) => !r.deferred)}
            className="grid-cols-4"
          />
        </div>
      )}
    </section>
  );
}

interface StripData {
  readonly projection: PlayerProjection;
  readonly areas: StatusStripAreas | null;
}

export interface StatusStripProps {
  readonly sessionId: string;
  /** Changes whenever the campaign advances, so the strip re-reads the engine. */
  readonly revision: number;
  readonly alertsCount: number | null;
}

/** Reads the engine views the strip needs and renders it; renders nothing until they load. */
export function StatusStrip({ sessionId, revision, alertsCount }: StatusStripProps) {
  const [data, setData] = useState<StripData | null>(null);

  useEffect(() => {
    const bridge = window.bluewave;
    if (bridge === undefined) return;
    let active = true;
    async function load(): Promise<void> {
      try {
        const [campaign, map] = await Promise.all([
          bridge!.campaign.execute("inspectCampaign", sessionId),
          bridge!.campaign.execute("inspectMap", sessionId).catch(() => null),
        ]);
        if (!active || campaign.outcome !== "success") return;
        setData({
          projection: campaign.value.projection,
          areas: map !== null && map.outcome === "success" ? map.value.world.areas : null,
        });
      } catch {
        // The strip is supplementary: stay hidden rather than show a made-up number.
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [sessionId, revision]);

  if (data === null) return null;
  return <StatusStripView model={buildStatusStrip({ ...data, alertsCount })} />;
}
