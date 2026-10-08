import { useState } from "react";
import { Button } from "../../components/ui/button.js";
import { CardContent, CardHeader, CardTitle } from "../../components/ui/card.js";
import { GlassCard } from "../../components/ui/glass-card.js";
import { useCommandScreenWorkflow } from "../../lib/command-screen-workflow.js";
import { useCampaignRevision } from "../../shell/CampaignShellContext.js";
import type {
  BudgetCommandOutcome,
  BudgetScreenProjection,
} from "../../../shared/budget-contract.js";
import {
  acceptBudgetAllocation,
  formatRate,
  initialBudgetPolicyState,
  projectBudgetPolicy,
  type BudgetPolicyState,
} from "./budget-policy-state.js";

export interface BudgetPolicyPanelProps {
  readonly sessionId: string;
}

/**
 * Player budget allocation (F-12, ADR-0060): the naval appropriation rate and a
 * standing monthly research budget. Bounds come from the engine; the engine
 * re-validates on submit and applies the change when the month is advanced.
 */
export function BudgetPolicyPanel({ sessionId }: BudgetPolicyPanelProps) {
  const bridge = window.bluewave;
  const campaignRevision = useCampaignRevision();
  const workflow = useCommandScreenWorkflow<
    BudgetPolicyState,
    BudgetScreenProjection,
    BudgetCommandOutcome
  >(
    {
      initialState: initialBudgetPolicyState,
      load: () =>
        bridge
          ? bridge.campaign.execute("inspectBudgetScreen", sessionId)
          : Promise.reject(new Error("Bluewave bridge not available")),
      project: projectBudgetPolicy,
      accept: acceptBudgetAllocation,
    },
    { refreshKey: campaignRevision },
  );
  const { state } = workflow;
  // The sliders show the player's draft; with no draft they show the engine's values.
  // A fresh projection (new revision) discards any stale draft.
  const [draft, setDraft] = useState<{ revision: number; rate?: number; research?: number }>({
    revision: state.revision,
  });
  const current = draft.revision === state.revision ? draft : { revision: state.revision };
  const rate = current.rate ?? state.appropriationRateBp;
  const research = current.research ?? state.researchBudget;
  const setRate = (value: number) => setDraft({ ...current, rate: value });
  const setResearch = (value: number) => setDraft({ ...current, research: value });

  const { bounds } = state;
  const loaded = bounds.appropriationRateMaxBp > 0;
  const busy = state.pendingRequest !== null || state.requiresRefresh;
  const dirty = rate !== state.appropriationRateBp || research !== state.researchBudget;

  function apply(): void {
    if (!bridge) return;
    workflow.execute("submit", ({ expectedRevision, transportRequestId }) =>
      bridge.campaign.execute("submitBudgetAllocation", {
        sessionId,
        expectedRevision,
        transportRequestId,
        appropriationRateBp: rate,
        researchBudget: research,
      }),
    );
  }

  return (
    <GlassCard glassVariant="liquid-refract" data-testid="budget-policy-panel">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Budget allocation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {workflow.loadError !== null && (
          <p role="alert" className="whitespace-pre-line text-sm text-destructive">
            {workflow.loadError}
          </p>
        )}
        {loaded && (
          <>
            <label className="block space-y-1 text-sm">
              <span className="flex justify-between">
                <span>Naval appropriation</span>
                <span className="tabular-nums">{formatRate(rate)}</span>
              </span>
              <input
                type="range"
                aria-label="Naval appropriation rate"
                className="w-full"
                min={bounds.appropriationRateMinBp}
                max={bounds.appropriationRateMaxBp}
                step={50}
                value={rate}
                onChange={(event) => setRate(Number(event.target.value))}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="flex justify-between">
                <span>Research per month</span>
                <span className="tabular-nums">{research.toLocaleString()}</span>
              </span>
              <input
                type="range"
                aria-label="Research budget per month"
                className="w-full"
                min={bounds.researchBudgetMin}
                max={bounds.researchBudgetMax}
                step={10}
                value={research}
                onChange={(event) => setResearch(Number(event.target.value))}
              />
            </label>
            <Button type="button" size="sm" disabled={!dirty || busy} onClick={apply}>
              Apply allocation
            </Button>
          </>
        )}
        {state.notice !== null && (
          <p role="status" className="whitespace-pre-line text-sm text-muted-foreground">
            {state.notice}
          </p>
        )}
      </CardContent>
    </GlassCard>
  );
}
