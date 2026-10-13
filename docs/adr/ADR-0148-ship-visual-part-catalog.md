# ADR-0148: Era- and nation-aware ship visual parts from an authored catalog

## Status

Accepted (2026-10-13).

## Context

The design workspace draws a schematic hull, superstructure and funnels, but gun mounts
are undifferentiated dots and nothing reflects the designing nation or the period. The
manual's turret files key a mount's drawing by nationality × era × size × type × gun
count, with a universal fallback and a dreadnought-era default (manual pp. 139–142,
`docs/research/ship-visualization-catalogue.md`). The charting session settled the
direction: presentation only, authored data, deterministic auto-placement, EARLY first
(`.scratch/ship-visualization/map.md`).

Three constraints shape the mechanism. The renderer may not parse YAML or bundle Effect
(ADR-0105, ADR-0125). Presentation must never feed authoritative state (ADR-0003). And
content values carry machine-checked provenance (ADR-0147).

## Decision

1. **A pure `@bluewave/ship-visual` package** owns the visual vocabulary (`VisualEra`,
   `NationStyle`, `SizeBand`, `MountClass`), the generated part catalog, the key resolver
   and pure placement maths. It has no runtime dependencies, imports no `effect`, is
   covered by the runtime-free gate, and is a dependency of `apps/desktop` only.
2. **The catalog is content YAML outside every pack** (`content/ship-visual/parts.yaml`),
   decoded through `ShipVisualCatalogSchema` in `@bluewave/content-schema`, with
   `ProvenanceSchema` required per entry. A generator writes the committed runtime module
   `catalog.generated.ts`; a sync test re-decodes the YAML and fails on drift. No pack
   declares the file, so it can never reach a content artifact, a campaign snapshot or a
   golden hash; a boundary test enforces this and the dependency direction.
3. **`VisualEra` is a display ruleset**, `ship-visual-era/1`: `VICTORIAN` ≤ 1895,
   `PRE_DREADNOUGHT` 1896–1905, `DREADNOUGHT` 1906–1935, `LATE_DREADNOUGHT` ≥ 1936, taken
   from the design month. The manual's ranges overlap and give no tie-break, so these
   bounds are a deliberate, versioned choice rather than a sourced fact. Changing them
   restyles drawings and nothing else.
4. **Selection key and fallback.** A mount's key is the designing nation's style ×
   `VisualEra` × size band (calibre rounded to whole inches: ≤ 5 small, 6–11 medium,
   ≥ 12 large) × mount class (from the authoritative `ArmamentMountType`) × gun count
   (optional in the key). The fallback order is: exact; universal style; same style in the
   dreadnought era; universal in the dreadnought era. At each step an exact gun count wins
   over a count-agnostic entry. `X × DREADNOUGHT` must cover every size × class, and a test
   enforces it, so resolution always yields a drawing.
5. **Symbols are path data in metres at the 12-inch reference**, placed by an SVG
   transform and scaled by calibre ÷ 12 in (clamped), the manual's auto-resize. Tones map to
   theme tokens. Draw order is masts → hull → superstructure and funnels → mounts →
   waterline.

## Consequences

- New nations, eras or mount classes are YAML edits plus a regenerate, with no renderer
  change. The four EARLY-band nations without a manual style draw the universal set.
- A player override of the nation style, sponsons, torpedo/aviation/electronics parts,
  accessories and damage colouring are deferred; the tone type reserves the damage path.
- The generated module is a committed derivative. Editing the YAML without regenerating
  fails the package tests.
