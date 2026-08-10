# RNG Stream Families

> Extracted contract view. The originating `DESIGN-*` document remains normative.

Required Stream Families:

- setup/world
- setup/nation
- setup/fleet
- diplomacy/month/pair
- politics/month/nation
- economy/month/nation
- research/month/nation/field
- construction/month/project
- officer/month/nation
- event/month/scope
- movement/month/area
- battle_generation/month/war/area
- tactical/battle
- submarine/month/war/area
- mine/month/war/area
- air_operations/battle
- damage/battle/ship
- peace/war/negotiation

Random Decision Record:

- Stream identifier.
- Stable entity key.
- Evaluation phase.
- Ruleset version.
- Input-state hash.
- Deterministic draw or derived value.
- Outcome.
- Reason code.
