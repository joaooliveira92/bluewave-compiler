# INC-7 — Mine Laying + Friendly-Identification (Value-Only)

**Type:** implementation
**Status:** open
**Blocked by:** INC-6
**Frontier:** no

## Acceptance (spec AC-15, AC-16)

- Submarine-laid mine laying (§20): only `MINELAYING` submarines or explicitly
  capable other types execute `MINE_LAYING`; requires mine inventory, technology,
  legal route, target area, readiness, reliability at least `40`, and fuel;
  success creates an `AreaMinePressureRecord` (DESIGN-14 via **C-2's mine model**)
  and consumes exact inventory; insufficient inventory →
  `SUBMARINE_MINE_INVENTORY_INSUFFICIENT`; no mine-**strike** resolution (C-2
  continuation) (`test/submarines/mine-laying.test.ts`).
- Friendly-identification (value-only, §23): `submarine_friendly_identification_v1`
  base misidentification probability `500` bp + exact clamp formula
  `clamp(0, 10_000, 500 + visibilityModifierBp + communicationModifierBp +
  doctrineModifierBp + fatigueModifierBp - identificationQualityBp)`; ships as a
  pure value function only — no risk/outcome application (DESIGN-29-dependent)
  (`test/submarines/friendly-identification.test.ts`).

## Hints

This increment **reads** C-2's `AreaMinePressureRecord` + `SUBMARINE_LAID` mine
type from `packages/combat/src/mines/` — do NOT modify that module (concurrent
C-2 is complete but the file is shared; import only). Ship
`submarine_mine_laying_v1` + `submarine_friendly_identification_v1` contracts +
validate guards. Do NOT modify `mines/`/`torpedoes/`/`weather/`/`phase-engine`/
`random`/desktop-e2e (concurrent).
