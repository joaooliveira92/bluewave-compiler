# Part catalog schema, location, and nation-style selection

**Type:** grilling
**Status:** resolved
**Blocked by:** 02, 03

## Question

Specify the authored **visual-part catalog**: its entry shape, where it lives, and how a
nation's style is chosen.

- **Entry shape:** id; the selection key (`nationStyle × visualEra × sizeBand × mountType ×
  gunCount`, per the settled mount→part key); symbol reference; layer/ordering; anchor/scale
  metadata; provenance block (`sourceStatus`/`confidence`/`kind`/`sources`) matching the repo
  `naval-profile` discipline. Confirm which fields are required vs derived.
- **Location:** a shared, era/year-keyed catalog vs `content/production/<scenario>/…`.
  Proposal: parts are era-based, not scenario-based, so a shared catalog with year windows;
  confirm.
- **Schema home:** a new schema in `packages/content-schema` validated at compile time;
  confirm it is not part of any compiled runtime output.
- **Nation style:** default to the **designing nation's** style; allow a player override
  (the manual lets any nation's mounts be used); the manual's 10 identifiers map to the 10
  named `NationId`s, the other 14 fall back to a universal style. Define the **fallback
  chain** exactly (universal → default era → any) and its determinism.

## Answer

Resolved autonomously.

- **Location:** `content/ship-visual/parts.yaml`: one shared, era-keyed catalog **outside any
  pack** (no `pack.json` declares it, so the content compiler never reads it and it never
  enters an artifact, snapshot or golden hash).
- **Schema home:** `ShipVisualCatalogSchema` in `@bluewave/content-schema`
  (`ship-visual.ts`), reusing `ProvenanceSchema`; strict excess keys.
- **Runtime form:** the renderer may not parse YAML or bundle Effect (ADR-0105/0125). A
  generator (`pnpm --filter @bluewave/ship-visual catalog:generate`) decodes the YAML through
  the schema and writes `packages/ship-visual/src/catalog.generated.ts`; a sync test decodes the
  YAML again and fails if the committed module differs.
- **Entry shape:** each catalog section holds entries with `id` (unique), a `key`, drawings,
  and `provenance` (required).
  - `mounts[]`: `key: { style, era, sizes, mountClass, guns? }`, where `sizes` lists the bands one
    drawing serves (amended in INC-2) and omitting `guns` makes a count-agnostic entry. Drawings are `profile: { shapes[], barrel }` and `plan: { body,
    diameterM, barrel }`.
  - `masts[]`: `key: { style, era }` with `profile: { heightM, shapes[] }`.
  - Shapes are `{ tone, d }` with SVG path data in **metres at the 12-inch reference**, origin
    at the seat centre, y down, bow to the left. The plan body is a closed enumeration
    (`ROUND`, `RING`, `SHIELD`, `PEDESTAL`, `CASEMATE`), drawn procedurally.
  - Derived, never authored: size band, gun-count clamp, scale and placement.
- **Size band** is computed from calibre rounded to whole inches,
  `floor((µm + 12 700) / 25 400)`: `SMALL` ≤ 5, `MEDIUM` 6–11, `LARGE` ≥ 12 (manual p141; the
  rounding closes the manual's 5"/6" gap). The manual's legacy `H` code is not adopted.
- **Nation style:** the designing nation's (`draft.nationId`): the 10 manual styles map to `uk`
  B, `germany` G, `usa` U, `japan` J, `france` F, `italy` I, `russia` R, `austria_hungary` A,
  `spain` S, `qing` Q; the other 14 nations use `X`. A **player override is deferred**: it
  needs a per-class persistence decision, and the manual stores the choice per design.
- **Fallback chain** (first hit wins; deterministic; each step logged in the resolution):
  1. `(style, era, size, class, guns)`
  2. `(X, era, size, class, guns)`
  3. `(style, DREADNOUGHT, size, class, guns)`
  4. `(X, DREADNOUGHT, size, class, guns)`

  At each step an exact-`guns` entry beats a count-agnostic one. A catalog test enforces that
  `X × DREADNOUGHT` covers every `size × class`, so the chain always terminates with a
  drawing. Masts use steps 1–4 without size, class or guns.
