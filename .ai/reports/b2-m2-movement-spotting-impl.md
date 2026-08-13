# Validation Report: B-2-IMPL — Tactical Movement, Spotting & Contact State (M2)

## Outcome

`PASS`. All AC-1..AC-15 verified. (Repaired and completed a mid-flight WIP that did
not compile; ran the orchestrator pipeline: implementator → reviewer (NEEDS_REWORK)
→ become repairs → validation gate.)

## Scope delivered (engine-only, `@bluewave/combat`)

- **INC-1 Movement kinematics** — `src/movement/{kinematics,constants}.ts`:
  `advancePosition`, `resolvePropulsion`, `resolveTurning`, `reciprocalCourse`,
  formation-station geometry (`computeDesiredStation`, `helmSteerToStation`,
  `onStation`), `resolveCollisionsGrounding` (empty successful record), and
  `assertFixedPointMovement` (full numeric surface + heading + sign guards).
  Integer direction table (350 rows, fixed-point 1e4) replaces runtime trig so
  displacement is bit-identical across engines/OS (F3).
- **INC-2 Spotting/sensor model** — `src/spotting/{detection,constants}.ts`:
  `hasLineOfSight` (flat-sea, extensible seam), `isDetected` (range+LOS, neutral
  visibility multiplier, optional keyed-retention seam for B-5), `distanceSq`
  computed in a 1-metre quantum to stay exact fixed-point safe-integer (F1),
  `resolveSensorsSpotting` (deduped tracks by stable contact id, records source,
  never leaks hidden identity).
- **INC-3 Contact lifecycle** — `src/contact/{lifecycle,constants}.ts`:
  `createContactTrack`, `ageContact`, `updateContact`, `isStale`,
  `resolveLegalTarget` (reuses `validateTargetOrder` → `TACTICAL_FOG_OF_WAR_VIOLATION`).
  Authoritative contact shape unified on `TacticalContact extends ContactTrack`
  (ADR-0019); `BattleContact` kept as deprecated projection.
- **INC-4 Simulation engine** — `src/simulation/{engine,spawn}.ts`:
  `advanceMinute`/`advanceMinutes` drive DESIGN-38 steps 4–8 in order over
  `TacticalBattleState` via the existing `BattleLedger` + `canonicalEventOrder`,
  computing a minute-state hash per minute. Deterministic eventId derived from
  event content (no module counter), deep-copied movement states (immutability),
  spawn helper derived from bbox geometry. Two-process child
  `run-minutes-child.ts` proves OS-independent byte-identical output.
- **INC-5 Contracts/reason codes** — `*_v1` contracts +
  `SHIPPED_*_CONTRACT` + validate guards for movement-kinematics,
  formation-station, spotting-sensor, contact-lifecycle. Reason-code surface stays
  exactly the DESIGN-38 §36 subset; the mid-flight draft's invented
  `INVALID_TACTICAL_CONTRACT` was replaced with the existing §36
  `TACTICAL_STATE_INVARIANT_FAILED` (F2); `reason-codes.test.ts` adds an
  inline-literal scan across the four B-2 modules to prevent silent new codes (F7).
- **ADR-0019** (contact-shape seam/unification).

## Requirements evidence

| AC | Proving test | Result |
|----|--------------|--------|
| AC-1 | `test/movement/movement.test.ts` | ✅ |
| AC-2 | `test/movement/position.test.ts` (also propulsion/turning/hook) | ✅ |
| AC-3 | `position.test.ts` propulsion block | ✅ |
| AC-4 | `position.test.ts` turning + `reciprocalCourse` | ✅ |
| AC-5 | `test/movement/formation-station.test.ts` | ✅ |
| AC-6 | `position.test.ts` collisions/grounding hook | ✅ |
| AC-7 | `test/spotting/detection.test.ts` (+ safe-integer + boundary) | ✅ |
| AC-8 | `detection.test.ts` LOS | ✅ |
| AC-9 | `test/spotting/resolve.test.ts` | ✅ |
| AC-10 | `test/contact/contact-lifecycle.test.ts` | ✅ |
| AC-11 | `test/contact/fog-of-war.test.ts` | ✅ |
| AC-12 | `test/simulation/{advance,pipeline-order,ledger-order}.test.ts` | ✅ |
| AC-13 | `test/simulation/determinism.test.ts` (two child processes, byte-compare) | ✅ |
| AC-14 | `test/contracts.test.ts` + `test/reason-codes.test.ts` | ✅ |
| AC-15 | `verify-golden-hashes.cjs` 9/9 unchanged | ✅ |

## Commands and observed results

```text
pnpm -w turbo run build --force
> 17 successful, 17 total (clean, uncached)

pnpm exec vp tsc -b packages/combat
> clean (exit 0)

pnpm -w turbo run typecheck
> 31 successful / 31 (tsc --noEmit)

pnpm lint
> combat: 0 warnings, 0 errors (only pre-existing content-schema/nation.test import
  error remains repo-wide, documented)
pnpm format --check packages/combat
> All matched files use the correct format

pnpm --filter @bluewave/combat test
> 27 files, 166 tests passed
pnpm --filter @bluewave/cross-process-test test
> 13 tests passed (two-child determinism)

node scripts/verify-golden-hashes.cjs
> All 9 hashes match golden reference   (AC-15, unchanged)

pnpm --filter @bluewave/cross-process-test test:cross-process
> JSON hashes equal golden reference; success true

Two clean child runs (node dist/simulation/run-minutes-child.js ×2)
> byte-identical JSON incl. non-cardinal headings 37°/123° (F3 exercised)
```

Full suite run (all green packages): combat 166, contracts 20, deterministic 11,
diagnostics 7, random 16, events 9, campaign 100, commands 16, ai 8, persistence 21,
cross-process 13, desktop 17, compiler-cli 62, phase-engine 88, content-compiler 14 —
**only `@bluewave/content-schema#test` fails** (`content/research/nations/1880/index.ts`
broken import, pre-existing, documented in SPRINT-PLAN; not caused by B-2).

## Determinism and cross-process evidence

- Identical manifest+state+orders+seed produce identical per-minute hashes and
  events; verified by two separate clean Node child processes, byte-compared.
- No ambient clock/random/env/locale/fs-order in authoritative code; no module-level
  mutable counter (eventId content-derived).
- Golden hashes unchanged (needed no ADR-0007 regeneration).

## Known limitations / deferred

- `BattleContact` minimal projection retained for compatibility; removal deferred
  to B-6 integration.
- Section 35 `BattleEvent` emitted as a minimal ordered record (ordering per spec
  honored); full content-hash field population is optional, deferred.
- `advanceMinutes.finalState.units` does not write back resolved positions;
  `movementStates` is the sole authoritative position surface (documented in engine).
- Un-ordered units hold course (no invented bias).
- Weather/smoke/visibility modifiers (B-5), ECM/radar (M5), collisions/grounding
  resolution, and phase-pipeline wiring (B-6) remain deferred per ADR-0018.
- `content-schema/test/nation.test.ts` pre-existing broken import (deferred).

## Changes summary

New: `packages/combat/src/{contact,movement,spotting,simulation}/`,
`packages/combat/src/simulation/run-minutes-child.ts`,
`packages/combat/test/{contact,movement,spotting,simulation}/`,
`packages/combat/test/{contracts,reason-codes}.test.ts`, `docs/adr/ADR-0019-*`.
Modified: `packages/combat/src/{index.ts,movement.ts,tactical/state.ts}` (contact
shape + movementStates + exports). `BattleResolver`/`StrengthCalculator` unmodified
(verified by git diff). No production-pack YAML change; goldens unchanged.

## Commits

To be created as small Conventional Commits on `dev` (clean tree ends the sprint).
