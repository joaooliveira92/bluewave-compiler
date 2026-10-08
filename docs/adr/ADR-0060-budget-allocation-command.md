# ADR-0060: Player budget allocation (`SetBudgetAllocation`)

Status: accepted (2026-10-07). Spec: `.scratch/rtw3-parity-ux-overhaul` F-12; roadmap item 2
(`docs/research/rtw3-parity-engine-roadmap.md`). Owner approved the roadmap ("approve all", autonomous).

## Decision
- New engine command `SetBudgetAllocation { nationId, appropriationRateBp, researchBudget }`
  (15th player command). Validated in `CommandLifecycle` against versioned ruleset constants in
  `packages/campaign/src/budgetConstants.ts`: rate 500..5000 bp, research 0..1000 per month, integers, known
  nation. Applied in `command_collection` by `applySetBudgetAllocation`.
- The rate writes the existing `navalAppropriationRateBp`, which already drives monthly revenue.
- Research is spent from `ResearchState.researchBudget`, which `resolve_research` zeroes after paying
  (B10b acceptance test C1 pins that, so it is kept). A new optional `ResearchState.standingResearchBudget`
  refills it each month. It is `undefined` unless the player sets it, so **no existing campaign, golden
  hash or AI behaviour changes** until a player issues the command.
- Desktop: `inspectBudgetScreen` / `submitBudgetAllocation` bridge commands (same queue-and-validate path as
  diplomacy), and a Budget allocation panel on Treasury. Bounds come from the engine, never hard-coded in the UI.

## Not done
- **Resign** has no engine concept; ending a campaign is already **Close** (the save is kept). A separate
  resign mechanic (defeat/score) would be its own engine change.
- The AI does not use the command; it keeps its own research funding.
