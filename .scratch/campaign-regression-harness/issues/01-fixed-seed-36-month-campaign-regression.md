# 01 — Fixed-seed 36-month campaign regression harness

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** no
**Spec:** (this ticket; a full spec is authored when the ticket is picked up)

## Outcome

Delivered as `packages/phase-engine/test/campaign-regression-36mo.test.ts`
(3 seeds x 36 months, real `MonthExecutor`, ~3.3s): zero exceptions, every
produced battle resolves to a §32 reason (none left pending), fleet hp is
non-increasing, hp stays in [0, max], `turnNumber`/calendar advance, treasuries
stay finite, `time_limit` share is bounded, and the same seed replays
byte-identically (ledger + snapshot hashes) while distinct seeds diverge.

Scoped out (recorded): cross-process determinism of the shared campaign path is
already covered by `@bluewave/cross-process-test` (determinism.yml); this harness
adds the multi-month dimension in-process. Hosting a 36-month leg in the
cross-process child (with its own golden) is a separate follow-up if wanted.

## Why

The only multi-year deterministic harness in the repo is
`packages/phase-engine/test/ai-procurement.test.ts` (economy/procurement over 36
months, **no battles**). There is no campaign-level regression net that drives
auto-resolved combat month after month, so a change like ADR-0098 is only covered
at the battle level, never end-to-end through the campaign loop. This ticket adds
that net. It is **not** an ADR-0098 blocker — ADR-0098 is already covered by the
deterministic scenario matrix (`docs/research/p1-tactical-benchmark.md`).

## Scope

One deterministic harness that runs a fixed nation/seed/budget campaign for 36
game-months against the real engine (the same command path `turn:execute` /
`commitMonth` uses), generating and auto-resolving any battles it produces, and
asserting invariants rather than exact outcomes.

## Acceptance

- A fixed scenario matrix (nations x seeds, e.g. 2 nations x 3 seeds) runs 36
  months with zero unhandled exceptions.
- Every produced battle resolves via `resolveBattleAuto` to one of the §32 end
  reasons; no result is malformed or empty.
- **Determinism:** byte-identical `eventLedgerHash` / `minuteHashes`/ campaign
  snapshot hash across two runs of the same seed in the same process and across
  processes (reuse `@bluewave/cross-process-test`).
- **Invariants:** no impossible endings (e.g. `time_limit` share bounded),
  per-side losses monotone over the campaign (a later snapshot never "repairs" a
  ship), no negative hp/strength, budgets never go negative beyond the modelled
  overdraft.
- Runs inside the existing `pnpm test` graph and finishes in a bounded time
  (target < 3 min); tagged so it can be widened without slowing the default run.
- No `Math.random`/clock/fs nondeterminism introduced; the harness takes its
  seeds from a fixed list.

## Notes

- Do not expand this into a campaign-system project: this is a regression net,
  not new gameplay.
- Prefer recording the observed bands as BALANCE_TARGET bands (like ADR-0053/0098)
  rather than brittle exact snapshots.
- Reuse the existing procurement harness's nation/seed/budget structure where it
  fits, but add the battle generation + auto-resolution leg it is missing.
