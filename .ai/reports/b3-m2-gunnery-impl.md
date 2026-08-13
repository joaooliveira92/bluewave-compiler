# B-3 M2 Gunnery — Validation Report (INC-1..4; INC-5 pending)

- **Sprint:** B-3 (`.ai/SPRINT-PLAN.md` Track B row 3) — core surface gunnery fire-resolution slice
- **Date:** 2026-08-13
- **Status:** SCOPING DONE + INC-1..4 IMPLEMENTED (PASS, isolated). **INC-5 (gate) pending** — see caveat.
- **Governing doc:** DESIGN-39 (`docs/rules/gunnery.md`); spec `.scratch/b3-m2-gunnery/spec.md` (AC-1..15, INC-1..5).

## Scope resolution & traceability
- Wayfinder map + 6 decision tickets (resolved): `.scratch/b3-m2-gunnery/map.md`, `issues/01..06-*.md`.
- Spec (AC-1..15, INC-1..5): `.scratch/b3-m2-gunnery/spec.md`; pointer `.ai/specs/b3-m2-gunnery.md`.
- Brief `.ai/briefs/b3-m2-gunnery.md`; research `docs/research/b3-m2-gunnery.md` (naval gun ballistics: base reload ms by caliber, salvo/spotting practice, fire-control).
- **Deferred (recorded, owning track):** autoloaders §6-10, dual-purpose §11-15 (later gunnery slices); armor/penetration §16-24 (B-4); straddle §25 + RAPID/AA predicates; target allocation §26-27; damage effects §29 (B-4/DAMAGE); phase wiring (B-6).

## Commits
| Stage | Commit |
| ----- | ------ |
| B-3 scoping (map/tickets/spec/brief/research) | `fd3fabe` |
| INC-1 gunnery state + modes + guards + base contract | `9777180` |
| INC-2 accuracy resolution (17-factor, floor-once, keyed hit-draw) | `e85efb9` |
| INC-3 rate-of-fire/reload (ceil) + gun-quality table | `33e721e` |
| INC-4 salvo/event + ordering + atomic ammo + resolveGunnery + determinism | `7cc73f8` |

Note: external commits `b65154f` ("adjusted import order") and `d1e5403` ("adjusted imports from ai") appeared mid-sprint from another actor (see Caveat) and are not B-3 deliverables.

## AC status (INC-1..4)
AC-1..AC-9, AC-11..AC-13 implemented and proven by tests; AC-10 (reason-code set-equality) and AC-14 (full contracts rollup) are **INC-5 pending** (seeded/partial in INC-2/3); AC-15 (goldens) verified 9/9 in combat; final gate pending.

Proving tests (all in `packages/combat/test/gunnery/`): state (AC-1), modes (AC-2), accuracy (AC-3), hit-check (AC-4), rate-of-fire (AC-5), gun-quality (AC-6), ammunition (AC-7), event-record (AC-8), ordering + ledger-order (AC-9), advance + pipeline-order + integration-boundary (AC-11), targeting-fog (AC-12), determinism (AC-13).

## Validation evidence (exact commands + results)
- `pnpm --filter @bluewave/combat exec tsc --noEmit` → exit 0, clean.
- `pnpm --filter @bluewave/combat build` → pass.
- `pnpm --filter @bluewave/combat lint` (vp lint .) → 0 warnings, 0 errors.
- `pnpm --filter @bluewave/combat test` → **43 files / 297 tests pass** (baseline 259 + 38 new gunnery). All pre-existing `simulation/*` and `movement/*` hash asserts unchanged (no-regression: `resolveGunnery` is a strict no-op when no batteries).
- `node scripts/verify-golden-hashes.cjs` → **9/9 match golden reference** (AC-15, no ADR-0007 regeneration).
- `BattleResolver`/`StrengthCalculator` unmodified (verified empty diff; gunnery does not import them — integration-boundary test).

## New reason codes (in-slice, gunnery `reasonCodes.ts` only — kept separate from shared catalog)
`INVALID_GUNNERY_STATE`, `GUNNERY_STATE_INVARIANT_FAILED`, `GUNNERY_FIRE_CONTROL_SOLUTION_INSUFFICIENT`, `GUNNERY_ACCURACY_FACTOR_MISSING`, `GUNNERY_RATE_FACTOR_MISSING`, `GUN_QUALITY_OUT_OF_RANGE`, `GUNNERY_AMMUNITION_UNAVAILABLE`, plus the deferred-predicate marker `GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED` (NOT in DESIGN-39 §32 — must be recorded in ADR-0020). Reused existing: `TACTICAL_STATE_INVARIANT_FAILED`, `TACTICAL_FOG_OF_WAR_VIOLATION`, `INVALID_TACTICAL_CLOCK`, `INVALID_TACTICAL_TIME_CONTRACT`. **AC-10 set-equality vs §32 + catalog is INC-5 pending.**

## INC-5 pending (next step)
Full `*_v1` contracts rollup + AC-10 reason-code set-equality vs DESIGN-39 §32 + catalog + gunnery↔shared disjointness assertion; **ADR-0020** (scope/integration boundary + constant/reason-code policy: `SURFACE_FIRE_CONTROL_MINIMUM_BP=2_000`, seeded ammo set `{ARMOR_PIERCING,COMMON,HIGH_EXPLOSIVE}`, `GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED`); PROGRESS/SPRINT-PLAN/report; **orchestrator validation gate** (full-repo clean uncached build `pnpm -w turbo run build --force`, `tsc -b`, `pnpm lint`, `pnpm format`, full test suite, cross-process determinism ×2 byte-identical, golden verify 9/9).

## Caveat (coordination hazard — reason the gate is deferred)
A **concurrent external actor** committed `b65154f` ("adjusted import order": cross-repo prettier on `commands/`, `modes.ts`) and `d1e5403` ("adjusted imports from ai": `@bluewave/ai` import reorder + it included my INC-4 `run-gunnery-child.ts`), and left **uncommitted `packages/ai/src/*` edits + new untracked `packages/ai/test/*` tests** in the working tree. The `@bluewave/ai` in-progress edits can fail a repo-wide build (e.g. a reported `aiPlanner.ts` type error surfaced in `@bluewave/cross-process-test`). The full-repo orchestrator gate should be run once the `packages/ai` working tree is settled/reconciled by the user, then INC-5 signed off. B-3 combat work itself is isolated to `packages/combat` and fully green.

## Known limitations / deferred
As spec §3: autoloaders, dual-purpose, armor/penetration (B-4), straddle + RAPID/AA predicates, target allocation, damage effects, phase wiring (B-6). Pre-existing unrelated `content-schema/test/nation.test.ts` broken import still open (unchanged). Player battle UI not in scope.
