# 08: Protection section

**Type:** implementation
**Status:** open
**Blocked by:** 03, 04
**Frontier:** no

Source: `.scratch/shippbuilding-ui.md` §"Protection".

## What to build

Group the protection fields spatially instead of as a flat list: main belt, upper belt, main
deck, extended deck, conning tower, turret face/side/roof, barbette, underwater protection,
subdivision, double bottom, and magazine protection. Each field reports its consequences
(thickness, coverage, weight, protected area, estimated effectiveness), and selecting a field
highlights that armour on the ship.

## Acceptance criteria

- [ ] Armour fields are grouped spatially (belt / deck / conning tower / armament / underwater).
- [ ] Each armour field shows thickness, coverage, weight, protected area, and estimated
      effectiveness.
- [ ] Editing a field updates the compiled result (mass, stability, effectiveness) immediately.
- [ ] Selecting "main belt" — and each belt/deck/conning-tower field — highlights it on the
      ship visualization (per ticket 04).
- [ ] Advanced armour fields (inclination, tapering, material, internal backing) are available
      through the progressive-disclosure pattern of ticket 13.
