# Spec — Minimum shippable playable loop

**Status:** ready-for-agent
**Origin:** production-readiness recommendations 2026-10-10

## Problem

The engine is complete through M4 on paper, but the modules are not all reachable
from a campaign (ADR-0045 note), the AI is not yet "intentful", and only three of ten
playable nations have authored identity (ADR-0096). There is no single, proven
end-to-end slice that says "this is a game you can play". That is the gap between
"engine complete" and "shippable".

## Solution

Define and prove one vertical slice end to end, then grow it. One nation, one
scenario (1880), compile → play a campaign with real monthly decisions → a battle
that matters and resolves deterministically → save, reload, verify. Make it an
acceptance gate backed by an e2e test, not a vibe.

## Acceptance criteria

- AC-1: A single documented campaign (nation, start, settings) compiles from the
  production pack with zero diagnostics.
- AC-2: At least N meaningful player decisions per month (economy, research,
  construction, diplomacy, fleet) are available and change the next month's outcome.
- AC-3: A campaign battle is generated, resolved, and surfaced with a result the
  player can act on; it is not an internal no-op.
- AC-4: Save → quit → reload → advance reproduces the same authoritative hashes
  (reuses the cross-process proof).
- AC-5: The slice runs end to end in `pnpm test:e2e` on CI.

## Tickets

- `issues/01-playable-loop-acceptance.md` — the gate + e2e slice.
- `issues/02-author-remaining-national-profiles.md` — close the ADR-0096 content gap.

## Out of scope

- New mechanics. This is reachability, wiring, and proof of what exists.
- Tactical (player-fought) battles; auto-resolution is the shippable path.
