# ADR-0059: RTW3 parity / UX modernization — decisions

Status: accepted (2026-10-07). Spec: `.scratch/rtw3-parity-ux-overhaul/spec.md`. Builds on ADR-0055
(map renderer), ADR-0058 (release UI hides engine detail).

These are the decisions the owner delegated ("decide the best approach") during the parity sprint.
Each was made by testing the real engine, not by assuming how the original game behaves.

## 1. Engine-check first; the UI only shows or accepts what the engine does
Before building any RTW3 screen, sweep the engine for the data and the commands. The engine's whole
player-command vocabulary is 14 commands (7 diplomacy, 5 division, research priority, construction
budget). Real data is shown; anything else is a visible **"Not yet modelled by the engine"** list with
a one-line reason (`DeferredFeaturesPanel`) — never a number, zero or disabled-but-real-looking
control (AGENTS.md: deferred work is recorded, never fabricated). Engine follow-ups are collected in
`docs/research/rtw3-parity-engine-roadmap.md` for owner ranking; they change authoritative state, so
each needs its own ADR and golden-hash update.

## 2. Division editor follows the engine's real semantics
- A division is **founded on one flagship**: `CreateDivision` validates a whole ship list but the engine
  builds the division from the first ship only. The wire command carries `flagshipShipId`; more ships
  join with `AddShipToDivision`.
- The desktop **never supplies new division ids** — they are derived deterministically from nation,
  turn and flagship.
- Reorganization **costs experience and cohesion** (engine constants, exposed in the view); the UI states
  the cost before the player commits.
- The engine does **not** enforce the design's same-area rule on `AddShipToDivision` (pinned by a test).
  The UI offers only same-area ships. If the engine starts enforcing it, that test should flip.
- All division commands share one queue-and-validate path with diplomacy (`playerCommandSupport.ts`):
  the engine's own `CommandLifecycle.validate()` is the issue-time verdict, shown verbatim.

## 3. Screens stay in step with the campaign
The shared command-screen workflow takes a `refreshKey` (the campaign revision) and reloads when it
changes, so a month advanced from the header never leaves Fleet/Construction showing stale data.

## 4. Density, type and alerts
- **Density** (Comfortable / Compact) is one persisted setting applied as `<html data-density>`; compact
  overrides Tailwind's single `--spacing` variable, so every screen tightens without per-screen variants.
- **Type floor:** player-facing text is never below 12px (`text-xs`); `type-floor.test.ts` enforces it.
  Debug/dev screens are exempt.
- **Alerts:** the header count and the Overview priorities come from the engine's priorities projection
  (warnings + criticals). No count is shown when the projection cannot be read.
- **Budget bar:** expenditure segments against an income marker on one scale; every segment is also named
  in text — colour is never the only signal.

## 5. Campaign lifecycle
`saveCampaign`, `closeCampaign` and `copyCampaign` are real bridge commands (Save and Close had no handler
and answered NOT_IMPLEMENTED). Save is idempotent because `commitMonth` already persists every month.

## Consequences
New screens follow rule 1. The roadmap document, not this ADR, tracks which engine mechanics to build.
