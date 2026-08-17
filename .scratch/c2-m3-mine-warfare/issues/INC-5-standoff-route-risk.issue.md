# INC-5 — Defensive Standoff + Route Risk (Value-Only)

**Type:** implementation
**Status:** open
**Blocked by:** INC-4
**Frontier:** no

## Acceptance (spec AC-11, AC-12)

- Defensive standoff (§16): `mine_defensive_standoff_v1` contract; exact
  thresholds (`<100_000` none, `100_000..249_999` level 1, `250_000..499_999`
  level 2, `500_000..749_999` level 3, `750_000..1_000_000` level 4); exact
  effect multipliers (`9_000`/`7_500`/`5_000`/`2_500` for levels 1–4); pure
  function `currentPressure -> {level, utilityMultiplierBp}`; emits
  `MINE_DEFENSIVE_STANDOFF_ACTIVE` when level > none; MUST NOT automatically
  cancel an accepted operation (no such mechanic exists to cancel — this is a
  documentation/comment requirement, not a behavior); **no consumer wired**
  (amphibious/blockade contracts don't exist yet — document, don't fabricate)
  (`test/mines/defensive-standoff.test.ts`).
- Strategic route risk (§13): exact formula `min(10_000,
  floor(currentPressure * freshnessBp * routeExposureMultiplierBp *
  targetSusceptibilityMultiplierBp / 1_000_000 / 10_000 / 10_000))`; exact
  shipped route-exposure multipliers (open sea `5_000`, coastal passage
  `10_000`, canal approach `15_000`, choke point `15_000`, port approach
  `12_500`); pure function returning `routeRiskBp`; emits
  `MINE_ROUTE_RISK_CREATED` when `routeRiskBp > 0`; **no movement-blocking
  behavior wired** — ticket 03 records why (blocked on DESIGN-25)
  (`test/mines/route-risk.test.ts`).

## Hints

Both functions are simple, pure, single-formula computations with no ship/area
mutation — keep them stateless and side-effect-free so the C-2-continuation
sprint can call them directly once a consumer exists. Do not invent a
`RouteEdge`/`AmphibiousOperation` type to "complete" the picture — accept the
minimal inputs the formula actually needs (pressure, freshness, target
susceptibility, exposure multiplier) as plain parameters.
