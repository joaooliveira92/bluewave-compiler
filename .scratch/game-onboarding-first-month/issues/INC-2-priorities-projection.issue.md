# INC-2 — Immediate Priorities projection

**What to build:** The read-only priorities engine, per [the assembled
spec](../spec.md) §7 — a pure `buildPrioritiesProjection(snapshot,
playerNationId)` in `@bluewave/campaign-engine` (new `src/priorities.ts`,
re-exported), feeding the Overview panel (INC-4), the pre-turn review (INC-8),
and the naval estimates report (INC-7).

- `StrategicPriority { id, type, severity, title, summary, reason,
  destination, fingerprint }` + `prioritySeveritySchema` +
  `strategicPriorityTypeSchema` (6 types ship).
- **6 of 8 doc types:** `monthly_deficit`, `critical_cash_reserve`,
  `low_research_spending`, `construction_near_completion`,
  `high_foreign_tension`, `no_active_construction`. **Cut:** `obsolete_active_class`
  and `construction_stalled` (no trustworthy signal — see spec §7; do not
  rebuild them).
- Named, documented, unit-tested constants in `priorities.ts`:
  `MIN_RESEARCH_SHARE_BP = 800`, `NEAR_COMPLETION_WORK_RATIO = 0.9`, the
  cash-reserve inequality (`treasury < max(totalMonthlyExpenditure, 1)`),
  the deficit-criticality predicate (`treasury + projectedBalance < 0`).
  `HIGH_TENSION_THRESHOLD = 8` is **imported** from `diplomacy.ts` — never
  re-declared.
- `construction_near_completion` uses the work-ratio proxy
  (`completedWork / totalWork >= 0.9`), NOT a months trigger (spec §7's
  recorded deviation — months-to-completion is underivable).
- Cash triggers consume INC-1's two new `PlayerProjection.economy` fields.
- 5-key deterministic sort: severity → direct financial risk → time-to-
  consequence → stable type order → fingerprint.
- Dismissal policy (information/advisory dismissible only) is a *consumer*
  concern; the projection emits `fingerprint`s. The `ui-state.json` sidecar
  (INC-3) is where dismissal/inspection state lives.
- Pure read-only over the snapshot — never wired into `MonthExecutor`;
  goldens stay 10/10.

**Blocked by:** INC-1 (the two `economy` fields feed the cash triggers)

**Status:** ready-for-agent

- [ ] `buildPrioritiesProjection` returns the 6 types with correct triggers
      against real snapshot data (no fabricated values)
- [ ] All named constants are centralized in `priorities.ts` and unit-tested
      (`MIN_RESEARCH_SHARE_BP = 800`, `NEAR_COMPLETION_WORK_RATIO = 0.9`,
      cash-reserve + deficit-criticality predicates)
- [ ] `HIGH_TENSION_THRESHOLD`/`isHighTension` are imported from
      `diplomacy.ts`, not re-declared
- [ ] `obsolete_active_class` + `construction_stalled` are absent (cut with
      the recorded reasons)
- [ ] Sort is deterministic (identical inputs → identical order) per the
      ​​5-key chain
- [ ] `id`/`fingerprint` derive deterministically from condition identity
- [ ] `destination` maps to a real screen (`overview | construction | fleet |
      research | diplomacy`); no `treasury` destination (no route)
- [ ] Goldens 10/10 unchanged; two-process determinism byte-identical
- [ ] Unit tests cover every trigger + boundary + the sort order
