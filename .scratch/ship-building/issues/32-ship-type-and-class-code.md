# 32: Ship type and class code

**Type:** implementation
**Status:** open
**Blocked by:** none
**Frontier:** yes

Spec: `parity-spec.md` F2. Derived class code (type + main battery), chosen type vs natural class finding.

Acceptance:
- `classCode(facts)` pure function in `classification.ts` (deterministic, EARLY types only).
- Metrics panel shows the class code; Submit panel lets the player choose a type from `EARLY_SHIP_TYPES` and warns when it
  differs from the natural class (advisory finding, not blocking).
- Tests for code format, mixed batteries, no guns, disagreement finding; render test.
