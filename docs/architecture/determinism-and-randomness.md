# DESIGN-08: Determinism And Randomness

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-08`
> **Amended by:** ADR-0103.

Determinism Requirement:

- Identical content, ruleset, initial snapshot, commands, and seeds must produce
  identical authoritative hashes.
- Determinism must hold across supported operating systems.

Random Streams:

- A single global consumptive RNG stream is prohibited.
- Random outcomes use named hierarchical streams.

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

Save/Reload Rule:

- Reloading and repeating identical commands reproduces identical outcomes.
- UI navigation, reporting detail, and visual effects do not consume
  authoritative randomness.
- AI decisions are deterministic and included in replay verification.
