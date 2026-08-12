# ADR-0017 (B-1-6): Auto-Resolution Proof Scope

## Status

Accepted

## Context

DESIGN-37 §42 requires the generator to prove the auto-resolver supports mission
type, asset types, elements, weather, objectives, withdrawal/surrender, damage/
losses, campaign consequences, and provenance return before manifest acceptance.
DESIGN-38 §8's `BattleInstances` in M1 (`@bluewave/combat` `BattleResolver`) is a
strength-based auto-resolution that resolves by fleet strength, damage, and
losses — it has **no** withdrawal/surrender/objective/provenance-return mechanic
(those are B-2/B-6). Taken literally, §42 would reject every manifest in B-1
because the M1 resolver does not implement the full §42 surface — a silent
weakening if ignored, or a false rejection if enforced.

## Decision

1. `proveAutoResolvable(manifest, resolverCapabilities)` verifies the manifest
   only exercises the resolver's **declared surface** — a persistent, declared
   capability contract (`auto_resolution_declared_surface_v1`).
2. The B-1 declared surface is: persistent surface ships, strength/damage/losses,
   and provenance return. Withdrawal, surrender, and objective mechanics are
   declared **not yet supported** and therefore cannot appear in a B-1 manifest.
3. This closes the DESIGN-37 §42-vs-M1-resolver gap as an explicit, versioned
   capability contract — not a silent weakening. When B-2/B-6 add withdrawal/
   surrender/objectives, the declared surface is bumped and the proof re-checks it.
4. Missing support rejects the opportunity with `AUTO_RESOLUTION_UNAVAILABLE`
   (DESIGN-37 §42).

## Consequences

- Every B-1 accepted manifest is provably auto-resolvable by the M1 resolver.
- No battle requires tactical play for campaign continuity (DESIGN-38 §33).
- Later milestones extend the declared surface — a documented, non-silent change.

## Related requirements

- DESIGN-37 §42, DESIGN-38 §33, §34.
- B-1 AC-11 (auto-resolution proof), AC-10 (seed).

## Related ADRs

- ADR-0016 (B-1-5 manifest/seed), ADR-0014 (B-1-3 reachable subset).