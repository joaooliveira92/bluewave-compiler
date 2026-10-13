# 08: Protection section

**Type:** implementation
**Status:** resolved
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

- [x] Armour fields are grouped spatially (belt / deck / conning tower / armament / underwater).
- [x] Each armour field shows thickness, coverage, weight, protected area, and estimated
      effectiveness.
- [x] Editing a field updates the compiled result (mass, stability, effectiveness) immediately.
- [x] Selecting "main belt" — and each belt/deck/conning-tower field — highlights it on the
      ship visualization (per ticket 04).
- [x] Advanced armour fields (inclination, tapering, material, internal backing) are available
      through the progressive-disclosure pattern of ticket 13. — material and inclination are under
      the field's Advanced disclosure; tapering and internal backing are not modelled (see Deferred).

## Answer

The Protection → Armour tab now opens a spatially-grouped armour editor instead of the flat region list:

- **View model** `protection-view.ts` (pure): `protectionModel(draft, view, materials)` groups every fitted
  `ArmourRegion` into five spatial groups — Belt / Deck / Conning tower / Armament / Underwater
  (`protectionGroupOf`, a presentation convention) — and turns each region into a `ProtectionField` with
  thickness, fore-aft **coverage** (share of the waterline, permille), weight (compiled
  `weightByRegionKg`), **protected area** (m²), material, **effective thickness** (thickness × material
  effectiveness × cos obliquity) and **estimated effectiveness** (the compiled penetration **margin**
  against the design threat, `defeats` when ≥ 0). It also exposes the free regions, the armour materials,
  the "all or nothing" scheme and the coverage/weight totals. Every value is a draft or compiled value.
- **Editor** `components/ProtectionEditor.tsx`: each field shows the readouts above and edits thickness,
  length and height (all draft edits via `set_armour_region`); the **Advanced** disclosure holds the
  material select and the inclination toggle; the section keeps the "All or nothing" action, the add-region
  control and the remove action. A "What the model does not carry" disclosure states the gaps plainly.
- **Selection → ship**: selecting a field (`Select <region> on the ship`) highlights that armour region on
  the central plan (`ArmourZoneLayer` gains an `armourHighlight` prop; `HullPlanPanel` forwards it) and
  switches the armour-zones overlay on so the highlight is visible. The band is drawn amidships and labelled
  a convention — the design gives no station.
- The section's fittings table (ARMOUR_SCHEME) stays below the editor, so the existing relocation/undo test
  keeps passing (no functional regression).

**Deferred (model does not carry the field).** Turret side, turret roof, subdivision, double bottom and the
brief's "extended deck" are not modelled as separate armour inputs (`ARMOUR_REGIONS` has twelve regions and
the draft carries no such fields); tapering and internal backing are not modelled either. The editor names
them under "What the model does not carry" and does not invent controls for them. The Advanced-disclosure
*pattern* is implemented locally here; ticket 13 generalises it across sections.

**Deferred (ship-design, not this ticket).** The balance's `cosObliquityBp` comment says a sloped plate is
"more effective", but `penetrationMarginBp` multiplies by it, so the "Inclined (30°)" setting currently
*reduces* effective thickness and margin (and the editor's "Effective thickness" readout follows the
compile). The direction looks inverted; recorded here as a `@bluewave/ship-design` deferral rather than
changed in a presentation ticket (changing it would move golden/determinism).

**Tests** `protection-view.test.ts` (grouping, labels, thickness/coverage/area/weight, margin against the
design threat, effective thickness, free regions, gaps note) and `ShipbuildingWorkspace.test.tsx`
("Protection armour section": group + readouts, thickness edit updating displacement with undo, and the
plan highlight). **Commands:** `vp test run` in `apps/desktop` → 286 files / 1953 tests passed;
`pnpm typecheck` (tsc -b) → clean; `vp lint`/`vp fmt --check` on the changed files → clean.
**Snap:** `pnpm snap --save /tmp/bw-save --click "Shipbuilding" --click "Protection" --click "Add region"
--click "Select Main belt on the ship"` → the Belt group and Main belt readouts render, the belt is
highlighted on the plan, console clean, idle mutations structural=0.
