# DESIGN-38: Tactical Combat

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-38`

Resolution:

- Discrete one-minute authoritative turns.
- Rendering may interpolate smoothly.
- Commands are quantized to authoritative tactical time.

Core State:

- Battle map.
- Forces.
- Divisions.
- Ships.
- Aircraft.
- Submarines.
- Contacts.
- Objectives.
- Weather.
- Smoke.
- Mines.
- Orders.
- Battle event ledger.

Realism Modes:

- Admiral:
  - Player commands lead divisions.
  - No direct manual targeting.
- Rear Admiral:
  - Player commands divisions within command reach.
  - Division target orders allowed.
- Captain:
  - Player may command any friendly division.
  - Ship targeting and manual torpedo fire allowed.
- Realism mode does not alter raw war score.
- Any realism bonus or penalty applies only to final career evaluation.

Command State:

- intended
- issued
- transmitted
- acknowledged
- executing
- completed
- failed
- cancelled

Command Constraints:

- Flagship communication.
- Visibility.
- Radio and signaling technology.
- Commander ability.
- Division experience.
- Flagship damage.
- Formation.

Movement:

- Uses fixed tactical coordinates.
- Ships have heading, speed, acceleration, turning performance, and collision
  radius.
- Full speed can cause:
  - fouled grates;
  - exhausted stokers;
  - machinery breakdown;
  - vibration penalties above 25 knots.
- Coal ships and VTE machinery are more sensitive.

Force Orders:

- flotilla_attack
- rally
- disengage
- change_lead_division
- battle_turn_away

Battle Turn Away:

- Requires technology.
- Reverses course and division order.
- May create command confusion.

Exit:

- Scenario-defined exit zones and disengagement conditions.
- Crossing a visual boundary alone does not guarantee escape.
- Pursuit, speed, contact, and mission determine successful withdrawal.

Battle End:

- Objective completion.
- Mutual disengagement.
- One side withdraws.
- Time limit.
- No viable combatants.
- Scenario-specific condition.

Auto-Resolution:

- Always available unless the scenario explicitly requires player command.
- Uses the same campaign inputs.
- Must be statistically validated against tactical simulation.
