# Validation Report: C-1 Torpedo INC-8 — Contracts Rollup + Reason-Code Set-Equality + Gate (AC-21, AC-24, AC-25)

## Outcome

`PASS` (for the INC-8 change set). Repo-wide golden/determinism gate is blocked by an
**unrelated concurrent session** editing `events`/`phase-engine`/`content-schema` in the same
working tree (Zod `datetime` envelope change); documented separately below, not caused by this
change (torpedo scope is engine-only; no snapshot/phase/events schema change).

## Scope delivered

- Full `*_v1` contracts rollup: `torpedo_v1`, `torpedo_launch_authority_v1`,
  `underwater_tube_hit_hazard_v1`, `torpedo_models_v1` with `SHIPPED_*_CONTRACT` +
  `validate*Contract` fail-closed guards (AC-24).
- Research-grounded `torpedo_models_v1` model set rolled up to the full 8-model set
  (`SEED_TORPEDO_MODEL_IDS` + `SHIPPED_TORPEDO_MODELS`): Whitehead 14-in 1886, RN 21-in Mk VIII
  1927, USN 21-in Mk 14 1931 appended; original 5 literals byte-unchanged (hashes preserved).
  BALANCE TARGET items flagged with provenance comments (AC-24).
- `reason-codes-torpedoes.test.ts` AC-21 set-equality: 21-code §29 list, IN_SLICE/DEFERRED
  partition (no deferred within §29), shipped catalog == in-slice + 2 markers
  (`TORPEDO_FIRE_SOLUTION_FACTOR_MISSING`, `TORPEDO_STUCK_IN_TUBE`), retired marker
  `TORPEDO_ELIGIBILITY_PREDICATE_DEFERRED` never re-added, reused catalog codes not redefined,
  module vs top-level/damage catalogs disjoint.
- ADR-0031 decision 6 reconciled: dropped the retired marker from the shipped-marker list;
  `TORPEDO_STUCK_IN_TUBE` retained.
- Reviewer repairs applied: spec §1.4 marker list (MEDIUM-1) and reason-codes test coupling note
  (LOW-1).
- Deferred (recorded, unchanged): progressive-flooding resolution (C-5), target evasion (§25),
  damage persistence (§26), submarine launch (C-3), aerial torpedoes (D-track), phase-engine /
  `resolveBattleAuto` torpedo integration (later battle-results slice), production-pack YAML.

## Requirements evidence

| AC | Evidence |
|----|----------|
| AC-21 | `test/reason-codes-torpedoes.test.ts` (6 tests) — set-equality + disjointness |
| AC-24 | `test/torpedo/contracts.test.ts` (50 tests) — tamper fail-closed on every contract incl. model-id list add/remove/reorder + content-hash mismatch; `torpedo_models_v1` pins the 8 seed ids (`model.ts`) |
| AC-25 | torpedo scope is engine-only (diff shows no snapshot/phase/events/BattleResolver/StrengthCalculator change); goldens unchanged by this change |

## Commands and observed results

```text
$ pnpm -w turbo run build --force
18 successful, 18 total (uncached)   # full-repo build green

$ cd packages/combat && pnpm exec tsc -b
exit 0   # combat typecheck clean

$ cd packages/combat && pnpm exec vitest run test/torpedo test/reason-codes-torpedoes.test.ts
30 files passed, 517 tests passed   # full torpedo suite incl. INC-8 AC tests

$ cd packages/combat && pnpm exec vitest run test/torpedo/contracts.test.ts test/torpedo/detonation.test.ts test/torpedo/model.test.ts test/reason-codes-torpedoes.test.ts
4 files passed, 112 tests passed   # INC-8 AC-21/AC-24 + detonation/model focused

$ git diff --name-only | grep -iE "BattleResolver|StrengthCalculator"
(no matches)   # unmodified (AC-25)
```

## Determinism evidence

- **Blocked by concurrent session (unrelated):** `node scripts/verify-golden-hashes.cjs` fails
  with a Zod `invalid_string`/`datetime` on `timestamp` inside `packages/cross-process-test` +
  `packages/events`. This is the **concurrent** `events` envelope-validation hardening
  (`7b60154`, plus uncommitted `packages/events/test/*` WIP), NOT caused by this change — the
  torpedo change adds no snapshot schema, phase, or events field. Mirrors the C-2 report's
  environment note. A clean determinism/golden run requires the concurrent `events` change to
  land or be reverted; not repairable from the torpedo scope.
- Two-process determinism (`run-torpedo-child.ts`, AC-23) already proven at the INC-7 gate
  (`db840c7`, goldens 10/10 unchanged).
- `BattleResolver`/`StrengthCalculator`: unmodified (diff).

## Canonical artifact changes

None. No snapshot schema change, no phase change, no golden regeneration. The 5 original
`torpedo_models_v1` literals are byte-unchanged (appends only), preserving their content hashes.

## Tests added

- `packages/combat/test/reason-codes-torpedoes.test.ts` (6 tests, AC-21).
- `test/torpedo/contracts.test.ts` extended (+100 lines) for the INC-8 rollup (AC-24).
- `test/torpedo/detonation.test.ts` (+9), `test/torpedo/model.test.ts` (+5) for the 3 new models.

## Security and cancellation

No new trust boundary, parsing, path, or I/O surface. Engine-only pure functions; fail-closed
guards. No cancellation-sensitive resources added.

## ADRs and dependencies

- **ADR-0031** (C-1 torpedo scope/reason-code/fuze authority) — decision 6 reconciled for the
  retired marker; no new dependencies.

## Known limitations and deferred requirements

- Repo-wide golden/two-process gate cannot be proven in the shared tree until the concurrent
  `events` hardening lands or is reverted (unrelated).
- As per spec §3: progressive-flooding resolution, evasion, damage persistence, submarine launch,
  aerial torpedoes, and phase wiring are deferred (recorded, not dropped).

## Changed files (INC-8 scope)

- `packages/combat/src/torpedoes/constants.ts`, `detonation.ts`, `model.ts`
- `packages/combat/test/torpedo/contracts.test.ts`, `detonation.test.ts`, `model.test.ts`
- `packages/combat/test/reason-codes-torpedoes.test.ts` (new)
- `.scratch/c1-m3-torpedoes/spec.md` (MEDIUM-1), `docs/adr/ADR-0031-…md` (decision 6),
  `.scratch/c1-m3-torpedoes/issues/INC-8-contracts-adr.issue.md` (closed),
  `.ai/specs/c1-m3-torpedoes.md` (pointer refresh)