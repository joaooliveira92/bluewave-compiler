# INC-1 — Strategic Representation + Types + Policies + Reason Codes + Contracts Seed

**Type:** implementation
**Status:** DONE (2026-08-28, commit `c2caf64`)
**Blocked by:** scoping (issues 01–06 resolved)
**Frontier:** no

## Acceptance (spec AC-1, AC-2, AC-3, AC-18, AC-21 seeds)

- `SubmarineStrategicAsset` (§1) with the full field set (stable asset identifier,
  owner nation, submarine type, quantity — exactly `1` for persistent units,
  readiness, reliability, current strategic area, home-base identifier, fuel and
  supply state, mission policy, damage/loss state, monthly battle-participation
  count, ruleset version, aggregate hash); every asset declares exactly one
  strategic representation (`PERSISTENT_UNIT` / `TYPED_FLOTILLA_POOL`);
  missing/mixed representation → `INVALID_SUBMARINE_REPRESENTATION`
  (`test/submarines/strategic-representation.test.ts`).
- `SubmarineTypeDefinition` (§4) with all five canonical types
  (`COASTAL`/`MEDIUM_RANGE`/`LONG_RANGE`/`MINELAYING`/`MISSILE`) and all §4
  fields (range class, remote-efficiency profile, ASW-vulnerability profile,
  mission eligibility, base-support requirement, tactical projection, technology
  prerequisites); §1 mapping `MISSILE`→`PERSISTENT_UNIT`, others→
  `TYPED_FLOTILLA_POOL` (`test/submarines/type-definitions.test.ts`).
- Submarine policies (§5): three policies (`FLEET_SUPPORT`/`PRIZE_RULES`/
  `UNRESTRICTED`) with exact target weights (warship/merchant/neutral-incident-
  multiplier) each summing to exactly 10_000; policy change = accepted command,
  effective next trade-warfare resolution (`test/submarines/policies.test.ts`).
- `submarines/reasonCodes.ts` seeded with the in-slice §27 partition (full list
  finalized in INC-8, but the module + first codes ship here).
- `submarine_strategic_asset_v1` + `submarine_types_v1` + `submarine_policies_v1`
  contracts + `SHIPPED_*_CONTRACT` + validate guards, wiring DESIGN-34's own
  exact §5/§9 integers per type (per ticket 06 — no research-grounded catalog).

## Hints

Follow the C-2 `mines/` pattern: `model.ts` state module, `constants.ts`
contracts module. New module directory `packages/combat/src/submarines/`.
Branded-safe-int fields via `@bluewave/contracts`. Deterministic content hash per
type definition. **Concurrency:** do NOT modify `packages/combat/src/torpedoes/`,
`mines/`, `weather/`, `packages/phase-engine/`, `packages/random/`, or the
desktop-e2e harness (concurrent sessions own those in the shared tree). `mines/`
may be *read* for the `AreaMinePressureRecord` type only (INC-7).
