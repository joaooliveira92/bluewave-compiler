import { useState } from "react";
import type { DesignDraft } from "@bluewave/ship-design";
import { Alert } from "../../../../components/ui/alert.js";
import { Button } from "../../../../components/ui/button.js";
import { useCampaignRevision } from "../../../../shell/CampaignShellContext.js";
import { Panel } from "./Panel.js";

let submitCounter = 0;

/**
 * Sends the working design to the engine (ADR-0066). The main process re-compiles it and queues a real `SubmitDesign`
 * command; the design appears in the Design Catalog when the month is committed.
 */
export function SubmitPanel({
  sessionId,
  draft,
  valid,
}: {
  readonly sessionId: string;
  readonly draft: DesignDraft;
  readonly valid: boolean;
}) {
  const revision = useCampaignRevision();
  const bridge = window.bluewave;
  const [className, setClassName] = useState("");
  const [result, setResult] = useState<{
    readonly tone: "ok" | "bad";
    readonly lines: readonly string[];
  } | null>(null);
  const [busy, setBusy] = useState(false);
  if (!bridge) return null;
  const canSubmit = valid && revision !== null && className.trim() !== "" && !busy;
  const submit = async () => {
    if (revision === null) return;
    setBusy(true);
    submitCounter++;
    try {
      const r = await bridge.campaign.execute("submitDesignCommand", {
        sessionId,
        expectedRevision: revision,
        transportRequestId: `design-${Date.now().toString(36)}-${submitCounter}`,
        className: className.trim(),
        draft: draft as unknown as Record<string, unknown>,
      });
      setResult(
        r.outcome === "success"
          ? {
              tone: "ok",
              lines: [
                `Design queued. "${className.trim()}" joins the Design Catalog when the month is committed.`,
              ],
            }
          : { tone: "bad", lines: r.diagnostics.length > 0 ? [...r.diagnostics] : [r.reason] },
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Panel title="Submit for construction">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="class-name" className="text-xs text-muted-foreground">
            Class name
          </label>
          <input
            id="class-name"
            className="h-8 w-64 rounded-md border bg-background px-2 text-sm"
            value={className}
            maxLength={60}
            onChange={(e) => setClassName(e.target.value)}
          />
        </div>
        <Button onClick={() => void submit()} disabled={!canSubmit}>
          {busy ? "Submitting…" : "Submit design"}
        </Button>
      </div>
      {!valid && (
        <p className="text-xs text-muted-foreground">
          Resolve the blocking findings before submitting.
        </p>
      )}
      {result !== null && (
        <Alert role="status" variant={result.tone === "ok" ? "default" : "destructive"}>
          <ul>
            {result.lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </Alert>
      )}
    </Panel>
  );
}
