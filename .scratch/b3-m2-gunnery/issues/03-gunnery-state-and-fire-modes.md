# Ticket 03 — GunneryState & Fire Modes

**Type:** decision
**State:** RESOLVED
**Blocked by:** 01

## Question
What is the authoritative `GunneryState` surface and how are the seven fire modes
modelled?

## Decision
`GunneryState` (per operational battery) carries: `batteryId`, owner ship id, gun
and mount definition ids, current target contact id or `NONE`, acquisition progress
(basis points), range estimate + range uncertainty, fire-control solution quality,
ammunition state by type (exact count), current fire mode, reload progress (integer
ms), straddle state (reserved slot; not computed this slice), damage state (reserved),
AA-eligibility state (reserved), last salvo minute + substep, and ruleset + formula
versions; plus an authoritative state hash.

Seven canonical fire modes as a closed enum with a per-mode record:
`CEASE_FIRE`, `RANGING`, `NORMAL`, `RAPID`, `AA_TRACKING`, `AA_BARRAGE`, `LOCAL_CONTROL`.
Each declares ammunition use, reload behavior, accuracy behavior, target
eligibility, fire-control requirements, and cancellation behavior per DESIGN-39 §2.

- `RAPID` / `AA_TRACKING` / `AA_BARRAGE` are defined (mode semantics + reload/ammo
  behavior) but their **eligibility predicates** (straddle for RAPID; AA-capable
  eligibility) are deferred to the straddle/AA slice — a firing guard reports the
  deferred predicate rather than fabricating one.
- Integer/fixed-point enforcement via `assertFixedPointGunnery` (branded safe
  integers; non-integers rejected with `TACTICAL_STATE_INVARIANT_FAILED`), the same
  shape as B-2's `assertFixedPointMovement`.

## Rationale / authority
DESIGN-39 §1-2 normative. Deferral of straddle/AA predicates keeps the first fire
slice coherent (surface NORMAL/RANGING/CEASE_FIRE/LOCAL_CONTROL fully resolvable)
and is recorded, not dropped.
