## Question

What is the authoritative state model for aircraft inventory, squadron assignments, and basing slots under `NationState`? 

Key questions:
- Does aircraft state live under `NationState` (like fleets, research, treasury) or in a new top-level snapshot field?
- How do inventory counts work? Is it a flat count per model+condition, or per-aircraft tracking?
- How do squadron assignments reference aircraft (count-based? individual tail numbers?) 
- How does basing capacity tracking work — per-base `BasingSlot` records?
- What's the relationship between aircraft production (DESIGN-43 §37, deferred) and the inventory model?
- How does this interact with existing `FleetState`, `Ship`, and `PortData` structures?

Produce a decision: the exact TypeScript types/interfaces and where they live.

## Type

task