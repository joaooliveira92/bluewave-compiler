# Ticket 04 — Sea-State Profile Policy

**Type:** decision
**Status:** resolved
**Blocked by:** 01

## Question

DESIGN-34 §13–17 define the tactical sea-state scale and detection/observation/
attack/surface-snorkel multipliers. Are these exact shipped integers (no research,
no tuning), and how are the §16 "MUST NOT alter torpedo" constraint and §17 sea
state 8–9 prohibitions enforced?

## Decision

- **Exact integers, no BALANCE TARGET, no research.** All sea-state constants are
  `MUST`-level shipped integers inside DESIGN-34:
  - §13 scale 0..9 + categories (`CALM` 0–1, `OPTIMAL` 2–5, `HEAVY` 6–7, `SEVERE`
    8–9); optimum band 2–5.
  - §14 detection multipliers (0:13_000, 1:11_500, 2:10_000, 3:9_500, 4:9_500,
    5:10_000, 6:10_500, 7:11_000, 8:11_500, 9:12_500).
  - §15 observation multipliers (0:11_000, 1:10_500, 2:10_000, 3:10_000, 4:10_000,
    5:9_500, 6:8_000, 7:6_500, 8:5_000, 9:3_500).
  - §16 attack multipliers (0:10_000, 1:10_000, 2:10_500, 3:11_000, 4:11_000,
    5:10_500, 6:8_500, 7:7_000, 8:5_000, 9:2_500); peak 11_000 at 3–4.
  - §17 sea state 8–9: deck-gun attack prohibited, surface battery charging
    prohibited (unless a tech permits), snorkel machinery-reliability 7_500 bp,
    surfaced transit speed 7_500 bp; sea state 0–1 surfaced operation additional
    detection 12_500 bp after §14.
- **Fail-closed §16 guard:** sea-state attack modifiers MUST NOT alter torpedo
  warhead damage, nominal speed, or nominal range — enforced via a
  `validateSeaStateAttackModifiersDontTouchTorpedo` guard on the shipped contract.
- **§17 predicate:** `submarineSeaStateOperationProhibited(seaState, operation)`
  returns true for deck-gun attack / surface battery charging at 8–9 →
  `SUBMARINE_SEA_STATE_OPERATION_PROHIBITED`.
- Sea-state profile ships as `submarine_sea_state_v1` + `SHIPPED_*_CONTRACT` +
  `validate*Contract` fail-closed guard.

## Rationale / authority

Design-34's §13–17 are normative exact integers; there is no BALANCE TARGET to
tune and no primary-source catalog to ground (unlike DESIGN-40 torpedo models).
The fail-closed guard prevents the §16 constraint from being violated silently.
