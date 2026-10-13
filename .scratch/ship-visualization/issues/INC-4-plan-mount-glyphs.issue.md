# INC-4: plan-view mount glyphs and the mounts legend chip

**Type:** implementation
**Status:** open
**Blocked by:** INC-1
**Frontier:** yes

Spec: SV-R10, SV-R11.

## What to build

A top-down glyph per gun mount (body shape + one barrel per gun, facing by station) at the
`fittingPoint`, drawn under the fitting dots when the footprint overlay is on. A `mixed`
legend chip summarises style, era and fallbacks.

## Acceptance criteria

- [ ] Each gun placement draws one glyph per drawn mount, with barrels = gun count (clamped 1–4).
- [ ] Glyphs share station and side with the dots and do not intercept pointer events.
- [ ] The legend chip names the nation style and visual era, and counts fallbacks.
