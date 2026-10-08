# 01 — `useNewGameFlow.test.ts` 30s timeouts (pre-existing, red-gates the repo)

**Type:** task

**Status:** resolved (2026-10-06, P-0)

**Blocked by:** none

**Frontier:** no

**What to build:** Make `pnpm test:run` / `pnpm check` green (or green-with-an-explicitly-documented-skip)
for `apps/desktop/src/renderer/shell/useNewGameFlow.test.ts`, which fails with 7 × 30s
`test timed out` errors in workspace runs.

## Observed

- 2026-10-06 (D-4 merge validation gate): 7 tests in
  `apps/desktop/src/renderer/shell/useNewGameFlow.test.ts` time out at 30s each under
  `pnpm -r exec vitest run` / `pnpm test:run`. Reproduced across repeated runs; other
  desktop test files pass.
- Earlier D-4 gates (INC-2..INC-4, 2026-09-22) recorded "desktop 5 failures" as
  pre-existing at a clean baseline — same class, tracked here so the waiver has a ticket
  instead of a memory.

## Why it is pre-existing (verified during the 2026-10-06 `origin/dev` merge, ADR-0044)

- `apps/desktop/**` was byte-identical to `origin/dev` at merge time
  (`git diff --name-only MERGE_HEAD` contains no desktop files).
- `apps/desktop` does not import `@bluewave/combat`, so the air-defense work cannot
  affect it.
- The failures reproduce at a clean baseline of `origin/dev`.

## Why it matters

`pnpm check` (format && lint && typecheck && build && test:run) is permanently red while
this stands, so every validation gate has to hand-waive it — a real desktop regression
would hide inside the known-red noise.

## Acceptance criteria

- [ ] Diagnosed: root cause of the hang (stale mock, un-awaited promise/subscription,
      open handle keeping the worker alive, or a genuinely slow path) — not just raised
      timeouts.
- [ ] Fixed so all 7 tests pass in a workspace run; or, if genuinely environment-bound,
      quarantined with an explicit `.skip`/`todo` carrying this ticket path in the reason
      string (no silent skips).
- [ ] `pnpm test:run` green end-to-end, so `pnpm check` is a usable gate again.

## Notes

Related known pre-existing reds (candidates for sibling tickets): `content-schema/test/nation.test.ts`
import failure; `RulesOfTheNavalAgeScreen` intermittent renderer flake (passes standalone);
compiler-cli parallel-timeout flake (passes standalone).

## Resolution (2026-10-06, P-0)

Root cause: the root `test:run` script ran the plain `vitest` binary, while every package's
`test` script (and the tests' `vi` import, `vite-plus/test`) uses the vite-plus runner. Under
the mismatched runner, the fake-timer / `waitFor` tests in `useNewGameFlow.test.ts` hang.
Fix: `test:run` now runs `vp test run`. `pnpm check` is fully green (desktop 528/528,
combat 3603/3603) with no hand-waived failures.
