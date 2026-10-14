# 07: Armament master-detail editor

**Type:** implementation
**Status:** resolved
**Blocked by:** 03, 04
**Frontier:** no

Source: `.scratch/shippbuilding-ui.md` §"Armament",
§"Important interaction patterns" (optional linked symmetry).

## What to build

Rework Armament into a master-detail editor: a compact mount list grouped as Main battery /
Secondary battery / Tertiary, and a selected-mount editor for the chosen mount. The selected
mount exposes its editable properties plus placement actions, and paired wing mounts can be
linked so edits apply to both — while still allowing asymmetric designs.

## Acceptance criteria

- [ ] A mount list groups mounts as Main battery / Secondary battery / Tertiary and shows each
      mount's layout (e.g. `A Twin 13-inch Fore`); selecting a mount opens its editor.
- [ ] The selected-mount editor exposes: gun model/calibre, barrel count, turret quality,
      ammunition per gun, mount position, elevation, fire-control connection, armor, rotation
      and firing arc, weight/cost, and placement conflicts.
- [ ] Mount actions are available near the selected mount: duplicate symmetrically, move,
      replace, remove, mirror to opposite side.
- [ ] An optional "link port and starboard mounts" toggle: with linked mounts, changing calibre
      or armor updates both; unlinking permits asymmetric edits.
- [ ] Selecting a mount highlights it on the ship (per ticket 04).
- [ ] Every control edits the draft and every readout is a compiled value.

## Answer

The Armament tabs (Main / Secondary / Torpedoes) now open a master-detail editor instead of a flat
battery list:

- **View model** `armament.ts` (pure): `armamentEntries(role, batteries, draft, view, content)`
  enriches each battery's mounts into `ArmamentMount` (name, side, position, zone, station, barrels,
  rounds, calibre, display name, installation type, fire-control class, compiled weight/cost, firing
  arc) and the one-line `layoutOf` label (`A Twin 13-inch Fore`, tubes as `P1 3-tube Port wing`).
  `conflictsFor` maps the design's `BoardFinding`s onto a mount; `mirrorOf` pairs a wing mount with
  its opposite-side counterpart.
- **Editor** `components/ArmamentEditor.tsx`: the mount list grouped by battery (each mount a
  `Select mount …` control that pins it on the ship per ticket 04), and the selected mount's editor
  with barrel count, ammunition per gun, zone, station and side (all draft edits via
  `set_param`/`move_placement`/`set_side`) and compiled readouts (installation type, fire-control
  class, firing arc, calibre, weight, cost) plus its placement conflicts. Mount actions: Duplicate,
  Duplicate to opposite side, Mirror to port/starboard, Replace (same category, gated by design
  month), Remove. A **Link port and starboard mounts** toggle batches barrel-count, ammunition and
  station edits across the wing pair (unlinked permits asymmetric edits). Linking is presentation
  state; edits it produces are ordinary draft edits.
- The section keeps the fittings table below the editor, so adding a mount and editing its raw
  parameters stay reachable (no functional regression).

**Deferred (model does not carry the field).** The source list's *turret quality*, *elevation*,
per-mount *armour*, *rotation/traverse* and *fire-control connection* are not authored in content
(`ARMAMENT_ADAPTER_UNMAPPED_FIELDS` names them on the armament side); the editor shows installation
type and fire-control class as compiled readouts and does not invent editable controls for them.

**Tests** `armament.test.ts` (words/positions/layout, enrichment, mirror pairing, conflict mapping)
and `ShipbuildingWorkspace.test.tsx` ("Armament master-detail editor": opens the editor with its
fields and readouts, commits a station edit with undo, duplicates a mount and restores displacement).
**Commands:** desktop shipbuilding + armament suites → 36 passed; `pnpm typecheck` → clean;
`vp lint`/`vp fmt --check` on the changed files → clean.

### Deviation: grouping by tab, not one list

The domain models exactly three battery roles (main, secondary, torpedo) — there is no "tertiary" role, and
unmounted AA/mine/missile fittings are not batteries. Rather than invent a fourth role, the Armament section keeps its
per-role local tabs (Main battery / Secondary / Torpedoes) and each tab's editor lists that role's batteries, which
is the same grouping expressed through the existing navigation spine. The "Other" tab (AA, mines, `MOUNT`) keeps the
fittings table, since those installations are not batteries and carry no mount-name/arc identity to master-detail.

The link toggle is likewise modelled on what the domain can express: barrel count, ammunition and station are
per-placement values, so linking batches those. Calibre is component identity (not a placement parameter) and
per-mount armour is not authored, so neither is a linked edit here (see the deferral note above).
