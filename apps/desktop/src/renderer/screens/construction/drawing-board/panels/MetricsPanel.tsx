import type { WorkshopView } from "@bluewave/ship-design";
import { cn } from "../../../../lib/utils.js";
import { Panel } from "./Panel.js";

const tone: Record<string, string> = {
  ok: "text-emerald-600",
  warn: "text-amber-600",
  bad: "text-red-600",
  neutral: "",
};

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
