# INC-1 — PlayerProjection economy extension + header fields

**What to build:** The two new derived `PlayerProjection.economy` fields and
the two new header fields the rest of the milestone feeds off, per [the
assembled spec](../spec.md) §9 and §5. No new command — everything ships via
the existing `inspectCampaign` command.

- `PlayerProjection.economy` gains `constructionSpend` (sum of active
  projects' this-month work allocation) and `researchSpend` (the real
  `researchBudget` field), alongside the existing `treasury`,
  `monthlyAppropriation`, `shipyardCapacity` (spec §9).
- `PlayerProjection` gains `nationName` (from `NationState.name`) and
  `projectedSurplusDeficit` (derived from `income`/`expenses`/
  `maintenanceCost` — the same raw fields Treasury uses), for the campaign
  header (spec §5). `maintenanceCost` is re-derived, never the raw `0`
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
