# Campaign module reachability

Status: derived 2026-10-11 from the phase registry (`packages/phase-engine/src/registry.ts`),
the month pipeline (`packages/phase-engine/src/month.ts`), the tactical minute pipeline
(`packages/combat/src/simulation/engine.ts:advanceMinute`), and the auto-resolution
orchestrator (`packages/combat/src/battleResolution/resolve.ts`). It answers one question:
**can a player reach this module from a compiled campaign, or is it built but unreachable?**

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
| **smoke** | **yes (2026-10-11)** | `resolveBattleAuto` projects `SmokeContext` from `manifest.smokeSources` (ADR-0112) |
| **air combat (CAP/strikes)** | **yes (2026-10-11)** | `resolveBattleAuto` projects `AirCombatContext` from `manifest.airGroups` (ADR-0112) |
| **air defense (AA)** | **yes (2026-10-11)** | `resolveBattleAuto` projects `AirDefenseContext` from `manifest.airDefenseInstallations` + attacking `airGroups` (ADR-0112) |

The smoke/air stages are *reachable through the production path*: the auto-resolver always
supplies the three contexts and invokes the stages in the established order (smoke after
movement intent; air combat after weather; air defense after air combat). A battle that
declares no capability projects an empty context — a strict, byte-identical no-op. This is
what distinguishes **capability absent** (empty context, stage runs, no effect) from the
previous state (**stage never supplied**, could not run). Proof:
`packages/combat/test/battle-resolution/reachability.test.ts`.

The M4 aviation *development* and carrier-operations pipelines are wired as strategic
phases; their in-battle air combat/defense stages are now reachable too, and their
capability is declared per battle when air content lands.

## Implemented but unreachable from a campaign (deferred)

| Module | Design | Status | Boundary / next step |
| --- | --- | --- | --- |
| Mine warfare | DESIGN-35 / C-2 | deferred (ADR-0112) | New `mine_warfare` strategic month phase in `phase-engine` (after diplomacy, before battle generation); no per-minute seam — it is a monthly area pressure/clearance ledger. |
| Submarines | DESIGN-34 / C-3 | deferred (ADR-0112) | New `submarine_operations` strategic month phase; needs a campaign submarine state model (none yet); policy gated on the unmodelled trade-warfare resolution (ADR-0088). |
| Coastal defense | DESIGN-48 / C-4 | deferred (ADR-0112) | New `coastal_defense` strategic month phase (area battery placement + land-target damage); needs authored coastal-battery content. |

Mine/submarine/coastal are strategic/pre-battle by design. Forcing them into
`resolveBattleAuto` would place monthly economics inside a minute loop, so they are
explicitly deferred with a named invocation boundary and minimum integration point
(the `phase-engine` registry + month pipeline), not silently dropped (ADR-0112).

## Existing proofs of the loop

- `packages/cross-process-test/test/production-pack-loop.test.ts` — compile the production
  pack → advance a month → save → load → replay, deterministically.
- Same file, P-1 AC-7 — a battle built from compiled 1880 content fires torpedoes.
- `packages/combat/test/battle-resolution/reachability.test.ts` — smoke/air contexts are
  projected from manifest capability and the stages are reachable through
  `resolveBattleAuto`, while an empty capability stays byte-identical.
- `packages/cross-process-test/src/run-child.ts` — the cross-process determinism child.

## Gaps this table makes explicit

1. From a normal 1880 start there are no wars, so **no battle is generated** until war is
   declared — the loop's player path to a *campaign-generated* battle is tracked in
   `.scratch/playable-loop/issues/01-playable-loop-acceptance.md`.
2. Mine/submarine/coastal (M3) remain built but unreachable; deferred by ADR-0112.

## Follow-ups

- `../../.scratch/playable-loop/issues/01-playable-loop-acceptance.md` — prove the player
  path reaches a campaign-generated battle.
- `../../.scratch/playable-loop/issues/03-wire-m3-m4-battle-modules.md` — smoke/air wired;
  mine/submarine/coastal deferred (ADR-0112).
