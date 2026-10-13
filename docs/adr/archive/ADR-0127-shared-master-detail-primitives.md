# ADR-0127: Shared master/detail primitives — card deck and slide panel

## Status

Accepted 2026-10-11.

## Context

The Fleet Dispatch nation-selection surface proved a master/detail interaction
language: a draggable, keyboard- and wheel-navigable card deck on the left and a
detail pane on the right. Every piece of it lived inside
`screens/new-game/nation-selection/`. The **Rules of the Naval Age** step then
needed the same pattern for its four preset bundles, and copying the deck, or
its wheel/arrow handling, into a second screen would have made parity between
the two steps coincidental rather than structural.

## Decision

1. **Shared presentation modules under `renderer/components/`**, each with a
   barrel `index.ts` as its public surface, consumed by both surfaces:
   - `card-deck/` — `CardDeck` (the controlled deck lifted from `FleetStack`:
     `topIndex`, `onCardActivate`, `onChange`, focus/`role`-agnostic),
     `normalizeIndex`, the wheel stepper (32px threshold, 360ms cooldown,
     `deltaMode` ×16/×100), the shared card palettes, and `DeckMasterPane`
     (listbox, `aria-activedescendant`, arrow wrap, Enter, wheel, tap routing,
     focus-on-mount). `FleetDispatchBoard` and the preset deck are thin
     configurations of it.
   - `slide-panel/` — `SlidePanel` + `useSlideVisibility`, the shared
     appear/disappear chrome (`overlay` for the nation dossier, `inline` for the
     preset detail panel). Panel *bodies* stay surface-specific.
2. **Why `components/`, not `nation-selection/`.** The pieces are generic
   presentation, not nation- or campaign-aware.
3. **Focus and selection are different state.** Moving focus (arrows, wheel,
   drag-to-fling) only previews; Enter or a tap calls the existing
   `selectPreset`, and the active preset stays derived by `detectActivePreset`.
   The detail panel has no Select control: the step's primary action
   ("Next: Choose Archetype") applies a previewed-but-unapplied preset, unless a
   setting was edited by hand after previewing it (the edit wins). Preview state
   is screen-local React state and is never persisted.
4. **No globe on the preset step.** The first design put a decorative globe at
   the top of the detail column; the owner rejected it, so the globe shell and
   `InteractiveGlobe` stay in `nation-selection/`, unchanged. The step's title
   and brief are shown by the shell header's secondary row (replacing the
   generic "Campaign setup assistant" copy for this step only), not repeated on
   the screen.
5. **Layout.** `NewGameScreenLayout` gains a `fullBleed` variant for steps that
   own the whole content area; other steps keep the centred column.

## Consequences

- A third master/detail step is composition: supply cards, option ids and
  callbacks to `DeckMasterPane`, and a detail column.
- Fleet Dispatch behaviour and semantics are unchanged (its listbox, options
  and tests are the parity proof); only the deck's CSS class names moved from
  `fleet-stack-*` to `card-deck-*`. `FleetStack` and the slide-visibility hook
  moved with their history preserved.
- `BounceCards` stays for the Starting-fleet method picker; only this screen
  stops using it.
- No engine, compiler, content, save, hash, golden, RNG or IPC change; the work
  is renderer presentation only.

## Alternatives considered

- **Lift only `FleetStack` and `normalizeIndex`.** Rejected: leaves the wheel,
  listbox and arrow composition duplicated per screen — the copy-paste this ADR
  exists to prevent.
- **A decorative globe hero band (built, then removed).** Rejected by the owner.
  The shared globe shell it required was not extracted.
