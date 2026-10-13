# Era- and nation-aware ship visualization: map

## Destination

A decision-ready spec — handed to spec-creator → `to-tickets` → implement — for an
**era- and nation-aware ship visualization inside the ship-design workspace** (side
profile + plan) that grows new visual parts as weapons, systems and technology evolve,
in the spirit of the manual's Appendix 3 element sets and Appendix 5 turret files.
Scope is the app's playable **EARLY** era band for implementation; the part taxonomy
spans all bands. Presentation only: no engine, compiler, or authoritative-state change.

## Notes

- **Domain:** ship visualization — part taxonomy, visual era/nation selection, symbol
  authoring and rendering, deterministic auto-placement, presentation boundary.
- **Reference:** `docs/manual.pdf`. The catalogue of grounded facts lives in
  `docs/research/ship-visualization-catalogue.md` (Appendix 1 types p131–134; Appendix 3
  side views p136–137; Appendix 5 turret files p139–142; scenario starts p21). The manual
  is the intended-behaviour reference; the repo's canon and DESIGN-* rules are authoritative.
- **Settled scope (owner, charting session):** design workspace only (not battle/tactical
  view, ship list, or class cards); authored SVG symbol library keyed nation×era with a
  procedural hull; catalogue all 5 bands but implement EARLY first; the manual's 10 styled
  powers + universal fallback for the other 14 nations; full part taxonomy with mounts +
  hull/superstructure first; part metadata authored as content YAML with schema + provenance;
  dedicated 4-value `VisualEra` by year; mount→part key `nation × era × size × type × guns`
  with layered fallback; deterministic auto-placement; repo canon authoritative over the
  manual's scenario set; on-screen SVG only (bitmap picture export out of scope); the part
  catalog and resolver live in a new **pure** package consumed by the renderer.
- **Standing preferences:** data over code (content YAML + schema validation + provenance);
  determinism (integer/fixed-point, no `Math.random`/wall clock); presentation derives from
  the compiled design, never feeds back; no fabricated content — sourced or `PLACEHOLDER`.
- **Skills per session:** `grilling` + `domain-modeling`; `research` for research tickets;
  `prototype` for the symbol-set ticket; `to-spec` at hand-off.
- **Tracker:** local markdown (`docs/agents/issue-tracker.md`), under `.scratch/ship-visualization/`.

## Decisions so far

<!-- one line per resolved ticket: name, gist, link -->

- [Manual ship-visualization reference](issues/01-manual-ship-visualization-reference.md):
  the manual's ship-type bounds, tech-scaled maxima, scenario starts, element-set placement
  and turret-file key (nation×era×size×type×guns) catalogued and page-cited in
  `docs/research/ship-visualization-catalogue.md`; manual scenario set and visual eras
  diverge from repo canon.
- [Visual part taxonomy](issues/02-visual-part-taxonomy.md): gun mounts (mixed) + masts
  (convention) are the EARLY build; mount class derives from the authoritative `ArmamentMountType`;
  sponson/torpedo/aviation/electronics/decks/accessories deferred, damage state reserved.
- [VisualEra model](issues/03-visual-era-model.md): V ≤1895, P 1896–1905, D 1906–1935, L ≥1936
  (`ship-visual-era/1`, display constants, ADR-0148); the design month governs.
- [Part catalog + nation style](issues/04-part-catalog-schema-and-nation-style.md):
  `content/ship-visual/parts.yaml` outside every pack, schema in content-schema, generated TS module
  + sync test; size band from rounded inches; designing nation's style, override deferred; 4-step
  fallback ending at the enforced-complete `X × DREADNOUGHT`.
- [Symbol format + rendering](issues/05-symbol-format-and-rendering-contract.md): path data in metres
  at the 12-inch reference, placed by SVG transform; tones → theme tokens; masts → hull → houses →
  mounts → waterline; pure `@bluewave/ship-visual`, renderer-only dependency.
- [Prototype](issues/06-prototype-nation-era-mount-symbols.md): folded into the first slice behind
  `pnpm snap`; reactions fed back (guns optional in key, single-gun rows, mast clamp).
- [Placement, boundary, verification](issues/07-placement-boundary-and-verification.md):
  deterministic placement rules; a boundary test; golden matrix of every catalog entry.

Spec: [spec.md](spec.md) · ADR: [ADR-0148](../../docs/adr/ADR-0148-ship-visual-part-catalog.md)

## Not yet specified

<!-- in-scope fog not yet sharp enough to ticket -->

- Refit/conversion/rebuild visual deltas (a ship that changes appearance when its mounts or
  fitted systems change after construction).
- Damage/destruction visual state (the manual recolours turrets for damage) and battle-wear.
- Aviation, radar/electronics, torpedo-tube and mine-sweep symbol detail (taxonomy covers
  them; the EARLY-first build may not).
- Distinct styling for the 14 non-manual nations (currently universal fallback).
- Player override of the turret nation style (needs a per-class persistence decision).
- Sponsons (no design-model setting yet) and deck/accessory parts.
- Whether/when the tactical or battle view reuses the same part library.
- Animated or 3D rendering.

## Out of scope

<!-- ruled beyond the destination; closed, never graduates -->

- Bitmap ship-picture generation/export (the manual's 640×160 `Classname+NationNumber.bmp`)
  and custom element-set authoring by players — on-screen SVG only.
- A manual place-and-nudge editor; placement is deterministic auto-placement.
- Rendering in the tactical/battle view, ship list, or class cards.
- 3D or animated models.
