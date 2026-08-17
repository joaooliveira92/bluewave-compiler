# Validation Report: C-1 INC-5 — Hit Resolution + Detonation Outcomes (AC-13 part 2, AC-14)

## Outcome

`PASS` (reviewer NEEDS_REWORK → all findings repaired → orchestrator gate green).

## Scope delivered

INC-5 of the C-1 torpedo fire-resolution slice of DESIGN-40, engine-only, entirely in
`@bluewave/combat/src/torpedoes/`: **AC-13 part 2** (§14 hit resolution) and **AC-14**
(§15 detonation outcomes). No campaign snapshot schema change; goldens unchanged.

## Requirements evidence

| Requirement | Implementation | Proving tests |
| ----------- | -------------- | ------------- |
| AC-13 part 2 §14 hit resolution | `hit-resolution.ts` (`intersectsCollisionGeometry`, `traveledArmingDistance`, `depthDraftCompatible`, `isLegalTarget`, `impactOrderingValid`, `resolveTorpedoHit` → `TORPEDO_HIT_RESOLVED`) | `test/torpedo/hit-resolution.test.ts` (25 tests) |
| AC-14 §15 detonation outcomes | `detonation.ts` (`TORPEDO_DETONATION_OUTCOMES`, `computeDetonationProbabilityBp`, `resolveTorpedoDetonation`, `applyTorpedoDetonationToTrack`, `torpedoTerminalForDetonationOutcome`, model→fuze mapping) | `test/torpedo/detonation.test.ts` (28 tests) |
| Reason-code partition | `reasonCodes.ts` ships `TORPEDO_HIT_RESOLVED`, `TORPEDO_DUD` | `test/torpedo/contracts.test.ts` (AC-21 seed, INC-5 set moved in, INC-6+ kept out) |
| Contracts | `SHIPPED_TORPEDO_DETONATION_CONTRACT` + `validateTorpedoDetonationContract` | `test/torpedo/contracts.test.ts` (MEDIUM-3 block) |

## Commands and observed results

```text
cd packages/combat && pnpm exec vp test run test/torpedo/
# 16 files passed, 350 tests passed

cd packages/combat && pnpm exec vp test run
# 117 files passed, 1366 tests passed (full combat suite)

cd packages/combat && pnpm exec tsc --noEmit -p tsconfig.json
# exit 0

pnpm -w turbo run build --force
# Tasks: 18 successful, 18 total (0 cached)

pnpm -w exec tsc -b
# clean except concurrent-agent desktop WIP (campaign-screen-registry.test.tsx)

pnpm lint   # 0 torpedo-scope errors (only pre-existing unrelated errors remain)
pnpm format --check   # 39 pre-existing files; torpedo/ADR scope clean

pnpm test  # turbo per-package
# 23/33 cached-successful; only content-schema@test fails (pre-existing nation.test.ts)

node scripts/verify-golden-hashes.cjs
# All 10 hashes match golden reference

cd packages/combat && pnpm exec vp test run test/simulation/determinism.test.ts
# 1 file, 2 tests passed
```

## Determinism evidence

- Golden hashes: **10/10 unchanged** (no canonical artifact change — engine-only).
- Cross-process determinism suite: PASS (2 tests).
- INC-5 pure functions: same inputs + same keyed draw ⇒ identical frozen hit
  verdict / detonation outcome / probability / provenance (proven by
  determinism tests + draw-count tests: predicates consume zero draws, the
  keyed path consumes exactly one).

## Canonical artifact changes

None. Goldens unchanged (AC-25).

## Tests added

- `hit-resolution.test.ts` (25): circle intersection incl. bigint/overflow + tangent-inclusive
  boundary, arming, depth-vs-draft boundary, each blocker, legality (fog/foundered vs sinking),
  impact ordering, composed `TORPEDO_HIT_RESOLVED`, malformed-input fail-closed.
- `detonation.test.ts` (28): exact closed outcome set, every outcome via explicit predicate or
  keyed draw, reliability-from-track binding (MEDIUM-2), model→fuze mapping + unknown-model
  fail-closed (HIGH-1), probability composition incl. stack floor 6_566, provenance surface,
  contact-does-not-guarantee-detonation, draw-count/no-draw determinism, §13 terminal mapping.

## Security and cancellation

No I/O, no ambient randomness (keyed stream `battle/torpedo/detonation/reliability:<battle>:<minute>:<substep>:<track>` only), no new trust boundary, no cross-package imports.

## Performance observations

Bigint used only where the integer square exceeds `MAX_SAFE_INTEGER` (documented bound analysis
in `hit-resolution.ts`); no float on authoritative paths.

## ADRs and dependencies

- **ADR-0031** (C-1 scope/integration boundary, reason-code partition, fuze authority, reliability
  binding, §15 BALANCE-TARGET policy, ADR renumber note 0029→0031).
- No new third-party dependency.

## Known limitations and deferred requirements

- Collision geometry is a caller-supplied `TargetHitProfile` (no production geometry exists);
  documented in ADR-0031.
- §22 chain-reaction base-probability mechanics deferred to INC-6 (deterministic
  ordnance-zone→chain-reaction predicate ships here as an explicit AC-14 outcome); INC-6 must
  keep the reliability draw the sole/stable draw (documented in `detonation.ts`).
- Engine wiring (`resolveTorpedoes` after damage, strict no-op) is INC-7; phase integration later.
- Model fuze is carried by the versioned model→fuze mapping, not a model-surface field (ADR-0031).

## Changed files

- `packages/combat/src/torpedoes/hit-resolution.ts` (new)
- `packages/combat/src/torpedoes/detonation.ts` (new, incl. detonation contract)
- `packages/combat/src/torpedoes/reasonCodes.ts` (ships `TORPEDO_HIT_RESOLVED`, `TORPEDO_DUD`)
- `packages/combat/src/torpedoes/index.ts` (exports new modules)
- `packages/combat/test/torpedo/contracts.test.ts` (AC-21 INC-5 set + detonation contract pin)
- `packages/combat/test/torpedo/hit-resolution.test.ts` (new)
- `packages/combat/test/torpedo/detonation.test.ts` (new)
- `docs/adr/ADR-0031-c1-torpedo-scope-reason-codes.md` (new)
- `packages/combat/src/torpedoes/{launch-failure,track}.ts` (format-only, gate `vp fmt`)

## Git and remote status

- Branch: dev
- Commits: INC-5 code+ADR commit `a2ed7c3` + traceability commit
- Working tree: clean except concurrent desktop/mines/game-onboarding WIP
- Push: not pushed; PR: none; merge performed: **no**

## Secondary consistency check

- Independently re-ran torpedo suite after lint fixes → 350/350.
- Confirmed the concurrent agent's mines tests now pass (combat 1366/1366) and its desktop WIP
  still carries the only tsc failure.
- ADR-0031 written by the orchestrator; INC-5 code headers reference it.