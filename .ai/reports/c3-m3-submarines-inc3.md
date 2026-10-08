# Validation Report: C-3-IMPL INC-3 — Submarine Proximity, Remote-Efficiency, ASW Vulnerability

## Outcome

`PASS`.

## Scope delivered

INC-3 of `c3-m3-submarines` (C-3 sprint, spec AC-6, AC-7, AC-8):

- **Proximity bands (DESIGN-34 §8, AC-6):** `proximityBandForRouteDistance` mapping — LOCAL (0..1), REGIONAL (2..3), REMOTE (4..6), EXTREME_REMOTE (≥7). Fail-closed on negative/non-integer distance.
- **Remote-efficiency multipliers (DESIGN-34 §9, AC-7):** `submarineRemoteEfficiencyBp` wired to existing `SUBMARINE_REMOTE_EFFICIENCY_BP` (shipped in INC-1). Exact 5-type × 4-band table with fail-closed guard on unknown type.
- **Long-range ASW vulnerability (DESIGN-34 §10, AC-8):** `submarineAswVulnerabilityBp` with exact LOCAL/REGIONAL/REMOTE/EXTREME_REMOTE values (10_500/10_750/11_000/11_500), valid range 10_000..12_500, fail-closed `LONG_RANGE_ASW_VULNERABILITY_MISSING` if out of range. `registeredAswVulnerabilityBp` dispatches between §10 table (long-range types) and neutral baseline (10_000).
- **Contracts (AC-21):** `submarine_proximity_v1`, `submarine_remote_efficiency_v1`, `submarine_long_range_asw_vulnerability_v1` with fail-closed validate guards.

## Commands and observed results

```text
pnpm -w turbo run build --force
18 successful, 18 total (clean uncached build)

pnpm --filter @bluewave/combat exec vp test run
157 files / 1904 tests passed (incl. 130 submarine; baseline 1774 + 130)

pnpm --filter @bluewave/combat exec vp test run test/submarines/
7 files / 130 tests passed

pnpm -w exec tsc -b
exit 0, clean

node scripts/verify-golden-hashes.cjs
All 10 hashes match golden reference (goldens byte-identical)
```

## Determinism evidence

- Functions are pure (no I/O/clock/random). Submarine suite run twice produced identical results.
- Golden hashes: 10/10 match.

## Canonical artifact changes

None. No snapshot schema, phase, engine-stage, or golden change.

## Tests added

- `proximity.test.ts` — 24 tests (band boundaries, negative/non-integer fail-closed, all 5×4 remote-efficiency values, all 4 ASW vulnerability values, contract tamper fail-closed).
- Cumulative submarine test count: 130 (7 files).
- Regression coverage: full combat suite 1904 passing.

## ADRs and dependencies

None new.

## Changed files

Code:

- `packages/combat/src/submarines/proximity.ts` (new)
- `packages/combat/src/submarines/contracts.ts` (modified — added 3 contracts)
- `packages/combat/src/submarines/constants.ts` (modified — added 3 policy ids)
- `packages/combat/src/submarines/index.ts` (modified — added proximity re-export)
- `packages/combat/test/submarines/proximity.test.ts` (new)

Docs:

- `.ai/SPRINT-PLAN.md` (updated INC-3 done, INC-4 frontier)
- `docs/PROGRESS.md` (updated C-3 status)
- Issue tracker (INC-3→DONE, INC-4→frontier)

## Reviewer

APPROVE — no findings.
