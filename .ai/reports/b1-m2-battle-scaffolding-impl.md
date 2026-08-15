# Validation Report: B-1 — M2 Battle Generation & Tactical Setup Scaffolding (Implementation)

## Outcome

`PASS_WITH_LIMITATIONS`

B-1 IMPL (spec `.scratch/b1-m2-battle-scaffolding/spec.md`) is implemented through
the 6 increments (INC-1..INC-6), reviewed (adversarial reviewer → 1 BLOCKER + 4
HIGH + several MEDIUM, all repaired or recorded), and gated. Limitations are the
two pre-existing failing suites (`apps/desktop/test/project.test.ts`,
`packages/content-schema/test/nation.test.ts`) plus the recorded AC-14 production
ship→design content linkage (deferred, not fabricated).

## Scope delivered

- **INC-1** Tactical-unit promotion + `CanonicalShipType` classifier
  (`ship_type_classifier_v1`, ADR-0012/0013). No snapshot schema change.
- **INC-2** `PermanentDivision` aggregate + DESIGN-26 invariants + 5 division
  commands wired into the command lifecycle + `command_collection` phase.
  `NationState.divisions` canonical field. Golden regen (documented).
- **INC-3** Battle-generation core: 9-type mission registry (ADR-0014), reachable
  opportunity predicate (ADR-0015), sides, force/mandatory roles, eligibility,
  optional selection v1, allied caps, division projection.
- **INC-4** Reachability, repair (≤3 passes), manifest canonicalization
  (`manifest_hash_v1`, ADR-0016), battle seed (`battle/battle_id/root`),
  reservations, declared-surface auto-resolve proof (ADR-0017).
- **INC-5** `BattleGenerator` facade + `generateBattles` (all 15
  `BattleGenerationStageRecord`s), `BattleGenerationRecord`, decision boundary
  (ADR 0017/B-1-4), cross-process generation hash.
- **INC-6** `battle_generation` phase (order 7.5), `WarState.battleManifests` +
  `BattleInstance.manifestHash`, persistence/replay/cross-process propagation,
  24-month AI smoke, golden regen.

### Review repairs (adversarial reviewer)

- **(BLOCKER)** `generateBattles` now actually composes forces: gathers eligible
  assets per side (deterministic order), enforces ADR-0015 strength floors
  (FLEET 300 / CRUISER 150), projects permanent divisions, assigns mandatory CORE
  roles, selects optional assets via the keyed v1 stream, revalidates
  reachability, repairs, and builds manifests carrying real `persistentAssets` +
  `permanentDivisionIds` + `reservations`.
- **(HIGH-4)** `WarState.battleManifests` widened to the full generator shape;
  `cloneSnapshot` deep-copies every field (no subset/full canonical divergence).
- **(MEDIUM-8)** Added `division-effects.test.ts` proving DESIGN-26 §14/§15/§16/§17
  (role eligibility, formation legality, DD-scout threshold, effect formulas +
  clamps).

## Requirements evidence

| Criterion | Implementation                                                              | Proving test                                                                                                                          |
| --------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1      | `tactical/unit.ts promoteTacticalUnit`, `tactical/shipType.ts classifyShip` | `combat/test/tactical/unit.test.ts`, `shipType.test.ts`                                                                               |
| AC-2      | `campaign/src/division.ts assertDivisionInvariants`                         | `campaign/test/division.test.ts`                                                                                                      |
| AC-3      | `commands/src/lifecycle.ts` division validators                             | `commands/test/commands.test.ts`                                                                                                      |
| AC-4      | `generation/mission.ts MISSION_REGISTRY`, `assertPrioritiesUnique`          | `combat/test/generation/mission.test.ts`                                                                                              |
| AC-5      | `generation/opportunity.ts determineMissionOpportunities` (ADR-0015)        | `combat/test/generation/opportunity.test.ts`, `pipeline.test.ts`                                                                      |
| AC-6      | `generation/eligibility.ts gatherEligibleAssets`                            | `combat/test/generation/eligibility.test.ts`                                                                                          |
| AC-7      | `tactical/division.ts projectPermanentDivision`                             | `combat/test/tactical/projection.test.ts`                                                                                             |
| AC-8      | `generation/force.ts`, `generation/optional.ts`                             | `combat/test/generation/roles-optional.test.ts`                                                                                       |
| AC-9      | `generation/repair.ts battleCompositionRepairV1`                            | `combat/test/generation/repair.test.ts`                                                                                               |
| AC-10     | `generation/manifest.ts`, `generation/seed.ts`                              | `combat/test/generation/seed-manifest.test.ts`                                                                                        |
| AC-11     | `generation/reservation.ts`, `generation/autoResolutionProof.ts`            | `combat/test/generation/reservation.test.ts`                                                                                          |
| AC-12     | `phase-engine/src/registry.ts` order 7.5 + `month.ts` phase                 | `phase-engine/test/battle-generation-phase.test.ts`                                                                                   |
| AC-13     | persistence + replay field propagation                                      | `persistence/test/battle-generation-persistence.test.ts`                                                                              |
| AC-14     | reachable-subset isolation (deferred missions unreachable)                  | `combat/test/generation/mission.test.ts` (deferred half); per-ship promotion mechanism in `desktop/test/production-promotion.test.ts` |

## Commands and observed results

```text
pnpm -w turbo run build --force          # 17 successful, 17 total
pnpm -w typecheck                        # 31 successful, 31 total
pnpm lint                                # 0 warnings, 1 error (pre-existing nation.test.ts broken import)
pnpm test:run                            # Test Files: 2 failed | 55 passed (57); Tests: 3 failed | 503 passed (506)
node scripts/verify-golden-hashes.cjs    # All 9 hashes match golden reference
pnpm -w turbo run test --filter=@bluewave/cross-process-test  # 13 passed; two runs byte-identical
```

Pre-existing (unrelated, present at baseline): `apps/desktop/test/project.test.ts`
(3 packing tests) and `packages/content-schema/test/nation.test.ts` (broken import
of `content/research/nations/1880/index.ts`, tracked separately).
`pnpm format` reports pre-existing repo-wide drift in 147 unmodified files; all
B-1-authored files pass `vp fmt --check`.

## Determinism evidence

- Content artifact hash: `103c60d3f25d1f6ccf758416ef33754732f0f837ad8021d3985ee027d95bccd9`
- Initial snapshot hash: `7ca7e5742fd3c05213da4bdb503901a03f28fc35d94e0739b679c607713fcbdc`
- Closing snapshot hash: `d8fd207583fdbc79219be4255eb26f6b81313d72c64993b295d31135b7b95359`
- Command ledger hash: `f489269f493660832e713adbef7cc4f6048a5f17251c33987e108bc03721849d`
- Event ledger hash: `b6a626ba84258da4165156c7f52e97b5ed5d323bbe78a6a0f676013c3387df9f`
- Financial ledger hash: `6aa1199c9db94af15e331b0d27bf3e1ec8742c82770ebfc7e1c0d883ba44a5b8`
- Random-decision ledger hash: `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945`
- Replay verification hash: `d889d477c7efbcc246bda28e1c4322ed3b59cf48200bb0762314136704af22d7`
- Battle-generation hash: `dcdb85c43321b44523b881ccd12623d1689455f060b5d98487850184bbdcb9b6`
- Replay result: `match=true` (replayed final hash equals original)
- Two child-process runs byte-identical on Windows (Node v24).

## Canonical artifact changes (ADR-0007)

Regenerated with documented old/new + cause. B-1 is pre-release (private
workspace packages), so no save migration is required; a schema-version bump was
considered but the compatibility string remains `1.0.0` (all current builds share
one version).

| Artifact               | Old → New               | Cause                                                    |
| ---------------------- | ----------------------- | -------------------------------------------------------- |
| initialSnapshotHash    | `bc7dfc2c…`→`7ca7e574…` | `WarState.battleManifests` field in compiled snapshot    |
| closingSnapshotHash    | `3b1be6ee…`→`d8fd2075…` | new fields + `battle_generation` phase in month pipeline |
| commandLedgerHash      | `5c154b3d…`→`f489269f…` | budget command envelope over new snapshot                |
| replayVerificationHash | `64abef89…`→`d889d477…` | new phase/snapshot surface                               |
| battleGenerationHash   | `53bfb35d…`→`dcdb85c4…` | real battle composition consumes co-located assets       |

INC-2 also changed `closingSnapshotHash` `ccd0f826→3b1be6ee` + `replayVerificationHash`
`1aa85ce2→64abef89` (cause: `NationState.divisions`). All regeneration was via
`node packages/cross-process-test/dist/run-child.js` then committed.

## Tests added

- combat: `tactical/{unit,shipType,projection,division-effects}.test.ts`,
  `generation/{mission,opportunity,eligibility,roles-optional,repair,seed-manifest,reservation,pipeline}.test.ts`,
  `fixtures/{unit-fixture,generation-fixture}.ts`
- campaign: `test/division.test.ts`
- commands: division command cases in `test/commands.test.ts`
- phase-engine: `test/battle-generation-phase.test.ts`; updated `phase-engine`,
  `integration`, `diplomacy-war`, `economy`, `month`, `ai-scenario`,
  `research-design` fixtures for the new phase + fields.
- persistence: `test/battle-generation-persistence.test.ts`
- cross-process: generation scenario in `run-child.ts` + assertion in
  `cross-process.test.ts`
- desktop: `test/production-promotion.test.ts`

## Security and cancellation

- Generation and composition are pure and consume no ambient randomness (keyed
  streams only). No new filesystem/network access. No shell composition. No
  secrets. Cancellation applies at compile/phase boundaries via existing
  `AbortSignal`; the phase pipeline is synchronous and does not add ambient I/O.

## Performance observations

No formal perf suite. Composition iterates per-opportunity over nation ships and
divisions; non-authoritative fixture sizing shows negligible cost. Not an
acceptance criterion.

## ADRs and dependencies

- ADR-0012 (B-1-1 package boundary), ADR-0013 (B-1-2 ship-type classifier),
  ADR-0014 (B-1-3 reachable mission subset), ADR-0015 (B-1-7 opportunity
  predicate), ADR-0016 (B-1-5 manifest/seed), ADR-0017 (B-1-6 auto-resolve scope).
- No new third-party dependencies.

## Known limitations and deferred requirements

- **AC-14 per-ship production promotion** is **PARTIAL**: the promotion mechanism
  is proven by fixtures (AC-1) and the deferred-missions-unreachable half passes;
  the _content_ linkage (production `fleets.yaml` ships carrying a
  `designVersionId`) is **deferred to the CONTENT-track** and not fabricated —
  the pack's `classId`s do not cleanly or uniquely map to `designs.yaml` (some
  classes, e.g. Temeraire, Custoza, have no design; mojibake in names), so
  authoring those links requires grounded content work (`docs/research/`) outside
  B-1's engine scope. `production-promotion.test.ts` records this explicitly
  rather than claiming a false PASS.
- Movement/spotting (B-2), gunnery (B-3), armor/damage (B-4), weather (B-5),
  results→campaign integration + M2 gate (B-6) remain deferred per spec §1.2.
- `BattleResolver` / `StrengthCalculator` unmodified this sprint (verified).
- Pre-existing failing suites (`project.test.ts`, `nation.test.ts`) unrelated.

## Changed files

- `packages/combat/src/tactical/`, `packages/combat/src/generation/`,
  `packages/combat/src/index.ts`, `packages/combat/test/`, `packages/combat/package.json`
- `packages/campaign/src/division.ts`, `state.ts`, `compiler.ts`, `index.ts`,
  `test/division.test.ts`
- `packages/campaign/package.json` (unchanged this pass)
- `packages/commands/src/{envelope,lifecycle,index}.ts`, `test/commands.test.ts`
- `packages/phase-engine/src/{registry,month,replay}.ts`, `test/`
- `packages/persistence/test/`, `packages/persistence/package.json`
- `packages/cross-process-test/src/run-child.ts`, `test/cross-process.test.ts`
- `packages/ai/test/ai.test.ts`, `packages/commands/test/commands.test.ts`
- `apps/desktop/test/production-promotion.test.ts`, `apps/desktop/package.json`
- `apps/compiler-cli/test/cli.test.ts`
- `docs/adr/ADR-0012..ADR-0017`, `golden/hashes.json`

## Git and remote status

- Branch: `dev`
- Commits (B-1 IMPL): `282f21d`, `ce62f89`, `f939d17`, `5547c27`, `591e234`,
  `73e8b96`, `6303100`, `41c2b0e`
- Working tree: clean
- Push: not performed (no remote-write requested)
- Pull request: prepared by this report; merge: **no**

## Secondary consistency check

Independently re-ran `node scripts/verify-golden-hashes.cjs` (9/9), ran the
cross-process child twice (byte-identical, incl. `battleGenerationHash`), and
confirmed `git status` clean. New snapshot fields (`NationState.divisions`,
`WarState.battleManifests`, `BattleInstance.manifestHash`) flow through
`month.ts cloneSnapshot`, `replay.ts`, `run-child.ts snapshotToHashable`, and
`integration.test.ts / cli.test.ts / persistence` hash builders consistently.
