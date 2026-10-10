# 01 — Minimum playable-loop acceptance gate

**Type:** implementation
**Status:** open
**Blocked by:** none
**Frontier:** yes
**Spec:** `.scratch/playable-loop/spec.md`

## Scope

Prove one end-to-end campaign slice reaches and exercises the shipped modules, and
lock it as a gate: 1880 compile → monthly decisions → a campaign battle that
resolves and is surfaced → save/reload/verify. Wire any built-but-unreachable module
needed by the slice; if a module is out of the slice, record it as deferred (do not
silently drop).

## Acceptance

- AC-1..AC-5 of the spec.
- A new e2e spec in `apps/desktop/e2e/` drives the slice and runs in
  `.github/workflows/desktop-e2e.yml`.
- The slice's save/reload reproduces golden/cross-process hashes.
- A written reachability table: each M1–M4 module marked reachable-from-campaign or
  explicitly deferred.

## Notes

Start by enumerating, from the campaign phase pipeline, which modules actually run
during auto-resolution (PROGRESS.md notes gunnery + weather + damage). The gaps
between "built" and "reachable" are the real work.

## Progress

- Reachability enumerated: `docs/architecture/module-reachability.md`. The month
  pipeline wires weather/economy/commands/AI/construction/diplomacy/research/aircraft/
  carrier/battle-generation/battle-resolution phases. Inside a battle, `resolveBattleAuto` runs
  contact/movement/weather/gunnery/damage/torpedoes/damage-control; **smoke, air combat
  and air defense stages no-op** (no context supplied), and mine/submarine/coastal are
  not wired at all → ticket 03.
- Existing loop proof: `cross-process-test/test/production-pack-loop.test.ts`
  (compile → advance a month → save → load → replay). P-1 AC-7 proves a compiled battle
  fires torpedoes.
- Remaining: prove the **player path** reaches a *campaign-generated* battle (declare
  war → advance until a battle is generated/resolved), and the e2e slice (AC-5).
