# 12 — Disengagement so battles can end without elimination

**Spec:** ../spec.md — follow-up from ADR-0053 (lethality tuning)

**Blocked by:** none

**Status:** DONE (2026-10-08, ADR-0073; reviewer APPROVE)

**Frontier:** no

## Problem (evidence)

After ADR-0053 every sweep battle (120/120) ends `no_viable_combatants`; mean
sunk is 2.8 of 4 for equal fleets. Lethality constants cannot change this:
`mutualDisengagement` and withdrawal are wired false in `viability.ts`, sinking
is a one-way snowball once flotation drains, and the only other exit is the
360 min time limit. The target of "a meaningful share not ending in elimination"
needs a disengagement/withdrawal rule.

## What to build

- A deterministic withdrawal/disengagement predicate (e.g. a side below a
  fleet-strength fraction breaks off; ADR with a versioned constant).
- Sweep acceptance: equal 2v2 fleets: >= 20% of battles end in disengagement or
  time_limit; mean sunk < 2.0; length stays 30-90 min.
- Re-pin affected baselines (ADR-0007), regenerate the sweep.
