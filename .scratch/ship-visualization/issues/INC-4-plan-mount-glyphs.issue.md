# INC-4: plan-view mount glyphs and the mounts legend chip

**Type:** implementation
**Status:** open
**Blocked by:** INC-1, ship-part-model P0 (interfaces/1 + visual-traits/1 sign-off)
**Frontier:** no

Spec: SV-R10, SV-R11.

## What to build

A top-down glyph per gun mount (body shape + one barrel per gun, facing by station) at the
`fittingPoint`, drawn under the fitting dots when the footprint overlay is on. A `mixed`
legend chip summarises style, era and fallbacks.

## Acceptance criteria

- [ ] Each gun placement draws one glyph per drawn mount, with barrels = gun count (clamped 1–4).
- [ ] Glyphs share station and side with the dots and do not intercept pointer events.
- [ ] The legend chip names the nation style and visual era, and counts fallbacks.

## Comments

- 2026-10-13: Paused by owner decision D7 (`.scratch/ship-part-model/proposal.md` §0, §8). Resume once the shared
  interface and visual-trait contract (§8.1–8.3) is signed off, and build against visual traits (`presentation`,
  `sizeClass`, `gunsPerMount`) instead of the mount-type key. The ship-visual YAML restructure is paused for the same
  reason.
