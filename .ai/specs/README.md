# Bluewave Implementation Specs

This directory is a **pointer index only** — the specs themselves live on the
issue tracker as `.scratch/<slug>/spec.md` (see `docs/agents/issue-tracker.md`).

Produced by the **spec-creator** subagent using the **`to-spec`** skill
(`.opencode/agents/spec-creator.md`), then sliced into vertical implementation
tickets by **`to-tickets`** (`.scratch/<slug>/issues/`).

Current specs:
- B-1 (M2 battle generation & tactical setup scaffolding) → `.scratch/b1-m2-battle-scaffolding/` (spec lives there)
- B-2 (M2 movement, spotting, contact) → `.scratch/b2-m2-movement-spotting/` (spec.md)
- B-3 (M2 gunnery core surface fire-resolution) → `.scratch/b3-m2-gunnery/` (spec.md)
- B-4 (M2 basic armor & damage-resolution) → `.scratch/b4-m2-armor-damage/` (spec.md, AC-1..16 / INC-1..6)
- B-5 (M2 tactical weather & visibility) → `.scratch/b5-m2-weather-visibility/` (spec.md, AC-1..17 / INC-1..6)
- B-6 (M2 battle results → campaign integration + M2 gate) → `.scratch/b6-m2-battle-results/` (spec.md, AC-1..14 / INC-1..5)
- C-1 (M3 torpedo fire-resolution) → `.scratch/c1-m3-torpedoes/` (spec.md, AC-1..25 / INC-1..8)
- Desktop engine-feature gate (Research & Technology screen) → `.scratch/desktop-engine-feature-gate/` (spec.md, AC-1..7 / INC-1..4)
- Desktop diplomacy & war screen (B10c) → `.scratch/desktop-diplomacy-war/` (spec.md)
- Desktop battle-outcome surfacing (B-6 follow-up) → `.scratch/desktop-battle-outcomes/` (spec.md)
- P-1 (Track P battles that matter) → `.scratch/p1-battles-that-matter/` (spec.md, AC-1..8 / 01..05)
- SB-1 (Ship-building component-level design workshop) → `.scratch/ship-building/` (spec.md, AC-1..15 / SB-00..SB-18)
- SB-2 (ship-building parity with the reference design screen) → `.scratch/ship-building/parity-spec.md` (tickets 31-35)
- Simulation battle identity labels (presentation-only) → `.scratch/simulation-battle-identity-labels/` (spec.md, AC-1..AC-12, ready for slicing)
- Division ship reordering (DESIGN-26 §8/§12, ADR-0086) → `.scratch/division-ship-reorder/` (spec.md, AC-1..AC-5 / INC-1..3)
