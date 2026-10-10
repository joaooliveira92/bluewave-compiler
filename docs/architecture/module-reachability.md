# Campaign module reachability

Status: derived 2026-10-10 from the phase registry (`packages/phase-engine/src/registry.ts`),
the month pipeline (`packages/phase-engine/src/month.ts`), the tactical minute pipeline
(`packages/combat/src/simulation/engine.ts:advanceMinute`), and an import scan of
`packages/phase-engine` against `@bluewave/combat`. It answers one question: **can a
player reach this module from a compiled campaign, or is it built but unreachable?**

Method: a module is *reachable* when a registered, executed month phase runs it, or when
`resolveBattleAuto` supplies its context to `advanceMinute`. A module implemented and
tested in `@bluewave/combat` but not referenced by `phase-engine` is *unreachable*.

## Strategic month phases (reachable)

These run in order in `MonthExecutor.execute`:

- opening/closing validation; strategic weather generation; monthly revenue; AI planning;
  AI procurement; command collection; appropriation; maintenance; obligation; construction
  processing; diplomacy resolution (incl. blockade); research resolution; aircraft
  development; carrier operations; battle generation; battle resolution.

## Tactical (per-minute) inside an auto-resolved battle

`resolveBattleAuto` → `advanceMinute`:

| Stage | Reachable | Note |
| --- | --- | --- |
| contact / sensors | yes | |
| movement intent / propulsion / collisions | yes | |
| weather | yes | `buildBattleWeather` supplies the context |
| gunnery | yes | |
| damage / fire / flooding / damage control | yes | ADR-0047/0049/0050 |
| torpedoes | yes | P-1; proven by `cross-process-test/test/production-pack-loop.test.ts` |
| **smoke** | **no** | no `SmokeContext` supplied → `resolveSmokeStage` no-ops |
| **air combat (CAP/strikes)** | **no** | no `AirCombatContext` supplied → no-ops |
| **air defense (AA)** | **no** | no `AirDefenseContext` supplied → no-ops |

## Implemented but unreachable from a campaign

| Module | Design | Status |
| --- | --- | --- |
| Mine warfare | DESIGN-35 / C-2 | no mine/sweep phase in `phase-engine`; module not imported |
| Submarines | DESIGN-34 / C-3 | no submarine phase; module not imported |
| Coastal defense | DESIGN-48 / C-4 | no coastal phase; module not imported |
| Smoke (in battle) | DESIGN-42 / C-5 | tactical stage present, context never supplied |
| Air combat + air defense (in battle) | DESIGN-43/44/45 / D-3, D-4 | tactical stages present, contexts never supplied |

The M4 aviation *development* and carrier-operations pipelines **are** wired as strategic
phases; it is their in-battle air combat/defense that is not reachable.

## Existing proofs of the loop

- `packages/cross-process-test/test/production-pack-loop.test.ts` — compile the production
  pack → advance a month → save → load → replay, deterministically.
- Same file, P-1 AC-7 — a battle built from compiled 1880 content fires torpedoes.
- `packages/cross-process-test/src/run-child.ts` — the cross-process determinism child.

## Gaps this table makes explicit

1. From a normal 1880 start there are no wars, so **no battle is generated** until war is
   declared — the loop has not been proven to reach a *campaign-generated* battle through
   the player path.
2. Mine/submarine/coastal (M3) and smoke/air (M3/M4) are built and unit-tested but not
   reachable; either wire them or record them as deferred for the release scope.

## Follow-ups

The first-release decision on these gaps is ADR-0097 (defer, tracked). Wiring them is
`.scratch/playable-loop/issues/03-wire-m3-m4-battle-modules.md`.

- `../../.scratch/playable-loop/issues/01-playable-loop-acceptance.md` — prove the player
  path reaches a campaign-generated battle.
- `../../.scratch/playable-loop/issues/03-wire-m3-m4-battle-modules.md` — wire the
  unreachable modules or defer them explicitly.
