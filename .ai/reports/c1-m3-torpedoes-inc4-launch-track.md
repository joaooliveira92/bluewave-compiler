# Validation Report: C-1 INC-4 — Launch Timing/Failure + TorpedoTrack (AC-12, AC-13 part 1)

## Outcome

`PASS` (reviewer APPROVE + repairs applied + orchestrator gate).

## Scope delivered

INC-4 of the C-1 torpedo fire-resolution slice of DESIGN-40, engine-only, entirely in
`@bluewave/combat`: **AC-12** (launch timing/failure) and **AC-13 part 1** (the `TorpedoTrack`
§13 entity + lifecycle state machine). No campaign snapshot schema change; goldens unchanged.

- **AC-12**: accepted salvo tubes fire in ascending tube-id order at the declared firing substep;
  per-tube mechanical failure consumes no torpedo unless the outcome is `TORPEDO_STUCK_IN_TUBE`;
  later tubes continue only per the salvo policy; every result recorded separately; no random
  branch changes canonical tube order; base launch-failure probability exactly `100` bp per tube
  before model/damage/crew/reliability modifiers.
- **AC-13 part 1**: every launched torpedo creates one authoritative `TorpedoTrack` with all §13
  fields; deterministic id (battleId + launcherId + tubeId + launch minute/substep — the
  contactKey/gunneryEventId idiom); domain-separated SHA-256 `trackHash`; fail-closed surface
  guard; one-way lifecycle (advance → EXHAUSTION; `setTorpedoTerminalResult` closed union);
  torpedo remains an authoritative entity until its terminal result is set.

## Requirements evidence

| Requirement | Implementation | Proving tests |
| ----------- | -------------- | ------------- |
| AC-12 launch timing/failure | `launch-failure.ts` (`resolveTubeLaunches`, `computeLaunchFailureChanceBp`, `evaluateTubeLaunchDraw`, `salvoContinuesAfterFailure`, `torpedoLaunchFailureStreamId`) | `test/torpedo/launch-failure.test.ts` (18 tests) |
| AC-13 part 1 TorpedoTrack | `track.ts` (`torpedoTrackId`, `createTorpedoTrack`, `assertTorpedoTrackSurface`, `assertAuthoritativeTorpedoTrack`, `computeTorpedoTrackHash`, `verifyTorpedoTrackHash`, `advanceTorpedoTrack`, `setTorpedoTerminalResult`, `projectAlongHeading`, `foldMdeg`) | `test/torpedo/track.test.ts` (25 tests) |
| Reason-code catalog shape (INC-4 set) | `reasonCodes.ts` (`TORPEDO_LAUNCH_FAILURE`, `TORPEDO_STUCK_IN_TUBE` shipped) | `test/torpedo/contracts.test.ts` (INC-4 codes moved into the shipped set, INC-5+ kept out) |

## Commands and observed results

```text
cd packages/combat && pnpm vitest run test/torpedo/
# 14 files passed, 289 tests passed (INC-4 adds launch-failure + track test files)

cd packages/combat && pnpm exec tsc --noEmit -p tsconfig.json
# exit 0

pnpm -w turbo run build --force
# Tasks: 18 successful, 18 total (0 cached)

pnpm -w exec tsc -b
# clean except concurrent-agent desktop WIP (campaign-screen-registry.test.tsx TS2724/TS2305 —
# a different session's uncommitted file, not part of this increment)

pnpm lint
# 22 errors, all pre-existing/unrelated (desktop e2e + nation.test.ts + concurrent desktop WIP);
# none in torpedo scope

pnpm format  --check
# 39 files with issues, all pre-existing docs/other-agents; torpedo sources/tests clean after
# formatting track.test.ts

pnpm test  # per-package vitest via turbo
# 25/35 tasks successful; content-schema@test fails on the pre-existing nation.test.ts import;
# combat@test fails only on test/mines/reason-codes-mines.test.ts (the concurrent C-2 INC-2 WIP);
# torpedo suite fully green

node scripts/verify-golden-hashes.cjs
# All 10 hashes match golden reference

cd packages/combat && pnpm vitest run test/simulation/determinism.test.ts
# 1 file, 2 tests passed (cross-process determinism)
```

## Determinism evidence

- Golden hashes: **10/10 unchanged** (no canonical artifact change — engine-only).
- Cross-process determinism (`test/simulation/determinism.test.ts`): PASS (2 tests).
- Torpedo suite determinism: INC-4 launch/track tests prove same-inputs → byte-identical outputs
  in-process; cross-process weapon-stage determinism is AC-23/INC-7.
- Processes/OS: macOS darwin, single-process runs.

## Canonical artifact changes

None. Goldens unchanged (AC-25 satisfied).

## Tests added

- `test/torpedo/launch-failure.test.ts` (18 tests): base `100` p failure, modifier composition,
  pure draw→outcome mapping, ascending tube ordering, per-tube consumption semantics (stuck vs
  non-stuck), salvo-abort continuation, mis-accounted-reservation fail-closed.
- `test/torpedo/track.test.ts` (25 tests): deterministic id, §13 field population, frozen +
  guarded surface, hash determinism/tamper-evidence, lifecycle run→terminal→one-way, exhaustion
  transition, `projectAlongHeading` fold/floor, gyro-vs-heading invariant.

## Security and cancellation

No I/O, no randomness in authoritative path (keyed RNG injection only), no new trust boundary.

## Performance observations

- RNG is a single injected tube-bound keyed stream; no authoritative cost shift measured.

## ADRs and dependencies

None new in this increment. Total suite pass — no geometric/set vulnerabilities surfaced.

## Known limitations and deferred requirements

- Actual hit/detonation resolution is AC-13 **part 2** / INC-5 (this increment only ships the
  track + trustworthy lifecycle endpoint `setTorpedoTerminalResult`).
- AC-12/AC-13 do not yet wire the torpedo stage into the battle engine (that is INC-7 /
  `resolveTorpedoes`).
- `TorpedoTrack` currently enforces `orderedGyroAngleMdeg === launchHeadingMdeg` (documented
  simplification §13 running-course invariant; INC-5 can relax when guidance runs are modeled).

## Changed files

- `packages/combat/src/torpedoes/launch-failure.ts` (skip-tube restoration + deterministic stream id)
- `packages/combat/src/torpedoes/track.ts` (TorpedoTrack entity + lifecycle)
- `packages/combat/src/torpedoes/constants.ts` (normalization note correction)
- `packages/combat/test/torpedo/contracts.test.ts` (INC-4 reason-code set update)
- `packages/combat/test/torpedo/launch-failure.test.ts` (new)
- `packages/combat/test/torpedo/track.test.ts` (new)

## Git and remote status

- Branch: dev
- Commits: singleton INC-4 commit `ffa65ea`
- Working tree: clean except pre-existing/concurrent desktop + C-2 WIP
- Push: not pushed (no push requested/authorized)
- PR: none
- Merge performed: **no**

## Secondary consistency check

- Independently re-ran `pnpm vitest run test/torpedo/` after formatting → 289/289 green.
- Independently ran `git stash push` of `launch-failure.ts` reduction and confirmed the seam is
  exercised only by the new test.
- A concurrent session is editing this same checkout (desktop F1-map work + C-2 mines); its
  uncommitted files were NOT committed by this increment.