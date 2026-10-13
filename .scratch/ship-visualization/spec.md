# Spec: era- and nation-aware ship visualization (EARLY first)

Source: [map.md](map.md) and decision tickets 01–07; [ADR-0148](../../docs/adr/ADR-0148-ship-visual-part-catalog.md);
research: `docs/research/ship-visualization-catalogue.md`.

## Problem

The design workspace's side profile draws hull, superstructure and funnels but no guns,
and the plan shows every fitting as the same dot. The player cannot see what the ship
looks like, nor how the look changes with the nation and the period. The manual's
turret files and side-view element sets show the intended behaviour.

## Solution

A pure `@bluewave/ship-visual` package resolves each placed gun mount (and each
conventional mast) to an authored symbol keyed nation style × visual era × size × mount
class × gun count, with a deterministic fallback. The renderer draws the resolved
symbols in the profile and the plan from the compiled design only.

## User stories

1. As a player designing an 1880s British battleship, I see turrets, barbettes, shielded
   and casemate guns drawn in the side profile where I placed them, sized by calibre.
2. As a player, I see a design drawn in 1898 in a pre-dreadnought style, and the same
   mounts drawn in 1890 in a Victorian style.
3. As a player of a nation with a manual style (e.g. France), my ship shows that nation's
   variant where one is authored, and the universal look otherwise.
4. As a player, I see a ship's masts, and I can tell from the legend which parts are data
   and which are drawing conventions.
5. As a player, the plan view shows each gun mount as a top-down glyph with its barrels.

## Requirements

- **SV-R1** `visualEraOf(month)` returns `VICTORIAN` ≤ 1895, `PRE_DREADNOUGHT` 1896–1905,
  `DREADNOUGHT` 1906–1935, `LATE_DREADNOUGHT` ≥ 1936, and `null` for a malformed month;
  `VISUAL_ERA_RULESET = "ship-visual-era/1"`.
- **SV-R2** `nationStyleOf(nationId)` maps the 10 manual nations to A/B/F/G/I/J/Q/R/S/U and
  every other id to `X`.
- **SV-R3** `sizeBandOf(caliberUm)` uses whole inches `floor((µm + 12700) / 25400)`:
  ≤ 5 `SMALL`, 6–11 `MEDIUM`, ≥ 12 `LARGE`.
- **SV-R4** `mountClassOf` maps `ArmamentMountType` → `TURRET`/`BARBETTE`/`SHIELDED`/`OPEN`/
  `CASEMATE` (tubes → none), defaulting to `TURRET` for `MAIN_GUN` and `SHIELDED` otherwise
  when no compiled armament exists.
- **SV-R5** The catalog is authored in `content/ship-visual/parts.yaml`, decoded by
  `ShipVisualCatalogSchema` (strict, provenance required), and generated into
  `catalog.generated.ts`; a test fails if the generated module and the YAML differ.
- **SV-R6** Resolution follows the four-step chain (ADR-0148 §4), with exact `guns`
  preferred at each step; the result records which step matched. `X × DREADNOUGHT` covers
  every size × class (test-enforced).
- **SV-R7** Placement is pure and deterministic, per ticket 07: station x; facing bow/stern
  by station; casemate seat below the deck edge; house-top seat inside `SUPERSTRUCTURE`;
  single-gun classes repeat per gun at 1.15 × width pitch; scale `px/m × clamp(cal/12in,
  0.3, 1.5)` with a 4 px floor.
- **SV-R8** The profile draws, back to front: reference → masts → hull → superstructure +
  funnels → mounts → waterline. Each mount symbol carries `data-testid="profile-mount"`,
  `data-instance`, `data-part` (the catalog entry id) and a `<title>` with class, calibre
  and gun count.
- **SV-R9** Masts are drawn per the convention in ticket 07 and are height-clamped to the
  drawing's top pad.
- **SV-R10** The plan draws a top-down glyph per gun mount at its `fittingPoint` (body
  shape + one barrel per gun), under the fitting dots, when the footprint overlay is on.
- **SV-R11** The legend gains a `mixed` chip for mounts (style, era, fallback count) and a
  `convention` chip for masts.
- **SV-R12** Boundary: only `apps/desktop` depends on `@bluewave/ship-visual`; no
  `packages/*` manifest, no `apps/desktop/src/main` source and no `pack.json` references
  it or the catalog; the package is in the runtime-free gate.
- **SV-R13** A golden matrix places every catalog entry at fixed dimensions against a
  committed snapshot, and every EARLY key (style × {V, P} × size × class) resolves.

## Acceptance criteria

- **AC-1** (R1–R4) Unit tests pin every boundary value and mapping.
- **AC-2** (R5, R6) Sync test and coverage test pass; the resolver unit tests cover each
  fallback step and the exact-guns preference.
- **AC-3** (R7, R8) The shipbuilding workspace's profile shows the reference design's
  mounts in place; `pnpm snap` captures it, with a clean console.
- **AC-4** (R1, R6) Changing the design month from 1890 to 1898 changes the `data-part` of
  at least one mount (V → P), with nothing else in the compiled design changing.
- **AC-5** (R9–R11) Masts, plan glyphs and legend chips render, each with tests.
- **AC-6** (R12, R13) The boundary test and the golden matrix pass; the runtime-free gate
  lists the package.
- **AC-7** `pnpm check` is green except for the known pre-existing red tests (memory:
  preexisting-test-failures-2026-10).

## Out of scope

Bitmap export, manual placement editor, battle/tactical/ship-list rendering, 3D/animation,
nation-style override, sponsons, torpedo/aviation/electronics/mine parts, decks and
accessories, damage colouring (reserved only).

## Implementation tickets

[INC-1](issues/INC-1-ship-visual-package-and-profile-mounts.issue.md) →
[INC-2](issues/INC-2-early-era-and-national-symbols.issue.md) →
[INC-3](issues/INC-3-profile-masts.issue.md) →
[INC-4](issues/INC-4-plan-mount-glyphs.issue.md)
