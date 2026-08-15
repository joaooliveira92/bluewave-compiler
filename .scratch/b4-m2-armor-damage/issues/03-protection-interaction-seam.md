# Ticket 03 — Protection-Interaction Seam

**Type:** decision
**State:** RESOLVED
**Blocked by:** 02

## Question
How does B-4 consume the B-3 gunnery output and the armored tactical units
without modifying B-2/B-3 modules?

## Decision
A new engine stage **`resolveDamage`** runs in the minute-advance simulation
**after** `resolveGunnery` (B-3, step 8) each tactical minute. It consumes:
- armored **`TacticalUnit`** definitions (B-1) — armor zones / thickness / design
  from the compiled ship definition (the AC-14 design⟷unit linkage concern from
  B-1 is resolved at the `TacticalUnit` seam, not the production YAML);
- the B-3 `GunneryEventRecord`'s reserved **impact/armor inputs** fields where
  populated (impact position, projectile/velocity) for full-penetration-capable
  hits;
- otherwise a presented hazard package (external seam for torpedo/mine/bomb
  contracts in later M3/M4 sprints).

`resolveDamage` runs stages 1–10 in DESIGN-41 §3 order; any incorporated stage
with no applicable effect emits a **successful empty stage result** (never a
skip). When no impact/hazard is presented in a minute it is a strict no-op and
emits nothing — **preserving B-2/B-3 hashes unchanged**. `BattleResolver` /
`StrengthCalculator` / gunnery modules remain unmodified.

## Rationale / authority
DESIGN-41 §3 ("No stage may be skipped. A stage with no applicable effect MUST
emit a successful empty stage result"); ADR-0018/0020 integration-boundary
pattern.

## Consequence
Enables B-3 event records to gain real armor outcomes downstream while gunnery
stays byte-compatible; later weapon contracts plug into the same hazard seam.