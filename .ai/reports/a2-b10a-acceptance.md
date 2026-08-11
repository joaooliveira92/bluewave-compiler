# Validation Report: A-2 — B10a Economy + Construction acceptance pass

## Outcome

`PASS`

All 10 B10a acceptance criteria (`.ai/briefs/b10a-economy-construction.md`) are
satisfied. The implementation was already committed (`bcc14d4`); this pass ran
the criteria and added one missing proof test (a full 3-nation economy turn).

## Scope delivered

- Monthly revenue/possession income (`NAVAL_APPROPRIATION`), maintenance
  (`MAINTENANCE_EXPENDITURE`), appropriation, obligation, and construction
  phases in `MonthExecutor`.
- Balanced, hashed per-nation `FinancialLedger` (debit == credit enforced at
  append).
- Paid-work-only construction rule (DESIGN-23 §7.4): zero payment → zero work.
- Completion promotes a construction project to a commissioned ship in
  `FleetState`.
- `BudgetProjectCommand` through `CommandLifecycle` with typed outcomes.

## Requirements evidence (criterion-by-criterion)

| # | Criterion | Evidence | Verdict |
| - | - | - | - |
| 1 | Full monthly turn with GBR, FRA, GER | NEW `phase-engine/test/economy.test.ts` "C1" — all three nations run revenue and keep positive treasury | **PASS** |
| 2 | Treasury updates via balanced postings (revenue, maintenance, construction) | "C2" — balanced ledger, NAVAL_APPROPRIATION + MAINTENANCE_EXPENDITURE present; existing `month.test.ts` "outputs FinancialLedger entries with correct shape" | **PASS** |
| 3 | Financial ledger hash deterministic + equals canonical serialization | "C3" — hash stable across runs and equals `sha256(canonicalSerialize(entries))` | **PASS** |
| 4 | Paid-work-only; zero payment → zero progress | "C4" + `month.test.ts` "zero payment produces zero progress (paid-work rule)" | **PASS** |
| 5 | Completed project → commissioned ship in FleetState | "C5" + `month.test.ts` "promotes completed construction project to fleet ship" | **PASS** |
| 6 | Treasury never negative at committed boundary | "C6" + `month.test.ts` "never produces negative treasury" + integration "Treasury never silently becomes negative" | **PASS** |
| 7 | Determinism for fixed seed (replay identical snapshots/hashes) | "C7" + `month.test.ts` determinism + cross-process golden (unchanged) | **PASS** |
| 8 | CommandLifecycle accepts/rejects with typed outcomes | `commands.test.ts` (success/idempotency_match/idempotency_conflict/rejected) + integration tests 5-7 (STALE_SNAPSHOT_HASH, UNAUTHORIZED, insufficient treasury) | **PASS** |
| 9 | Existing compiler/command/phase/persistence/determinism suites pass | `pnpm -w turbo run build test` → 32 tasks green | **PASS** |
| 10 | `vitest run` passes across workspace | same run | **PASS** |

## Commands and observed results

```text
$ pnpm --filter @bluewave/phase-engine test economy.test.ts
  ✓ test/economy.test.ts (7 tests)
  Test Files  1 passed (1)   Tests  7 passed (7)

$ pnpm -w turbo run build test
  Tasks: 32 successful, 32 total
  >>> FULL TURBO
```

## Determinism evidence

- Golden cross-process hashes unchanged (see `.ai/reports/a0-b10b-acceptance.md`);
  `pnpm test:cross-process` still matches `golden/hashes.json`.
- C3/C7 assert ledger + snapshot determinism directly.

## Canonical artifact changes

None. No golden hashes or fixtures regenerated.

## Tests added

- `packages/phase-engine/test/economy.test.ts` (7 tests): 3-nation turn,
  balanced ledger, finance-hash determinism, paid-work rule, completion→ship,
  non-negative treasury, fixed-seed determinism.

## Security and cancellation

No new trust boundaries. Existing `AbortSignal` in compile/save paths unchanged
(integration tests 14-15 green).

## Performance observations

Not collected; no changes made.

## ADRs and dependencies

None new.

## Known limitations and deferred requirements

- Tax rates, industrial capacity, trade income, arrears/insolvency, wartime
  modifiers, naval bases, repair/refit/scrap, class batches, and AI decision
  making remain deferred per the B10a brief (B10c/B10d and later).

## Changed files

- `packages/phase-engine/test/economy.test.ts` (new).
- `docs/PROGRESS.md`, `.ai/SPRINT-PLAN.md`: status updates.

## Git and remote status

- Branch: `feat/a0-b10b-acceptance`
- Commits: pending for this pass
- Working tree: clean
- Push status: not pushed
- Merge performed: `no`

## Secondary consistency check

- Re-ran the economy test file after prettier: green.
- Full workspace build+test re-run: 32 tasks green.