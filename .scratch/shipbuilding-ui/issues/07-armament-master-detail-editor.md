# 07: Armament master-detail editor

**Type:** implementation
**Status:** open
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
