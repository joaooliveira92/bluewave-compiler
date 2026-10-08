import { useState } from "react";
import type {
  DraftEdit,
  Finding,
  Severity,
  SuggestedFix,
  WorkshopView,
} from "@bluewave/ship-design";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../../components/ui/accordion.js";
import { Badge } from "../../../../components/ui/badge.js";
import { Button } from "../../../../components/ui/button.js";
import { Panel } from "./Panel.js";

const sevVariant: Record<Severity, "destructive" | "secondary" | "outline"> = {
  BLOCKING: "destructive",
  CRITICAL: "destructive",
  WARNING: "secondary",
  ADVISORY: "outline",
};

function FindingItem({ f, value }: { readonly f: Finding; readonly value: string }) {
  return (
    <AccordionItem value={value} className="rounded border px-2">
      <AccordionTrigger className="gap-2 py-2 text-left font-normal hover:no-underline">
        <span className="flex-1">
          <Badge variant={sevVariant[f.severity]} className="mr-2">
            {f.severity}
          </Badge>
          {f.what}
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-1 text-sm">
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
      </AccordionContent>
    </AccordionItem>
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
        <Accordion multiple className="space-y-2" aria-label="Findings">
          {order.flatMap((s) =>
            view.findingsBySeverity[s].map((f, i) => (
              <FindingItem key={`${s}-${f.id}-${i}`} value={`${s}-${f.id}-${i}`} f={f} />
            )),
          )}
        </Accordion>
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
