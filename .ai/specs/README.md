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
- Content-authoring hardening (complete schema coverage + decode at the artifact boundary; one manifest authority; codepoint ordering; machine-checked provenance + placeholder release gate; committed content lock + `content:verify`; presentation corpus sourced from the artifact over IPC) → `.scratch/content-authoring-hardening/` (spec.md, CAH-* ACs; extends content-runtime-integrity)
- Naval Age master/detail rework (live "Rules of the Naval Age" screen adopts the Fleet Dispatch master/detail pattern; shared deck + globe primitives) → `.scratch/naval-age-master-detail/` (spec.md, AC-1..18 / NAM-1..10; issues 01..05)
- SB-3 (building-ships process manual parity, EARLY band, delta over SB-1/SB-2; manual p30–33 + p131–134, DESIGN-13/22/23) → `.scratch/shipbuilding-process/` (spec.md, SB3-R1..R35; tickets INC-1..INC-17). **Landed and gated**: classification parity, project-status migration, halt/resume/delay, engine acceleration + capacity pressure, batch order + naming, dock ceiling/expansion/capacity cap, foreign yards (server-derived terms INC-17, war effects + impoundment INC-10), rebuild/bulge + armament-change validation, and the player surfaces (batch dialog, dock/capacity panel, foreign builder, halt/resume/accelerate, rebuild) each with render tests, `pnpm snap` and e2e; INC-9c builder priority and the INC-3b/5b/6b/7b/8b/9e/9f/12b/15b slices closed. **Remaining (no open frontier)**: INC-11 foreign tech-insight (blocked on content-technology materialisation; owner: content-runtime-integrity) and INC-16 ship-dimension dock predicate (deferred; needs persisted length/beam, owner: ship-design/campaign content).
- Era- and nation-aware ship visualization (design-workspace profile + plan; part catalog keyed nation × era × size × mount class × guns; EARLY first; ADR-0148) → `.scratch/ship-visualization/` (spec.md, SV-R1..R13 / INC-1..INC-4)
- RULES.md compliance (close the six audit gaps — authoritative wall-clock in `transitionRecord`; untagged/`instanceof` errors; cast-trusted boundaries; ambient `node:fs` in the compiler parse stage; raw archetype serialization; the console allowance — and freeze each always-apply rule as a fail-closed preflight ratchet gate) → `.scratch/rules-compliance/` (spec.md; sliced into 7 fully-parallel tickets at `issues/`; governance only, goldens byte-identical)
- Ship part model (platforms, slots, parts; one catalogue for all ship part families; `mountCount` × `gunsPerMount`; application bases; lifecycle and revisions; equivalence-gated migration; ready-for-agent, P1 authorised) → `.scratch/ship-part-model/` (spec.md, SPM-R1..R26; design proposal.md rev 4.1, D1–D19; tickets 01–16, frontier 01, 16 gated on D16)
