# ADR-0141: Shipbuilding workspace beside the Drawing Board

## Status

Accepted (2026-10-12).

Superseded by: ADR-0153 (the bottom-bar workspace is the app's only designer; the Drawing Board tab is removed).

## Context

The Drawing Board (Construction screen) lays the designer out as five task tabs beside a
ship view. The `shipbuilding-ui` effort (`.scratch/shippbuilding-ui.md`) asks for a
different paradigm — a design map of ship systems, a persistent central ship, a
contextual inspector, and a persistent engineering strip — without replacing the
Drawing Board. Ticket 01 lifted the designer into the shared
`components/design-workspace/` layer so a second host needs no cross-screen import.
Two hosts of one designer raise three questions: where the new one lives, which
working design it edits, and what its "Save draft" means.

## Decision

1. **A second host, not a fork.** The Shipbuilding workspace
   (`screens/shipbuilding/`) opens from a bottom-navigation action in a near
   full-screen modal over the current screen. It composes the shared layer
   (`useDrawingBoard`, the selection store, `boardFindings`, the plan model and
   panels) under its own layout. No designer logic is copied; both hosts change
   together.
2. **One campaign working design.** Both hosts read and write the same campaign
   working draft (`drawing-board-draft.json`, ADR-0082) through
   `useDraftAutosave`. The two hosts are mutually exclusive: both are modal (an open
   Drawing Board dialog makes the bottom navigation inert, and the Shipbuilding
   modal covers the Construction screen), so only one is ever mounted; each reads
   the draft when it opens and flushes it when it closes. They also share the
   restored-draft toast id. No IPC command, save format, or authoritative state is
   added. The wiring both hosts need around the draft (findings, selection
   pruning, guarded preset loading) lives in the shared `useDesignSession`.
3. **"Save draft" is an explicit flush.** Autosave already persists every change
   after a short delay; the top bar's Save draft writes immediately
   (`useDraftAutosave().saveNow`) and is disabled outside a campaign, where there
   is nowhere to save.
4. **The class name is owned by the top bar.** The workspace holds it and passes it
   to the submit panel (`SubmitPanel` `name`/`onNameChange`); the Drawing Board's
   panel keeps its own field. It is presentation state until submission.
5. **Whole-design tools live in the top bar's overflow menu.** Besides reset, the
   menu opens starting designs, import/export, edit history and design
   alternatives in dialogs: whole-design actions the Drawing Board already offers,
   kept out of routine editing (dialogs are reserved for non-routine work).
6. **Revision and rebuild of existing projects stay in the Drawing Board.** They
   need the Construction screen's project list; the Shipbuilding workspace offers
   new designs only. Recorded as deferred, not dropped.

## Consequences

- Behaviour fixes in the shared layer reach both hosts; a host-specific change
  must stay in its screen folder.
- Opening the workspace never changes campaign state; submitting from it is the
  same `submitDesignCommand` as the Drawing Board.
- A player who edits in one host sees the same working design in the other.
