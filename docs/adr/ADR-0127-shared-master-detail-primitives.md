# ADR-0127: Shared master/detail primitives — card deck, globe shell, slide panel — and an inert decorative globe

## Status

Accepted 2026-10-11.

## Context

The Fleet Dispatch nation-selection surface proved a master/detail interaction
language: a draggable, keyboard- and wheel-navigable card deck on the left, a
globe and dossier on the right. Every piece of it lived inside
`screens/new-game/nation-selection/`. The **Rules of the Naval Age** step then
needed the same pattern for its four preset bundles, and copying the deck, the
wheel/arrow handling or the globe into a second screen would have made parity
between the two steps coincidental rather than structural.

The nation globe is also a *selection* control (pins, a selection ring,
drag/zoom/click). Reusing its sphere as atmosphere on a step where no nation can
be chosen risks a player reading it as a second nation picker.

## Decision

1. **Shared presentation modules under `renderer/components/`**, each with a
   barrel `index.ts` as its public surface, consumed by both surfaces:
   - `card-deck/` — `CardDeck` (the controlled deck lifted from `FleetStack`:
     `topIndex`, `onCardActivate`, `onChange`, focus/`role`-agnostic),
     `normalizeIndex`, the wheel stepper (32px threshold, 360ms cooldown,
     `deltaMode` ×16/×100), and `DeckMasterPane` (listbox, `aria-activedescendant`,
     arrow wrap, Enter, wheel, tap routing, focus-on-mount).
     `FleetDispatchBoard` and the preset deck are thin configurations of it.
   - `globe/` — `GlobeShell` + `useSvgGlobe` (the D3 orthographic sphere and
     rAF loop) and `DecorativeGlobe`. `InteractiveGlobe` stays in
     `nation-selection/` and layers pins, ring, drag/zoom/click on the shell.
   - `slide-panel/` — `SlidePanel` + `useSlideVisibility`, the shared
     appear/disappear chrome (`overlay` for the dossier, `inline` for the preset
     detail panel). Panel *bodies* stay surface-specific.
2. **Why `components/`, not `nation-selection/` or `world-map/`.** The pieces
   are generic presentation, not nation- or campaign-aware; `components/world-map/`
   is a different, domain-coupled strategic map and must not become a dependency
   of new-game steps.
3. **Focus and selection are different state.** Moving focus (arrows, wheel,
   drag-to-fling) only previews; Enter or a tap calls the existing
   `selectPreset`, and the active preset stays derived by `detectActivePreset`.
   Deck/preview state is screen-local React state and is never persisted.
4. **The decorative globe is inert by construction.** `DecorativeGlobe` has no
   pins, selection ring, drag, zoom or click; is `aria-hidden` and
   `pointer-events-none`; takes no nation id or props; idles only when
   `prefers-reduced-motion` is not set; and reads only the static
   `world-110m.json` and theme CSS variables. `globe/globeBoundary.test.ts`
   allow-lists the module's imports so no campaign or authoritative module can
   reach it.
5. **Layout.** `NewGameScreenLayout` gains a `fullBleed` variant for steps that
   own the whole content area; other steps keep the centred column.

## Consequences

- A third master/detail step is composition: supply cards, option ids and
  callbacks to `DeckMasterPane`, and a detail column.
- Fleet Dispatch behaviour and DOM are unchanged; its tests are the parity
  proof. `FleetStack`, `GlobeShell`, `useSvgGlobe` and the slide-visibility hook
  moved (history preserved); the four existing `useSvgGlobe` `as unknown` casts
  moved with it and the ratchet baseline key was renamed, not extended.
- `BounceCards` stays for the Starting-fleet method picker; only this screen
  stops using it.
- No engine, compiler, content, save, hash, golden, RNG or IPC change; the
  work is renderer presentation only.

## Alternatives considered

- **Lift only `FleetStack` and `normalizeIndex`.** Rejected: leaves the wheel,
  listbox and arrow composition duplicated per screen — the copy-paste this ADR
  exists to prevent.
- **Reuse `InteractiveGlobe` with its interactions switched off.** Rejected:
  nation ids, pins and handlers would still be reachable; an inert composition
  that cannot take them is a stronger guarantee than a disabled one.
- **Place the shared modules in `world-map/`.** Rejected: domain-coupled map.
