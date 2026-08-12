# ADR-0014 (B-1-3): Reachable Mission Subset for B-1 Battle Generation

## Status

Accepted

## Context

DESIGN-37 §2 defines a canonical registry of exactly nine mission types. The
`@bluewave/combat` package is required to ship the complete registry (§2) with
exact unique priorities (§3). However, the current campaign state (M1 accepted)
has no owning mechanic for seven of them:

- `COASTAL_RAID` — coastal-defense targets (DESIGN-48, M3, unassigned);
- `CONVOY_ATTACK` / `CONVOY_DEFENSE` — trade-warfare (DESIGN-33, unassigned);
- `INVASION` — amphibious manifests (DESIGN-36, M3, unassigned);
- `RAIDER_INTERCEPTION` — trade-raiding (DESIGN-33, unassigned);
- `BLOCKADE_BREAKOUT` — blockade breakout (DESIGN-32, basic blockade landed in
  B10c but breakout has no owning mechanic);
- `CARRIER_ACTION` — carrier operations (DESIGN-44, M4, unassigned).

Their opportunity predicates reference input contracts with no owning mechanic,
so no reachable campaign state can ever satisfy them in B-1. Generating them
would either fabricate input contracts (violating DESIGN-37 §6 "MUST NOT
independently invent") or produce `UNSUPPORTED_CONTENT_REACHABLE`.

## Decision

1. The mission registry ships **exactly the nine canonical types** with the exact
   DESIGN-37 §3 priorities (AC-4).
2. Only `FLEET_BATTLE` and `CRUISER_BATTLE` are **reachable** from B-1 campaign
   state; their opportunity predicates resolve against M1-accepted state
   (`WarState`, `FleetState`).
3. The other seven missions are **registered with complete definitions** but their
   opportunity predicates reference the (absent) owning-mechanic input contracts
   and therefore deterministically produce a **successful empty stage record** —
   the DESIGN-55 §13/§14 isolation pattern. No `UNSUPPORTED_CONTENT_REACHABLE` is
   emitted.
4. Reachability is a versioned ruleset constant
   (`reachable_mission_subset_v1`) so promoting a mission later is a ruleset
   change, not a silent code edit.

## Consequences

- Deterministic: reachable missions generate; unreachable missions yield
  successful-empty records, never fabricated engagements.
- Prevents `UNSUPPORTED_CONTENT_REACHABLE` at the production-pack scope (AC-14).
- Later milestones promote a mission by implementing its owning mechanic and
  moving its opportunity predicate to a real input contract — a versioned change.

## Related requirements

- DESIGN-37 §2, §3, §6, §7; DESIGN-55 §13/§14 (unsupported-content isolation).
- B-1 AC-4 (registry), AC-14 (reachability).

## Related ADRs

- ADR-0013 (B-1-2 ship-type classifier), ADR-0009 (phase identifiers).
- ADR-0015 (B-1-7 reachable opportunity predicate).