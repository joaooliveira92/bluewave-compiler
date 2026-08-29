# Validation Report: C-1 INC-6 — TorpedoDamagePackage (AC-15..AC-18)

## Outcome

`PASS` (reviewer NEEDS_REWORK → all findings repaired → orchestrator gate green).

## Scope delivered

INC-6 of the C-1 torpedo slice, engine-only, entirely in `@bluewave/combat/src/torpedoes/`,
**reusing the B-4 damage seams by import only** per the resolved decision ticket
`.scratch/c1-m3-torpedoes/issues/05-damage-seams.md`: §16 `TorpedoDamagePackage`, §17 flotation,
§18 flooding creation, §19 machinery, §20 system shock, §21 tube-hit hazard, §22 chain reaction,
§23 oxygen. `src/damage/` and `src/battleResolution/` unmodified (diff-verified). No phase/snapshot
change; goldens unchanged.

## Requirements evidence

| Requirement                 | Implementation                                                                                                  | Proving tests               |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------- |
| AC-15 §16 damage package    | `damagePackage.ts` (`TorpedoDamagePackage` + enveloped hash, `applyTorpedoDamagePackage` atomic incl. rollback) | `damage-package.test.ts`    |
| AC-16 §17 flotation         | `flotation.ts` (`computeTorpedoFlotationDamage`, shipped leak/zone tables) + `structureFlotation` reuse         | `flotation.test.ts`         |
| AC-16 §18 flooding creation | `flooding.ts` (`resolveTorpedoFloodingCreation`, 4-factor formula, isolation table)                             | `flooding-creation.test.ts` |
| AC-17 §19 machinery         | `machinery.ts` (weights 10_000, reduced 2_500, keyed selection → `ComponentOutcome`)                            | `machinery.test.ts`         |
| AC-17 §20 system shock      | `systemShock.ts` (3_000/1_000/0 bp, ascending stable-id, ineligible unchanged)                                  | `system-shock.test.ts`      |
| AC-18 §21 tube hazard       | `tubeHazard.ts` (`underwater_tube_hit_hazard_v1`, four table groups, severe branch)                             | `tube-hazard.test.ts`       |
| AC-18 §22 chain reaction    | `chainReaction.ts` (1_500/3_000/1_000 bases, five-modifier manifest, separate package helper)                   | `chain-reaction.test.ts`    |
| AC-18 §23 oxygen            | `oxygen.ts` (15_000/11_000/7_500/15_000/3_000, compatibility gated)                                             | `oxygen.test.ts`            |
| AC-16/AC-21/AC-24           | reason codes + `SHIPPED_TORPEDO_DAMAGE_CONTRACT`/`SHIPPED_UNDERWATER_TUBE_HIT_HAZARD_CONTRACT` + guards         | `contracts.test.ts`         |

## Commands and observed results

```text
cd packages/combat && pnpm exec vp test run test/torpedo/
# 24 files, 453 tests passed

cd packages/combat && pnpm exec vp test run test/torpedo/damage-package.test.ts test/torpedo/tube-hazard.test.ts test/torpedo/chain-reaction.test.ts test/torpedo/contracts.test.ts
# 4 files, 83 tests passed

cd packages/combat && pnpm exec tsc --noEmit -p tsconfig.json   # exit 0

pnpm -w turbo run build --force   # Tasks: 18 successful, 18 total (0 cached)
```

Full gate (orchestrator): repo build clean; `tsc -b` clean except concurrent desktop WIP; lint `0` torpedo-scope errors; format clean in scope; repo turbo tests green except pre-existing `content-schema` nation.test + concurrent C-2 mines mid-edit (documented separately); goldens `10/10`; cross-process determinism suite `2/2`.

## Determinism evidence

- Same inputs + same keyed `battle/torpedo/...` draws → identical frozen hashes (proven, incl. identical `stateHash`).
- Draw-count determinism: machinery→shock→hazard consume input-determined counts; §22 chain draws are separate probes (INC-5 LOW-4 honored); no ambient randomness.
- Cross-process: goldens unchanged 10/10; `test/simulation/determinism.test.ts` 2/2.

## Canonical artifact changes

None. Goldens unchanged. `src/damage/` + `src/battleResolution/` diff empty (B-4/B-2..B-6 surfaces intact).

## Tests added

`flotation, flooding-creation, machinery, system-shock, tube-hazard, chain-reaction, oxygen, damage-package` test files (98 new tests, 8 files) + INC-6 contract-guard blocks in `contracts.test.ts`.

## ADRs

Added **ADR-0031** entries 8 (TUBE_BAY 12_500), 9 (§21 immediate flooding = flotation-reserve loss), 10 (authored BALANCE-TARGET integers, contract-pinned). No new third-party dependency.

## Known limitations and deferred requirements

- Flooding per-minute resolution → C-5 (creation-only here).
- §22 separate explosion package is wired via `applyTorpedoChainReactionPackage` in this slice; the battle-engine stage that calls torpedo resolution during a scan/contact is INC-7.
- §26 campaign persistence, §25 evasion → later battle-results / ship-maneuver tracks.

## Changed files

New: `damageConstants.ts, damagePackage.ts, flotation.ts, flooding.ts, machinery.ts, systemShock.ts, chainReaction.ts, oxygen.ts, tubeHazard.ts` + 8 test files. Modified: `index.ts` (exports), `reasonCodes.ts` (5 §29 codes), `contracts.test.ts`, `docs/adr/ADR-0031` (entries 8–10), `hit-resolution.test.ts`/`launch-failure.test.ts` (format-only).

## Git and remote status

- Branch: dev. Commits: INC-6 code+ADR commit `072b704` + traceability commit.
- Push: no. PR: none. Merge performed: no.

## Secondary consistency check

- Independently re-ran torpedo suite after lint/format → 453/453.
- Confirmed mines desktop WIP not bundled in this commit (concurrent sessions' files excluded).
- Reviewer findings HIGH-1/MEDIUM-1/2/3/4/LOW-1/2 all closed.
