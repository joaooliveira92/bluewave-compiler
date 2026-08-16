# INC-1 — Model + Launcher + Ammunition + Compatibility + Reason Codes + Constants

**Type:** implementation
**Status:** open
**Blocked by:** scoping (issues 01–06 resolved)
**Frontier:** yes (first)

## Acceptance (spec AC-1..AC-4, AC-21, AC-24 seeds)

- `TorpedoModelDefinition` with all §1 fields incl. content version + content hash;
  missing/invalid → `INVALID_TORPEDO_MODEL_DEFINITION` (`test/torpedo/model.test.ts`).
- Authoritative integer `TorpedoLauncherState` (§2) + closed mount-type enum
  (`ABOVE_WATER_FIXED`/`ABOVE_WATER_TRAINABLE`/`UNDERWATER_FIXED`/`UNDERWATER_TRAINABLE`/
  `SUBMARINE_INTERNAL`) + `assertFixedPointTorpedo` guards
  (`INVALID_TORPEDO_LAUNCHER_STATE`/`TORPEDO_STATE_INVARIANT_FAILED`)
  (`test/torpedo/launcher-state.test.ts`).
- Ammunition: loaded-per-tube-or-`EMPTY`, reserve by model, reload state; atomic
  reserve+consume exactly one per fired tube; no creation/substitution/over-capacity;
  `TORPEDO_AMMUNITION_UNAVAILABLE`/`TORPEDO_MODEL_INCOMPATIBLE`
  (`test/torpedo/ammunition.test.ts`).
- Platform compatibility predicates (§4) incl. diameter/mass/propulsion/fire-control/
  tech/inventory/treaty; no administrative bypass (`test/torpedo/compatibility.test.ts`).
- `torpedoes/reasonCodes.ts` in-slice §29 codes + `torpedo_v1` contract seeds
  (`SHIPPED_TORPEDO_CONTRACT` + validate guard).

## Hints

Follow the B-4 pattern: `damage/state.ts` state + guards, `damage/constants.ts`
contracts. New module directory `packages/combat/src/torpedoes/`. Branded-safe-int
fields via `@bluewave/contracts`. Deterministic content hash for the model.