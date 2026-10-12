# Spec: Choose your archetype — master/detail rework

Slug: `archetype-master-detail`
Kind: live renderer rework of one new-game screen (`Choose your archetype`) — the
**third consumer** of the shared master/detail pattern, after **Rules of the Naval
Age** and the already-wired **Starting-fleet method** step. Presentation only; no
engine, compiler, content, save, hash, golden, RNG or IPC change.
**Triage:** `ready-for-agent` — fully specified; to be sliced into vertical
implementation tickets by `to-tickets` (`.scratch/archetype-master-detail/issues/`).
**Status:** approved. **Blocked by:** none. **Frontier:** independent; every
decision is resolved in this spec.

## Problem Statement

The **Choose your archetype** new-game step is where a player weights a new
campaign across three engine-backed dimensions (economy, industry, combat) with a
fixed 20-point budget, either by picking a named preset or by building a custom
split.

Its current surface is a **flat grid of cards**: three preset cards and a
"Create Your Own" card all compete for attention at once; selecting one only
replaces a **below-screen** "Consequences" panel; and building a custom split
throws the player into a **full-screen modal dialog** whose live preview is
cramped beside three sliders. There is no single, calm place to inspect one
archetype — its tagline, its exact allocation, and what that allocation actually
does to the campaign — before committing it.

Meanwhile the two steps the player has just used — **Rules of the Naval Age**
(immediately before) and the **Starting-fleet method** step (immediately after) —
both use a calmer interaction language: a draggable, keyboard- and wheel-
navigable **master** card deck on the left, and a **detail** pane on the right
that previews the focused choice. That language is already proven and shared
(`DeckMasterPane`, `CardDeck`, `deckNavigation`, `SlidePanel`, per ADR-0127).

From the player's perspective: the archetype step looks and behaves like a
different product from the two steps bracketing it, it hides what each archetype
actually changes until after the choice, and the custom-build experience is a
jarring full-screen modal rather than the inline detail the rest of the flow uses.

## Solution

Rework the **live** `Choose your archetype` screen into the same two-pane
master/detail surface the other new-game steps use, **composing** — not copying —
the shared primitives:

- **MASTER (left):** a draggable, keyboard- and wheel-navigable deck of the
  **three named archetype presets plus the custom-build slot** as one listbox,
  with interaction parity with the Rules-of-the-Naval-Age and fleet-method decks.
- **DETAIL (right):** a vertical, scrollable column holding a status line
  ("Current archetype: …"), a focused-archetype slide panel showing the slot's
  name, tagline, allocation across the three dimensions, and its live consequence
  preview with an Active/Pending state — and, for the **custom slot**, the
  editable 20-point allocator **inline** in place of the current modal.

Selection keeps the pattern's two distinct states: moving focus **previews** and
commits nothing; **Enter**, a tap on any visible card, or the step's **primary
action** applies the focused archetype. The primary action reads "Select" while a
previewed archetype differs from the applied one (applying it on the first press),
and "Choose Nation" once it is applied (advancing on the next press). The existing
`Back` action and `onNext(ArchetypeSelection)` flow are preserved unchanged.

The rework **reuses the already-written-but-unwired** `ArchetypeDeckPane` and
`ArchetypeDetailPanel` components in
`screens/new-game/components/archetype/`, extending them (the inline allocator is
the new body) rather than building from scratch. The existing pure modules
(`new-game-archetype-screen-state.ts`, `archetype-consequence.ts`,
`archetype-dimensions.ts`) and the engine's `ARCHETYPE_PRESETS` / allocation
validators are the single source of truth; no state is duplicated or forked.

### Requirements (traceable IDs)

Each acceptance criterion (below) serves one or more of these requirements. New
spec-local requirements are `ARC-1..ARC-10`; each also names the canonical
`BW-*` / `DESIGN-*` requirement it operationalises.

- **ARC-1 (master/detail layout).** At `lg`+ the screen is a two-pane
  master/detail split (master deck and detail region are siblings); at narrow
  widths the two panes stack into one scroll column. Adopts
  `NewGameScreenLayout fullBleed`; the step's title/brief is shown by the shell
  header's secondary row (already wired) and is **not** repeated in-screen.
  Serves **DESIGN-51** (UI/player interaction, responsive player loop) and
  **BW-ARC-002** (UI state is never authoritative).
- **ARC-2 (master archetype deck + parity).** The master pane is the **three
  `ARCHETYPE_PRESETS` plus the custom-build slot** as a listbox of controlled
  cards (four options): arrow Left/Right/Down/Up wrap via `normalizeIndex`, wheel
  threshold 32px + cooldown 360ms with `deltaMode` normalisation, Enter confirms,
  drag-to-fling changes focus, tapping any visible card activates, focus-on-mount.
  Serves **DESIGN-51**, **DESIGN-03** (campaign configuration is a closed,
  validated set), **BW-TST-002** (navigation consumes no authoritative randomness).
- **ARC-3 (focus vs. selection).** Moving focus (arrows, wheel, drag-to-fling)
  only **previews** the focused slot in the detail pane and commits nothing;
  **Enter**, a tap on any visible card, or the primary action applies it.
  Serves **BW-ARC-002**, **DESIGN-51**.
- **ARC-4 (focused-archetype detail panel).** The detail pane shows the focused
  slot's name, tagline, its allocation across the three dimensions, and its live
  consequence preview, with an **Active** state when the focused slot is the
  applied selection and a **Pending** ("Applies on Next") state when it is
  previewed but not applied. Preset slots also show their `description`. The
  panel has **no control of its own** — applying is Enter, a tap, or the primary
  action. Serves **DESIGN-51**, **DESIGN-03**.
- **ARC-5 (inline custom allocator).** The custom slot's body **is** the editable
  allocator, rendered inline in the detail pane in place of the current
  `Dialog`: the three dimension controls (range + labelled increase/decrease
  steppers), the used-points budget with the validation diagnostics, the
  reset-to-balanced baseline action, and the live consequence preview. The
  allocator is valid only when the engine's
  `validateArchetypeAllocation` passes (each dimension within bounds, total
  exactly `ARCHETYPE_POINT_TOTAL`); committing applies an
  `ArchetypeSelection` of `kind: "custom"` with the built allocation. Serves
  **DESIGN-03**, **DESIGN-51**, **BW-ARC-002**.
- **ARC-6 (pending + primary action).** The step's primary action reads
  **"Select"** while a previewed slot differs from the applied selection, applies
  it on the first press, and then reads **"Choose Nation"** to advance on the next
  press. It is **disabled** until an applied selection exists — and, when the
  custom slot is applied or being committed, until the custom allocation is
  valid. Mirrors the Rules-of-the-Naval-Age and fleet-method semantics exactly.
  Serves **DESIGN-51**, **DESIGN-02**.
- **ARC-7 (flow preservation).** `Back` (→ `onBack`), the
  `onNext(ArchetypeSelection)` payload, and initial-state restoration from a
  persisted `ArchetypeSelection` (`initialArchetype`) are preserved: a returning
  player sees their applied archetype focused and Active. Serves **DESIGN-02**.
- **ARC-8 (single state path).** The screen keeps one `ArchetypeEditorState`;
  the applied selection flows through `editorToSelection`, and preview/focus is
  screen-local React state that is never persisted. No second copy of the
  allocation, no fork of the engine presets or validators. Serves **BW-ARC-002**,
  **DESIGN-51** (`UI and automation layer MUST NOT mutate authoritative domain
  state directly`).
- **ARC-9 (repo guardrails).** No new `as unknown` casts; one component per file;
  a directory's public surface is its barrel; presentational components take
  derived view-model props and never read authoritative state. Reuse the existing
  `ArchetypeDeckPane` / `ArchetypeDetailPanel`. Serves **BW-ARC-001**,
  **BW-ARC-002**, ADR-0106 (type-safety ratchet).
- **ARC-10 (no authoritative change).** No engine, compiler, content pack, save
  format, hash, golden hash, RNG, IPC channel, or preload method change. Serves
  **BW-ARC-001**, **BW-DET-003**.

### Acceptance criteria (criterion → requirement IDs → proving test)

"Old behaviour fails" means the test is written so it would fail against the
current grid-and-modal code.

| AC | Criterion | Requirement IDs | Proving test |
| -- | --------- | --------------- | ------------ |
| AC-1 | At `lg`+ the screen is a two-pane master/detail split (master listbox and detail region are siblings); at narrow widths the panes stack into one scroll column; the in-screen title is not repeated (the shell header owns it). | ARC-1, DESIGN-51, BW-ARC-002 | Reworked screen render asserts both regions exist as siblings and no duplicate step title; `pnpm snap` captured at desktop (`lg`) and narrow width and compared against AC-1..AC-5 / AC-10. |
| AC-2 | The master pane renders exactly four listbox options — the three `ARCHETYPE_PRESETS` (Merchant Prince / Shipyard Baron / Grand Admiral) plus "Create Your Own" — as one `role="listbox"`. | ARC-2, DESIGN-03 | Render test: one `role="listbox"` containing four named `role="option"`s; fails against the current grid markup. |
| AC-3 | Arrow navigation wraps using the shared `normalizeIndex`; Right/Down advance, Left/Up retreat, both wrapping at the ends. | ARC-2 | Primitive helper test (negative, overflow, zero count) plus a screen test asserting ArrowRight at the last option wraps to the first and ArrowLeft at the first wraps to the last. |
| AC-4 | Wheel navigation uses the shared 32px accumulation threshold and 360ms cooldown with `deltaMode` normalisation, and never consumes authoritative randomness. | ARC-2, BW-TST-002 | Covered by the shared `deckNavigation` tests; a screen test confirms the deck is wired to the shared stepper (one wheel step moves focus exactly once). |
| AC-5 | Enter confirms the focused slot: a preset applies via `selectPreset`; the custom slot reveals/focuses the inline allocator. | ARC-2, ARC-3, ARC-5 | Render test: navigate to Grand Admiral, press Enter, assert the applied selection is `grand_admiral`; navigate to the custom slot, press Enter, assert the allocator is present/editable. |
| AC-6 | Drag-to-fling (or any focus-only move) previews the focused slot in the detail pane **without** changing the applied selection. | ARC-3, ARC-8 | Screen test: move focus to a different card, assert the detail panel updates while the applied selection (and the primary-action payload) is unchanged; then apply to change it. |
| AC-7 | Tapping any visible card activates it, not just the top card. | ARC-2, ARC-3 | Render test: activate a non-top card and assert the applied selection becomes that card's archetype. |
| AC-8 | The focused-archetype detail panel shows the slot's name, tagline, the three-dimension allocation, and its consequence preview; presets also show their `description`; the panel offers no Select control. | ARC-4, DESIGN-03, DESIGN-51 | Render test: focus each slot → name/tagline/allocation present; the consequence panel renders; no in-panel Select button. |
| AC-9 | Active vs. Pending: the focused slot reads "Active" when it equals the applied selection and "Applies on Next" when previewed but unapplied. | ARC-4, ARC-6 | Render test: after applying Shipyard Baron its panel reads Active; focus Grand Admiral without applying and its panel reads "Applies on Next". |
| AC-10 | The custom slot's allocator renders inline in the detail pane (no modal dialog): three editable dimension controls with accessible labels, the used-points budget, and the reset-to-balanced action. | ARC-5, DESIGN-51 | Reworked render test: activate the custom slot → three editable `slider`s labelled "Economy/Industry/Combat allocation", a used-points readout, and a Reset control; assert **no** `dialog` is opened. |
| AC-11 | The inline allocator validates against the engine: an invalid total shows the "Allocation needs fixing" diagnostics and blocks committing; correcting it (or Reset) restores validity. | ARC-5, DESIGN-03 | Render test: step Combat twice → invalid (22/20, diagnostics present, commit blocked); step Economy down twice → valid again; Reset → balanced baseline `7/7/6`. |
| AC-12 | Committing the custom slot applies an `ArchetypeSelection` of `kind: "custom"` with the built allocation; the custom card then reads Active. | ARC-5, ARC-8 | Render test: build a valid split, commit via the primary action, assert `onNext`/applied selection is `custom` with the built allocation and the custom slot is Active. |
| AC-13 | The primary action reads "Select" while a previewed slot differs from the applied selection (applying on the first press), then "Choose Nation" (advancing on the next press); disabled until an applied, valid selection exists. | ARC-6, ARC-7 | Render test: on open with no selection the action is disabled; focus a different preset → "Select"; press it → applied and label "Choose Nation"; press again → `onNext` called once. |
| AC-14 | `Back` is preserved (→ `onBack`). | ARC-7 | Existing render test preserved: the Back control calls `onBack`. |
| AC-15 | Continuing emits the applied selection through `onNext(ArchetypeSelection)`: a preset selection carries `kind: "preset"` + its id, a custom selection carries `kind: "custom"` + its allocation. | ARC-7, ARC-8 | Existing render tests preserved/reworked: `onNext` payload shape for both preset and custom. |
| AC-16 | Restoration: an initial `ArchetypeSelection` focuses the matching slot and marks it Active; `null` leaves nothing applied and the primary action disabled. | ARC-7, ARC-4 | Render test: render with an initial preset/custom selection → that slot focused/Active; render with `null` → no Active slot, action disabled. |
| AC-17 | Single state path: the applied selection is derived (`editorToSelection`), preview/focus is presentation-only and unpersisted; no duplicated allocation or forked engine preset/validator. | ARC-8, BW-ARC-002 | Boundary review + the reworked screen tests; the pure `new-game-archetype-screen-state` tests stay green and unchanged in behaviour. |
| AC-18 | No new `as unknown` casts; one component per file; the directory's public surface is its barrel; presentational panes take derived view-model props and never read authoritative state. | ARC-9, ADR-0106, BW-ARC-001, BW-ARC-002 | `pnpm preflight` (no-new-`as unknown`-casts ratchet) green; structural review of the new/edited files against the barrel/one-component-per-file rule. |
| AC-19 | No authoritative state, hash, golden hash, save format, RNG, compile output, IPC, or engine-package change. | ARC-10, BW-ARC-001, BW-DET-003 | Golden verification unchanged; two-process determinism byte-identical; no engine/compiler package touched; renderer bundling unchanged. |

## User Stories

1. As a campaign player, I want the archetype step to look and behave like the
   naval-age and fleet-method steps around it, so that the new-campaign flow feels
   like one product rather than three.
2. As a campaign player, I want the archetypes presented as a deck of cards I can
   inspect one at a time, so that choosing a playstyle is a calm decision instead
   of a wall of competing cards.
3. As a campaign player, I want to navigate the deck with the arrow keys, so that
   I can set up a campaign without reaching for the mouse.
4. As a campaign player, I want to navigate the deck with the scroll wheel, so
   that the wheel does what it looks like it should.
5. As a campaign player, I want to drag a card away and have the next one come
   forward, so that the deck feels physical and forgiving to explore.
6. As a campaign player, I want to tap any visible card to choose it, so that I do
   not have to bring it to the top first.
7. As a campaign player, I want pressing Enter to confirm the focused archetype,
   so that the keyboard path completes the choice.
8. As a campaign player, I want moving focus to *preview* an archetype without
   applying it, so that exploring the deck never silently changes my selection.
9. As a campaign player, I want the focused archetype's name and tagline in the
   detail pane, so that I always know which playstyle I am inspecting.
10. As a campaign player, I want the focused archetype's exact allocation across
    economy, industry, and combat shown in the detail pane, so that I can see the
    split before committing.
11. As a campaign player, I want the focused archetype's consequences — the
    numeric effects, strengths, and opportunity costs — shown in the detail pane,
    so that I can judge what the split actually does to my campaign.
12. As a campaign player, I want preset archetypes to also show their short
    description, so that a named playstyle explains itself without external docs.
13. As a campaign player, I want an Active marker on the archetype I have applied,
    so that I can tell at a glance which split my campaign will use.
14. As a campaign player, I want a previewed-but-unapplied archetype to say it
    "Applies on Next", so that I understand that inspecting is not committing.
15. As a campaign player, I want to build a custom 20-point split *inline* in the
    detail pane rather than in a full-screen dialog, so that the custom-build
    experience matches the rest of the flow.
16. As a campaign player, I want the custom allocator's live consequence preview
    beside its sliders, so that I can tune the split and see the effect at once.
17. As a campaign player, I want the used-points budget and the validation
    diagnostics in the allocator, so that I know when my split is not yet valid.
18. As a campaign player, I want a reset-to-balanced action, so that I can start
    my custom build from a neutral baseline.
19. As a campaign player, I want the custom build blocked until it is valid (each
    dimension in range, total exactly 20), so that I cannot launch an invalid
    campaign.
20. As a campaign player, I want the primary action to read "Select" when a
    previewed archetype differs from my applied one, so that applying is explicit.
21. As a campaign player, I want the primary action to read "Choose Nation" once
    an archetype is applied, so that continuing is obvious.
22. As a campaign player, I want the primary action disabled until I have applied
    a valid archetype, so that I cannot continue without a playstyle.
23. As a campaign player, I want the Back action preserved, so that I can return
    to the naval-age step.
24. As a campaign player, I want my archetype carried forward when I continue, so
    that the review and launch steps use the split I chose.
25. As a returning player, I want the archetype I previously chose to come back
    focused and Active, so that revisiting the step does not lose my choice.
26. As a keyboard-only player, I want the master deck to expose proper listbox
    semantics (`aria-activedescendant`, named options), so that my assistive tech
    announces which archetypes exist and which is focused.
27. As a keyboard-only player, I want the custom allocator's sliders and steppers
    to carry accessible labels, so that I can build a custom split without a
    mouse.
28. As a developer, I want the rework to reuse the existing `ArchetypeDeckPane`
    and `ArchetypeDetailPanel` components, so that we do not duplicate work that
    was already built and shared.
29. As a developer, I want archetype selection to keep flowing through the
    existing `ArchetypeEditorState` / `editorToSelection` path and the engine's
    presets/validators, so that there is one source of truth for the allocation.
30. As a developer, I want preview/focus to stay presentation-only and
    unpersisted, so that no UI change can affect authoritative simulation state.
31. As a developer, I want no new `as unknown` casts, one component per file, and
    barrel surfaces respected, so that the type-safety ratchet and component rules
    hold.
32. As a maintainer, I want no engine, compiler, content, save, hash, golden, or
    IPC change, so that a presentation rework cannot affect determinism or
    compatibility.
33. As a reviewer, I want a `pnpm snap` capture of the reworked screen at desktop
    and narrow widths, so that I can confirm the master/detail layout, the inline
    allocator, and the Active/Pending states against the acceptance criteria.
34. As a future implementer of the next screen in this series, I want this third
    consumer to be composition only, so that the shared primitives stay the
    pattern and no per-screen copy creeps in.

## Implementation Decisions

### Decision 1 — Layout: two-pane master/detail, full-bleed (the layout decision)

At `lg`+, the screen is a **two-pane master/detail split**, mirroring
`RulesOfTheNavalAgeScreen` and `NewGameFleetMethodScreen`:

- **LEFT (master):** the **archetype deck** — the three presets plus the custom
  slot as controlled cards, with the shared `DeckMasterPane` listbox semantics and
  interaction parity. The pane keeps the established master-column sizing
  (`lg:w-[min(39vw,36rem)]`, border-r, non-scrolling overflow-hidden deck
  viewport).
- **RIGHT (detail):** a **vertical, scrollable column** containing, top to bottom:
  1. a status line ("Current archetype: …", defaulting to "Custom" when nothing
     is named);
  2. the **focused-archetype slide panel** (`ArchetypeDetailPanel`, the Dossier
     `SlidePanel` inline variant) — name, tagline, allocation, consequence preview,
     Active/Pending state; for the custom slot its body is the **inline allocator**;
  3. the `Back` action.

On narrow widths the two panes **stack** into a single scroll column (master
first, detail below), matching the other two steps. The screen adopts
`NewGameScreenLayout fullBleed`; the shell header's secondary row already shows the
step's title/brief (`CHOOSE_YOUR_ARCHETYPE_HEADING` / `..._HINT` are wired in
`App.tsx`'s `WIZARD_STEP_COPY`), so the in-screen `ScreenHeader` is dropped. Other
new-game steps keep the centred layout unchanged.

### Decision 2 — Focus vs. selection semantics (what each gesture commits)

Two distinct pieces of presentation state, only one of which produces the
selection:

- **focus (`focusedIndex`)** — which card is on top and which slot the detail pane
  previews. Changed by arrow keys, the wheel, and a drag-to-fling (`onChange`).
  **Commits nothing.**
- **selection (`ArchetypeEditorState`)** — which archetype's allocation is applied.
  Changed **only** by an explicit apply: Enter, a tap, or the primary action.

Commit gestures:
- **Enter** confirms the focused slot. A preset slot applied → `selectPreset`.
  The custom slot activated → reveals/focuses the inline allocator (see
  Decision 4).
- **Tapping any visible card** activates it (and moves focus to it).
- Moving focus (arrows / wheel / drag) only previews.

This preserves the existing archetype picker's contract — "inspect without
committing, commit on click" — while giving it the shared interaction language. It
also matches the upstream deck's two distinct callbacks (`onChange` for the stack
moving itself, `onCardActivate` for a tap), which `ArchetypeDeckPane` already
separates.

### Decision 3 — Reuse the existing unwired components

The archetype deck/detail components were already written in an earlier commit
(`ArchetypeDeckPane`, `ArchetypeCard`, `ArchetypeCustomDeckCard`,
`ArchetypeDetailPanel`) and exported from the `components/archetype` barrel, but
**no screen imports them** — the live screen still renders the old grid plus the
modal. The rework **wires these components into `NewGameArchetypeScreen`** and
extends `ArchetypeDetailPanel` with the inline allocator body; it does **not**
rebuild the deck against the shared primitives. The obsolete grid cards
(`ArchetypePresetCard`, `ArchetypeCustomCard`) and the modal are then retired
from the screen (kept only if a test or another consumer still needs them; verify
with a search before deleting).

### Decision 4 — Inline custom allocator (replaces the modal)

The custom slot's detail body is the editable allocator, rendered inline in the
right column — the pattern's "detail pane always shows the focused slot" applied
to an editable slot:

- The allocator reuses the **existing** `ArchetypeAllocationEditor` (three
  labelled range controls + steppers, the used-points budget, the diagnostics
  popover, the split bar) and `ArchetypeConsequencePanel` (compact) — no new
  allocator UI is invented.
- Editing a dimension updates a **working custom allocation** held in screen-local
  state; the live consequence preview recomputes from it.
- Commit applies an `ArchetypeSelection` of `kind: "custom"` with that allocation,
  and only when `validateArchetypeAllocation` passes. While invalid, the primary
  action is disabled and the diagnostics are shown (as the modal does today).
- Activating the custom slot (Enter/tap) reveals/focuses the allocator; focusing
  it previews the current working custom allocation in the same panel. The exact
  activation affordance (reveal on focus vs. reveal on activate) is a small
  implementation choice; the spec requires only that (a) focusing the custom slot
  previews its allocation and consequence in the detail pane, and (b) a valid
  custom build can be applied and reported Active.
- The current `Dialog` (and its Reset/Confirm/Cancel footer) is removed.

This is a genuine composition difference from the preset and fleet-method detail
panels, which are read-only bodies: here the custom body is editable and its own
validation gates the primary action. Record it in the spec/commit narrative as the
"editable detail slot" composition; ADR-0127 already states a third master/detail
step is composition, so no new ADR is expected (see Further Notes).

### Decision 5 — State and authority (no fork)

- The screen keeps one `ArchetypeEditorState`; the applied selection is produced
  by `editorToSelection(state)`, exactly as today.
- `focusedIndex`, the preview, the working custom allocation, and the deck order
  are React presentation state; they are never authoritative and never persisted.
- The screen continues to receive only its existing props (`initialArchetype`,
  `onBack`, `onNext`, `onPrimaryActionChange`) and to drive the shell's primary
  action exactly as the other two steps do.
- `restoreArchetypeEditorState(initialArchetype)` still seeds the initial state;
  `null` means nothing is applied.
- No campaign command, IPC channel, preload method, or engine package is added or
  changed.

### Decision 6 — Primary action semantics

Mirror `NewGameFleetMethodScreen` / `RulesOfTheNavalAgeScreen`:

- Track a **pending** slot id (the previewed reason a commit is due). A hand edit
  to the custom allocation clears any pending preset preview.
- `needsSelect = pending !== null && pending !== applied`.
- `handleNext`: if `needsSelect`, apply it (and, for custom, only when valid) and
  return without advancing; otherwise call `onNext(editorToSelection(state))`.
- Label: `needsSelect ? "Select" : "Choose Nation"`; disabled until an applied,
  valid selection exists (and while a custom commit is invalid).

### Decision 7 — Renderer guardrails

- One component per file; each directory's public surface is its `index.ts`
  barrel; where routing a child through a barrel would close an import cycle,
  import the leaf directly.
- Presentational components take derived view-model props and never read
  authoritative state.
- No new `as unknown` casts (the `scripts/verify-no-unknown-casts.mjs` ratchet);
  existing baseline casts are not the pattern to copy.
- Keep `ArchetypeConsequencePanel` shared between the inline allocator preview and
  the detail panel (its `compact` variant is already used by both).

## Testing Decisions

A good test here asserts **external, user-visible behaviour**: the DOM a render
produces from real props, the selection a user gesture yields through the public
callbacks, and the state the pure helpers compute. Tests must not assert internal
call order or private implementation details. New tests are written so the
pre-rework grid-and-modal code would fail them.

**The seams (confirmed with the owner): exactly two, both existing — no new
seams.** The highest seam is the screen render, and the pure modules are already
seam-separated from it.

- **`NewGameArchetypeScreen` render seam (the primary seam).** Rework
  `NewGameArchetypeScreen.test.tsx` in place: master listbox with four options;
  focus previews without committing; Enter/tap applies via the state path; detail
  panel shows name/tagline/allocation/consequence with Active/Pending; the inline
  allocator (no dialog) with validation and reset; the primary action label/disabled
  transitions; `onNext` payload shape for preset and custom; restoration from an
  initial `ArchetypeSelection`; Back. **Prior art:** the existing
  `NewGameArchetypeScreen.test.tsx`, and the parity suites
  `RulesOfTheNavalAgeScreen.test.tsx` and `NewGameFleetMethodScreen.test.tsx`.
- **Pure helper seams (already separated, kept green).**
  `new-game-archetype-screen-state.test.ts` (`restoreArchetypeEditorState`,
  `selectPreset`, `setDimension`, `resetCustomAllocation`, `usedPoints`,
  `isAllocationValid`, `editorToSelection`, `selectedPreset`) and
  `archetype-consequence.test.ts` (`buildArchetypeConsequence` numerics).
  Behaviour is unchanged, so these stay green with no edits beyond what the rework
  genuinely requires.
- **Shared primitive seams (already covered upstream — not re-tested here).**
  `DeckMasterPane.test.tsx`, `CardDeck.test.tsx`, `deckNavigation.test.ts`. The
  archetype rework is composition, so it adds no primitive tests; the screen test
  only proves the deck is wired to the shared behaviour.

Adversarial cases that specifically kill the old behaviour / prove parity:

- The step renders **no `dialog`** when the custom slot is active (the modal is
  gone), and the allocator is present inline.
- A tap on a **non-top** visible card activates it (proves the tap path, not just
  the top card).
- Focus change previews but leaves the applied selection and the primary-action
  payload untouched; only Enter/tap/the primary action commits.
- Committing the custom slot while invalid is blocked with diagnostics; correcting
  the split (or Reset) restores validity.
- Restoration from a persisted preset selection focuses and marks it Active.

End-to-end and visual:

- `pnpm snap` (desktop build) captures the reworked screen at desktop (`lg`) and
  narrow width; check the master/detail split, the stacked narrow layout, the
  inline allocator, the Active/Pending states, console clean, and no structural
  churn warning, against AC-1..AC-5 / AC-8..AC-12.
- The existing new-game e2e flow already navigates the archetype step and clicks
  its primary action; `pnpm test:e2e` must stay green. If the flow's selectors
  touch the retired grid/modal markup, fix them in the shared flow helper (not by
  weakening the assertion).

## Out of Scope

- **No engine or compiler change.** No authoritative state, command, phase,
  ruleset, formula, content pack, save, hash, golden hash, RNG, IPC channel, or
  preload method changes. `ARCHETYPE_PRESETS`, the dimension bounds, the point
  total, and the effect formulas are untouched.
- **Only this screen, in this concept.** The master/detail primitives are already
  shared (ADR-0127); this spec adds a third consumer and reworks no other screen.
- Changing the new-game flow's ordering or the other steps.
- Redesigning the archetype's consequence model, its numeric effects, or its copy.
- Localization/i18n; the panel reuses the existing canonical English copy.
- Retiring `BounceCards` (used by the Starting-fleet picker and the a11y audit).
- Any change to the six-step flow's header/wizard copy beyond dropping the
  in-screen duplicate title.

### Non-goals (explicit)

- Not a throwaway prototype — this is a real change to the live screen wired to
  the existing new-game state and flow.
- Not a second place to build a custom archetype (the allocator exists once, in
  the detail pane).
- Not a general "editable detail slot" primitive extraction; if the pattern proves
  reusable later, that is a separate spec.

## Further Notes

- **No new ADR expected.** ADR-0127 already records where the shared master/detail
  primitives live and why, and its Consequences state that "a third master/detail
  step is composition." This spec adds exactly that third consumer. If the
  **inline-editable detail slot** (custom allocator) turns out to be reusable by a
  further screen, record it as an ADR amendment then — not now.
- **Grounding (verified before writing).** The reference steps
  (`RulesOfTheNavalAgeScreen`, `NewGameFleetMethodScreen`), the shared primitives
  (`card-deck/` — `DeckMasterPane`, `CardDeck`, `deckNavigation`, `cardPalettes`;
  `slide-panel/`), the target screen (`NewGameArchetypeScreen` and its test), the
  already-written-but-unwired archetype components
  (`components/archetype/` — `ArchetypeDeckPane`, `ArchetypeCard`,
  `ArchetypeCustomDeckCard`, `ArchetypeDetailPanel`, `ArchetypeAllocationEditor`,
  `ArchetypeAllocationBar`, `ArchetypeEmptyPreview`, `ArchetypePresetCard`,
  `ArchetypeCustomCard`, barrel `index.ts`), the pure modules
  (`new-game-archetype-screen-state`, `archetype-consequence`,
  `archetype-dimensions`, `ArchetypeConsequencePanel`), the engine module
  (`packages/campaign-engine/src/archetype.ts` — presets, `BALANCED_ALLOCATION`,
  `ARCHETYPE_POINT_TOTAL`, `validateArchetypeAllocation`, `archetypeEffects`), the
  flow wiring (`CampaignUnavailableView` → `useNewGameFlow.actions.acceptArchetype`,
  and `App.tsx`'s `WIZARD_STEP_COPY` for `new-game-archetype`), and ADR-0127 were
  all read while writing this spec. The archetype deck/detail components are
  confirmed **unwired** (only the barrel and their own files reference them).
- **Determinism.** The work is renderer presentation only. Focus/preview consume no
  randomness in an authoritative path. No authoritative hash, golden, or save
  change is expected; any golden movement is a stop condition, not something to
  accommodate.
- **Dependency.** No new dependency: `motion/react`, lucide, and the existing UI
  kit are already in the renderer bundle via the other two steps. The archetype
  artwork manifest (`getArchetypeArtwork`) already backs the deck cards.
- **Suggested plan order for `to-tickets` (dependency order):**
  1. Wire `ArchetypeDeckPane` + `ArchetypeDetailPanel` into a `fullBleed`
     master/detail layout with preview-then-apply semantics; port/rework
     `NewGameArchetypeScreen.test.tsx` (preset path first).
  2. Move the custom allocator inline into the detail panel (extend
     `ArchetypeDetailPanel` with the `ArchetypeAllocationEditor` body); delete the
     `Dialog`; port the validation/reset tests; prove "no `dialog`".
  3. Primary-action "Select"/"Choose Nation" semantics + pending handling +
     restoration from an initial `ArchetypeSelection`; retire the now-unused grid
     cards if nothing else references them.
  4. Snapshot/E2E verification against the two reference steps; run the full gate.
- **Known low-risk sharp edges.** jsdom cannot evaluate Tailwind responsive
  classes, so the `lg`+ split vs. narrow stack is proven structurally in tests plus
  `pnpm snap` at two widths, not by computed media queries. The deck's drag physics
  are motion behaviour and are not asserted in unit tests. The custom slot's
  activation affordance (reveal-on-focus vs. reveal-on-activate) is a small
  implementation choice the implementer may resolve; the spec fixes only the
  observable requirements.

### Definition of done

- [ ] `NewGameArchetypeScreen` is a two-pane master/detail split at `lg`+ and
      stacks at narrow widths; `fullBleed` layout; no duplicate in-screen title.
- [ ] The master deck lists the three presets plus the custom slot as one listbox
      with the shared interaction parity; the existing unwired
      `ArchetypeDeckPane`/`ArchetypeDetailPanel` are reused/extended, not rebuilt.
- [ ] Focus only previews; Enter, a tap, or the primary action applies; the detail
      panel shows name/tagline/allocation/consequence with Active/Pending and no
      in-panel Select control.
- [ ] The custom allocator is inline in the detail pane (no dialog), validated
      against the engine, resettable, with a live consequence preview; committing
      applies `kind: "custom"`; invalid builds block committing.
- [ ] The primary action reads "Select" while pending, "Choose Nation" once
      applied; disabled until an applied, valid selection exists.
- [ ] Back, `onNext(ArchetypeSelection)`, and restoration from `initialArchetype`
      are preserved; the applied selection flows through `editorToSelection` with
      no fork.
- [ ] Every AC-1..AC-19 has a proving test (or the orchestrated `pnpm snap`
      capture) that fails against the pre-rework grid-and-modal code.
- [ ] No new `as unknown` casts; one component per file and barrel surfaces
      respected.
- [ ] `pnpm preflight` green (including the no-new-`as unknown`-casts ratchet);
      `pnpm test:scripts` green.
- [ ] `pnpm check` green end-to-end (format, lint, `lint:effect`, typecheck, build,
      tests, desktop E2E `pnpm test:e2e`).
- [ ] No authoritative state/hash/golden/save/engine change; two-process
      determinism byte-identical.
- [ ] `pnpm snap` capture of the reworked screen at desktop and narrow widths
      (screenshot + `aria.yaml`, console clean, no structural churn warning),
      checked against the ACs by implementator and reviewer.
- [ ] Clean working tree; small Conventional Commits on `dev`; traceability
      pointer updated.

### Validation commands

Focused (run from the repo root; selectors target the changed desktop renderer
modules):

- `pnpm --filter @bluewave/desktop exec vp test run src/renderer/screens/new-game`
- `pnpm --filter @bluewave/desktop exec vp test run src/renderer/screens/new-game/components/archetype`

Full orchestrator gate (all green on the exact commit):

- `pnpm preflight`
- `pnpm test:scripts`
- `pnpm check` (includes typecheck, lint, `lint:effect`, tests, and `pnpm test:e2e`)
- two-process determinism (`pnpm --filter @bluewave/cross-process-test exec vp test`)
  byte-identical
- orchestrator golden-hash verification (unchanged expected)
- `pnpm snap` — capture the reworked screen at desktop and narrow widths; check
  against AC-1..AC-5 / AC-8..AC-12, console clean, no structural churn warning.
