# 14: Reference-design picker as a master/detail deck

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** no

Source: owner request (2026-10-13): the Shipbuilding workspace's "Start from a reference design"
dialog (bottom-bar Shipbuilding modal) should use the same master/detail pattern as the
Rules-of-the-Naval-Age Presets screen. Cards with ship types (SVG images) on the left, and the
selected type's information on the right.

## What to build

- **Master:** the shared `DeckMasterPane` (ADR-0127). It holds one card per available ship type
  that has a starter design. Each card carries an SVG side profile of that starter design, drawn
  by the design workspace's own profile, so its mounts and masts come from the ship-visual
  catalog (ship-visualization ADR-0148).
- **Detail:** the focused type's name, recommended use, relative cost and build time,
  displacement and speed envelopes, description, armour, armament, weaknesses, roles,
  unsimulated roles and the torpedo rule, plus the "Start from …" action.
- **Interaction:** moving focus (arrows, wheel, drag, tap) only previews. Enter or the detail's
  action starts from that design, and that still goes through the existing replace-design
  confirmation.
- **Scope:** the Construction → Drawing Board keeps its list (`ShipTypePanel`).

## Acceptance criteria

- [x] The dialog shows a deck of ship-type cards, each with an SVG profile of its starter design,
      and a detail pane for the focused card.
- [x] Focus changes only preview; starting needs Enter or the action, then the existing
      confirmation.
- [x] Locked types and types without a starter design are not shown as startable; the "other
      kinds arrive with later eras" note stays.
- [x] `pnpm snap` of the bottom-bar Shipbuilding modal captures the dialog, with a clean console.

## Answer

- **Browser:** `ReferenceDesignBrowser` (screens/shipbuilding/components) puts the shared `DeckMasterPane` on the
  left and the focused type's `ReferenceDeckDetail` on the right. It replaces `ShipTypePanel` in the workspace's wide
  "Start from a reference design" dialog (`WorkspaceDialog wide`).
- **Data:** a pure view model, `referenceDeck`, lists the available types in roster order with each starter's draft.
  It opens on the current type, counts locked types, and starts only from a legal starter.
- **Cards:** `ReferenceDeckCard` draws the starter design with `StarterProfile`, which is the workspace's own
  `ProfileView`, so the cards show the era/nation gun mounts and masts from the ship-visual catalog.
- **Shared detail:** `ShipTypeFacts` and `ShipTypeDetails` were extracted from `RosterRow`, so the Drawing Board list
  and the new detail share one source.
- **Interaction:** arrows, wheel, drag and tap only preview; Enter or "Start from …" starts, through the existing
  replace-design confirmation.
- **Golden fix:** empty mount and mast layers now render nothing, and the profile golden
  (`section-drawing.golden.test.tsx`) is re-pinned to match.
- **Validation:**
  - `reference-deck.test.ts` 5/5 and `ReferenceDesignBrowser.test.tsx` 4/4.
  - shipbuilding + design-workspace 381/381.
  - `pnpm snap` was taken from the bottom-bar Shipbuilding modal (More design actions → Start from a reference
    design, and ← to the battleship card), with a clean console.
