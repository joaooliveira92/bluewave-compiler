# Symbol format, rendering contract, and package boundary

**Type:** grilling
**Status:** resolved
**Blocked by:** 04

## Question

Pin the symbol authoring format and the rendering contract, and the boundary between the
pure package and the renderer.

- **Symbol format:** SVG symbol/spritesheet conventions (viewBox, units, stroke/fill tokens
  so parts theme with the existing CSS classes); how a "12-inch reference" scale rule maps
  the manual's auto-resize to our calibre-driven scaling.
- **Layering:** reproduce the manual's ordering (masts/decks/superstructure behind hull +
  turrets; accessories in front) and the two superstructure layers, mapped onto the existing
  `profile-layers` / `plan-layers` z-order.
- **Colour / damage:** how parts are tinted (theme tokens) and reserve a path for the manual's
  damage/destruction recolour without building it now.
- **Package boundary:** confirm the new **pure** `@bluewave/ship-visual` (or equivalent) owns
  the catalog schema/types, the key resolver, and pure geometry, stays runtime-free and free
  of Effect runtime, and that the desktop renderer consumes it — consistent with the
  packages DAG and the runtime-free gate (ADR-0100 §2, ADR-0128).
- **Relationship to existing code:** extend the existing `hull-plan/` modules in place vs a
  parallel `ship-visual` renderer module; note any refactor.

## Answer

Resolved autonomously.

- **Symbol format:** path data in metres at the 12-inch reference (manual p142: "draw the gun
  to match the size of a 12-inch gun"). The renderer places a symbol with an SVG `transform`
  (translate, uniform scale, mirror) and `vector-effect: non-scaling-stroke`, so authored path
  strings are never re-parsed.
- **Scale:** `px/m × calibreFactor`. In profile `px/m` is the frame's `vScale`; in plan it is
  `min(px/m along, px/m across)`. `calibreFactor = clamp(caliberUm / 304 800, 0.3, 1.5)`, the
  manual's auto-resize; masts are not calibre-scaled. A DISPLAY floor keeps a symbol at least
  4 px wide.
- **Tones → theme tokens:** `structure` → `fill-muted stroke-foreground`, `gun` →
  `fill-foreground`, `void` → `fill-background stroke-foreground`. Parts theme with the
  existing CSS classes. The manual's neutral-grey-plus-damage-recolour rule maps to a future
  `state` modifier on the tone. It is reserved in the type, not built.
- **Layering (back to front):** reference datums → masts → hull → superstructure + funnels →
  gun mounts → [accessories, reserved] → waterline datum. This reproduces the manual's
  "masts behind hull; turrets in front of superstructure; accessories in front of
  everything". The manual's turret layers 5 and 6 collapse into ordered `shapes[]` within one
  symbol.
- **Package boundary:** new pure `@bluewave/ship-visual` (no dependencies; dev-only
  `content-schema`/`yaml` for the generator and sync test). It owns the vocabulary, the
  generated catalog, the resolver and pure placement maths, and imports no `effect`. It is
  added to the runtime-free gate's roots. Only `apps/desktop` (renderer) depends on it.
- **Existing code:** extend `hull-plan/` in place with new layer components
  (`ProfileMastLayer`, `ProfileMountLayer`, `PlanMountLayer`) fed by one adapter
  (`visualMounts.ts`) that reads the compiled design. No parallel renderer module.
