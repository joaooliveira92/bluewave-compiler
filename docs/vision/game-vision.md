# DESIGN-01: Game Vision

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-01`

Purpose:

- Bluewave is a long-form naval strategy and tactical combat simulation.
- The player leads the naval institution of a major power rather than
  representing one fixed historical individual.
- The campaign models naval policy, fleet design, procurement, research,
  deployment, diplomacy, war, political confidence, and tactical command.
- The player influences foreign policy but does not directly control the
  whole national government.
- Campaign success is evaluated relative to the nation's starting position,
  assigned strategic objectives, political confidence, and long-term naval
  performance.

Primary Player Fantasy:

- Shape a nation's navy across multiple technological eras.
- Design ships and force structures under economic, industrial, political,
  treaty, and technological constraints.
- Prepare for wars whose timing and diplomatic context are not fully under
  player control.
- Command selected tactical engagements.
- Preserve the navy's institutional standing and leave a capable legacy fleet.

Core Design Principles:

- Decisions must have visible causes and traceable consequences.
- Historical asymmetry is intentional, but career evaluation is relative to
  each nation's opportunities and constraints.
- Randomness must be deterministic, seeded, domain-separated, and auditable.
- The player and AI issue commands through the same rules wherever practical.
- Information presented to the player is limited by intelligence and fog of war.
- The database stores canonical content and authoritative state, not duplicated
  procedural projections.
- All derived values must be reproducible from authoritative inputs.
- Save/load must preserve deterministic future outcomes when the same commands
  are repeated.
- Tactical combat must never be required for campaign continuity; every battle
  must support deterministic auto-resolution.
- No campaign may begin unless all start-readiness gates pass.
