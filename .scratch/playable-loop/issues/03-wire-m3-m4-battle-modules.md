# 03 — Wire (or explicitly defer) the unreachable M3/M4 battle modules

**Type:** decision + implementation
**Status:** open
**Blocked by:** none
**Frontier:** yes
**Spec:** `.scratch/playable-loop/spec.md`; `docs/architecture/module-reachability.md`

## Scope

`docs/architecture/module-reachability.md` shows five built-but-unreachable modules:
mine warfare (C-2), submarines (C-3), coastal defense (C-4), and the in-battle smoke
(C-5) and air combat/defense (D-3/D-4) stages. `resolveBattleAuto` never supplies the
smoke/air contexts, and `phase-engine` never imports the mine/submarine/coastal modules.

For each, either wire it into the campaign month / auto-resolver, or record it as
explicitly deferred for the release scope (its DESIGN doc marked future). Silence is the
only wrong answer.

## Acceptance

- A decision per module: wire, or defer with the reason and the DESIGN doc marked.
- For wired modules: a campaign battle/month proves the module ran (headless, seeded),
  and determinism + goldens stay green.
- `docs/architecture/module-reachability.md` updated to reflect the outcome.

## Notes

Cheapest first: supplying a `SmokeContext`/`AirCombatContext`/`AirDefenseContext` in
`resolveBattleAuto` (projected from the manifest) may reach C-5/D-3/D-4 without new
strategic phases. Mine/submarine/coastal need strategic phases (or an explicit defer).
