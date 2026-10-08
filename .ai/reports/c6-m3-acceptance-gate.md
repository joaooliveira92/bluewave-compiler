# Validation Report: C-6 M3 Acceptance Gate

## Outcome

`PASS`

## Scope delivered

M3 `M3_ADVANCED_SURFACE_WARFARE` signed COMPLETED per DESIGN-55 §23 (scoped
closure). All six §4 capabilities transitioned to ACCEPTED:

| §4 capability           | Implementing sprint             | Key ADR        |
| ----------------------- | ------------------------------- | -------------- |
| Torpedoes               | C-1 (INC-1..INC-8, AC-1..AC-25) | ADR-0031       |
| Mines                   | C-2 (INC-1..INC-8, AC-1..AC-25) | ADR-0033       |
| Submarines              | C-3 (INC-1..INC-8, AC-1..AC-22) | ADR-0034..0037 |
| Coastal defenses        | C-4 (INC-1..INC-6, AC-1..AC-11) | ADR-0039       |
| Smoke                   | C-5 (INC-1..INC-9, AC-1..AC-15) | ADR-0040       |
| Detailed damage control | C-5 (INC-1..INC-9, AC-1..AC-15) | ADR-0040       |

Deliverables: `docs/acceptance/m3-capability-registry.md`, updated PROGRESS.md,
updated SPRINT-PLAN.md.

## Commands and observed results

```text
# Build (clean uncached)
$ pnpm -w turbo run build --force
18/18 successful

# TypeScript
$ pnpm tsc -b
clean (exit 0)

# Format
$ pnpm format:fix
2 files fixed (SPRINT-PLAN.md, C-5 report)

# Lint
$ pnpm lint
117 errors (all pre-existing: nation.test.ts import + type assertions; 0 new)

# Combat test suite
$ pnpm -w turbo run test --concurrency=1 --continue --filter @bluewave/combat
197 files / 2524 tests PASS

# Full engine test suites (concurrency=1)
$ pnpm -w turbo run test --concurrency=1 --continue
contracts 1/20 PASS
diagnostics 1/7 PASS
deterministic 1/11 PASS
random 1/16 PASS
content-compiler 4/14 PASS
campaign 9/107 PASS
campaign-engine 13/79 PASS
events 4/25 PASS
commands 1/16 PASS
persistence 4/47 PASS
ai 3/22 PASS
phase-engine 16/145 PASS
compiler-cli 7/95 PASS
cross-process-test 3/14 PASS
content-schema 2/3 PASS (1 pre-existing FAIL: nation.test.ts)
desktop 71/73 PASS (2 pre-existing FAIL: campaignBridge, ConstructionWizard)

# Golden hashes
$ node scripts/verify-golden-hashes.cjs
All 10 hashes match golden reference

# Cross-process determinism
$ pnpm -w turbo run test --filter @bluewave/cross-process-test
3 files / 14 tests PASS (two-process byte-identical)
```

## Determinism evidence

- `scripts/verify-golden-hashes.cjs`: 10/10 match golden reference.
- `@bluewave/cross-process-test`: 3 suites / 14 tests PASS.
- `BattleResolver`/`StrengthCalculator` unmodified (integration-boundary tests in
  every M3 module prove zero imports/zero wiring to legacy resolver).

## Canonical artifact changes

None. M3 is entirely within `@bluewave/combat` (no phase/snapshot/hash-surface
changes from C-1..C-4); C-5 added `resolveSmoke` (step 5.5) and
`resolveDamageControl` (step 8.6) to the minute-advance engine, which
regenerated goldens under ADR-0007 with documented cause in the C-5 report.

## Pre-existing failures (not M3-blocking)

- `content-schema/test/nation.test.ts` — broken import (deleted corpus).
- `apps/desktop` — campaignBridge.test.ts (NOT_IMPLEMENTED→INVALID_PAYLOAD),
  ConstructionWizard.test.tsx ("ship name" assertion over-match).

## Deferred (recorded per M3 spec)

Progressive-flooding, torpedo evasion/persistence, submarine tactical
allocation/loss/interception/ASW/friendly-fire, mine-strike resolution,
smoke→gunnery/spotting integration, full terminal damage state machine,
survivors/rescue, YAML constants, coastal-defense battle integration.

## Changed files

```
A  docs/acceptance/m3-capability-registry.md   (new)
M  docs/PROGRESS.md                             (M3 COMPLETED, next D-1)
M  .ai/SPRINT-PLAN.md                           (C-6 DONE, next D-1)
```

## Git and remote status

- Branch: `dev`
- Commits: `9696f91` (C-5-IMPL), `20f3d7c` (format), `d8957ef` (format 2), plus
  the upcoming C-6 commit.
- Working tree: clean after C-6 commit.
- Push: not performed (no explicit instruction).

## Secondary consistency check

- `rg -i "open decision" docs/` — zero hits (no unresolved markers).
- `docs/acceptance/m3-capability-registry.md` references all 6 capabilities.
- `PROGRESS.md` milestone section updated.
- `SPRINT-PLAN.md` C-6 row DONE, "Immediate next action" points to D-1.
