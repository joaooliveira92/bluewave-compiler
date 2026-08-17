# Validation Report: C-1 INC-7 — Engine Stage + Records/Ordering + Two-Process Determinism (AC-20, AC-22, AC-23)

## Outcome

`PASS` (reviewer NEEDS_REWORK → all findings repaired → orchestrator gate green).

## Scope delivered

INC-7 wires the torpedo fire-resolution chain into the battle engine's minute-advance as a
pure deterministic stage: `resolveTorpedoes` (launch → track advance → hit → detonation →
damage package) after the damage stage, threading torpedo state/tracks across minutes; §27
immutable records + §28 canonical ordering; two-process determinism child. `BattleResolver`/
`StrengthCalculator`/`battleResolution/` unmodified.

## Requirements evidence

| Requirement | Implementation | Proving tests |
| ----------- | -------------- | ------------- |
| AC-22 engine stage | `torpedoes/resolve.ts` (`resolveTorpedoes`), `simulation/engine.ts` (optional `torpedoes` context, stage after damage, strict no-op, threading) | `advance.test.ts`, `integration-boundary.test.ts` |
| AC-20 records/ordering | `torpedoes/records.ts` (§27 record + hash), `torpedoes/ordering.ts` (§28 locale-free comparators) | `records.test.ts`, `ordering.test.ts` |
| AC-23 two-process determinism | `simulation/run-torpedo-child.ts` (fixed seed, single canonical JSON line) | `determinism.test.ts` (two node spawns, byte-compared) |

## Commands and observed results

```text
cd packages/combat && pnpm exec vp test run test/torpedo/
# 29 files, 504 tests passed

cd packages/combat && pnpm exec vp test run test/simulation/
# 4 files, 19 tests passed (B-2..B-6 no-context hash invariance intact)

cd packages/combat && pnpm exec vp test run test/torpedo/determinism.test.ts
# 3 tests passed (two-process byte-identical, AC-23)

cd packages/combat && pnpm exec tsc --noEmit -p tsconfig.json
# clean except concurrent mines/desktop WIP

cd packages/combat && pnpm exec vp lint src/torpedoes src/simulation src/battleLedger.ts test/torpedo/
# 0 errors in scope

pnpm -w turbo run build --force   # 18/18 (0 cached)
node scripts/verify-golden-hashes.cjs   # All 10 hashes match golden reference
```

## Determinism evidence

- Cross-process: two independent `node` spawns of `dist/simulation/run-torpedo-child.js`,
  byte-compared identical; per-minute 64-hex hashes; fixed seed; one canonical JSON line.
- Strict no-op: absent `torpedoes` context → B-2..B-6 per-minute hash byte-identical (pinned
  literals reproduced with the pre-INC-7 engine and re-verified green).
- `canonicalEventOrder` tie-break now locale-free (`<`/`>`), verified byte-identical to the
  committed goldens.
- No ambient randomness; every draw keyed on `battle/torpedo/...` streams.

## Canonical artifact changes

None. Goldens unchanged 10/10. `battleLedger.ts` ordering tie-break locale-free change is
golden-safe (byte-identical). `src/battleResolution/`, `resolver.ts`, `strength.ts` diffs empty.

## Tests added

`advance, records, ordering, integration-boundary, determinism` test files (48 tests), incl.
BLOCKER-1 (chain recordId/eventId uniqueness) + BLOCKER-2 (same-minute gunnery→damage→torpedo
state composition) regression tests.

## ADRs

**ADR-0031** entries 11 (§22 neutral-modifier collapse + MAGAZINE-zone deferral), 12 (engine
stage defaults), 13 (whole-minute track-sampling approximation), 14 (battleLedger locale-free
ordering). No new third-party dependency.

## Known limitations and deferred requirements

- §22 chain modifiers hard-coded neutral in the stage (INC-6 explicit contract unchanged);
  MAGAZINE-zone chain not wired in the stage — recorded ADR-0031-11.
- Whole-minute end-of-minute collision sampling approximation — ADR-0031-13.
- Phase-engine/battle-results integration of the torpedo stage — INC-8/later.

## Changed files

New: `torpedoes/records.ts`, `torpedoes/ordering.ts`, `torpedoes/resolve.ts`,
`simulation/run-torpedo-child.ts` + 5 test files. Modified: `simulation/engine.ts` (+147
additive), `torpedoes/index.ts` (exports), `torpedoes/damagePackage.ts` (single-eval option),
`battleLedger.ts` (locale-free tie-break), `docs/adr/ADR-0031` (entries 11–14).

## Git and remote status

- Branch: dev. Commits: INC-7 code commit `db840c7` + traceability commit.
- Push: no. PR: none. Merge performed: no.

## Secondary consistency check

- Re-verified 504/504 + simulation 19/19 + determinism 3/3 after lint/format fixes.
- Confirmed the only combat failures are the concurrent C-2 mines mid-edit (documented).
- Reviewer BLOCKER-1/2, HIGH-3/4, MEDIUM-5/6/7, LOW-8/9 all closed.