# 06: Fit validation before derivation (P1)

**Type:** implementation
**Status:** open
**Blocked by:** 03
**Frontier:** no
**Requirements:** SPM-R12 · Stories 23, 24, 27

## What to build

A ship designer gets a clear, structured finding when a loadout does not fit, before any
derived calculation runs. Fit validation is a pure stage, run in this order:

1. the slot exists;
2. interface match **and** every constraint, checked on the resolved spec;
3. `mountCount` bounds, including nested entries;
4. lifecycle at the design month;
5. national access and hard limits (the stricter of national and platform wins);
6. placement.

Findings are sorted: `FIT_COUNT_EXCEEDED`, `FIT_INTERFACE_MISMATCH`,
`FIT_CONSTRAINT_VIOLATED`, `FIT_NOT_YET_AVAILABLE` (with the date), `FIT_UNAVAILABLE`
(with `supersededBy`) and `FIT_NATION_ACCESS`. Expected errors are findings; only
invariant breaks throw (ADR-0152).

## Acceptance criteria

**Framework completeness.** All `FIT_*` rules, their ordering, the diagnostics and the
barrier that stops derivation all exist:

- [ ] Design-compile seam tests produce each `FIT_*` finding from a hand-built fixture
      loadout, including a nested over-full `guns` slot and a slot with 0–3 forward mounts.
- [ ] Findings are deterministically ordered, and stay identical across runs and when the
      input entries are permuted.
- [ ] An invalid loadout yields its findings, and no derived metrics are computed from it.
- [ ] A national limit stricter than the platform's wins, and vice versa (ADR-0089).

**Content-family coverage.** This ticket proves the gun slice only:

- [ ] Every gun loadout from ticket 03 passes validation on the compatibility slot
      templates, with no new findings.
- [ ] No placeholder content is invented for torpedo or other families. Tickets 04 and 05
      add their own fixtures, and ticket 08 verifies all 823 placements together.
