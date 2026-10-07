# ADR-0054: Diplomacy Command Queue Stays Visible; War Declaration Reads as Irreversible

## Status

Accepted (2026-10-07).

## Context

The visual audit (`.scratch/desktop-ui-audit/issues/01-first-visual-sweep-findings.md`, #11) found that
clicking "Declare war" on a relation row appeared to do nothing. The click only creates a draft; the
"Command queue" bar with the submit button sat at the bottom of a long page, off-screen. The backend is
correct: a submitted command is queued, validated by the engine's own `CommandLifecycle`, and applied at
`commitMonth` (verified: relation becomes "At war", tension 10/10). No UI or bridge path cancels a queued
diplomacy command (`pendingCommands.ts` has `deletePendingEnvelope`, but nothing exposes it).

## Decision

1. The Command queue bar is pinned to the bottom of the viewport (`sticky`), so a draft is visible the
   moment it is created. The sticky element is a plain wrapper, not `GlassCard`, whose inner
   `overflow-hidden` container would confine `sticky` to the card.
2. A drafted `DeclareWar` relabels the submit button "Declare war" (destructive style) and shows an
   alert that it cannot be cancelled from this screen and takes effect on the next month advance.
   Other drafts keep "Submit command".
3. No extra confirmation dialog: draft -> submit is already a two-step flow; the change makes that
   confirmation step visible and honest rather than adding a third.

## Consequences

- No engine, bridge or authoritative behaviour changes.
- If a cancel path for queued diplomacy commands is added later, the warning copy must change with it.
