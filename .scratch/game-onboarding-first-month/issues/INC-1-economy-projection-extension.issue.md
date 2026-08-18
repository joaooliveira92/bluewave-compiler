# INC-1 — PlayerProjection economy extension + header fields

**What to build:** The two new derived `PlayerProjection.economy` fields and
the two new header fields the rest of the milestone feeds off, per [the
assembled spec](../spec.md) §9 and §5. No new command — everything ships via
the existing `inspectCampaign` command.

- `PlayerProjection.economy` gains `constructionSpend` and `researchSpend`,
  alongside the existing `treasury`, `monthlyAppropriation`,
  `shipyardCapacity` (spec §9).
  - `researchSpend` = the real `researchBudget` field (direct read).
  - `constructionSpend` = the nation's total **committed** work across
    construction projects (cumulative `paidWork`), following the exact
    honest pattern `buildOpeningBriefingProjection` already documents
    (`opening-briefing.ts:188-193`): there is **no pre-commit monthly
    construction figure** — `MonthReport.newConstructionSpending` only exists
    after a `commitMonth`. Do NOT fabricate a monthly number; surface the
    cumulative commitment and note it's the honest pre-commit value.
- `PlayerProjection` gains `nationName` (from `NationState.name`) and
  `projectedSurplusDeficit` (derived from `income`/`expenses`/
  `maintenanceCost` — the same raw fields Treasury uses, reusing the
  briefing's `projectedSurplus` derivation chain), for the campaign header
  (spec §5). `maintenanceCost` is re-derived, never the raw `0`
  pre-first-commit value.
- Pure, read-only, deterministic derivations over the immutable snapshot —
  no hash impact, goldens stay 10/10.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `PlayerProjection.economy.constructionSpend` + `researchSpend` are
      derived from real snapshot data and served via `inspectCampaign`
- [ ] `PlayerProjection.nationName` + projected surplus/deficit are derived
      and served via `inspectCampaign`
- [ ] Every derivation is pure over the snapshot (no I/O, no randomness, no
      `Date.now()`) — projections are never fed into `MonthExecutor`
- [ ] Existing projection consumers still compile; `tsc -b` clean
- [ ] Goldens 10/10 unchanged; two-process determinism byte-identical
- [ ] Unit tests cover each new field's derivation against fixture data
