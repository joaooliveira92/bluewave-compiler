# INC-5 — Sea-State Profile

**Type:** implementation
**Status:** open
**Blocked by:** INC-4
**Frontier:** no

## Acceptance (spec AC-11, AC-12)

- Sea-state scale (§13): integer 0..9 inclusive; shipped categories (`CALM` 0–1,
  `OPTIMAL` 2–5, `HEAVY` 6–7, `SEVERE` 8–9); exact optimum band 2–5
  (`test/submarines/sea-state-scale.test.ts`).
- Detection multipliers (§14): 0:13_000, 1:11_500, 2:10_000, 3:9_500, 4:9_500,
  5:10_000, 6:10_500, 7:11_000, 8:11_500, 9:12_500.
- Observation multipliers (§15): 0:11_000, 1:10_500, 2:10_000, 3:10_000, 4:10_000,
  5:9_500, 6:8_000, 7:6_500, 8:5_000, 9:3_500.
- Attack multipliers (§16): 0:10_000, 1:10_000, 2:10_500, 3:11_000, 4:11_000,
  5:10_500, 6:8_500, 7:7_000, 8:5_000, 9:2_500; peak 11_000 at 3–4; **fail-closed
  guard:** sea-state attack modifiers MUST NOT alter torpedo warhead damage,
  nominal speed, or nominal range.
- Surface/snorkel ops (§17): at sea state 8–9 deck-gun attack prohibited, surface
  battery charging prohibited (unless a tech permits), snorkeling
  machinery-reliability `7_500` bp, periscope observation per §15, surfaced transit
  speed `7_500` bp; at 0–1 surfaced operation additional detection `12_500` bp
  after §14; §17 violation → `SUBMARINE_SEA_STATE_OPERATION_PROHIBITED`
  (`test/submarines/sea-state-multipliers.test.ts`).

## Hints

Ship `submarine_sea_state_v1` contract + validate guard + §16 fail-closed
`validateSeaStateAttackModifiersDontTouchTorpedo` guard. All values are exact
DESIGN-34 integers (ticket 04). Do NOT modify `mines/`/`torpedoes/`/`weather/`/
`phase-engine`/`random`/desktop-e2e (concurrent).
