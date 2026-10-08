import { useState } from "react";
import {
  bp,
  kg,
  mm,
  ZONE_IDS,
  type ComponentDef,
  type DesignDraft,
  type DraftEdit,
  type Finding,
  type Candidate,
  type Severity,
  type SuggestedFix,
  type WorkshopView,
  type ZoneId,
} from "@bluewave/ship-design";
import { Badge } from "../../../components/ui/badge.js";
import { Button } from "../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card.js";
import { cn } from "../../../lib/utils.js";
import type { DrawingBoardContent } from "./content.js";
import { NumberField, SelectField } from "./fields.js";

type Edit = (e: DraftEdit) => void;

function Panel({
  title,
  children,
  className,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
  readonly className?: string;
}) {
  return (
    <Card className={className} role="region" aria-label={title}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">{children}</CardContent>
    </Card>
  );
}

export function HullPanel({
  draft,
  content,
  edit,
}: {
  readonly draft: DesignDraft;
  readonly content: DrawingBoardContent;
  readonly edit: Edit;
}) {
  const h = draft.hull;
  return (
    <Panel title="Hull and displacement">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <SelectField
          label="Hull form"
          value={h.hullFormId}
          options={content.hullForms.map((f) => ({
            value: f.id,
            label: f.id.replaceAll("_", " "),
          }))}
          onChange={(v) => edit({ kind: "set_hull", patch: { hullFormId: v } })}
        />
        <SelectField
          label="Material"
          value={h.materialId}
          options={[
            { value: "iron", label: "Iron" },
            { value: "mild_steel", label: "Mild steel" },
            { value: "high_tensile", label: "High-tensile steel" },
          ]}
          onChange={(v) => edit({ kind: "set_hull", patch: { materialId: v } })}
        />
        <SelectField
          label="Subdivision"
          value={String(h.subdivisionGrade)}
          options={[0, 1, 2, 3, 4].map((g) => ({ value: String(g), label: `Grade ${g}` }))}
          onChange={(v) =>
            edit({ kind: "set_hull", patch: { subdivisionGrade: Number(v) as 0 | 1 | 2 | 3 | 4 } })
          }
        />
        <NumberField
          label="Length (waterline)"
          unit="m"
          value={h.lengthWl}
          scale={1000}
          decimals={1}
          onCommit={(v) => edit({ kind: "set_hull", patch: { lengthWl: mm(v) } })}
        />
        <NumberField
          label="Beam"
          unit="m"
          value={h.beam}
          scale={1000}
          decimals={2}
          onCommit={(v) => edit({ kind: "set_hull", patch: { beam: mm(v) } })}
        />
        <NumberField
          label="Draught"
          unit="m"
          value={h.draught}
          scale={1000}
          decimals={2}
          onCommit={(v) => edit({ kind: "set_hull", patch: { draught: mm(v) } })}
        />
        <NumberField
          label="Depth to main deck"
          unit="m"
          value={h.depthToMainDeck}
          scale={1000}
          decimals={2}
          onCommit={(v) => edit({ kind: "set_hull", patch: { depthToMainDeck: mm(v) } })}
        />
        <NumberField
          label="Block coefficient"
          value={h.blockCoeffBp}
          scale={10_000}
          decimals={2}
          onCommit={(v) => edit({ kind: "set_hull", patch: { blockCoeffBp: bp(v) } })}
        />
        <NumberField
          label="Target displacement"
          unit="t"
          value={h.targetDisplacementKg}
          scale={1000}
          onCommit={(v) => edit({ kind: "set_hull", patch: { targetDisplacementKg: kg(v) } })}
        />
        <NumberField
          label="Design margin"
          unit="%"
          value={h.designMarginBp}
          scale={100}
          decimals={1}
          onCommit={(v) => edit({ kind: "set_hull", patch: { designMarginBp: bp(v) } })}
        />
        <NumberField
          label="Growth reserve"
          unit="%"
          value={h.growthReserveBp}
          scale={100}
          decimals={1}
          onCommit={(v) => edit({ kind: "set_hull", patch: { growthReserveBp: bp(v) } })}
        />
      </div>
    </Panel>
  );
}

export function MachineryPanel({
  draft,
  content,
  edit,
}: {
  readonly draft: DesignDraft;
  readonly content: DrawingBoardContent;
  readonly edit: Edit;
}) {
  const m = draft.machinery;
  return (
    <Panel title="Machinery, fuel and range">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <SelectField
          label="Plant"
          value={m.plantId}
          options={content.plants.map((p) => ({ value: p.id, label: p.id.replaceAll("_", " ") }))}
          onChange={(v) => edit({ kind: "set_machinery", patch: { plantId: v } })}
        />
        <NumberField
          label="Installed power"
          unit="kW"
          value={m.installedKw}
          onCommit={(v) => edit({ kind: "set_machinery", patch: { installedKw: v } })}
        />
        <NumberField
          label="Coal bunkers"
          unit="t"
          value={m.fuelCapacityKg}
          scale={1000}
          onCommit={(v) => edit({ kind: "set_machinery", patch: { fuelCapacityKg: v } })}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {m.rooms?.length ?? 1} machinery room(s). Cruise speed and range target come from the
        requirement: {(draft.requirement.cruiseSpeedMilliKnots / 1000).toFixed(1)} kn,{" "}
        {draft.requirement.requiredRangeNm.toLocaleString("en-US")} nm.
      </p>
    </Panel>
  );
}

function midStation(content: DrawingBoardContent, draft: DesignDraft, zone: ZoneId): number {
  const z = content.hullForms
    .find((f) => f.id === draft.hull.hullFormId)
    ?.zones.find((q) => q.id === zone);
  return z ? Math.floor((z.startPermille + z.endPermille) / 2) : 500;
}

export function PlacementsPanel({
  draft,
  content,
  month,
  edit,
}: {
  readonly draft: DesignDraft;
  readonly content: DrawingBoardContent;
  readonly month: string;
  readonly edit: Edit;
}) {
  const defs = new Map(content.components.map((c) => [c.id, c]));
  const [componentId, setComponentId] = useState(content.components[0]!.id);
  const [zoneId, setZoneId] = useState<ZoneId>("SUPERSTRUCTURE");
  const def = defs.get(componentId);
  const zones = (def?.allowedZones as ZoneId[] | undefined) ?? [...ZONE_IDS];
  const zone = zones.includes(zoneId) ? zoneId : zones[0]!;
  const add = () => {
    let n = 1;
    while (draft.placements.some((p) => p.instanceId === `${componentId}_${n}`)) n++;
    edit({
      kind: "add_placement",
      placement: {
        instanceId: `${componentId}_${n}`,
        componentId,
        zoneId: zone,
        stationPermille: midStation(content, draft, zone),
      },
    });
  };
  return (
    <Panel title="Components and arrangement">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="p-1">Fitting</th>
              <th className="p-1">Zone</th>
              <th className="p-1">Station</th>
              <th className="p-1">Settings</th>
              <th className="p-1">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {draft.placements.map((p) => {
              const d = defs.get(p.componentId);
              return (
                <tr key={p.instanceId} className="border-t align-top">
                  <th scope="row" className="p-1 text-left font-normal">
                    <div>{d?.displayName ?? p.componentId}</div>
                    <div className="text-xs text-muted-foreground">{p.instanceId}</div>
                  </th>
                  <td className="p-1">{p.zoneId.replaceAll("_", " ").toLowerCase()}</td>
                  <td className="w-24 p-1">
                    <NumberField
                      label={`Station of ${p.instanceId}`}
                      unit="‰"
                      value={p.stationPermille}
                      onCommit={(v) =>
                        edit({
                          kind: "move_placement",
                          instanceId: p.instanceId,
                          zoneId: p.zoneId,
                          stationPermille: v,
                        })
                      }
                    />
                  </td>
                  <td className="p-1">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(d?.parameters ?? {}).map(([name, r]) => (
                        <NumberField
                          key={name}
                          className="w-24"
                          label={`${name} of ${p.instanceId}`}
                          min={r.min}
                          max={r.max}
                          step={r.step}
                          value={p.params?.[name] ?? r.min}
                          onCommit={(v) =>
                            edit({
                              kind: "set_param",
                              instanceId: p.instanceId,
                              param: name,
                              value: v,
                            })
                          }
                        />
                      ))}
                    </div>
                  </td>
                  <td className="p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Remove ${p.instanceId}`}
                      onClick={() => edit({ kind: "remove_placement", instanceId: p.instanceId })}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-end gap-3 border-t pt-3">
        <SelectField
          className="min-w-56"
          label="Add component"
          value={componentId}
          options={content.components.map((c: ComponentDef) => ({
            value: c.id,
            label:
              c.introduction.fromMonth > month
                ? `${c.displayName} (from ${c.introduction.fromMonth})`
                : c.displayName,
          }))}
          onChange={setComponentId}
        />
        <SelectField
          className="min-w-44"
          label="Zone"
          value={zone}
          options={zones.map((z) => ({ value: z, label: z.replaceAll("_", " ").toLowerCase() }))}
          onChange={(v) => setZoneId(v as ZoneId)}
        />
        <Button onClick={add}>Add to ship</Button>
      </div>
    </Panel>
  );
}

export function ArmourPanel({ draft, edit }: { readonly draft: DesignDraft; readonly edit: Edit }) {
  return (
    <Panel title="Protection">
      {draft.armour.regions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No armour fitted. The brief{" "}
          {draft.requirement.protectionGoal === "NONE" ? "accepts" : "does not accept"} an
          unprotected ship.
        </p>
      ) : (
        <ul className="space-y-2">
          {draft.armour.regions.map((r) => (
            <li key={r.region} className="flex flex-wrap items-end gap-3">
              <span className="w-40 text-sm">
                {r.region.replaceAll("_", " ").toLowerCase()}{" "}
                <span className="text-xs text-muted-foreground">
                  ({r.materialId.replaceAll("_", " ")})
                </span>
              </span>
              <NumberField
                className="w-32"
                label={`Thickness of ${r.region}`}
                unit="mm"
                value={r.thicknessUm}
                scale={1000}
                onCommit={(v) =>
                  edit({ kind: "set_armour_region", region: { ...r, thicknessUm: v } })
                }
              />
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Remove ${r.region}`}
                onClick={() => edit({ kind: "remove_armour_region", region: r.region })}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

const tone: Record<string, string> = {
  ok: "text-emerald-600",
  warn: "text-amber-600",
  bad: "text-red-600",
  neutral: "",
};

export function LedgerPanel({ view }: { readonly view: WorkshopView }) {
  return (
    <Panel title="Weight summary">
      <div className="flex h-3 w-full overflow-hidden rounded bg-muted" aria-hidden="true">
        {view.ledger.map((r, i) => (
          <div
            key={r.category}
            title={r.category}
            style={{ width: `${r.shareBp / 100}%`, opacity: 0.35 + (i % 4) * 0.2 }}
            className="bg-primary"
          />
        ))}
      </div>
      <table className="w-full text-sm">
        <caption className="sr-only">Displacement ledger</caption>
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th scope="col">Category</th>
            <th scope="col" className="text-right">
              Tonnes
            </th>
            <th scope="col" className="text-right">
              Share
            </th>
          </tr>
        </thead>
        <tbody>
          {view.ledger.map((r) => (
            <tr key={r.category} className="border-t">
              <th scope="row" className="text-left font-normal">
                {r.category}
              </th>
              <td className="text-right tabular-nums">
                {Math.round(r.kg / 1000).toLocaleString("en-US")}
              </td>
              <td className="text-right tabular-nums">{(r.shareBp / 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t font-medium">
            <th scope="row" className="text-left">
              Total / buoyancy at design draught
            </th>
            <td className="text-right tabular-nums" colSpan={2}>
              {Math.round(view.totalKg / 1000).toLocaleString("en-US")} t /{" "}
              {Math.round(view.buoyantKg / 1000).toLocaleString("en-US")} t
            </td>
          </tr>
        </tfoot>
      </table>
    </Panel>
  );
}

export function MetricsPanel({ view }: { readonly view: WorkshopView }) {
  return (
    <Panel title="Performance">
      <dl className="grid grid-cols-1 gap-1 text-sm">
        {view.metrics.map((m) => (
          <div key={m.id} className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{m.label}</dt>
            <dd className={cn("text-right tabular-nums", tone[m.tone])}>{m.value}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Classification</dt>
          <dd>{view.naturalClass ?? "not classified"}</dd>
        </div>
      </dl>
    </Panel>
  );
}

const sevVariant: Record<Severity, "destructive" | "secondary" | "outline"> = {
  BLOCKING: "destructive",
  CRITICAL: "destructive",
  WARNING: "secondary",
  ADVISORY: "outline",
};

function FindingItem({ f }: { readonly f: Finding }) {
  return (
    <li>
      <details className="rounded border p-2">
        <summary className="cursor-pointer text-sm">
          <Badge variant={sevVariant[f.severity]} className="mr-2">
            {f.severity}
          </Badge>
          {f.what}
        </summary>
        <div className="mt-2 space-y-1 text-sm">
          <p>
            <strong>Why:</strong> {f.why}
          </p>
          <p>
            <strong>Consequence:</strong> {f.consequence}
          </p>
          {f.remedies.length > 0 && (
            <div>
              <strong>Ways to fix it:</strong>
              <ul className="ml-5 list-disc">
                {f.remedies.map((r) => (
                  <li key={r.id}>{r.description}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Rule {f.id}</p>
        </div>
      </details>
    </li>
  );
}

export function FindingsPanel({
  view,
  suggest,
  onApply,
}: {
  readonly view: WorkshopView;
  readonly suggest: () => SuggestedFix[];
  readonly onApply: (e: DraftEdit) => void;
}) {
  const order: Severity[] = ["BLOCKING", "CRITICAL", "WARNING", "ADVISORY"];
  const total = order.reduce((a, s) => a + view.counts[s], 0);
  const serious = view.counts.BLOCKING + view.counts.CRITICAL + view.counts.WARNING > 0;
  // Suggestions belong to one compiled design: they reset whenever the design changes.
  const [fixes, setFixes] = useState<{
    readonly forHash: string;
    readonly list: SuggestedFix[];
  } | null>(null);
  const current = fixes !== null && fixes.forHash === view.compiled.hash ? fixes.list : null;
  return (
    <Panel title="Validation">
      <p role="status" className="text-sm">
        {view.valid
          ? "Design can be submitted."
          : "Design cannot be built: resolve the blocking findings."}{" "}
        <span className="text-muted-foreground">
          {order.map((s) => `${view.counts[s]} ${s.toLowerCase()}`).join(", ")}
        </span>
      </p>
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">No findings.</p>
      ) : (
        <ul className="space-y-2">
          {order.flatMap((s) =>
            view.findingsBySeverity[s].map((f, i) => (
              <FindingItem key={`${s}-${f.id}-${i}`} f={f} />
            )),
          )}
        </ul>
      )}
      {serious && (
        <div className="space-y-2 border-t pt-3">
          <Button
            variant="outline"
            onClick={() => setFixes({ forHash: view.compiled.hash, list: suggest() })}
          >
            Suggest fixes
          </Button>
          {current !== null &&
            (current.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No single change improves this design; try changing more than one thing.
              </p>
            ) : (
              <ul className="space-y-2" aria-label="Suggested fixes">
                {current.map((f) => (
                  <li
                    key={f.description}
                    className="flex items-start justify-between gap-3 rounded border p-2 text-sm"
                  >
                    <div>
                      <div>{f.description}</div>
                      <div className="text-xs text-muted-foreground">
                        Resolves{" "}
                        {f.resolved.length === 0
                          ? "nothing outright"
                          : f.resolved.map((r) => r.split(":")[1]).join(", ")}{" "}
                        · blocking {f.countsBefore.BLOCKING} → {f.countsAfter.BLOCKING}, critical{" "}
                        {f.countsBefore.CRITICAL} → {f.countsAfter.CRITICAL}, warnings{" "}
                        {f.countsBefore.WARNING} → {f.countsAfter.WARNING} · weight{" "}
                        {f.totalKgDelta >= 0 ? "+" : ""}
                        {Math.round(f.totalKgDelta / 1000)} t
                      </div>
                    </div>
                    <Button size="sm" onClick={() => onApply(f.edit)}>
                      Apply
                    </Button>
                  </li>
                ))}
              </ul>
            ))}
        </div>
      )}
    </Panel>
  );
}

export function ForecastPanel({ view }: { readonly view: WorkshopView }) {
  const money = (micro: number) => Math.round(micro / 1_000_000).toLocaleString("en-US");
  return (
    <Panel title="Cost and construction forecast">
      <dl className="grid grid-cols-1 gap-1 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Build cost (first of class)</dt>
          <dd className="tabular-nums">{money(view.forecast.costMicro)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Monthly upkeep</dt>
          <dd className="tabular-nums">{money(view.forecast.monthlyMaintenanceMicro)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Build time</dt>
          <dd className="tabular-nums">
            {view.forecast.months === null
              ? (view.forecast.note ?? "n/a")
              : `${view.forecast.months} months (limited by ${view.forecast.bottleneck ?? "capacity"})`}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{view.cve.label}</dt>
          <dd className="tabular-nums">{(view.cve.cveBp / 100).toFixed(0)} / 100</dd>
        </div>
      </dl>
    </Panel>
  );
}

const archetypeLabel: Record<string, string> = {
  CONSERVATIVE: "Conservative and reliable",
  BALANCED: "Balanced",
  AGGRESSIVE: "Aggressive, high risk",
  LOW_COST: "Low-cost, for numbers",
  LONG_RANGE: "Long range",
  UPGRADE: "Upgrade-oriented",
};

export function AlternativesPanel({
  generate,
  onLoad,
}: {
  readonly generate: () => Candidate[];
  readonly onLoad: (d: DesignDraft) => void;
}) {
  const [state, setState] = useState<{
    readonly status: "idle" | "working" | "done";
    readonly list: Candidate[];
  }>({ status: "idle", list: [] });
  const run = () => {
    setState({ status: "working", list: [] });
    // Let the "working" state paint before the synchronous search starts.
    setTimeout(() => setState({ status: "done", list: generate() }), 20);
  };
  return (
    <Panel title="AI alternatives">
      <p className="text-xs text-muted-foreground">
        The AI designer uses the same rules, costs and validation as you do. It starts from the
        current design.
      </p>
      <Button variant="outline" onClick={run} disabled={state.status === "working"}>
        {state.status === "working" ? "Designing…" : "Generate alternatives"}
      </Button>
      {state.status === "done" &&
        (state.list.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No valid alternative found from this starting point.
          </p>
        ) : (
          <ul className="space-y-2" aria-label="AI candidates">
            {state.list.map((c) => {
              const k = c.compiled;
              return (
                <li
                  key={c.compiled.hash}
                  className="flex items-start justify-between gap-3 rounded border p-2 text-sm"
                >
                  <div>
                    <div className="font-medium">{archetypeLabel[c.archetype] ?? c.archetype}</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(k.totalKg / 1000).toLocaleString("en-US")} t ·{" "}
                      {((k.machinery?.maxSpeedMilliKnots ?? 0) / 1000).toFixed(1)} kn ·{" "}
                      {(k.machinery?.rangeNmAtCruise ?? 0).toLocaleString("en-US")} nm · cost{" "}
                      {Math.round(c.costMicro / 1_000_000).toLocaleString("en-US")} ·{" "}
                      {k.findings.filter((f) => f.severity !== "ADVISORY").length} finding(s) · CVE{" "}
                      {(c.cveBp / 100).toFixed(0)}/100 (development metric)
                    </div>
                  </div>
                  <Button size="sm" onClick={() => onLoad(c.draft)}>
                    Load design
                  </Button>
                </li>
              );
            })}
          </ul>
        ))}
    </Panel>
  );
}
