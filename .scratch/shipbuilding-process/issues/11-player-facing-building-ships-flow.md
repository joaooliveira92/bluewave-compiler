# 11: Player-facing building-ships flow

**Type:** grilling
**Status:** resolved
**Blocked by:** 05, 06, 07, 08, 09

## Question

Decide the player-facing construction surface so the manual's building-ships process is playable
end-to-end, once the domain decisions are settled.

Manual (printed p30–33): order ships (build dialog, batch up to 12), watch build time and monthly
cost, halt and resume construction, accelerate selected ships, see dock size and shipyard
capacity, and contract to a foreign yard.

Decide, against the existing Construction screen and Drawing Board
(`apps/desktop/src/renderer/screens/construction/**`, `apps/desktop/src/shared/construction-contract.ts`):

- the ship list and build dialog (batch quantity, builder choice, name assignment);
- halt/resume and accelerate controls and their confirmations;
- dock-size and shipyard-capacity readouts (and dock-growth actions);
- the foreign-yard order flow and impound-risk disclosure;
- what is a display of a compiled value versus an edit;
- the snapshot/accessibility bar (`pnpm snap`, aria, console clean).

## Answer

Resolved 2026-10-12 (autonomous; grounded in the domain decisions of tickets 05–10, the existing
Construction screen and Drawing Board, and AGENTS.md desktop conventions).

The surface is the Construction screen (`apps/desktop/src/renderer/screens/construction/`) plus the
Drawing Board. Decisions:

- **Ship list + build dialog.** A "new construction" flow picks an approved compiled design version, a
  builder (domestic yard or foreign), and a **batch quantity 1..12** with auto-assigned names (ticket
  07). Show dock fit (existing `YardList`) and the dock-size ceiling (ticket 08).
- **Money/time readouts.** The monthly instalment (= the per-package funding), remaining months and total
  cost (existing `ForecastPanel`); a hull still building ages toward its launch month.
- **Halt / resume.** Row actions on each `NEW_CONSTRUCTION` project (ticket 05); halted rows show the
  half-mothball carrying cost.
- **Accelerate.** A per-ship toggle (ticket 06) that discloses the +5% cost and states the
  capacity-pressure delay risk; accelerated rows are badged.
- **Dock & shipyard capacity.** A nation panel showing dock size (max build displacement), the
  concurrency cap and its current utilisation, and a dock-expansion action (12 months, next era step).
- **Foreign yard.** The build dialog offers foreign builders when no domestic yard fits or by choice,
  showing the builder's dock limit, impoundment risk (tension-based) and treaty-delivery status (ticket 09).
- **Display vs edit.** Every new control edits a command/draft; every readout shows a compiled value —
  the Drawing Board never invents data (SB-2).
- **Rebuild surface** exposes the ticket-10 action set.

Bar: `pnpm snap` capture of each changed screen, aria assertions by role + accessible name, console
clean; the desktop e2e suite covers order → halt → accelerate → advance month → launch. Per AGENTS.md a
UI change without a captured screen is not APPROVE-able.

Hand-off: the UI slices of the spec, after the domain slices.
