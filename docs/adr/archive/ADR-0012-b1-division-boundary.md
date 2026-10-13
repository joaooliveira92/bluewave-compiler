# ADR-0012 (B-1-1): Package Boundary for Permanent Divisions vs. Battle Generation

## Status

Accepted

## Context

B-1 (M2 battle generation and tactical-setup scaffolding) adds two related but
distinct responsibilities: a **permanent division** data model (campaign-
authoritative organization with membership commands) and the **battle-generation
pipeline** (strategic contest to tactical manifest). Splitting them across
packages must follow ENGINEERING-CONTRACT's "no speculative packages" rule and
the directed dependency graph.

`@bluewave/campaign` owns campaign-authoritative state and commands (nations,
fleets, wars, construction, research). `@bluewave/combat` owns battle-time
behavior (resolver, tactical clock, auto-resolution). Battle generation consumes
campaign state (`WarState`, `FleetState`, `Ship`, and now `PermanentDivision`) and
produces tactical artifacts (`BattleManifest`, `BattleGenerationRecord`).

An alternative would place permanent divisions in `@bluewave/combat`, since they
are projected into battle. That is rejected: divisions are authoritative strategic
state mutated by `@bluewave/commands` through the monthly pipeline, and combat must
not own campaign state.

## Decision

1. **Permanent divisions live in `@bluewave/campaign`** (`src/division.ts` +
   `src/commands/divisionCommands.ts`): `PermanentDivision` type, invariants,
   roles/formations/effects, and the division command surface (`CreateDivision`,
   `AddShipToDivision`, `RemoveShipFromDivision`, `DissolveDivision`,
   `ChangeDivisionFlagship`). `NationState.divisions` is campaign state.
2. **Battle generation + tactical setup live in `@bluewave/combat`** under
   `src/generation/` and `src/tactical/`: mission registry, opportunities, force
   requirements, eligible-asset gathering, division projection, optional
   selection, allied support, repair, manifest/seed/reservations, auto-resolution
   proof, and `TacticalBattleState`.
3. `@bluewave/combat` imports the `PermanentDivision` **type** from
   `@bluewave/campaign` for projection (read-only). It never mutates campaign
   divisions.
4. No new package is introduced.

## Consequences

- Directed dependency `campaign <- phase-engine` and `combat <- phase-engine` is
  preserved; `combat` depends on `campaign` (already true for `Ship`/`FleetState`).
- Consistency: division invariants are enforced by `@bluewave/campaign`
  (authoritative) and observed by `@bluewave/combat` projection.
- Matches the reference `@bluewave/commands` + `@bluewave/phase-engine` wiring for
  the five division commands.

## Related requirements

- ENGINEERING-CONTRACT "no speculative packages", "directed package graph".
- DESIGN-26 §1 (permanent vs. tactical division), DESIGN-37 §13, §30.

## Related ADRs

- ADR-0006 (campaign architecture).