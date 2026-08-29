# D-3 Milestone Brief — M4 Aviation: CAP & Strikes

## Objective

Scope and implement CAP (Combat Air Patrol) and strike mission execution within the minute-advance tactical combat engine under `@bluewave/combat/src/air-combat/` — mission role feasibility predicates (DESIGN-43 §§22-31), CAP tick resolution (air-to-air 6-factor exchange formula per grounded research), strike lifecycle (launch→formation→transit→attack→egress→recovery), ship attack via bomb/torpedo damage feeding into existing `resolveDamage`, new minute-advance stage (step 1, before gunnery).

## Canonical requirements

- DESIGN-43 §§22-31 (mission roles, role-specific predicates, squadron eligibility, inventory allocation)
- DESIGN-44 §§13-18 (strike prep/launch/recovery — D-2 shipped; D-3 uses for tactical execution)
- DESIGN-38 (minute-advance engine, records/ordering)
- ENGINEERING-CONTRACT binding. Goldens regenerate when `resolveAirCombat` wires in (ADR-0007). `BattleResolver`/`StrengthCalculator` unmodified.

## Starting state

D-1 COMPLETE (aircraft models, squadrons, basing, phase wiring). D-2 COMPLETE (carrier operations state, deck cycles, launch rates, recovery, records, contracts, phase wiring). M1+M2+M3 completed.

## Scope summary

| Area | Scope decision |
|------|----------------|
| CAP patrol state + detection + interception timing | IN (INC-1) |
| Air-to-air exchange formula (6-factor) | IN (INC-2) |
| CAP vs escort + CAP vs bomber engagement | IN (INC-2) |
| Strike disruption of bombers | IN (INC-3) |
| Strike tactical state machine (EN_ROUTE→ATTACKING→EGRESSING→RETURNING) | IN (INC-3) |
| Transit time calculation | IN (INC-4) |
| Bombing accuracy + dive bombing + level bombing | IN (INC-4) |
| Air-launched torpedo attack (reuse C-1) | IN (INC-5) |
| Damage integration (feeds into existing resolveDamage) | IN (INC-5) |
| Strike egress + fuel check + recovery (D-2) | IN (INC-6) |
| Records + ordering + reason codes + contracts | IN (INC-7) |
| Engine wiring (step 1, substep 1) + two-process + gate | IN (INC-8) |
| AA / air defense | DEFERRED to D-4 |
| Experience/fatigue (DESIGN-28) | DEFERRED |
| Content YAML | DEFERRED to CONTENT-track |

## Key decisions

- **State location**: `BattleState.airCombat` — new field for CAP/strike tactical state.
- **Minute stage**: step 1 (after weather, before gunnery substep 2). Strict no-op preserves prior goldens.
- **Air-to-air formula**: 6-factor squadron-quality exchange per `docs/research/d3-m4-air-combat-model.md`.
- **Damage**: bomb/torpedo hits → `AirAttackDamagePackage` → existing `resolveDamage`.
- **Air torpedo**: reuse C-1 hit resolution with air-launch predicate overrides.
- **Goldens**: regenerate when stage wires in (ADR-0007).

## Acceptance criteria

22 ACs (AC-1..AC-22) — see spec §1.2 for full table. Headline: CAP patrol, detection, interception timing, 6-factor exchange formula, CAP vs escort/bomber, disruption, strike state machine, transit, bombing accuracy, dive bombing, torpedo attack, damage integration, egress, recovery, records, ordering, reason codes, contracts, engine wiring, two-process determinism.

## Implementation increments

8 frontier-ordered tickets (INC-1..INC-8) at `.scratch/d3-m4-cap-strikes/issues/`.

## Dependencies

- M1+M2+M3 ACCEPTED (done)
- D-1 (aircraft model definitions, squadrons, basing) — ACCEPTED
- D-2 (carrier operations state, deck cycles, launch rates, recovery priority) — ACCEPTED
- `@bluewave/random` for keyed RNG streams
- Existing `resolveDamage` pipeline (B-4/C-5) — reused, not duplicated

## Deferred

AA/air defense (D-4), experience/fatigue (DESIGN-28), content YAML, player UI, AI mission planning, fuel endurance model. Full list at spec §1.3.

## Deliverable

Valid spec + 8 implementation tickets (frontier-ordered, blocks wired), ready for the implementator + reviewer + orchestrator gate pipeline.