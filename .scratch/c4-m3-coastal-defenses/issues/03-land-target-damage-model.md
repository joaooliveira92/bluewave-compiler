# Decision 03: Land-target damage model

## Question

DESIGN-48 defines 5 damage states (Intact → Suppressed → Damaged → Disabled → Destroyed) for 7 land target types. How should the damage progression work?

## Options

**A. Pure state map + Boolean progression.** Each land target has a `currentState: LandTargetDamageState` field. Progression is a pure function: given current state and a damage application event, return the next state. No HP thresholds, no partial damage — a simplification of the B-4 damage pipeline's approach, appropriate for the value-only model before tactical integration.

**B. HP-threshold model.** Each land target has HP and damage accumulates until thresholds are crossed (same as the ship damage model in B-4).

## Decision

**Option A.** Boolean state progression (5 states, sequential). This matches the DESIGN-48 wording ("Intact/Suppressed/Damaged/Disabled/Destroyed" — defined damage states, not HP ranges). A damage application must provide a typed event indicating what damage is applied (e.g., `BOMBARDMENT`, `SHELLING`, `ASSAULT`), and the model returns the next state. This avoids duplicating the ship damage pipeline's HP model for a pure value type. Recorded as `coastal_defense_v1` constant in the shipped contract.