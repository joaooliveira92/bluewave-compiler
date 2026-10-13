# Deterministic auto-placement, presentation boundary, and verification bar

**Type:** grilling
**Status:** resolved
**Blocked by:** 02, 05

## Question

Settle how parts are placed, prove the visualization cannot leak into authoritative state,
and define how it is verified.

- **Auto-placement rules:** how each data-bound part's position/orientation is derived
  deterministically from the compiled design (mount station/side, funnel stations, hull-form
  zones); tie-breaks and ordering; profile-vs-plan consistency; reuse of the existing
  `autoPlace` / `fittingPoint` machinery. No manual placement editor.
- **Presentation boundary:** the visualization and its catalog must not appear in compiled
  content packs, campaign snapshots, or determinism golden `hashes.json`; confirm the
  compiler/runtime never consumes `ship-visual`. State the guard/test that enforces it.
- **Verification bar:** the repo standard — `pnpm check` (clean uncached build, typecheck,
  lint, format, full tests, determinism), the `@effect/tsgo` Oxlint gate for any Effect code,
  `pnpm snap` screenshot + `aria.yaml` for the affected screens, and `pnpm test:e2e`. Decide
  what a **golden matrix** of nation×era parts looks like (a snapshot per catalog key at
  fixed dimensions) so part coverage can't silently rot.

## Answer

Resolved autonomously.

- **Auto-placement (pure, deterministic):**
  - **Mounts:** x from the placement station. Each mount faces the bow when its station is
    < 500‰ and the stern otherwise.
  - **Seat:** a casemate hangs in the hull side from the deck edge (amended after the INC-1 snap). Any other mount seats
    on the lower house top inside the `SUPERSTRUCTURE` zone, otherwise on the deck, exactly as
    funnels do.
  - **Single-gun rows:** single-gun classes draw *n* symbols in a row centred on the station,
    at pitch 1.15 × the symbol width.
  - **Order:** draw order is side (port, centre, starboard), then station, then instanceId;
    port mounts draw first and muted, as the far side.
  - **Plan:** glyphs sit at the existing `fittingPoint`, so the plan and the profile agree on
    station and side.
  - **Masts:** the foremast sits at the bridge's forward end and the mainmast at the zone's
    aft end. There are none without a superstructure zone.
- **Presentation boundary:** `@bluewave/ship-visual` is a dependency of `apps/desktop` only.
  A boundary test in the package fails if any `packages/*` manifest or
  `apps/desktop/src/main` source references it, or if any `pack.json` references
  `content/ship-visual`. The catalog lives outside every pack, so artifacts, snapshots and
  `hashes.json` cannot contain it.
- **Verification bar:** `pnpm check` (clean build, typecheck, lint, format, full tests,
  determinism, golden), the runtime-free gate covering the new package, and `pnpm snap` of
  the shipbuilding workspace (screenshot + `aria.yaml`).
- **Golden matrix:** a test resolves and places **every catalog entry** at fixed dimensions
  and compares the result against a committed file snapshot (`test/__golden__/matrix.json`).
  It also asserts every EARLY `(style, era ∈ {V, P}, size, class)` key resolves, so part
  coverage cannot silently rot.
