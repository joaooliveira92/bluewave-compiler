# Bluewave Implementation Specs

This directory is a **pointer index only** — the specs themselves live on the
issue tracker as `.scratch/<slug>/spec.md` (see `docs/agents/issue-tracker.md`).

Produced by the **spec-creator** subagent using the **`to-spec`** skill
(`.opencode/agents/spec-creator.md`), then sliced into vertical implementation
tickets by **`to-tickets`** (`.scratch/<slug>/issues/`).

Completed efforts are pruned from the tracker (git history is the archive; see
`scratch-archive-*` tags). Current specs:

- Desktop battle-outcome surfacing (B-6 follow-up) → `.scratch/desktop-battle-outcomes/` (spec.md)
- SB-1 (Ship-building component-level design workshop) → `.scratch/ship-building/` (spec.md, AC-1..15 / SB-00..SB-18)
- SB-2 (ship-building parity with the reference design screen) → `.scratch/ship-building/parity-spec.md` (tickets 31-35)
- Simulation battle identity labels (presentation-only) → `.scratch/simulation-battle-identity-labels/` (spec.md, AC-1..AC-12, ready for slicing)
- Content-runtime integrity (full-surface content artifact; main consumes/verifies; renderer IPC decoupling; packaged smoke; strict YAML + invariants) → `.scratch/content-runtime-integrity/` (spec.md, CRI-* ACs / issues 01..06)
- Naval Age master/detail rework (live "Rules of the Naval Age" screen adopts the Fleet Dispatch master/detail pattern; shared deck + globe primitives) → `.scratch/naval-age-master-detail/` (spec.md, AC-1..18 / NAM-1..10; issues 01..05)
- SB-3 (building-ships process manual parity, EARLY band, delta over SB-1/SB-2; manual p30–33 + p131–134, DESIGN-13/22/23) → `.scratch/shipbuilding-process/` (spec.md, SB3-R1..R35; sliced INC-1..INC-15)
