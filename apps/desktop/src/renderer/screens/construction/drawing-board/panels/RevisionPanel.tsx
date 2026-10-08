import { useEffect, useState } from "react";
import {
  draftChangeKinds,
  type ChangeKind,
  type DesignDraft,
  type DraftEdit,
  type RevisionDecision,
} from "@bluewave/ship-design";
import { Alert } from "../../../../components/ui/alert.js";
import { Button } from "../../../../components/ui/button.js";
import { useCampaignRevision } from "../../../../shell/CampaignShellContext.js";
import type { DrawingBoardContent } from "../content.js";
import { SelectField } from "../fields.js";
import {
  changeKinds,
  previewRevision,
  REASON_TEXT,
  revisableProjects,
  TIER_LABEL,
  type RevisionProject,
} from "../revisionPreview.js";
import { Panel } from "./Panel.js";

const pct = (bp: number) => `${(bp / 100).toFixed(1)}%`;
let reviseCounter = 0;

/**
 * What would these changes cost on a ship already being built, and (for ships whose design the engine kept) apply them.
 * For a revisable project the comparison is against that ship's real draft with the engine's own diff, so the preview
 * is exactly what the engine will decide. For an authored design there is no draft: the preview then counts the edits
 * made on the board and cannot be applied.
 */
export function RevisionPanel({
  sessionId,
  projects,
  history,
  draft,
  startDraft,
  content,
  onLoad,
}: {
  readonly sessionId?: string;
  readonly projects: readonly RevisionProject[];
  readonly history: readonly DraftEdit[];
  readonly draft: DesignDraft;
  readonly startDraft: DesignDraft;
  readonly content: DrawingBoardContent;
  readonly onLoad: (draft: DesignDraft) => void;
}) {
  const balance = content.revision;
  const open = revisableProjects(projects);
  const [chosen, setChosen] = useState<string>("");
  const project = open.find((p) => p.projectId === chosen) ?? open[0];
  const bridge = window.bluewave;
  const revision = useCampaignRevision();
  const [real, setReal] = useState<{ projectId: string; draft: DesignDraft } | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const projectId = project?.projectId;
  const revisable = project?.revisable === true;

  useEffect(() => {
    setReal(null);
    setResult(null);
    if (!bridge || sessionId === undefined || projectId === undefined || !revisable) return;
    let live = true;
    void bridge.campaign.execute("loadProjectDraft", { sessionId, projectId }).then((r) => {
      if (live && r.outcome === "success")
        setReal({ projectId, draft: r.value.draft as unknown as DesignDraft });
    });
    return () => {
      live = false;
    };
  }, [bridge, sessionId, projectId, revisable]);

  if (balance === null) {
    return (
      <Panel title="Revision preview">
        <p className="text-sm text-muted-foreground">This ruleset has no revision rules.</p>
      </Panel>
    );
  }
  if (project === undefined) {
    return (
      <Panel title="Revision preview">
        <p className="text-sm text-muted-foreground">
          No ships are under construction, so there is nothing to revise.
        </p>
      </Panel>
    );
  }
  const categories = new Map(content.components.map((c) => [c.id, c.category]));
  const categoryOf = (id: string) => categories.get(id);
  const exact = real !== null && real.projectId === project.projectId;
  const kinds: ChangeKind[] = exact
    ? draftChangeKinds(real.draft, draft, categoryOf)
    : changeKinds(history, startDraft, draft, categoryOf);
  const d: RevisionDecision | null = previewRevision(kinds, project, balance);
  const canApply =
    exact &&
    d !== null &&
    !d.requiresRebuildProject &&
    sessionId !== undefined &&
    revision !== null &&
    bridge !== undefined &&
    !busy;

  const apply = async () => {
    if (!bridge || sessionId === undefined || revision === null) return;
    setBusy(true);
    reviseCounter++;
    try {
      const r = await bridge.campaign.execute("reviseProjectCommand", {
        sessionId,
        expectedRevision: revision,
        transportRequestId: `revise-${Date.now().toString(36)}-${reviseCounter}`,
        projectId: project.projectId,
        draft: draft as unknown as Record<string, unknown>,
      });
      setResult(
        r.outcome === "success"
          ? {
              tone: "ok",
              text: `Revision queued (${TIER_LABEL[r.value.tier]}). It takes effect when the month is committed.`,
            }
          : {
              tone: "bad",
              text: (r.diagnostics.length > 0 ? r.diagnostics : [r.reason]).join(" "),
            },
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title="Revision preview">
      <SelectField
        label="If applied to project"
        value={project.projectId}
        options={open.map((p) => ({
          value: p.projectId,
          label: `${p.className} (${pct(p.totalWork > 0 ? Math.floor((p.completedWork * 10_000) / p.totalWork) : 10_000)} built)`,
        }))}
        onChange={setChosen}
      />
      {exact && (
        <Button variant="outline" onClick={() => onLoad(real.draft)}>
          Load this ship&apos;s design into the board
        </Button>
      )}
      {d === null ? (
        <p className="text-sm">No changes yet, so nothing would need revising.</p>
      ) : (
        <div role="status" className="space-y-1 text-sm">
          <p className="font-medium">
            {TIER_LABEL[d.tier]}{" "}
            <span className="font-normal">at {pct(d.progressBp)} hull progress</span>
          </p>
          <ul className="list-disc pl-5 text-muted-foreground">
            {d.reasonCodes.map((c) => (
              <li key={c}>{REASON_TEXT[c] ?? c}</li>
            ))}
            {d.reasonCodes.length === 0 && <li>Early enough that nothing is lost.</li>}
          </ul>
          <dl className="grid grid-cols-2 gap-x-4 tabular-nums">
            {d.delayMonths > 0 && (
              <>
                <dt className="text-muted-foreground">Delay</dt>
                <dd className="text-right">{d.delayMonths} month(s)</dd>
              </>
            )}
            {d.reworkWorkMicro > 0 && (
              <>
                <dt className="text-muted-foreground">Rework</dt>
                <dd className="text-right">{d.reworkWorkMicro.toLocaleString("en-US")} work</dd>
              </>
            )}
            {d.studyCostMultiplierBp > 0 && (
              <>
                <dt className="text-muted-foreground">Redesign study cost</dt>
                <dd className="text-right">×{(d.studyCostMultiplierBp / 10_000).toFixed(2)}</dd>
              </>
            )}
            {d.tier === "T2_REDESIGN" && (
              <>
                <dt className="text-muted-foreground">Hull work kept</dt>
                <dd className="text-right">
                  {Math.round(d.hullDoneWorkAfter).toLocaleString("en-US")} of{" "}
                  {project.completedWork.toLocaleString("en-US")}
                </dd>
              </>
            )}
          </dl>
          {d.requiresRebuildProject && (
            <p>
              This would no longer be a revision: it needs a rebuild or conversion project, or
              cancelling the ship.
            </p>
          )}
        </div>
      )}
      {exact && (
        <Button onClick={() => void apply()} disabled={!canApply}>
          {busy ? "Queuing…" : "Apply revision to this ship"}
        </Button>
      )}
      {result !== null && (
        <Alert variant={result.tone === "ok" ? "default" : "destructive"}>{result.text}</Alert>
      )}
      <p className="text-xs text-muted-foreground">
        Changes counted:{" "}
        {kinds.length > 0 ? kinds.join(", ").toLowerCase().replaceAll("_", " ") : "none"}.{" "}
        {exact
          ? "Compared with this ship's real design. Armour and machinery orders are assumed not placed."
          : revisable
            ? "Loading this ship's design…"
            : "This ship was built from an authored design, so it cannot be revised and this is only an estimate from your edits."}
      </p>
    </Panel>
  );
}
