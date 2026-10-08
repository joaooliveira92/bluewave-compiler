import { compileDesign, validateDraftShape, type DesignDraft } from "@bluewave/ship-design";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type {
  DesignCommandOutcome,
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
