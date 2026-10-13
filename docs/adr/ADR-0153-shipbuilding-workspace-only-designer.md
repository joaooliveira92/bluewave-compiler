# ADR-0153: The Shipbuilding workspace is the app's only designer — the Drawing Board tab is removed

## Status

Accepted (2026-10-13).

Supersedes: ADR-0141 (the two-host decision; the bottom-bar workspace becomes the app's only designer).

## Context

[ADR-0141](ADR-0141-shipbuilding-workspace.md) introduced the Shipbuilding
workspace as a *second* host of the shared design-workspace layer, opening from a
bottom-navigation action in a near full-screen modal, deliberately *beside* the
Construction screen's Drawing Board tab. Both hosts composed the same designer
and the same campaign working draft; the two were mutually exclusive modals.

Two entry points to one designer is a usability fault: the player reaches a
different-looking designer depending on whether they open the Construction tab or
the bottom bar. The workspace is the intended paradigm
(`.scratch/shippbuilding-ui.md`); the Drawing Board is the legacy layout. The
app should use one designer, reached one way.

## Decision

1. **The bottom-bar Shipbuilding workspace is the app's only designer.** The
   Construction screen drops its "Drawing Board" tab and the `DrawingBoardDialog`
   it mounted; `ConstructionScreen` no longer imports it. This supersedes
   ADR-0141 §1–5 (the "second host, not a fork" decision).
2. **Revision and rebuild stay deferred, and widen.** ADR-0141 §6 kept
   revision/rebuild of in-progress projects in the Drawing Board because it needs
   the Construction screen's project list. With the Drawing Board unreachable,
   revision/rebuild has no surface; it stays recorded as deferred, not dropped.
3. **The shared layer and the working draft are unchanged.** The
   `components/design-workspace/` layer, `useDesignSession`, and the campaign
   working-draft autosave (`drawing-board-draft.json`, ADR-0082) stay as they are;
   the workspace keeps using them. No IPC command, save format, or authoritative
   campaign state changes.
4. **The Drawing Board host source stays in the tree, unreferenced.** The
   `screens/construction/drawing-board/` host, its unit tests, and the
   `inspectDrawingBoardContent` / `readDrawingBoardDraft` / `writeDrawingBoardDraft`
   IPC remain, now unused by any screen. Deleting them is deferred: it is larger
   than this change and the source is inert.
5. **E2E is migrated where it maps, dropped otherwise.** The design flows that
   map to the workspace — submitting a queued design, and the reference roster,
   ship-type gating, belt validation and submit (the ADR-0088 critical path) —
   were repointed to the bottom-bar modal. The Drawing-Board-specific flows (plan
   move/place, hull-section hover cards, selection linking, finding → fix, the
   ship-view splitter, and revision while building) were dropped. The workspace
   needs its own e2e coverage for them; recorded as deferred.
6. **The packaged smoke captures the workspace.** The release smoke opens the
   bottom-bar modal and checks the artifact-backed ship-building content (the
   ship plan and its sections) renders, replacing the Drawing Board screenshot.

## Consequences

- One designer, one entry point: the bottom bar. The Construction screen is
  construction only (Shipyard Ledger, Design Catalog, Command Ledger).
- Behaviour fixes in the shared layer reach the single remaining host; a
  workspace-specific change stays in `screens/shipbuilding/`.
- **Coverage gap (deferred):** the workspace has no e2e for plan editing,
  selection routing, findings, or revision yet. The dropped Drawing-Board specs
  are the checklist for writing them.
- The unused Drawing Board source and draft IPC are dead weight until a later
  cleanup removes them.

## Alternatives considered

- **Keep both hosts (status quo, ADR-0141).** Rejected: two modals for one task
  is the fault this ADR fixes.
- **Delete the Drawing Board host and its IPC now.** Deferred: it touches the
  main process and many test files, beyond the requested change; the source is
  inert in the meantime.
- **Move revision/rebuild into the workspace first (full retirement).** Deferred:
  it is real work; until it lands the app simply does not offer revision, which
  is recorded rather than fabricated.
