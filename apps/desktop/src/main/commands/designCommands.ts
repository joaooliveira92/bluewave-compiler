import {
  classifyRevision,
  compileDesign,
  draftChangeKinds,
  progressFromWork,
  validateDraftShape,
  type DesignDraft,
} from "@bluewave/ship-design";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type {
  DesignCommandOutcome,
  LoadProjectDraftPayload,
  ProjectDraftView,
  ReviseCommandOutcome,
  ReviseProjectCommandPayload,
  SubmitDesignCommandPayload,
} from "../../shared/design-contract.js";
import { getCampaignSession } from "../campaignSessions.js";
import { loadShipBuildingContent } from "../shipBuildingContent.js";
import { submitPlayerCommand } from "./playerCommandSupport.js";

/** Canonical ship-type label per DESIGN-22 intended class, as the construction screen's icons expect it. */
const HULL_TYPE_BY_CLASS: Readonly<Record<string, string>> = {
  DD: "destroyer",
  CL: "light_cruiser",
  CA: "heavy_cruiser",
  B: "coast_defense_ship",
  BB: "battleship",
};

function slug(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return s.length >= 2 ? s.slice(0, 40) : "design";
}

/**
 * Submits a designed ship (ADR-0066). The draft is compiled here first so the player gets the findings immediately
 * (the engine still compiles it again when the month is committed and is the only authority). A design with a blocking
 * finding is rejected without queuing anything.
 */
export async function submitDesignCommand(
  payload: SubmitDesignCommandPayload,
): Promise<BridgeResult<DesignCommandOutcome>> {
  const record = getCampaignSession(payload.sessionId);
  if (!record) {
    return {
      outcome: "error",
      reason: "SESSION_NOT_FOUND",
      diagnostics: [`No active campaign session ${payload.sessionId}`],
    };
  }
  const shape = validateDraftShape(payload.draft);
  if (shape.length > 0) {
    return { outcome: "rejected", reason: "INVALID_COMMAND_PAYLOAD", diagnostics: shape };
  }
  const draft = payload.draft as unknown as DesignDraft;
  const monthId = `${record.month.year}-${String(record.month.month).padStart(2, "0")}`;
  let compiled;
  try {
    compiled = compileDesign(
      { ...draft, nationId: record.playerSlotId },
      loadShipBuildingContent().environmentFor(monthId).ctx,
    );
  } catch (e) {
    return {
      outcome: "rejected",
      reason: "DESIGN_REJECTED",
      diagnostics: [e instanceof Error ? e.message : String(e)],
    };
  }
  if (!compiled.valid) {
    return {
      outcome: "rejected",
      reason: "DESIGN_REJECTED",
      diagnostics: compiled.findings
        .filter((f) => f.severity === "BLOCKING")
        .map((f) => `${f.what} ${f.why}`),
    };
  }
  const base = slug(payload.className);
  const turn = Number(record.state.snapshot.turnNumber);
  const designVersionId = `des_${record.playerSlotId.toLowerCase()}_${base}_t${turn}`.slice(0, 64);
  const result = await submitPlayerCommand({
    sessionId: payload.sessionId,
    expectedRevision: payload.expectedRevision,
    transportRequestId: payload.transportRequestId,
    build: (rec) => ({
      body: {
        type: "SubmitDesign",
        nationId: rec.playerSlotId,
        designVersionId,
        designFamilyId: `fam_${rec.playerSlotId.toLowerCase()}_${base}`.slice(0, 64),
        className: payload.className.trim(),
        hullType: HULL_TYPE_BY_CLASS[draft.requirement.category] ?? "coast_defense_ship",
        machineryType: draft.machinery.plantId,
        draft: { ...draft, nationId: rec.playerSlotId },
      },
      discriminator: designVersionId,
    }),
  });
  if (result.outcome !== "success") return result;
  return {
    outcome: "success",
    value: { commandId: result.value.commandId, designVersionId, appliedOnNextTurn: true },
    diagnostics: [],
  };
}

const sessionMissing = (sessionId: string) =>
  ({
    outcome: "error",
    reason: "SESSION_NOT_FOUND",
    diagnostics: [`No active campaign session ${sessionId}`],
  }) as const;

/** The player's own project and the draft its design was compiled from, or the reason it has none. */
function projectWithDraft(
  record: NonNullable<ReturnType<typeof getCampaignSession>>,
  projectId: string,
) {
  const snapshot = record.state.snapshot;
  const nation = snapshot.nations.get(record.playerSlotId);
  const project = nation?.constructionProjects.find((p) => p.id === projectId);
  if (!project) return { error: `Project ${projectId} not found` } as const;
  const design = snapshot.designs.get(project.designVersionId);
  if (design?.sourceDraft === undefined)
    return {
      error: `Project ${projectId} was built from an authored design with no source draft and cannot be revised`,
    } as const;
  return { project, design, draft: design.sourceDraft as unknown as DesignDraft } as const;
}

/** The draft a project is being built from, so the Drawing Board can edit the real design (ADR-0070). */
export async function loadProjectDraft(
  payload: LoadProjectDraftPayload,
): Promise<BridgeResult<ProjectDraftView>> {
  const record = getCampaignSession(payload.sessionId);
  if (!record) return sessionMissing(payload.sessionId);
  const found = projectWithDraft(record, payload.projectId);
  if ("error" in found)
    return { outcome: "rejected", reason: "PROJECT_NOT_REVISABLE", diagnostics: [found.error] };
  return {
    outcome: "success",
    value: {
      className: found.design.className,
      draft: found.draft as unknown as Record<string, unknown>,
    },
    diagnostics: [],
  };
}

/**
 * Queues a `ReviseProject` (ADR-0070). The same rules the engine applies are run here first (compile, change kinds,
 * revision tier) so the player gets the answer now; a design that cannot be built, changes nothing, or would need a
 * rebuild project is rejected without queuing. The engine remains the only authority when the month is committed.
 */
export async function reviseProjectCommand(
  payload: ReviseProjectCommandPayload,
): Promise<BridgeResult<ReviseCommandOutcome>> {
  const record = getCampaignSession(payload.sessionId);
  if (!record) return sessionMissing(payload.sessionId);
  const found = projectWithDraft(record, payload.projectId);
  if ("error" in found)
    return { outcome: "rejected", reason: "PROJECT_NOT_REVISABLE", diagnostics: [found.error] };
  const shape = validateDraftShape(payload.draft);
  if (shape.length > 0)
    return { outcome: "rejected", reason: "INVALID_COMMAND_PAYLOAD", diagnostics: shape };
  const content = loadShipBuildingContent();
  if (content.revision === null)
    return {
      outcome: "rejected",
      reason: "REVISION_RULES_MISSING",
      diagnostics: ["The ship-building content has no revision rules"],
    };
  const draft = { ...(payload.draft as unknown as DesignDraft), nationId: record.playerSlotId };
  const monthId = `${record.month.year}-${String(record.month.month).padStart(2, "0")}`;
  let compiled;
  try {
    compiled = compileDesign(draft, content.environmentFor(monthId).ctx);
  } catch (e) {
    return {
      outcome: "rejected",
      reason: "REVISION_REJECTED",
      diagnostics: [e instanceof Error ? e.message : String(e)],
    };
  }
  if (!compiled.valid)
    return {
      outcome: "rejected",
      reason: "REVISION_REJECTED",
      diagnostics: compiled.findings
        .filter((f) => f.severity === "BLOCKING")
        .map((f) => `${f.what} ${f.why}`),
    };
  const categories = new Map(content.components.map((c) => [c.id, c.category]));
  const kinds = draftChangeKinds(found.draft, draft, (id) => categories.get(id));
  if (kinds.length === 0)
    return {
      outcome: "rejected",
      reason: "REVISION_REJECTED",
      diagnostics: ["The revision changes nothing"],
    };
  const decision = classifyRevision(
    kinds,
    progressFromWork(Number(found.project.completedWork), Number(found.project.totalWork)),
    content.revision,
  );
  if (decision.requiresRebuildProject || decision.tier === "T3_RECONSTRUCTION")
    return {
      outcome: "rejected",
      reason: "REVISION_REQUIRES_REBUILD",
      diagnostics: [
        `The ship is ${(decision.progressBp / 100).toFixed(1)}% built: this change would need a rebuild project, which is not available yet`,
      ],
    };
  const turn = Number(record.state.snapshot.turnNumber);
  const newDesignVersionId = `${found.design.designVersionId.replace(/_r\d+$/, "")}_r${turn}`.slice(
    0,
    64,
  );
  const result = await submitPlayerCommand({
    sessionId: payload.sessionId,
    expectedRevision: payload.expectedRevision,
    transportRequestId: payload.transportRequestId,
    build: (rec) => ({
      body: {
        type: "ReviseProject",
        nationId: rec.playerSlotId,
        projectId: payload.projectId,
        newDesignVersionId,
        draft: { ...draft, nationId: rec.playerSlotId },
      },
      discriminator: `${payload.projectId}/${newDesignVersionId}`,
    }),
  });
  if (result.outcome !== "success") return result;
  return {
    outcome: "success",
    value: {
      commandId: result.value.commandId,
      newDesignVersionId,
      tier: decision.tier,
      progressBp: decision.progressBp,
      reworkWork: decision.reworkWorkMicro,
      reasonCodes: decision.reasonCodes,
      appliedOnNextTurn: true,
    },
    diagnostics: [],
  };
}
