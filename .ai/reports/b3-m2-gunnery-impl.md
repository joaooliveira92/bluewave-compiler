# B-3 M2 Gunnery — Validation Report (INC-1..5, full gate)

- **Sprint:** B-3 (`.ai/SPRINT-PLAN.md` Track B row 3) — core surface gunnery fire-resolution slice
- **Date:** 2026-08-13
- **Status:** **COMPLETE — PASS.** SCOPING DONE + INC-1..4 IMPLEMENTED (PASS) + **INC-5 contracts/ADR rollup DONE + orchestrator full-repo validation gate PASS.** AC-1..AC-15 all proven.
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
| INC-5 contracts rollup (AC-10/14) + ballistics constants + ADR-0020 + gate  | *(this commit)* |

Note: external commits `b65154f` ("adjusted import order") and `d1e5403` ("adjusted imports from ai") appeared mid-sprint from another actor (see Caveat) and are not B-3 deliverables.

## AC status (INC-1..5)
AC-1..AC-9, AC-11..AC-13 implemented and proven by tests. **AC-10** proven by `test/reason-codes-gunnery.test.ts` (exact in-slice set-equality vs DESIGN-39 §32 + reused-catalog + literal scan; deferred codes absent). **AC-14** proven by `test/gunnery/contracts.test.ts` (base + accuracy + rate + gun-quality `*_v1` contracts + `SHIPPED_*_CONTRACT` + validate guards, fail-closed on tamper) and `test/gunnery/ballistics-constants.test.ts`. **AC-15** verified by orchestrator gate (goldens 9/9; `BattleResolver`/`StrengthCalculator` unmodified by diff).

Proving tests (all in `packages/combat/test/gunnery/`): state (AC-1), modes (AC-2), accuracy (AC-3), hit-check (AC-4), rate-of-fire (AC-5), gun-quality (AC-6), ammunition (AC-7), event-record (AC-8), ordering + ledger-order (AC-9), advance + pipeline-order + integration-boundary (AC-11), targeting-fog (AC-12), determinism (AC-13).

## Validation evidence (exact commands + results)
- `pnpm --filter @bluewave/combat build` → exit 0, clean.
- `pnpm --filter @bluewave/combat test` → **45 files / 330 tests pass** (INC-1..5 gunnery + all combat suites green; `resolveGunnery` strict no-op when no batteries — B-2 hashes unchanged).
- `pnpm -w turbo run build --force` (clean uncached) → **17/17 successful**.
- `pnpm -w turbo run typecheck` → **31/31 successful** (incl. `@bluewave/ai` after the AIPlanner gate repair below).
- `pnpm -w turbo run test` → 876 pass / 3 fail — the 3 are **pre-existing** `apps/desktop/test/project.test.ts` CLI-spawn failures (verified identical on clean HEAD); 14 pre-existing failing suites (`apps/desktop/**` renderer module-resolution: missing `@testing-library/react` / `@bluewave/campaign-engine`; `content-schema/test/nation.test.ts` broken import) — none import changed combat/ai files, all present on clean HEAD.
- `pnpm lint` (root `vp lint .`) → **295 errors, all pre-existing baseline** (TS2307/TS7006/no-redundant-type-constituents etc. across phase-engine/persistence/desktop); **INC-5 files add 0** (count unchanged 295 before/after).
- `pnpm format` (root `vp fmt --check .`) → **486 files** need formatting (baseline was 489; INC-5 **reduced** debt by 3, all touched files fmt-clean).
- cross-process determinism: `pnpm -F @bluewave/cross-process-test test` → **13/13**; `packages/combat/test/gunnery/determinism.test.ts` (two child node processes, byte-compared) green.
- `node scripts/verify-golden-hashes.cjs` → **9/9 match golden reference** (AC-15; no ADR-0007 regeneration).
- `BattleResolver`/`StrengthCalculator` unmodified (verified empty diff).

## Gate repair (pre-existing blocker, resolved this gate)
`packages/ai/src/aiPlanner.ts:280` had a TS2367 no-overlap error (`fields.length === 0` where `CANONICAL_RESEARCH_FIELD_IDS` is a compile-time 15-element literal tuple), breaking a repo-wide `tsc -b`. Repaired by widening the local to `readonly string[]` (static-type-only, behavior-preserving; `Array.isArray` guard on a constant array dropped). This is the `@bluewave/ai` reconciliation flagged in the INC-1..4 caveat; verified behavior-neutral by code inspection (only the emptiness-guard type), unrelated to gunnery scope.

## New reason codes (in-slice, gunnery `reasonCodes.ts` only — kept separate from shared catalog)
`INVALID_GUNNERY_STATE`, `GUNNERY_STATE_INVARIANT_FAILED`, `GUNNERY_FIRE_CONTROL_SOLUTION_INSUFFICIENT`, `GUNNERY_ACCURACY_FACTOR_MISSING`, `GUNNERY_RATE_FACTOR_MISSING`, `GUN_QUALITY_OUT_OF_RANGE`, `GUNNERY_AMMUNITION_UNAVAILABLE`, plus the deferred-predicate marker `GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED` (NOT in DESIGN-39 §32 — must be recorded in ADR-0020). Reused existing: `TACTICAL_STATE_INVARIANT_FAILED`, `TACTICAL_FOG_OF_WAR_VIOLATION`, `INVALID_TACTICAL_CLOCK`, `INVALID_TACTICAL_TIME_CONTRACT`. **AC-10 set-equality vs §32 + catalog proven in INC-5** (`test/reason-codes-gunnery.test.ts`); new `GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED` recorded in ADR-0020.

## INC-5 delivered (this commit)
- **AC-10** `test/reason-codes-gunnery.test.ts`: `IN_SLICE` (8) == `Object.values(GUNNERY_REASON_CODES)` exactly; every in-slice ∈ §32 or = deferred-predicate marker `GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED`; 12 deferred §32 codes asserted absent from shipped catalog; 4 reused codes present in shared `REASON_CODES`; literal scan over `src/gunnery/**` proves no out-of-surface throw.
- **AC-14** `test/gunnery/contracts.test.ts`: base `gunnery_v1` + subset `gunnery_accuracy_v1` / `gunnery_rate_v1` / `gun_quality_v1` all prove shipped-`SHIPPED_*_CONTRACT` validates and fail-closed on every checked field (scale, factor manifest, rounding, bounds, exponent, table entry, null, version drift).
- **Content deliverable** `src/gunnery/constants.ts`: `gunnery_ballistics_v1` + `GUNNERY_BASE_RELOAD_BY_CALIBER_MM` ({152→7000, 203→18000, 305→25000, 356→36000, 381→35000, 406→40000} ms, grounded `docs/research/b3-m2-gunnery.md` §1) + `GUNNERY_SCEN1880_RML_HEAVY_BASE_RELOAD_MIN_MS=120_000` (BALANCE TARGET lower bound, honestly flagged "NOT fully grounded → owner/ADR"); `SHIPPED_GUNNERY_BALLISTICS_CONTRACT` + `validateGunneryBallisticsContract`; locked by `test/gunnery/ballistics-constants.test.ts`. `.scratch/b3-m2-gunnery/spec.md` §1.4 corrected to count 8 in-slice codes.
- **ADR-0020** `docs/adr/ADR-0020-b3-gunnery-scope-and-reason-codes.md`: scope/integration boundary (engine-stage after spotting, B-6 wiring, goldens unchanged); in-slice/reused/deferred reason-code policy (incl. new `GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED`); `SURFACE_FIRE_CONTROL_MINIMUM_BP=2_000` as recorded versioned-ruleset constant; ballistics deliverable + 1880 RML open item.

## Reviewer
Adversarial reviewer returned **APPROVE** (no BLOCKER/HIGH). Addressed its recommendations: LOW-1 added the missing tamper cases (accuracy `basisPointsPerUnit`/`factorKeys`/`finalMaxBp`, rate `basisPointsPerUnit`/`neutralMultiplierBp`/`scaleExponent`); LOW-2 corrected the spec/ticket in-slice count to 8; NIT-3 aligned research/code prose to "2–5 minutes (120 000–300 000 ms)"; NIT-4 verified formatting stable (all touched files fmt-clean).

## Caveat (resolved this gate)
The concurrent-actor coordination hazard from the INC-1..4 report (`@bluewave/ai` uncommitted edits + a `aiPlanner.ts` type error) is **resolved**: the actor's edits were committed and the remaining type error repaired in this gate (see "Gate repair"). Full-repo gate now clean except the documented pre-existing desktop/`nation.test.ts` test-suite failures and the baseline lint/format debt, none introduced by B-3.

## Known limitations / deferred
As spec §3: autoloaders, dual-purpose, armor/penetration (B-4), straddle + RAPID/AA predicates, target allocation, damage effects, phase wiring (B-6). Pre-existing unrelated `content-schema/test/nation.test.ts` broken import still open (unchanged). Player battle UI not in scope.
