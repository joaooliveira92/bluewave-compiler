**Type:** grilling
**Status:** open
**Blocked by:** 01

## Question

Spec §14 (Advance Month Flow) of [01-diagnosis.md](../01-diagnosis.md).

The real month-orchestration pipeline (`packages/phase-engine`'s
`PhaseRegistry`/`month.ts`) is already far more built than the doc assumes —
and already runs tactical battle generation as part of resolution (map
Notes: report battle outcomes as plain text only, no tactical UI, per the
charting decision). No `AbortSignal` cancellation path exists in the real
command flow; a real idempotency/ledger system already exists in
`packages/commands` (`CommandIdempotencyMap`, `CommandLedger`,
`ReservationManager`, `ScopedIdempotencyStore`, consumed by
`phase-engine/month.ts`).

Decide:

1. **Pre-turn review contents** (§14.2): confirm each listed field is
   derivable from real state at review time (cross-reference
   [Treasury](./06-treasury-budget.md), [Priorities](./04-immediate-priorities-engine.md)).
2. **Blockers vs. warnings** (§14.3): confirm the doc's initial lists match
   what the real phase pipeline can actually detect pre-commit versus only
   discovers mid-resolution.
3. **Resolution request & idempotency** (§14.4): reconcile the doc's
   `AdvanceCampaignMonthCommand` (with its own `requestId`) against the real
   `packages/commands` idempotency machinery and
   [Campaign lifecycle/revision](./01-campaign-lifecycle-time-revision.md)'s
   resolved revision model — decide whether `requestId` is genuinely new or
   whether the real ledger already provides equivalent identity.
4. **Cancellation semantics** (§14.5): since no `AbortSignal` path exists,
   decide whether Milestone 2 builds real mid-resolution cancellation (new,
   nontrivial work) or ships without it — e.g. disable the Advance-Month
   action for the operation's duration instead, deferring true
   cancellation. Recommend the latter unless research surfaces this is
   already trivial to add.
5. **Resolution stages** (§14.6): map the doc's proposed 17-step sequence
   onto the real `PhaseRegistry` phase list — cite the actual phase names
   and order rather than assuming the doc's list is correct.
6. **Transactional requirement & double submission** (§14.7–§14.8): confirm
   atomicity is already handled by `packages/persistence`'s existing
   atomic-replace mechanism (per the map's Notes) — this section may need
   far less new design than the doc implies.

## Notes for the resolving session

- This ticket blocks [Monthly resolution presentation](./14-monthly-resolution-presentation.md)
  and [Monthly Naval Estimates Report](./15-monthly-naval-estimates-report.md)
  — both depend on the real stage list decided here.
