# ADR-0013 (B-1-2): Derived Ship-Type Classification

## Status

Accepted

## Context

DESIGN-22 §4 defines a `ShipClassificationResult` carrying an **intended** type
(declared by the designer) and a **natural** type (independently derived from the
compiled mechanical design). DESIGN-37 §1 requires that a tactical unit carry its
canonical ship type, and DESIGN-26 §4 division compatibility depends on ship type.

The B-1 `TacticalShipUnit` needs a deterministic `CanonicalShipType` (DESIGN-22's
14-type registry) for promotion and division grouping. A design could carry the
type as an authored field, but that would allow authored text to override
classification, violating DESIGN-22's "runtime inference and silent fallback are
prohibited" and making classification non-versioned.

## Decision

1. `CanonicalShipType` is the 14-type union exactly as DESIGN-22 §1, in registry
   precedence order.
2. `classifyShip(design): CanonicalShipType` derives the type **deterministically
   and without runtime inference** from the compiled `CompiledDesignVersion`, via a
   versioned classifier `ship_type_classifier_v1` (a captured `SHIP_TYPE_CLASSIFIER_VERSION`).
3. The type is **never authored** by content and **never inferred at runtime**; it
   is a pure function of the compiled design.
4. Classification is a versioned ruleset contract: any change to the classification
   rules bumps `ship_type_classifier_v1` and is a design revision, not an ambient
   tune.
5. A design whose compiled fields cannot be classified by `v1` throws
   `InvalidShipType` (loud, no fallback).

## Consequences

- Deterministic: identical designs always classify identically; promotion carries
  the exact canonical type into `TacticalShipUnit.shipType`.
- Division compatibility (DESIGN-26 §4 `division_type_compatibility_v1`) can rely on
  the same type without re-deriving or trusting authored text.
- Content cannot force an illegal classification; a mis-authored hull family fails
  loudly at promotion rather than silently mis-grouping.
- Classification changes are versioned (ruleset change), auditable, and non-silent.

## Related requirements

- DESIGN-22 §4 (classification result), §5 (intended vs. natural), §27
  (28. identical inputs → identical results and hashes).
- DESIGN-37 §1 (ship readiness/type inputs), DESIGN-26 §4 (compatibility).

## Related ADRs

- ADR-0007 (cross-process determinism: classifier must be ambient-free).
- ADR-0012 (B-1-1 package boundary).