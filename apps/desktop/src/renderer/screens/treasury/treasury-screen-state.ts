import type { PlayerProjection } from "@bluewave/campaign-engine";

export interface TreasuryScreenState {
  readonly projection: PlayerProjection | null;
  readonly loadError: string | null;
}

export function initialTreasuryScreenState(): TreasuryScreenState {
  return { projection: null, loadError: null };
}

export function applyProjectionLoaded(
  state: TreasuryScreenState,
  projection: PlayerProjection,
): TreasuryScreenState {
  return { projection, loadError: null };
}

export function applyLoadFailed(state: TreasuryScreenState, error: string): TreasuryScreenState {
  return { ...state, loadError: error };
}

export interface TreasuryBreakdown {
  readonly income: number;
  readonly fleetMaintenance: number;
  readonly constructionSpend: number;
  readonly researchSpend: number;
  readonly totalExpenditure: number;
  readonly projectedSurplusDeficit: number;
  readonly availableFunds: number;
  readonly projectedMonthEndFunds: number;
}

/**
 * Pure read-only Treasury summary, every figure from the `inspectCampaign`
 * projection (spec §9). Nothing is computed in the renderer except the two
 * presentation sums: total expenditure and projected month-end funds (both
 * sums of projection numbers). Surplus/deficit may legitimately be negative.
 */
export function summarizeTreasury(projection: PlayerProjection): TreasuryBreakdown {
  const income = projection.economy.monthlyAppropriation;
  const fleetMaintenance = projection.economy.maintenanceCost;
  const constructionSpend = projection.economy.constructionSpend;
  const researchSpend = projection.economy.researchSpend;
  const totalExpenditure = fleetMaintenance + constructionSpend + researchSpend;
  const projectedSurplusDeficit = projection.projectedSurplusDeficit;
  const availableFunds = projection.economy.treasury;
  const projectedMonthEndFunds = availableFunds + projectedSurplusDeficit;
  return {
    income,
    fleetMaintenance,
    constructionSpend,
    researchSpend,
    totalExpenditure,
    projectedSurplusDeficit,
    availableFunds,
    projectedMonthEndFunds,
  };
}

export interface BudgetSegment {
  readonly id: "maintenance" | "construction" | "research";
  readonly label: string;
  readonly value: number;
  /** Share of the bar's full width, 0..1. */
  readonly width: number;
  /** Share of total expenditure, 0..1 (0 when nothing is spent). */
  readonly shareOfSpend: number;
}

export interface BudgetBar {
  readonly income: number;
  readonly totalExpenditure: number;
  readonly segments: readonly BudgetSegment[];
  /** Where income falls along the bar, 0..1 — spending past this line is a deficit. */
  readonly incomeMarker: number;
  readonly overBudget: boolean;
}

/**
 * Geometry for the "budget at a glance" bar (spec V-4): expenditure stacked in
 * segments against an income marker, on one shared scale (whichever is larger),
 * so over-spending is visible as the bar running past the marker. Presentation
 * only — every figure comes from `summarizeTreasury`.
 */
export function buildBudgetBar(t: TreasuryBreakdown): BudgetBar {
  const income = Math.max(0, t.income);
  const scale = Math.max(income, t.totalExpenditure, 1);
  const spend = t.totalExpenditure;
  const make = (id: BudgetSegment["id"], label: string, value: number): BudgetSegment => ({
    id,
    label,
    value,
    width: Math.max(0, value) / scale,
    shareOfSpend: spend > 0 ? Math.max(0, value) / spend : 0,
  });
  return {
    income,
    totalExpenditure: spend,
    segments: [
      make("maintenance", "Fleet maintenance", t.fleetMaintenance),
      make("construction", "Construction", t.constructionSpend),
      make("research", "Research", t.researchSpend),
    ],
    incomeMarker: income / scale,
    overBudget: spend > income,
  };
}
