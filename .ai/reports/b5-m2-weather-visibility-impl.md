# B-5 M2 Tactical Weather & Visibility — Implementation Validation Report

**Date:** 2026-08-15
**Sprint:** B-5 (Track B, M2 Surface Tactical Core)
**Result:** PASS

## Summary

All 6 increments (INC-1..INC-6) implemented across the new `@bluewave/combat`
weather module (16 src + 17 test files, 182 weather tests + 665 other combat
tests). Reviewer demanded NEEDS_REWORK once (HIGH: stale state hashes on
TOD-change minutes + 6 MEDIUM + 6 LOW); all findings repaired and re-reviewed
to APPROVE, plus a follow-up pass closing a dormant MEDIUM (solar-bearing −1
schema-vs-guard) and 4 hygiene items. Golden hashes 9/9 unchanged;
`BattleResolver`/`StrengthCalculator` unmodified.

## Scope delivered

- `StrategicWeatherState` + new `weather_generation` phase (order 0.5) generating
  per-area state from climate profiles with keyed RNG `campaign/weather/<areaId>/<month>`
  (DESIGN-42 §1, §30; AC-1..2).
- `BattleWeatherInitialization` from strategic weather + battle context, with
  area-consistency assertion and `INVALID_BATTLE_WEATHER_INITIALIZATION`
  fail-closed on unknown policy / non-integer location / area mismatch (§2; AC-3).
- 12-component `BattleWeatherComponents` with integer guards + hash (§3; AC-4).
- 30-min tactical progression via per-interval keyed stream
  `battle/weather/interval/<n>` and climate transition tables; sea-state drift
  clamped to ±1 regardless of authored range; fail-closed table validation (§4; AC-5).
- Visibility distance: exact BigInt rational product, single FLOOR,
  `WEATHER_VISIBILITY_FORMULA_MISSING` on missing factor (§5; AC-6).
- Glare (§24), fog/mist (§25), precipitation (§26), night/twilight (§27) with
  published multiplier bands and 5 canonical states (AC-7..10).
- `WeatherEventRecord` with stage-accurate pre/post state hashes, canonical
  ordering via `BattleLedger`+`canonicalEventOrder`, `resolveWeather` wired at
  engine step 7.5 before spotting (strict no-op without weather context) (§28-29; AC-11..13).
- Two-process determinism (node-spawn ×2 byte-compared), 4 `*_v1` contracts with
  fail-closed guards, reason-code set-equality vs §30 (+3 documented in-slice
  markers), ADR-0022 (AC-14..17).

## Validation evidence (exact commands + observed results)

### Build (uncached)

```bash
$ pnpm -w turbo run build --force
# 18 successful, 18 total
```

### TypeScript

```bash
$ pnpm exec tsc -b
# exit 0
```

### Lint (changed packages)

```bash
$ pnpm -w turbo run lint --force --filter=@bluewave/combat
# Found 0 warnings and 0 errors.
# (pre-existing content-schema CANON_NATIONS_1880 import error — unrelated, tracked)
```

### Format

```bash
$ npx prettier --check "packages/combat/src/weather/**" "packages/combat/test/weather/**"
# All matched files use Prettier code style!
```

### Full test suite (per package, turbo failed-fast at pre-existing content-schema)

```bash
$ pnpm -w turbo run test --force
# 13 successful; only @bluewave/content-schema FAILED — pre-existing broken
# import test/nation.test.ts (CANON_NATIONS_1880 path deleted on main); unrelated
# to B-5; tracked (SPRINT-PLAN "Repair content-schema/test/nation.test.ts").
```

Downstream packages run individually (skipped by turbo fail-fast):

| Package | Result |
|---------|--------|
| content-compiler | 4 files / 14 tests PASS |
| campaign | 8 files / 100 tests PASS |
| events | 1 file / 9 tests PASS |
| commands | 1 file / 16 tests PASS |
| phase-engine | 8 files / 88 tests PASS |
| persistence | 2 files / 22 tests PASS |
| combat | 84 files / 847 tests PASS |
| cross-process-test | 3 files / 14 tests PASS |
| ai | 3 files / 22 tests PASS |
| contracts/diagnostics/deterministic/random | 20/7/11/16 PASS |

### Golden hashes

```bash
$ node scripts/verify-golden-hashes.cjs
# All 9 hashes match golden reference
```

### BattleResolver/StrengthCalculator unmodified

```bash
$ git diff packages/combat/src/resolver.ts packages/combat/src/strength.ts
# (no output — unmodified)
```

## Reviewer cycle

1. First review (B-5-IMPL): **NEEDS_REWORK** — HIGH H1 (stale state hashes on
   TOD-change minutes, empirically reproduced) + M1..M6 + L1..L6.
2. Repair pass: all fixed (TOD re-hash; fail-closed daylight; per-interval
   streams; table validation; ±1 sea-state clamp; init-boundary code + area
   check; `RandomLedger` audit port). Re-review: **APPROVE**, 17/17 ACs PASS.
   Note: weather RNG ledger is strictly stronger than B-3/B-4 (audit port).
3. Follow-up pass: closed dormant MEDIUM (solar-bearing −1 profile doc vs
   component guard → fail closed `WEATHER_PROFILE_INCOMPLETE` + ADR) and 4 LOW
   hygiene items (stale comments, NIGHT elevation regression test, ADR §9/§13
   renumber, progression-minute hash pin).

## Changed files

### New (B-5 weather module)

- `packages/combat/src/weather/`: `index.ts`, `constants.ts`, `reasonCodes.ts`,
  `strategic-state.ts`, `climate.ts`, `components.ts`, `battle-init.ts`,
  `progression.ts`, `visibility.ts`, `glare.ts`, `fog.ts`, `precipitation.ts`,
  `night-twilight.ts`, `event-record.ts`, `engine.ts`, `contractRollup.ts`
- `packages/combat/src/simulation/run-weather-child.ts` (AC-14 child)
- `packages/combat/test/weather/`: 17 files + `test/reason-codes-weather.test.ts`
- `docs/adr/ADR-0022-weather-scope-integration-boundary.md`

### Changed (B-5 wiring/traceability)

- `packages/combat/src/simulation/engine.ts` — step 7.5 `resolveWeather`, strict no-op
- `packages/combat/src/index.ts` — weather barrel export
- `packages/phase-engine/src/registry.ts` — `weather_generation` phase (order 0.5)
- `packages/phase-engine/test/{phase-engine,integration}.test.ts` — phase-count assertions
- `.ai/SPRINT-PLAN.md`, `docs/PROGRESS.md` — traceability
- `.scratch/b5-m2-weather-visibility/` — map, decision tickets (1–5), spec, INC tickets (1–6)
- `.ai/briefs/b5-m2-weather-visibility.md`, `.ai/specs/b5-m2-weather-visibility.md`

## Pre-existing unrelated failures (unchanged, tracked)

1. `packages/content-schema/test/nation.test.ts` — deleted CANON_NATIONS_1880 path; fails test + lint.
2. `apps/desktop/*` — renderer test failures (published separately; out of B-5 scope).

## Determinism

- Golden hashes 9/9 unchanged (weather wired strictly no-op when no weather context;
  `weather_generation` phase registered only in PhaseRegistry — MonthExecutor/goldens
  unaffected).