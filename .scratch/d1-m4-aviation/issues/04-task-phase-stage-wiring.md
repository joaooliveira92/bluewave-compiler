## Question

Where in the monthly phase pipeline does aircraft development resolve?

DESIGN-43 §8 mandates a keyed RNG stream for proposal generation. This means:
- Aircraft development needs a phase with `rngAllowed: true`.
- Where should it sit in the existing 14-phase registry? Candidates:
  - After `resolve_research` (order 7) and before `battle_generation` (order 7.5) — aircraft development is a strategic R&D activity.
  - After `construction_processing` (order 6) and before `resolve_diplomacy` (order 6.5) — if aircraft development is more industrial.
  - After `battle_resolution` (order 8) — if it needs battle outcomes to inform development priorities.
- Does it require a new phase stage or can it be folded into an existing one (e.g., `resolve_research` already has RNG)?
- What's the impact on golden hashes (regeneration under ADR-0007)?
- What's the no-op behavior when no nation has aviation tech?

Produce a decision: phase identifier, order, RNG policy, and no-op contract.

## Type

task