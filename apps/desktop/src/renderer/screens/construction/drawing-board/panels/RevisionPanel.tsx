import { useState } from "react";
import type { DesignDraft, DraftEdit } from "@bluewave/ship-design";
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

/**
 * "What would these changes cost on a ship already being built?" Preview only: applying a revision to a project is
 * not an engine command yet. The rules are `classifyRevision` (spec 15.4) with the project's real work figures.
 */
export function RevisionPanel({
  projects,
  history,
  draft,
  startDraft,
  content,
}: {
  readonly projects: readonly RevisionProject[];
  readonly history: readonly DraftEdit[];
  readonly draft: DesignDraft;
  readonly startDraft: DesignDraft;
  readonly content: DrawingBoardContent;
}) {
  const open = revisableProjects(projects);
  const [chosen, setChosen] = useState<string>("");
  const project = open.find((p) => p.projectId === chosen) ?? open[0];
  const categories = new Map(content.components.map((c) => [c.id, c.category]));
  if (project === undefined) {
    return (
      <Panel title="Revision preview">
        <p className="text-sm text-muted-foreground">
          No ships are under construction, so there is nothing to revise.
        </p>
      </Panel>
    );
  }
  const kinds = changeKinds(history, startDraft, draft, (id) => categories.get(id));
  const d = previewRevision(kinds, project, content.revision);
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
      <p className="text-xs text-muted-foreground">
        Changes counted:{" "}
        {kinds.length > 0 ? kinds.join(", ").toLowerCase().replaceAll("_", " ") : "none"}. Preview
        only; the engine cannot yet apply a revision. Armour and machinery orders are assumed not
        placed.
      </p>
    </Panel>
  );
}
