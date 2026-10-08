import {
  APPROPRIATION_RATE_MAX_BP,
  APPROPRIATION_RATE_MIN_BP,
  RESEARCH_BUDGET_MAX,
  RESEARCH_BUDGET_MIN,
} from "@bluewave/campaign";
import { SafeInt } from "@bluewave/contracts";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type {
  BudgetCommandOutcome,
  BudgetScreenProjection,
  SubmitBudgetAllocationPayload,
} from "../../shared/budget-contract.js";
import { getCampaignSession } from "../campaignSessions.js";
import { currentRevision, submitPlayerCommand } from "./playerCommandSupport.js";

/**
 * Budget allocation (ADR-0060). Same authority model as diplomacy: the desktop
 * queues a real `SetBudgetAllocation` envelope; the engine validates the bounds at
 * issue time and is the sole mutator when `commitMonth` applies it.
 */
export async function inspectBudgetScreen(
  sessionId: string,
): Promise<BridgeResult<BudgetScreenProjection>> {
  const record = getCampaignSession(sessionId);
  if (!record) {
    return {
      outcome: "error",
      reason: "SESSION_NOT_FOUND",
      diagnostics: [`No active campaign session ${sessionId}`],
    };
  }
  const nation = record.state.snapshot.nations.get(record.playerSlotId);
  if (!nation) {
    return {
      outcome: "error",
      reason: "UNKNOWN_PLAYER_SLOT",
      diagnostics: [`No nation ${record.playerSlotId} in session ${sessionId}`],
    };
  }
  return {
    outcome: "success",
    value: {
      revision: currentRevision(record),
      month: record.month,
      appropriationRateBp: Number(nation.navalAppropriationRateBp),
      researchBudget: Number(
        nation.research.standingResearchBudget ?? nation.research.researchBudget,
      ),
      bounds: {
        appropriationRateMinBp: APPROPRIATION_RATE_MIN_BP,
        appropriationRateMaxBp: APPROPRIATION_RATE_MAX_BP,
        researchBudgetMin: RESEARCH_BUDGET_MIN,
        researchBudgetMax: RESEARCH_BUDGET_MAX,
      },
    },
    diagnostics: [],
  };
}

export async function submitBudgetAllocation(
  payload: SubmitBudgetAllocationPayload,
): Promise<BridgeResult<BudgetCommandOutcome>> {
  return submitPlayerCommand({
    sessionId: payload.sessionId,
    expectedRevision: payload.expectedRevision,
    transportRequestId: payload.transportRequestId,
    build: (record) => ({
      body: {
        type: "SetBudgetAllocation",
        nationId: record.playerSlotId,
        appropriationRateBp: SafeInt(payload.appropriationRateBp),
        researchBudget: SafeInt(payload.researchBudget),
      },
      discriminator: "budget",
    }),
  });
}
