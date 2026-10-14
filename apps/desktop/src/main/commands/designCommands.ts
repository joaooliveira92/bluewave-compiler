import { isShipOperational } from "@bluewave/campaign";
import {
  classifyRevision,
  compileDraftFromParts,
  draftChangeKinds,
  HULL_TYPE_FOR_SHIP_TYPE,
  progressFromWork,
  rebuildFactsOf,
  toLegacyCompileView,
  validateDraftShape,
  validateRebuild,
  yardDemandOf,
  type DesignDraft,
  type DraftCompileResult,
  type Finding,
  type LegacyCompileView,
} from "@bluewave/ship-design";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type {
  DesignCommandOutcome,
  LoadProjectDraftPayload,
  LoadShipDraftPayload,
  ProjectDraftView,
  RebuildableShipView,
  RebuildCheckPayload,
  RebuildCheckView,
  RebuildCommandOutcome,
  RebuildFindingView,
  ReviseCommandOutcome,
  ReviseProjectCommandPayload,
  ShipDraftView,
  StartRebuildCommandPayload,
  SubmitDesignCommandPayload,
  DesignStudyPreview,
} from "../../shared/design-contract.js";
import {
  buildDesignVersion,
  planDesignStudy,
  pricingFor,
  REBUILD_BULGE_REQUIRED,
  rebuildArmamentFindings,
  rebuildBulgeRequired,
  studyExists,
} from "@bluewave/phase-engine";
import { getCampaignSession } from "../campaignSessions.js";
import { loadShipBuildingContent, loadShipBuildingData } from "../shipBuildingContent.js";
import { submitPlayerCommand } from "./playerCommandSupport.js";

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
  const base = slug(payload.className);
  const turn = Number(record.state.snapshot.turnNumber);
  const designVersionId = `des_${record.playerSlotId.toLowerCase()}_${base}_t${turn}`.slice(0, 64);
  const designFamilyId = `fam_${record.playerSlotId.toLowerCase()}_${base}`.slice(0, 64);
  // The player's design is compiled through the parts barrier (ticket 17a), from the content the
  // pack validated; the legacy catalogue is no longer a compile path.
  const content = loadShipBuildingContent();
  const partsContent = content.draftCompileContent;
  if (partsContent === undefined) {
    return {
      outcome: "rejected",
      reason: "DESIGN_REJECTED",
      diagnostics: ["The ship-building content carries no parts to compile a design from"],
    };
  }
  const owned = { ...draft, nationId: record.playerSlotId };
  let compiledView: LegacyCompileView;
  try {
    compiledView = toLegacyCompileView(
      compileDraftFromParts({
        designId: designVersionId,
        draft: owned,
        month: monthId,
        content: partsContent,
        ctx: content.environmentFor(monthId).ctx,
        nation: { nationId: record.playerSlotId },
      }),
    );
  } catch (e) {
    return {
      outcome: "rejected",
      reason: "DESIGN_REJECTED",
      diagnostics: [e instanceof Error ? e.message : String(e)],
    };
  }
  if (!compiledView.valid) {
    return {
      outcome: "rejected",
      reason: "DESIGN_REJECTED",
      diagnostics: compiledView.findings
        .filter((f) => f.severity === "BLOCKING")
        .map((f) => `${f.what} ${f.why}`),
    };
  }
  const compiled = compiledView.compiled;
  // The hull type is the ship type's own (domain mapping); there is no fallback label, so a type the ruleset cannot
  // map is refused rather than filed as something else (ADR-0088).
  const hullType = (HULL_TYPE_FOR_SHIP_TYPE as Readonly<Record<string, string | undefined>>)[
    draft.requirement.category
  ];
  if (hullType === undefined) {
    return {
      outcome: "rejected",
      reason: "DESIGN_REJECTED",
      diagnostics: [`Ship type ${draft.requirement.category} cannot be built.`],
    };
  }
  const snapshot = record.state.snapshot;
  if (snapshot.designs.has(designVersionId) || studyExists(snapshot, designVersionId)) {
    return {
      outcome: "rejected",
      reason: "DESIGN_REJECTED",
      diagnostics: [
        `A design named "${payload.className.trim()}" was already submitted this month.`,
      ],
    };
  }
  // The study the engine will open for it, from the same rules, so the player sees its months and cost now (ADR-0085).
  let study: DesignStudyPreview | undefined;
  if (content.study !== null) {
    const planned = planDesignStudy(
      snapshot,
      record.playerSlotId,
      buildDesignVersion(
        compiled,
        owned,
        {
          designVersionId,
          designFamilyId,
          className: payload.className.trim(),
          hullType,
          machineryType: draft.machinery.plantId,
          contentVersion: snapshot.rulesetVersion,
          kgPerHitPoint: content.kgPerHitPoint,
        },
        pricingFor(content, monthId),
      ),
      { compiled, draft: owned },
      content,
      monthId,
    );
    study = {
      months: planned.finalStudyWork,
      cost: planned.finalStudyCost,
      derived: planned.derived,
      discountBp: planned.discountBp,
      baselineClassName:
        planned.baselineDesignVersionId === "NONE"
          ? null
          : (snapshot.designs.get(planned.baselineDesignVersionId)?.className ?? null),
      newFamily: planned.newFamily,
      failedCriteria: planned.failedCriteria,
    };
  }
  const result = await submitPlayerCommand({
    sessionId: payload.sessionId,
    expectedRevision: payload.expectedRevision,
    transportRequestId: payload.transportRequestId,
    build: (rec) => ({
      body: {
        type: "SubmitDesign",
        nationId: rec.playerSlotId,
        designVersionId,
        designFamilyId,
        className: payload.className.trim(),
        hullType,
        machineryType: draft.machinery.plantId,
        draft: { ...draft, nationId: rec.playerSlotId },
      },
      discriminator: designVersionId,
    }),
  });
  if (result.outcome !== "success") return result;
  return {
    outcome: "success",
    value: {
      commandId: result.value.commandId,
      designVersionId,
      appliedOnNextTurn: true,
      ...(study ? { study } : {}),
    },
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
  if (!project) return { ok: false, error: `Project ${projectId} not found` } as const;
  const design = snapshot.designs.get(project.designVersionId);
  if (design?.sourceDraft === undefined)
    return {
      ok: false,
      error: `Project ${projectId} was built from an authored design with no source draft and cannot be revised`,
    } as const;
  return {
    ok: true,
    project,
    design,
    draft: design.sourceDraft as unknown as DesignDraft,
  } as const;
}

/** The draft a project is being built from, so the Drawing Board can edit the real design (ADR-0070). */
export async function loadProjectDraft(
  payload: LoadProjectDraftPayload,
): Promise<BridgeResult<ProjectDraftView>> {
  const record = getCampaignSession(payload.sessionId);
  if (!record) return sessionMissing(payload.sessionId);
  const found = projectWithDraft(record, payload.projectId);
  if (!found.ok)
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
  if (!found.ok)
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
  const partsContent = content.draftCompileContent;
  if (partsContent === undefined)
    return {
      outcome: "rejected",
      reason: "REVISION_REJECTED",
      diagnostics: ["The ship-building content carries no parts to compile a design from"],
    };
  let compiledView: LegacyCompileView;
  try {
    compiledView = toLegacyCompileView(
      compileDraftFromParts({
        designId: found.design.designVersionId,
        draft,
        month: monthId,
        content: partsContent,
        ctx: content.environmentFor(monthId).ctx,
        nation: { nationId: record.playerSlotId },
      }),
    );
  } catch (e) {
    return {
      outcome: "rejected",
      reason: "REVISION_REJECTED",
      diagnostics: [e instanceof Error ? e.message : String(e)],
    };
  }
  if (!compiledView.valid)
    return {
      outcome: "rejected",
      reason: "REVISION_REJECTED",
      diagnostics: compiledView.findings
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
        `The ship is ${(decision.progressBp / 100).toFixed(1)}% built: it is too far along to revise, and rebuilding is not available yet. Finish it as designed, then submit this version as a new class and order it separately`,
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

// ---------------------------------------------------------------------------
// Rebuild (ADR-0078): list the ships that can be rebuilt, load one's draft, check a change, start the rebuild.
// ---------------------------------------------------------------------------

type SessionRecord = NonNullable<ReturnType<typeof getCampaignSession>>;

/** The player's own ship, if it is commissioned, free (no battle) and its design kept a source draft; else why not. */
function rebuildableShip(record: SessionRecord, shipId: string) {
  const snapshot = record.state.snapshot;
  const nation = snapshot.nations.get(record.playerSlotId);
  const ship = nation?.fleets.flatMap((f) => f.ships).find((s) => s.id === shipId);
  if (!ship) return { ok: false, error: `Ship ${shipId} is not yours` } as const;
  if (!isShipOperational(ship) || ship.inBattleId !== undefined)
    return {
      ok: false,
      error: `${ship.name} is under construction, already being rebuilt or in a battle`,
    } as const;
  const design = snapshot.designs.get(ship.designVersionId);
  if (design?.sourceDraft === undefined)
    return {
      ok: false,
      error: `${ship.name} was built from an authored design with no source draft and cannot be rebuilt`,
    } as const;
  return { ok: true, ship, design, draft: design.sourceDraft as unknown as DesignDraft } as const;
}

const monthIdOf = (record: SessionRecord) =>
  `${record.month.year}-${String(record.month.month).padStart(2, "0")}`;

/** The player's ships that can be rebuilt, in ship id order. */
export async function listRebuildableShips(
  sessionId: string,
): Promise<BridgeResult<readonly RebuildableShipView[]>> {
  const record = getCampaignSession(sessionId);
  if (!record) return sessionMissing(sessionId);
  const nation = record.state.snapshot.nations.get(record.playerSlotId);
  const ships = (nation?.fleets ?? [])
    .flatMap((f) => f.ships)
    .flatMap((s) => {
      const found = rebuildableShip(record, s.id);
      return found.ok
        ? [
            {
              shipId: s.id,
              name: s.name,
              className: found.design.className,
              designVersionId: s.designVersionId,
            },
          ]
        : [];
    })
    .sort((a, b) => (a.shipId < b.shipId ? -1 : a.shipId > b.shipId ? 1 : 0));
  return { outcome: "success", value: ships, diagnostics: [] };
}

/** The draft a ship was built from, so the Drawing Board can edit the real design for a rebuild. */
export async function loadShipDraft(
  payload: LoadShipDraftPayload,
): Promise<BridgeResult<ShipDraftView>> {
  const record = getCampaignSession(payload.sessionId);
  if (!record) return sessionMissing(payload.sessionId);
  const found = rebuildableShip(record, payload.shipId);
  if (!found.ok)
    return { outcome: "rejected", reason: "SHIP_NOT_REBUILDABLE", diagnostics: [found.error] };
  return {
    outcome: "success",
    value: {
      className: found.design.className,
      draft: found.draft as unknown as Record<string, unknown>,
    },
    diagnostics: [],
  };
}

/** A `Finding` as the renderer's `RebuildFindingView`. */
const findingView = (f: Finding): RebuildFindingView => ({
  id: f.id,
  what: f.what,
  why: f.why,
  consequence: f.consequence,
  remedies: f.remedies.map((r) => r.description),
});

/** The bulge requirement as a view finding, using the phase engine's own reason code. */
const bulgeRequiredView: RebuildFindingView = {
  id: REBUILD_BULGE_REQUIRED,
  what: "A bulge rebuild needs a blister.",
  why: "The rebuilt design does not increase the hull's displacement, so no blister mass was added.",
  consequence: "The rebuild would not raise torpedo protection the way a bulge should.",
  remedies: [
    "Enter the blister's added mass.",
    "Choose a standard rebuild instead.",
    "Drop the bulge from the design.",
  ],
};

/**
 * The authored, versioned BULGE torpedo-protection gain (ADR-0130 section 3), read from the
 * already-parsed ship-building balance. The `refit` section is not yet part of the decoded
 * `ShipBuildingContent` (INC-12 authored it but did not plumb it through), so it is read through a
 * narrow lens and accepted only as a safe, non-negative integer; null simply hides the readout. The
 * value is never invented in the renderer.
 */
function authoredBulgeProtectionGainBp(): number | null {
  const balance = loadShipBuildingData().balance as {
    refit?: { bulgeProtectionGainBp?: unknown };
  };
  const gain = balance.refit?.bulgeProtectionGainBp;
  return typeof gain === "number" && Number.isSafeInteger(gain) && gain >= 0 ? gain : null;
}

/**
 * Checks a changed design as a rebuild of `shipId`: compiles it, compares it with the ship's current design against the
 * retained-hull limits and the dock, and answers with the findings and how far each measure goes. Nothing is queued. The same
 * rules the engine applies when the month is committed (`applyStartRebuild`), so a legal check means the order will be
 * accepted unless the situation changes.
 */
function rebuildCheck(
  record: SessionRecord,
  shipId: string,
  draftIn: Record<string, unknown>,
  rebuildKind?: "BULGE",
): BridgeResult<{ view: RebuildCheckView; draft: DesignDraft }> {
  const found = rebuildableShip(record, shipId);
  if (!found.ok)
    return { outcome: "rejected", reason: "SHIP_NOT_REBUILDABLE", diagnostics: [found.error] };
  const shape = validateDraftShape(draftIn);
  if (shape.length > 0)
    return { outcome: "rejected", reason: "INVALID_COMMAND_PAYLOAD", diagnostics: shape };
  const content = loadShipBuildingContent();
  if (content.rebuild === null)
    return {
      outcome: "rejected",
      reason: "REBUILD_RULES_MISSING",
      diagnostics: ["The ship-building content has no rebuild rules"],
    };
  const draft = { ...(draftIn as unknown as DesignDraft), nationId: record.playerSlotId };
  const month = monthIdOf(record);
  const env = content.environmentFor(month);
  const partsContent = content.draftCompileContent;
  if (partsContent === undefined)
    return {
      outcome: "rejected",
      reason: "REBUILD_REJECTED",
      diagnostics: ["The ship-building content carries no parts to compile a design from"],
    };
  let compiledResult: DraftCompileResult;
  let currentResult: DraftCompileResult;
  try {
    compiledResult = compileDraftFromParts({
      designId: found.design.designVersionId,
      draft,
      month,
      content: partsContent,
      ctx: env.ctx,
      nation: { nationId: draft.nationId },
    });
    currentResult = compileDraftFromParts({
      designId: found.design.designVersionId,
      draft: found.draft,
      month,
      content: partsContent,
      ctx: env.ctx,
      nation: { nationId: found.draft.nationId },
    });
  } catch (e) {
    return {
      outcome: "rejected",
      reason: "REBUILD_REJECTED",
      diagnostics: [e instanceof Error ? e.message : String(e)],
    };
  }
  const categories = new Map(content.components.map((c) => [c.id, c.category]));
  const changesNothing =
    draftChangeKinds(found.draft, draft, (id) => categories.get(id)).length === 0;
  const bulgeProtectionGainBp = rebuildKind === "BULGE" ? authoredBulgeProtectionGainBp() : null;
  const blockingProblems = (result: DraftCompileResult): string[] =>
    toLegacyCompileView(result)
      .findings.filter((f) => f.severity === "BLOCKING")
      .map((f) => `${f.what} ${f.why}`);
  // The retained-hull comparison needs both designs' derived facts, so each must pass the barrier.
  // A draft that does not is a normal "not allowed", never a bridge rejection: the panel renders a
  // `success` view's `designProblems`, and an issue-less rejection would leave it stuck on "Checking…".
  if (currentResult.status !== "ACCEPTED" || compiledResult.status !== "ACCEPTED") {
    const designProblems = [
      ...(currentResult.status === "ACCEPTED"
        ? []
        : [
            "The ship's stored design no longer compiles; the content that shipped with the campaign has changed.",
            ...blockingProblems(currentResult),
          ]),
      ...(compiledResult.status === "ACCEPTED" ? [] : blockingProblems(compiledResult)),
    ];
    return {
      outcome: "success",
      value: {
        view: {
          legal: false,
          findings: [],
          designProblems,
          changesNothing,
          measures: null,
          bulgeProtectionGainBp,
        },
        draft,
      },
      diagnostics: [],
    };
  }
  const compiled = compiledResult.compiled;
  const current = currentResult.compiled;
  const designProblems = compiled.valid
    ? []
    : compiled.findings.filter((f) => f.severity === "BLOCKING").map((f) => `${f.what} ${f.why}`);
  const report = validateRebuild(
    rebuildFactsOf(current, found.draft),
    rebuildFactsOf(compiled, draft),
    content.rebuild,
    { demand: yardDemandOf(compiled, draft), yards: env.yards },
  );
  // The manual's armament-change conditions (SB3-R26), the exact rule set the engine applies; and the
  // BULGE requirement (SB3-R25), checked only when the player chose a bulge rebuild.
  const armamentFindings = rebuildArmamentFindings(found.draft, draft, content, month).filter(
    (f) => f.severity === "BLOCKING" || f.severity === "CRITICAL",
  );
  const bulgeRequired = rebuildKind === "BULGE" && rebuildBulgeRequired(found.draft, draft);
  const view: RebuildCheckView = {
    legal:
      report.legal &&
      compiled.valid &&
      !changesNothing &&
      armamentFindings.length === 0 &&
      !bulgeRequired,
    findings: [
      ...report.findings.map(findingView),
      ...armamentFindings.map(findingView),
      ...(bulgeRequired ? [bulgeRequiredView] : []),
    ],
    designProblems,
    changesNothing,
    measures: report.measures,
    bulgeProtectionGainBp,
  };
  return { outcome: "success", value: { view, draft }, diagnostics: [] };
}

export async function checkRebuild(
  payload: RebuildCheckPayload,
): Promise<BridgeResult<RebuildCheckView>> {
  const record = getCampaignSession(payload.sessionId);
  if (!record) return sessionMissing(payload.sessionId);
  const result = rebuildCheck(record, payload.shipId, payload.draft, payload.rebuildKind);
  if (result.outcome !== "success") return result;
  return { outcome: "success", value: result.value.view, diagnostics: [] };
}

const idPart = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

/**
 * Queues a `StartRebuild` (ADR-0078). The rebuild check runs first, so a design that cannot be built, changes nothing or
 * breaks a retained-hull limit is rejected here without queuing; the engine stays the only authority when the month is
 * committed.
 */
export async function startRebuildCommand(
  payload: StartRebuildCommandPayload,
): Promise<BridgeResult<RebuildCommandOutcome>> {
  const record = getCampaignSession(payload.sessionId);
  if (!record) return sessionMissing(payload.sessionId);
  const checked = rebuildCheck(record, payload.shipId, payload.draft, payload.rebuildKind);
  if (checked.outcome !== "success") return checked;
  const { view, draft } = checked.value;
  if (!view.legal)
    return {
      outcome: "rejected",
      reason: "REBUILD_REJECTED",
      diagnostics: [
        ...(view.changesNothing ? ["The rebuild changes nothing"] : []),
        ...view.designProblems,
        ...view.findings.map((f) => `${f.what} ${f.why}`),
      ],
    };
  const found = rebuildableShip(record, payload.shipId);
  if (!found.ok)
    return { outcome: "rejected", reason: "SHIP_NOT_REBUILDABLE", diagnostics: [found.error] };
  const turn = Number(record.state.snapshot.turnNumber);
  const newDesignVersionId =
    `${found.design.designVersionId.replace(/_(r|rb)\d+$/, "")}_rb${turn}`.slice(0, 64);
  const projectId = `rebuild_${idPart(payload.shipId)}_t${turn}`.slice(0, 64);
  const result = await submitPlayerCommand({
    sessionId: payload.sessionId,
    expectedRevision: payload.expectedRevision,
    transportRequestId: payload.transportRequestId,
    build: (rec) => ({
      body: {
        type: "StartRebuild",
        nationId: rec.playerSlotId,
        shipId: payload.shipId,
        projectId,
        newDesignVersionId,
        draft: { ...draft, nationId: rec.playerSlotId },
        ...(payload.rebuildKind === undefined ? {} : { rebuildKind: payload.rebuildKind }),
      },
      discriminator: `${payload.shipId}/${newDesignVersionId}`,
    }),
  });
  if (result.outcome !== "success") return result;
  return {
    outcome: "success",
    value: {
      commandId: result.value.commandId,
      projectId,
      newDesignVersionId,
      appliedOnNextTurn: true,
    },
    diagnostics: [],
  };
}
