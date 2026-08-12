# ADR-0015 (B-1-7): Reachable Opportunity Predicate for FLEET/CRUISER Battles

## Status

Accepted

## Context

DESIGN-37 §6.1 (FLEET_BATTLE) and §6.2 (CRUISER_BATTLE) predicate opportunities on
a "fleet/decisive-contact" or "contact/patrol opportunity" record. M1 state
(`WarState`, `FleetState`) has no mission, operation, or contact entity — those
belong to movement/spotting (B-2) and operations. Without a defined predicate,
the B-1 implementator would have to guess which manifests are authoritative,
violating DESIGN-37's "runtime inference and silent fallback are prohibited".

The reviewer follow-up (map.md) requires a deterministic reachability predicate
authored **before INC-3** so the implementator does not guess.

## Decision

1. Define the versioned reachable predicate `opportunity_reachability_v1`:
   **an opportunity for a reachable mission arises from opposing active-war
   surface presence co-located in the same area post-movement** (presence =
   `locationAreaId` on `FleetState`/`Ship`).
2. No mission/contact/operation record is created in B-1 (movement/spotting are
   B-2). The predicate operates purely on committed M1 state.
3. For `FLEET_BATTLE`: at least one opposing active-war pair has co-located
   surface presence and each side's eligible combat strength is at least the
   DESIGN-37 §6.1 minimum (`300` points).
4. For `CRUISER_BATTLE`: at least one eligible cruiser group (`CL`/`CA`/`BC`) per
   side is co-located and each side's eligible cruiser strength is at least the
   §6.2 minimum (`150` points).
5. This is a versioned ruleset decision, not invention; it is recorded as an ADR
   and must be authored before any INC-3 manifest is authoritative.

## Consequences

- Deterministic, causal opportunities: co-located opposing active-war surface
  presence is the only trigger in B-1.
- When B-2 lands movement/spotting, the predicate is revisited (versioned bump)
  to consume real contact records — a documented, non-silent change.
- Guards against fabricated or guessed manifests.

## Related requirements

- DESIGN-37 §6.1, §6.2, §7; DESIGN-55 §13/§14.
- B-1 AC-5 (opportunity determination), AC-7 (division preservation).

## Related ADRs

- ADR-0014 (B-1-3 reachable mission subset).