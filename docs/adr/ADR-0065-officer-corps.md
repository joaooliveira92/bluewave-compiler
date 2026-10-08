# ADR-0065: Officer Corps and Division Commanders

## Status

Accepted 2026-10-08 (recorded after implementation; code comments previously cited this as ADR-0063, which is the ship-building compiler decision)

## Context

Permanent divisions carry a `commanderOfficerId`, but nations had no officers to assign, and a commander's quality had no effect.

## Decision

1. Each nation has a deterministic, fictional officer roster (`buildOfficerRoster(nationId)`): six officers of rank CAPTAIN, COMMODORE or REAR_ADMIRAL, no real persons named, generated from the nation id so the same pack always yields the same officers. Stored as optional `NationState.officers` (absent in saves from earlier builds).
2. Each officer has one command rating `skill` (30..90, 50 average).
3. A division commander changes the accuracy of the division's ships by `10_000 + (skill - 50) * 20` basis points; a division with no (or unknown) commander takes the DESIGN-26 vacancy multiplier of `9_000` bp. Ships outside any division are neutral. Applied in auto-resolved battles as the `officer` accuracy factor.
4. Commands `AssignOfficer` and `RelieveOfficer` set the commander. Filling a vacancy is free; replacing or relieving a sitting commander applies the DESIGN-26 commander-change penalty to experience and cohesion (`applyCommanderChange`).

## Consequences

Snapshot state changes (new optional field), so the cross-process golden closing-snapshot and replay hashes were regenerated. The clone-coverage audit lists `Officer` as a cloned type.
