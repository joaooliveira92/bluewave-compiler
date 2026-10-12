# Spec: Rules of the Naval Age — master/detail rework

Slug: `naval-age-master-detail`
Kind: live renderer rework of one new-game screen (`Rules of the Naval Age`) —
adopts the Fleet Dispatch master/detail interaction pattern. Presentation only;
no engine, compiler, or authoritative-state change.
**Triage:** sliced into `issues/01`..`issues/05` (`to-tickets`). **Status:** approved —
the owner delegated every decision recorded below. **Blocked by:** none. **Frontier:**
independent; all decisions are resolved in this spec.

> **Amendment 2026-10-11 (owner):** the decorative globe (NAM-3, AC-8, Decision 5,
> shared globe shell in Decision 3, tickets 02/04) is **dropped** from the Rules of
> the Naval Age screen, and the screen no longer shows its own title/description
> panel: "Rules of the Naval Age" / "Set the era, scale, and historical uncertainty
> for this campaign." replace the shell header's "Campaign setup assistant" /
> "Select the historical scenario to continue" for this step. Everything else stands.
> A second amendment the same day removes the detail panel's Select button: the
> primary action "Next: Choose Archetype" applies a previewed preset (Enter and
> tap still apply immediately; a hand edit after previewing wins). See ADR-0127.

## Problem Statement

The **Rules of the Naval Age** new-game screen is the step where a player sets
the campaign's era, scale, and historical uncertainty. Its current preset picker
is a flat `BounceCards` row with a name shelf, a comparison list, and a caption:
the four preset bundles all compete for attention at once, the focused bundle's
*actual six engine settings* are never shown, and there is no single, calm place
to inspect one bundle before committing it.

Meanwhile the **Fleet Dispatch** nation-selection surface already establishes a
calmer, more legible interaction language the player has just used seconds
earlier: a draggable, keyboard- and wheel-navigable **master** card deck on the
left, and a **detail** pane on the right with a globe and a dossier. That
pattern was built (`FleetStack` controlled deck, `FleetDispatchBoard` listbox
semantics, the globe shell) but lives entirely inside the nation-selection
folder and is not reused.

From the player's perspective: the preset step looks and behaves like a
different product from the step before it, it hides what each preset actually
changes, and it makes the four choices a wall of cards rather than a deck you
can inspect one at a time.

## Solution

Rework the **live** `Rules of the Naval Age` screen into a two-pane
master/detail surface, reusing — not copying — the primitives the Fleet Dispatch
surface already proved:

- **MASTER (left):** a draggable, keyboard- and wheel-navigable deck of the four
  preset bundles (`cadet`, `admiral`, `naval_historian`, `alternate_history`),
  with listbox semantics and interaction parity with `FleetDispatchBoard`.
- **DETAIL (right):** a vertical, scrollable column holding (a) a **decorative
  globe shell** as the hero band, (b) a focused-preset slide panel showing the
  bundle's name, tagline, and its six settings with an Active/Select state, and
  (c) the existing **Era & Scale** and **Historical Uncertainty** forms, fully
  functional, rendered below.

The existing `Back` action and `"Next: Choose Archetype"` primary action /
`onNext(preferences, options)` flow are preserved unchanged.

The shared controlled deck and globe shell are lifted out of
`nation-selection/` into shared renderer modules consumed by **both** surfaces.
Selecting a card continues to call the existing `selectPreset(presetId)` path in
`useNavalAgePreferences`, so the six engine settings still update
`DraftPreferences` and `detectActivePreset` still derives Active/"Custom". No
state is duplicated or forked.

### Requirements (traceable IDs)

Each acceptance criterion (below) serves one or more of these requirements. New
spec-local requirements are `NAM-1..NAM-10`; each also names the canonical
`BW-*` / `DESIGN-*` requirement it operationalises.

- **NAM-1 (master/detail layout).** At `lg`+ the screen is a two-pane
  master/detail split; at narrow widths the two panes stack in one scroll
  column. Serves **DESIGN-51** (UI/player interaction, responsive player loop)
  and **BW-ARC-002** (UI state is never authoritative).
- **NAM-2 (master preset deck + parity).** The master pane is the four
  `PRESET_DEFINITIONS` bundles as a listbox of controlled cards: arrow
  Left/Right/Down/Up wrap via `normalizeIndex`, wheel threshold 32px + cooldown
  360ms, Enter confirms, drag-to-fling changes focus, tapping any visible card
  selects. Serves **DESIGN-51**, **DESIGN-03** (campaign configuration is a
  closed, validated set — the four bundles are the picker's option set), and
  **BW-TST-002** (navigation consumes no authoritative randomness).
- **NAM-3 (decorative globe constraint).** The detail globe is a decorative
  shell only: non-interactive, idle spin acceptable, no pins, no click/drag/zoom,
  MUST NOT read authoritative game state and MUST NOT imply nation selection.
  Serves **BW-ARC-001** (presentation independent of authoritative logic),
  **BW-ARC-002**, **DESIGN-51**.
- **NAM-4 (focused-preset detail panel).** The detail pane shows the focused
  preset's name, tagline, and its six settings
  (`fleetSize`, `researchSpeed`, `technologyVariation`, `historicalBudget`,
  `tacticalRealism`, `difficulty`) with an Active/Select state; moving focus
  previews without committing. Serves **DESIGN-51**, **DESIGN-03**.
- **NAM-5 (right-pane forms preserved).** `EraScaleSection` (scenario/era,
  campaign seed, fleet size) and `HistoricalUncertaintySection` remain on the
  right side and functionally unchanged. Serves **DESIGN-03**, **DESIGN-51**.
- **NAM-6 (single state path).** Selecting a card calls the existing
  `selectPreset(presetId)`; the six settings flow through `DraftPreferences` and
  `detectActivePreset`; renderer state is presentation-only. No fork. Serves
  **BW-ARC-002**, **DESIGN-51** (`UI and automation layer MUST NOT mutate
  authoritative domain state directly`).
- **NAM-7 (shared primitives).** The controlled deck primitive and the globe
  shell are extracted into shared renderer modules and consumed by both Fleet
  Dispatch and this screen. No copy-paste. Serves **BW-ARC-001**.
- **NAM-8 (flow preservation).** `Back` and `"Next: Choose Archetype"` /
  `onNext(preferences, options)` are preserved. Serves **DESIGN-02** (campaign
  continuity/flow) and **DESIGN-51**.
- **NAM-9 (repo guardrails).** No new `as unknown` casts; one component per
  file; a directory's public surface is its barrel; presentational components
  take derived view-model props and never read authoritative state. Serves
  **BW-ARC-001**, **BW-ARC-002**, ADR-0106 (type-safety ratchet).
- **NAM-10 (ADR).** An ADR records where the shared deck/globe primitives live
  and why, and records the decorative-globe constraint. Serves the
  ENGINEERING-CONTRACT ADR threshold.

### Acceptance criteria (criterion → requirement IDs → proving test)

"Old behaviour fails" means the test is written so it would fail against the
current `BounceCards`/single-column code.

| AC | Criterion | Requirement IDs | Proving test |
| -- | --------- | --------------- | ------------ |
| AC-1 | At `lg`+ the screen is a two-pane master/detail split (master listbox and detail region are siblings); at narrow widths the panes stack into one scroll column. | NAM-1, DESIGN-51, BW-ARC-002 | Reworked screen render asserts both regions exist as siblings; `pnpm snap` captured at desktop (`lg`) and narrow width and compared against AC-1..AC-4 / AC-9. |
| AC-2 | The master pane renders exactly the four `PRESET_DEFINITIONS` bundles as listbox options named Cadet / Admiral / Naval Historian / Alternate History. | NAM-2, DESIGN-03 | Render test: one `role="listbox"` containing four `role="option"`s with those accessible names; fails against the current comparison-list markup. |
| AC-3 | Arrow navigation wraps using the shared `normalizeIndex`; Right/Down advance, Left/Up retreat, both wrapping at the ends. | NAM-2 | Unit test of the shared index helper (negative input, overflow, zero count) plus a primitive test asserting ArrowRight at the last option wraps to the first and ArrowLeft at the first wraps to the last. |
| AC-4 | Wheel navigation uses a 32px accumulation threshold and a 360ms cooldown, with `deltaMode` normalisation (line = ×16, page = ×100), and never consumes authoritative randomness. | NAM-2, BW-TST-002 | Wheel-helper unit test with fake timers: sub-threshold scroll does not move; crossing threshold moves once; a second wheel inside the cooldown is ignored; a wheel after the cooldown moves again; deltaMode scaling applied. |
| AC-5 | Enter confirms the focused preset by calling `selectPreset(focusedId)`. | NAM-2, NAM-6 | Render test: navigate to Admiral, press Enter, assert the six settings become Admiral's and the active preset reads Admiral. |
| AC-6 | Drag-to-fling changes focus (updates the detail pane) without committing a preset. | NAM-2, NAM-6 | Primitive unit test: a fling emits `onChange(index)`; a screen test wires `onChange` to focus only and asserts `selectPreset` was not called and the active preset is unchanged. |
| AC-7 | Tapping any visible card selects that preset via `selectPreset`. | NAM-2, NAM-6 | Render test: activate a non-top card and assert the active preset becomes that card's bundle. |
| AC-8 | The detail globe is decorative: non-interactive (no drag/zoom/click/pins), marked decorative to assistive tech, reads no authoritative state, and exposes no nation-selection semantics. | NAM-3, BW-ARC-001, BW-ARC-002, DESIGN-51 | Render test: globe region is `aria-hidden`/not a listbox or option, has no interactive handlers, and no nation ids/pins; a boundary test/import check confirms the decorative variant reads no campaign/authoritative module. |
| AC-9 | The focused-preset detail panel shows the preset's name, tagline, and all six settings with an Active/Select state (Active when the focused bundle equals the derived active preset). | NAM-4, DESIGN-03 | Render test: focus a preset → name + tagline + six labelled values present; "Active" when it matches, "Select" otherwise. |
| AC-10 | Moving focus previews the bundle in the detail panel and caption without committing any preference. | NAM-4, NAM-6 | Render test preserving the existing "previews a card on hover/focus without committing the preset" behaviour: focus a card, assert detail updates while `DraftPreferences`/active preset are unchanged; then click commits. |
| AC-11 | `EraScaleSection` renders in the right column and remains functional: the starting-era select, the campaign-seed input, and the fleet-size select update preferences and show their secondary readouts/icons. | NAM-5, DESIGN-03 | Reworked render tests reusing the existing era/scale assertions (era option description, fleet-size qualitative readout, option icons). |
| AC-12 | `HistoricalUncertaintySection` renders in the right column and remains functional: each uncertainty select updates its preference field and shows its label/blurb. | NAM-5, DESIGN-03 | Reworked render tests reusing the existing uncertainty assertions. |
| AC-13 | Picking a preset applies its exact six-setting bundle through `selectPreset`, and editing any one setting afterwards reverts the derived active preset to Custom — with no duplicated state. | NAM-6, BW-ARC-002 | Render test: click Cadet → `fleetSize=small`, `difficulty=easy`; change Difficulty → active reads Custom. Pure `applyPreset`/`detectActivePreset` tests unchanged and green. |
| AC-14 | `Back` is preserved and the `"Next: Choose Archetype"` primary action is preserved and calls `onNext(preferences, options)` once ready. | NAM-8, DESIGN-02 | Existing render test preserved: primary label/disabled behaviour and `onNext` payload (`fleetSize=small`, `difficulty=easy`). |
| AC-15 | The controlled deck primitive is extracted and consumed by both Fleet Dispatch and this screen; its controlled `topIndex` / `onCardActivate` contract and `normalizeIndex` parity are unit-tested; Fleet Dispatch's existing tests stay green. | NAM-7, BW-ARC-001, NAM-2 | Primitive unit tests for controlled `topIndex`, `onCardActivate`, `onChange`, and `normalizeIndex`; existing `FleetDispatchBoard.test.tsx` remains green against the refactored board. |
| AC-16 | No new `as unknown` casts; one component per file; the directory's public surface is its barrel; presentational panes take derived view-model props and never read authoritative state. | NAM-9, ADR-0106, BW-ARC-001, BW-ARC-002 | `pnpm preflight` (no-new-`as unknown`-casts ratchet) green; structural review of the new files against the barrel/one-component-per-file rule. |
| AC-17 | No authoritative state, hash, golden hash, save format, RNG, compile output, or engine-package change; UI navigation consumes no authoritative randomness. | BW-ARC-001, BW-ARC-002, BW-TST-002, BW-DET-003 | Golden verification unchanged; two-process determinism byte-identical; no engine/compiler package touched; renderer bundling unchanged. |
| AC-18 | An ADR records where the shared deck/globe primitives live and why, and records the decorative-globe constraint. | NAM-10, ADR threshold | New/amended ADR file present, ADR index row refreshed, `pnpm preflight` ADR gate green. |

## User Stories

1. As a campaign player, I want the preset step to look and behave like the
   nation-selection step I just used, so that the new-campaign flow feels like
   one product rather than two.
2. As a campaign player, I want the four preset bundles presented as a deck of
   cards I can inspect one at a time, so that choosing one is a calm decision
   instead of a wall of competing choices.
3. As a campaign player, I want to navigate the deck with the arrow keys, so
   that I can set up a campaign without reaching for the mouse.
4. As a campaign player, I want to navigate the deck with the scroll wheel, so
   that the wheel does what it looks like it should.
5. As a campaign player, I want to drag a card away and have the next one come
   forward, so that the deck feels physical and forgiving to explore.
6. As a campaign player, I want to tap any visible card to choose it, so that I
   do not have to bring it to the top first.
7. As a campaign player, I want pressing Enter to confirm the focused bundle, so
   that the keyboard path completes the choice.
8. As a campaign player, I want moving focus to *preview* a bundle without
   applying it, so that exploring the deck never silently changes my settings.
9. As a campaign player, I want the focused preset's name and tagline in the
   detail pane, so that I always know which bundle I am inspecting.
10. As a campaign player, I want the focused preset's six actual engine settings
    shown in the detail pane, so that I can see what each preset really changes
    before committing.
11. As a campaign player, I want an Active/Select state on the focused bundle,
    so that I can tell whether it is the one currently applied.
12. As a campaign player, I want a decorative globe as the detail hero, so that
    the screen carries the same naval-dossier atmosphere without offering a
    second, confusing nation picker.
13. As a campaign player, I want the globe to stay out of the way — not
    clickable, not draggable, not zoomable — so that it never competes with the
    forms or implies I am choosing a nation here.
14. As a campaign player, I want the Era & Scale settings (starting era,
    campaign seed, fleet size) still on this screen, so that my existing flow is
    uninterrupted.
15. As a campaign player, I want the Historical Uncertainty settings still on
    this screen, so that my existing flow is uninterrupted.
16. As a campaign player, I want the Back action preserved, so that I can
    return to nation selection.
17. As a campaign player, I want the `"Next: Choose Archetype"` action preserved
    and to carry my preferences forward, so that the flow continues exactly as
    before.
18. As a keyboard-only player, I want the master deck to expose proper listbox
    semantics (`aria-activedescendant`, named options), so that my assistive
    tech announces which bundles exist and which is focused.
19. As a keyboard-only player, I want the decorative globe hidden from
    assistive tech, so that it does not add noise or imply a control.
20. As a developer, I want the controlled deck primitive lifted into a shared
    renderer module, so that Fleet Dispatch and the preset deck share one
    implementation instead of two copies.
21. As a developer, I want the globe shell lifted into a shared renderer module,
    so that the interactive nation globe and the decorative preset globe share
    one sphere implementation.
22. As a developer, I want the deck's controlled `topIndex`/`onCardActivate`/
    `onChange` contract unit-tested, so that the two consumers cannot silently
    diverge.
23. As a developer, I want the index-wrapping and wheel-threshold logic shared
    and unit-tested, so that interaction parity between the two surfaces is
    proven rather than assumed.
24. As a developer, I want preset selection to keep flowing through
    `selectPreset`/`DraftPreferences`/`detectActivePreset`, so that there is one
    source of truth for the six engine settings.
25. As a developer, I want renderer state to stay presentation-only, so that no
    UI change can affect authoritative simulation state.
26. As a developer, I want no new `as unknown` casts, so that the type-safety
    ratchet is not weakened.
27. As a developer, I want one component per file and the directory's public
    surface behind a barrel, so that the new screen follows the renderer
    component rules.
28. As a maintainer, I want no engine, compiler, content, save, hash, or golden
    change, so that a presentation rework cannot affect determinism or
    compatibility.
29. As a maintainer, I want an ADR for the shared-primitive placement and the
    decorative-globe constraint, so that future surfaces know where these
    primitives live and why the globe is inert.
30. As a reviewer, I want a `pnpm snap` capture of the changed screen at desktop
    and narrow widths, so that I can confirm the visible layout and constraints
    against the acceptance criteria.
31. As a future implementer of the next screen in this series, I want the
    master/detail primitives already shared and documented, so that adopting the
    pattern again is composition, not a rewrite.

## Implementation Decisions

### Decision 1 — Layout: two-pane master/detail (the layout decision)

At `lg`+, the screen is a **two-pane master/detail split**:

- **LEFT (master):** the **preset deck** — the four `PRESET_DEFINITIONS`
  bundles as controlled cards, with listbox semantics and interaction parity
  with `FleetDispatchBoard` (arrow Left/Right wrap via `normalizeIndex`, wheel
  threshold + cooldown, Enter confirms, drag-to-fling changes focus, tapping any
  visible card selects). Master width follows the Fleet Dispatch precedent
  (`lg:w-[min(39vw,36rem)]`, border-r, non-scrolling overflow-hidden deck
  viewport).
- **RIGHT (detail):** a **vertical, scrollable column** containing, top to
  bottom:
  1. a **decorative globe shell** as a hero band;
  2. the **focused-preset slide panel** (Dossier pattern) — preset name,
     tagline, and the six settings with an Active/Select state;
  3. the existing **`EraScaleSection`** and **`HistoricalUncertaintySection`**,
     fully functional, rendered below.

On narrow widths the two panes **stack** into a single scroll column (master
first, detail below), matching how the Fleet Dispatch surface collapses.

The current `NewGameScreenLayout` centres content in a `max-w-4xl` column, which
cannot host a full-width two-pane split. The screen adopts a **full-bleed
master/detail shell** — a `fullBleed` variant on the shared new-game layout (no
max-width, no centred column) that still hosts the existing `ScreenHeader` — so
the split can use the full content area. Other new-game steps keep the centred
layout unchanged.

### Decision 2 — Focus vs. selection semantics (what each gesture commits)

Two distinct pieces of presentation state, only one of which touches
preferences:

- **focus (`focusedIndex`)** — which card is on top and which bundle the detail
  pane previews. Changed by arrow keys, the wheel, and a drag-to-fling
  (`onChange`). **Commits nothing.**
- **selection (`activePreset`)** — which bundle's six settings are applied.
  Derived by `detectActivePreset(preferences)`, never stored separately.
  Changed **only** by `selectPreset(presetId)`.

Commit gestures:
- **Enter** confirms the focused bundle → `selectPreset(focusedId)`.
- **Tapping any visible card** selects it → `selectPreset(tappedId)` (and moves
  focus to it).
- Moving focus (arrows / wheel / drag) only previews.

This preserves the existing preset picker's contract — "preview on hover/focus,
commit on click" — while giving it the Fleet Dispatch interaction language. It
also matches the upstream deck's two distinct callbacks (`onChange` for the
stack moving itself, `onCardActivate` for a tap), which today's Fleet Dispatch
happens to wire to the same handler but the primitive already separates.

### Decision 3 — Shared-component placement (extract, do not copy)

The mission's locked decision is to lift the controlled deck primitive and the
globe shell into **shared renderer modules consumed by both surfaces**:

- **Shared controlled deck primitive (lifted from `FleetStack`).** A
  presentation-only card deck that keeps the upstream physics (fan / cascade /
  deck / pile placement, drag-to-fling, depth shading) and the two nation-selector
  additions: controlled `topIndex` and `onCardActivate`. It stays
  focus/`role`-agnostic (the parent owns listbox semantics). The nation-selection
  `FleetStack` consumer is replaced by an import of this shared primitive.
- **Shared master selector (the parity seam).** The listbox container,
  `aria-activedescendant`, the 32px/360ms wheel handling, `normalizeIndex`
  wrapping, arrow/Enter handling, and pointer activation are extracted into a
  shared master-pane primitive parameterised by heading text, `aria-label`/
  instructions, the card renderer, and the focus/commit callbacks.
  `FleetDispatchBoard` becomes a thin configuration of it (its existing DOM —
  `role="listbox"` name "Playable nations", named options, tap-selects-index,
  keyboard forwarding — must remain intact and its tests green), and the Naval
  Age master pane is another configuration.
- **Shared globe shell (lifted from `GlobeShell` + `useSvgGlobe`).** The D3
  orthographic sphere skeleton and its rAF/autorotate projection loop are
  generic; move them into a shared renderer module. `InteractiveGlobe` (nation
  selection) keeps composing it with pins, the selection ring, d3-drag/d3-zoom
  and click; the Naval Age screen composes the **same shell with none of those**.
  Placement is in the renderer's shared presentation area (not the strategic
  `world-map/` module, which is a different, domain-coupled map). No new
  dependency: `d3-*`, `topojson-client`, and `world-110m.json` are already in the
  renderer bundle.
- **Shared slide-panel primitive.** The dossier's slide-visibility/animation
  primitive (`useSlideVisibility`) and panel chrome are lifted so the nation
  dossier and the preset detail panel use the same appear/disappear motion; the
  preset panel's *body* is preset-specific presentation (name, tagline, six
  settings) and must not fork nation-dossier content. Unlike the nation dossier
  (a bottom overlay that opens/closes), the preset detail panel is always shown
  for the focused bundle and sits inline in the right scroll column; it does not
  overlay the globe.

Rejected alternative: **only lifting `FleetStack` and `normalizeIndex`, leaving
the wheel/listbox composition duplicated per screen.** Rejected because it is
exactly the copy-paste the mission forbids, and because interaction parity would
then be coincidental rather than structural.

### Decision 4 — State and authority (no fork)

- Selecting a card calls the existing `selectPreset(presetId)` from
  `useNavalAgePreferences`; the six settings still update `DraftPreferences`,
  and `detectActivePreset(preferences)` still derives Active vs. "Custom".
- `focusedIndex`, the preview, and the deck order are React presentation state;
  they are never authoritative and never persisted.
- The screen continues to receive only its existing props (`recommendedPreset`,
  `onCancel`, `onNext`, `onPrimaryActionChange`) and to drive the shell's primary
  action exactly as today.
- No campaign command, IPC channel, preload method, or engine package is added
  or changed.

### Decision 5 — Decorative globe constraint

The detail globe is a **decorative shell only**:

- non-interactive: no d3-drag, no d3-zoom, no click handler, no pins, no
  selection ring;
- it may idle-spin (the shared projection loop's existing autorotate), and must
  respect `prefers-reduced-motion`;
- it MUST NOT read authoritative game state (it reads only the static
  `world-110m.json` and theme CSS variables, exactly as the shared shell already
  does);
- it MUST NOT imply nation selection: it is marked decorative to assistive tech
  (`aria-hidden`), exposes no `listbox`/`option`/`button` semantics, and is not
  given any nation id or `focusedCountryId` prop.

The shared shell therefore needs a decorative mode (or the consumer wraps it in
an `aria-hidden` region and supplies no interactive behaviour); the interactive
nation globe is unchanged.

### Decision 6 — Detail panel content

The focused-preset panel shows the bundle's **name** and **tagline** plus its
six settings, using the existing presentation content modules for labels and
value copy (e.g. the existing fleet-size label/readout and uncertainty
field/value labels) — no new copy is invented, and no engine data is read. Each
setting shows the preset's value and an **Active/Select** state derived from
whether the focused bundle equals `activePreset`.

### Decision 7 — Preserve the forms and the flow

`EraScaleSection` (starting era, campaign seed, fleet size) and
`HistoricalUncertaintySection` keep their existing props, callbacks, icons, and
readouts; they are only relocated into the right scroll column. The `Back`
button (→ `onCancel`) and the `"Next: Choose Archetype"` primary action
(→ `onNext(preferences, options)` when `ready`) are preserved verbatim.

### Decision 8 — Renderer guardrails

- One component per file; each directory's public surface is its `index.ts`
  barrel; where routing a child through a barrel would close an import cycle,
  import the leaf directly.
- Presentational components take derived view-model props and never read
  authoritative state.
- No new `as unknown` casts (the `scripts/verify-no-unknown-casts.mjs` ratchet);
  existing baseline casts are not the pattern to copy.
- `BounceCards` stays in the repo (the Starting-fleet method picker and the a11y
  audit still use it); only this screen stops using it as its master deck.

## Testing Decisions

A good test here asserts **external, user-visible behaviour**: the DOM a render
produces from real props, the state a pure helper yields, and the deck
primitive's public callback contract. Tests must not assert internal call order
or private implementation details. New tests are written so the pre-rework code
would fail them.

Modules covered and prior art:

- **Shared controlled deck primitive** (lifted from `FleetStack`): controlled
  `topIndex` brings the matching card to the front; `onCardActivate` fires on a
  tap; `onChange` fires when the stack moves itself (fling). Prior art:
  `FleetDispatchBoard.test.tsx` pointer-activation cases; the deck's own
  physics are not asserted (they are motion, not contract).
- **Shared index/wheel helpers:** `normalizeIndex` parity (negative, overflow,
  zero count) and the wheel decoder (32px threshold, 360ms cooldown, deltaMode
  ×16/×100) with fake timers. Prior art: the reference board's wheel effect and
  `fleetDispatchUtils`'s `normalizeIndex`.
- **Shared master selector:** listbox semantics (`role`, named options,
  `aria-activedescendant`), arrow wrap, Enter confirms, tap selects, focus on
  mount. Prior art: `FleetDispatchBoard.test.tsx` (must stay green through the
  refactor).
- **Shared globe shell:** the decorative composition renders the sphere and
  exposes no interactive semantics; the interactive nation composition is
  unchanged. Prior art: `DossierSlidePanel.test.tsx` for the panel chrome; no
  existing globe-shell unit test — add the minimal external-behaviour check.
- **Reworked `RulesOfTheNavalAgeScreen`:** master listbox with four presets; focus
  previews without committing; Enter/tap commits via `selectPreset`; detail panel
  shows name/tagline/six settings with Active/Select; era/scale and uncertainty
  forms still functional in the right column; Back and Next preserved. Prior
  art: the existing `RulesOfTheNavalAgeScreen.test.tsx` (reworked in place).
- **Preserved pure modules (unchanged and green):**
  `rules-of-the-naval-age-presets.test.ts` (`applyPreset`/`detectActivePreset`),
  `new-game-preferences-screen-state.test.ts`, `useNavalAgePreferences.test.ts`,
  `rules-of-the-naval-age-content.test.ts`.

Adversarial cases that specifically kill the old behaviour / prove parity:

- Arrow wrapping at both ends (not a clamped stop).
- Wheel sub-threshold accumulation does not move; the cooldown blocks a rapid
  second move; movement resumes after the cooldown.
- Focus change previews but leaves `DraftPreferences` and the derived active
  preset untouched; only Enter/tap commits.
- A tap on a **non-top** visible card selects it (proves the tap path, not just
  the top card).
- The decorative globe contains no `option`/interactive node and reads no
  nation id.
- Editing one setting after a preset reverts the active preset to Custom (the
  single-source-of-truth proof).

End-to-end and visual:

- `pnpm snap` (desktop build) captures the reworked screen at desktop (`lg`) and
  narrow width; check the master/detail split, the stacked narrow layout, the
  decorative globe (no interaction, console clean, no structural churn warning),
  and the detail panel against AC-1..AC-4 / AC-8..AC-12.
- The existing new-game e2e flow clicks `"Next: Choose Archetype"`, which is
  preserved; no e2e change is expected, but `pnpm test:e2e` must stay green. If
  the flow's selectors touch the preset markup, fix them in the shared flow
  helper (not by weakening the assertion).

## Out of Scope

- **No engine or compiler change.** No authoritative state, command, phase,
  ruleset, formula, content pack, save, hash, golden hash, RNG, IPC channel, or
  preload method changes.
- **No nation-selection behaviour on this screen.** The detail globe is
  decorative; no pins, no nation click, no nation id, no dossier nation fields.
- **Only this screen, in this concept (first of a series).** The master/detail
  primitives become shared so later screens can adopt the pattern, but no other
  screen is reworked here.
- Retiring `BounceCards` generally (it stays for the Starting-fleet method
  picker and the a11y audit).
- Any changes to the six canonical setting identifiers, their supported values,
  or the preset bundles' contents.
- Localization/i18n; the detail panel reuses existing canonical English copy.
- Escape-to-cancel on this screen (the explicit `Back` action remains; escape
  parity from the full-screen nation selector is not required here).

### Non-goals (explicit)

- Not a throwaway prototype — this is a real change to the live screen wired to
  existing new-game state and flow.
- Not a redesign of the new-game flow's ordering or the other steps.
- Not a second nation picker beneath the deck.

## Further Notes

- **ADR required.** Before/with implementation, record a new ADR
  (next number ADR-0127) covering: (a) **where the shared controlled deck,
  master selector, globe shell, and slide-panel primitives live and why** (shared
  renderer presentation modules consumed by Fleet Dispatch and this screen), and
  (b) the **decorative-globe constraint** (the shell may be inert, must not read
  authoritative state, and must not imply nation selection). Refresh the ADR
  index row; `pnpm preflight` gates ADR index / status consistency.
- **Grounding (verified).** The reference files (`NationSelectionScreen`,
  `FleetDispatchBoard`, `FleetStack`/`FleetStack.css`, `FleetNationCard`,
  `fleetDispatchUtils` with `normalizeIndex`/`CARD_PALETTES`, `GlobePanel`,
  `InteractiveGlobe`, `GlobeShell`, `useSvgGlobe`, `DossierSlidePanel/*`), the
  target files (`RulesOfTheNavalAgeScreen`, `PresetPickerSection`,
  `EraScaleSection`, `HistoricalUncertaintySection`, `useNavalAgePreferences`,
  `rules-of-the-naval-age-presets` with its four bundles,
  `new-game-preferences-screen-state`, `admiral-preset`,
  `preferenceArtworkManifest`), the flow wiring (`CampaignUnavailableView` →
  `useNewGameFlow.actions.acceptPreferences`), and the existing tests
  (`FleetDispatchBoard.test.tsx`, `RulesOfTheNavalAgeScreen.test.tsx`,
  `rules-of-the-naval-age-presets.test.ts`, `useNavalAgePreferences.test.ts`,
  `BounceCards.test.tsx`, `a11y.audit.test.tsx`) were all read before writing
  this spec. `GlobeShell`/`useSvgGlobe` are already partially lifted inside
  `nation-selection/`; this spec lifts them the rest of the way into a shared
  module.
- **Determinism.** The work is renderer presentation only. The shared deck and
  globe consume no randomness in an authoritative path; the projection loop is
  presentational. No authoritative hash, golden, or save change is expected; any
  golden movement is a stop condition, not something to accommodate.
- **Dependency.** `motion/react`, `d3-geo`, `d3-drag`, `d3-selection`, `d3-zoom`,
  `topojson-client`, and `world-110m.json` are already in the renderer bundle
  via the nation-selection surface; no new dependency is introduced.
- **Suggested plan order for `to-tickets` (dependency order):**
  1. Extract the shared controlled deck primitive + shared index/wheel helpers +
     the shared master selector; refactor `FleetDispatchBoard` onto it and keep
     its tests green (proves parity before the second consumer exists).
  2. Extract the shared globe shell (`GlobeShell` + `useSvgGlobe`) and the shared
     slide-panel primitive; update `InteractiveGlobe`/dossier imports; add the
     decorative mode.
  3. Rework `RulesOfTheNavalAgeScreen` into the two-pane layout (master deck +
     detail globe band + focused-preset panel + relocated forms), wired to the
     existing `useNavalAgePreferences`; preserve Back/Next.
  4. Rework the screen render tests and the a11y/snap coverage; add the ADR;
     run the full gate.
- **Known low-risk sharp edges.** jsdom cannot evaluate Tailwind responsive
  classes, so the `lg`+ split vs. narrow stack is proven structurally in tests
  plus `pnpm snap` at two widths, not by computed media queries. The deck's drag
  physics are motion behaviour and are not asserted in unit tests.

### Definition of done

- [ ] Shared controlled deck primitive + shared master selector + shared index/
      wheel helpers extracted; unit tests cover controlled `topIndex`,
      `onCardActivate`, `onChange`, and `normalizeIndex`/wheel parity;
      `FleetDispatchBoard` consumes it and its existing tests stay green.
- [ ] Shared globe shell (`GlobeShell` + `useSvgGlobe`) extracted; the
      interactive nation globe is unchanged; a decorative mode exists and is
      covered by an external-behaviour test.
- [ ] `RulesOfTheNavalAgeScreen` is a two-pane master/detail split at `lg`+ and
      stacks at narrow widths; master deck has listbox semantics and interaction
      parity; detail column holds the decorative globe band, the focused-preset
      panel, and the relocated Era & Scale + Historical Uncertainty forms.
- [ ] Selecting a card (Enter or tap) calls the existing `selectPreset(presetId)`
      and updates `DraftPreferences`; focus only previews; `detectActivePreset`
      still derives Active/"Custom"; no state fork.
- [ ] Decorative globe is non-interactive, marked decorative, reads no
      authoritative state, and implies no nation selection.
- [ ] Back and `"Next: Choose Archetype"` / `onNext(preferences, options)` are
      preserved.
- [ ] Every AC-1..AC-18 has a proving test (or the orchestrated `pnpm snap`
      capture) that fails against the pre-rework code.
- [ ] No new `as unknown` casts; one component per file and barrel surfaces
      respected.
- [ ] `pnpm preflight` green (including the no-new-`as unknown`-casts ratchet and
      ADR index); `pnpm test:scripts` green.
- [ ] `pnpm check` green end-to-end (format, lint, `lint:effect`, typecheck,
      build, tests, desktop E2E `pnpm test:e2e`).
- [ ] No authoritative state/hash/golden/save/engine change; two-process
      determinism byte-identical.
- [ ] ADR recorded (shared-primitive placement + decorative-globe constraint) with
      its index row.
- [ ] `pnpm snap` capture of the reworked screen at desktop and narrow widths
      (screenshot + `aria.yaml`, console clean, no structural churn warning),
      checked against the ACs by implementator and reviewer.
- [ ] Clean working tree; small Conventional Commits on `dev`; traceability
      pointer updated.

### Validation commands

Focused (run from the repo root; selectors target the changed desktop renderer
modules):

- `pnpm --filter @bluewave/desktop exec vp test run src/renderer/screens/new-game`
- `pnpm --filter @bluewave/desktop exec vp test run src/renderer/screens/new-game/nation-selection`

Full orchestrator gate (all green on the exact commit):

- `pnpm preflight`
- `pnpm test:scripts`
- `pnpm check` (includes typecheck, lint, `lint:effect`, tests, and `pnpm test:e2e`)
- two-process determinism (`pnpm --filter @bluewave/cross-process-test exec vp test`) byte-identical
- orchestrator golden-hash verification (unchanged expected)
- `pnpm snap` — capture the reworked screen at desktop and narrow widths; check
  against AC-1..AC-4 / AC-8..AC-12, console clean, no structural churn warning.
