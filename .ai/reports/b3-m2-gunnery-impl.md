# B-3 M2 Gunnery — Validation Report (INC-1..5, DONE)

- **Sprint:** B-3 (`.ai/SPRINT-PLAN.md` Track B row 3) — core surface gunnery fire-resolution slice
- **Date:** 2026-08-13
- **Status:** DONE — PASS. All increments (INC-1..5) implemented, reviewed, and gated.
- **Governing doc:** DESIGN-39 (`docs/rules/gunnery.md`); spec `.scratch/b3-m2-gunnery/spec.md` (AC-1..15, INC-1..5).

## Scope resolution & traceability
- Wayfinder map + 6 decision tickets (resolved): `.scratch/b3-m2-gunnery/map.md`, `issues/01..06-*.md`.
- Spec (AC-1..15, INC-1..5): `.scratch/b3-m2-gunnery/spec.md`; pointer `.ai/specs/b3-m2-gunnery.md`.
- Brief `.ai/briefs/b3-m2-gunnery.md`; research `docs/research/b3-m2-gunnery.md` (naval gun ballistics: base reload ms by caliber, salvo/spotting practice, fire-control).
- **ADR-0020**: `docs/adr/ADR-0020-b3-gunnery-scope-and-reason-codes.md` — scope/integration boundary (mirrors ADR-0018), §32 reason-code policy, `SURFACE_FIRE_CONTROL_MINIMUM_BP=2_000`, and the 1880s RML heavy-gun `baseReloadMilliseconds=210_000` BALANCE TARGET decision.
- **Deferred (recorded, owning track):** autoloaders §6-10, dual-purpose §11-15 (later gunnery slices); armor/penetration §16-24 (B-4); straddle §25 + RAPID/AA predicates; target allocation §26-27; damage effects §29 (B-4/DAMAGE); phase wiring (B-6).

## Commits
| Stage | Commit |
| ----- | ------ |
| B-3 scoping (map/tickets/spec/brief/research) | `fd3fabe` |
| INC-1 gunnery state + modes + guards + base contract | `9777180` |
| INC-2 accuracy resolution (17-factor, floor-once, keyed hit-draw) | `e85efb9` |
| INC-3 rate-of-fire/reload (ceil) + gun-quality table | `33e721e` |
| INC-4 salvo/event + ordering + atomic ammo + resolveGunnery + determinism | `7cc73f8` |
| INC-5 contracts rollup + ballistics constant set + reason-code set-equality + ADR-0020 | (this session, see commit below) |

Note: external commits `b65154f`/`d1e5403` ("adjusted import order"/"adjusted imports from ai") and `5991070`/`db2b73f` (`test(ai): fix AI test suite failures`, `adjusted aiPhase`) appeared from another actor across the sprint window and are not B-3 deliverables; the coordination hazard flagged in the prior report revision is resolved (working tree was clean at INC-5 start). A separate, unrelated CLI debug-surface effort landed at `de6eb55` (`.scratch/cli-battle-debug-surface/`) — also not a B-3 deliverable.

## AC status (INC-1..5, all PASS)
All AC-1..AC-15 implemented and proven by tests. AC-10 (reason-code set-equality) and AC-14 (full contracts rollup) — previously INC-5-pending — are now complete.

Proving tests (all in `packages/combat/test/gunnery/` + `packages/combat/test/reason-codes-gunnery.test.ts`): state (AC-1), modes (AC-2), accuracy (AC-3), hit-check (AC-4), rate-of-fire (AC-5), gun-quality (AC-6), ammunition (AC-7), event-record (AC-8), ordering + ledger-order (AC-9), reason-code set-equality (AC-10), advance + pipeline-order + integration-boundary (AC-11), targeting-fog (AC-12), determinism (AC-13), contracts (AC-14), goldens (AC-15).

## INC-5 deliverables (this session)
- **AC-14 full contracts rollup**: extended `combat/test/gunnery/contracts.test.ts` with fail-closed proving tests for all five shipped `*_v1` contracts — `gunnery_v1` (base state/ammo/fire-mode), `gunnery_accuracy_v1` (16-factor manifest), `gunnery_rate_v1` (11-factor §4 manifest), `gun_quality_v1` (-3..+2 table), and the new `gunnery_ballistics_v1` (naval gun ballistics content deliverable).
- **Naval gun ballistics constant set** (`packages/combat/src/gunnery/constants.ts`): `GUNNERY_CALIBERS` (7 calibers) + `BASE_RELOAD_MS_BY_CALIBER` + `SHIPPED_GUNNERY_BALLISTICS_CONTRACT` + `validateGunneryBallisticsContract` + fail-closed `baseReloadMsForCaliber` lookup (`GUNNERY_RATE_FACTOR_MISSING` on unknown caliber). Six calibers grounded directly from `docs/research/b3-m2-gunnery.md` §1 (NavWeaps); the 1880s RML heavy-gun caliber is an authored BALANCE TARGET (`210_000` ms) per ADR-0020 §5, within the research-recommended `120_000`–`300_000` ms range.
- **AC-10 reason-code set-equality**: new `combat/test/reason-codes-gunnery.test.ts` — proves the shipped `GUNNERY_REASON_CODES` set equals exactly the 7 in-slice §32 codes + 1 deferred-predicate marker (`GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED`, explicitly not a §32 code), that no deferred §32 code (autoloader/dual-purpose/armor/target/straddle, 12 codes) is shipped, and that the gunnery catalog and the shared combat catalog are disjoint (the 4 reused codes live only in the shared catalog).
- **ADR-0020**: `docs/adr/ADR-0020-b3-gunnery-scope-and-reason-codes.md` — scope/integration boundary (mirrors ADR-0018), §32 reason-code policy, `SURFACE_FIRE_CONTROL_MINIMUM_BP=2_000` rationale, and the RML-heavy `baseReloadMilliseconds` BALANCE TARGET resolution.
- **Pre-existing defect repaired** (blocking the gate, unrelated to gunnery): `packages/ai/src/aiPlanner.ts:280` had a dead/unreachable comparison (`fields.length === 0` against a statically-15-length tuple, TS2367) that cascaded into `phase-engine#build`, `compiler-cli#build`, `cross-process-test#build` failures. Removed the dead guard (the tuple is never empty). This was a genuine baseline defect discovered while establishing the INC-5 baseline, not a B-3 gunnery change; repaired per ENGINEERING-CONTRACT failure policy ("repair failures... introduced by... fixture inconsistencies, formatting, typing") since it blocked the mandated full-repo gate.

## Validation evidence (exact commands + results) — orchestrator gate, this session
- `pnpm --filter @bluewave/combat exec tsc --noEmit` → exit 0, clean.
- `pnpm --filter @bluewave/combat build` → pass.
- `pnpm --filter @bluewave/combat lint` (vp lint .) → 0 warnings, 0 errors.
- `pnpm --filter @bluewave/combat test` → **44 files / 325 tests pass** (baseline 297 + 28 new INC-5 tests). All pre-existing `simulation/*` and `movement/*` hash asserts unchanged.
- `pnpm -w turbo run build --force` (clean uncached, full repo) → **17/17 tasks successful.**
- `pnpm -w exec tsc -b` (workspace-wide) → exit 0, clean.
- `pnpm lint` (root `vp lint .`, full repo) → non-desktop/non-pre-existing errors: **0**. Remaining errors confined to (a) `apps/desktop` (pre-existing, see Caveat), (b) `packages/ai/test/aiPlanner.test.ts` (pre-existing `CommandIdempotencyMap` type mismatch, 9 occurrences — not touched this session, not caused by the `aiPlanner.ts` dead-code fix), (c) `packages/content-schema/test/nation.test.ts` (known pre-existing broken import), (d) `packages/persistence/test/persistence.test.ts` (pre-existing `Map` type mismatch, 1 occurrence). None are in `packages/combat` or gunnery-touched files.
- `pnpm format` (root `vp fmt --check .`, full repo) → pre-existing repo-wide drift across 247 files (matches the pattern the B-1 report already documented at 147 files); this session's touched files (`packages/combat/src/gunnery/constants.ts`, `packages/combat/test/gunnery/contracts.test.ts`, `packages/combat/test/reason-codes-gunnery.test.ts`, `packages/ai/src/aiPlanner.ts`) were individually formatted (`vp fmt --write <files>`) and re-verified clean; the pre-existing repo-wide drift on unrelated files was left untouched (out of scope — a repo-wide reformat is not a B-3 deliverable).
- `pnpm -w turbo run test --continue --force` (uncached, full repo) → **32/34 tasks successful.** Failed: `@bluewave/content-schema#test` (pre-existing `nation.test.ts` broken import) and `@bluewave/desktop#test` (pre-existing: `apps/desktop` package.json is missing the `@testing-library/react` devDependency and 8+ files import a non-existent `@bluewave/campaign-engine` package — the real package is `@bluewave/campaign` — introduced by commit `b4509e4` "feat(desktop): migrate renderer to React 19 + components/ui kit", unrelated to gunnery; 12 test files fail to resolve imports, 108 tests that do run pass). Both pre-existing and out of scope for B-3.
- `node scripts/verify-golden-hashes.cjs` → **9/9 match golden reference** (AC-15, no ADR-0007 regeneration).
- `BattleResolver`/`StrengthCalculator` unmodified (verified empty `git diff --stat` on `packages/combat/src/resolver.ts` + `packages/combat/src/strength.ts`).
- Two-process determinism (AC-13): `combat/test/gunnery/determinism.test.ts` spawns two separate clean Node child processes (`execFileSync` × 2 against `dist/simulation/run-gunnery-child.js`) and byte-compares output — included and passing in the 325-test combat run above.

## New reason codes (in-slice, gunnery `reasonCodes.ts` only — kept separate from shared catalog)
`INVALID_GUNNERY_STATE`, `GUNNERY_STATE_INVARIANT_FAILED`, `GUNNERY_FIRE_CONTROL_SOLUTION_INSUFFICIENT`, `GUNNERY_ACCURACY_FACTOR_MISSING`, `GUNNERY_RATE_FACTOR_MISSING`, `GUN_QUALITY_OUT_OF_RANGE`, `GUNNERY_AMMUNITION_UNAVAILABLE`, plus the deferred-predicate marker `GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED` (NOT in DESIGN-39 §32 — recorded in ADR-0020). Reused existing: `TACTICAL_STATE_INVARIANT_FAILED`, `TACTICAL_FOG_OF_WAR_VIOLATION`, `INVALID_TACTICAL_CLOCK`, `INVALID_TACTICAL_TIME_CONTRACT`. Set-equality proven by `combat/test/reason-codes-gunnery.test.ts` (AC-10, complete).

## Known limitations / deferred
As spec §3: autoloaders, dual-purpose, armor/penetration (B-4), straddle + RAPID/AA predicates, target allocation, damage effects, phase wiring (B-6). Player battle UI not in scope.

## Pre-existing failures documented (not newly caused by B-3, out of scope)
1. `content-schema/test/nation.test.ts` — broken `content/research/nations/1880/index.ts` import (long-standing, tracked in `docs/OPEN-ISSUES.md`).
2. `apps/desktop` test/lint failures — missing `@testing-library/react` devDependency + wrong `@bluewave/campaign-engine` import name (actual package `@bluewave/campaign`) across 8+ renderer files, introduced by commit `b4509e4`. Desktop/UI concern, not gunnery; not fixed here (would expand scope into the desktop app).
3. `packages/ai/test/aiPlanner.test.ts` lint errors (`CommandIdempotencyMap` type mismatch, 9 occurrences) and `packages/persistence/test/persistence.test.ts` lint error (`Map` type mismatch) — pre-existing, not touched this session (only `packages/ai/src/aiPlanner.ts` was edited, to repair the separate TS2367 build-blocking defect above).

## Definition of done — B-3-IMPL: MET
All AC-1..AC-15 pass with proving tests, no skipped/loosened tests; golden hashes unchanged; `BattleResolver`/`StrengthCalculator` unmodified; ADR-0020 landed; research note present; traceability updated (this report, PROGRESS.md, SPRINT-PLAN.md B-3 row + Immediate next action).
