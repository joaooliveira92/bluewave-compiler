# Ticket 01 — Scope Boundary

**Type:** decision
**State:** RESOLVED
**Blocked by:** none

## Question
DESIGN-39 spans gun mechanics (fire modes, accuracy, rate-of-fire, gun quality,
autoloaders §6-10, dual-purpose §11-15), armor/penetration (§16-24), straddle,
target allocation, ammunition, damage, events, and 32 §33 validation items.
What is the first bounded, engine-only vertical slice for the M2 gunnery sprint?
(Precedent: B-2 scoped only DESIGN-38's movement/spotting/contact subset.)

## Decision
Ship the **core surface gunnery fire-resolution** slice: `GunneryState` (§1), the
full fire-mode set (§2), accuracy resolution (§3), rate-of-fire/reload (§4), gun
quality (§5), ammunition count + atomic consume (§28), salvo/AA-burst →
`GunneryEventRecord` (§30), canonical ordering (§31), required reason codes (§32),
and the §33 validation items that pertain to this slice. See map "Decisions so far".

## Deferred (recorded, never dropped)
- Autoloaders (§6-10) — later dedicated gunnery slice.
- Dual-purpose (§11-15) — later dedicated gunnery slice.
- Armor zones / thickness limits / penetration outcomes (§16-24) — folds with the
  **B-4 armor-and-damage** track (DESIGN-41).
- Straddle registration (§25) + RAPID/AA eligibility predicates — later slice.
- Target allocation (§26-27) — later slice.
- Damage effects on gunnery state (§29) — B-4 / DAMAGE track.
- Phase-engine wiring (B-6), auto-resolution stats validation (B-6/release).

## Rationale / authority
Bounded first slice keeps the sprint a coherent vertical path (gun aims and fires
at a contact, deterministically, with auditable records) and defers large
independent mechanical blocks to tracks that already own them (B-4 armor/damage).
