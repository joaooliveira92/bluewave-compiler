# Ticket 06 — Content/Constant Policy & Research Scope

**Type:** decision
**Status:** resolved
**Blocked by:** 01-scope-boundary, 04-sweeping-dual-equipment

## Question

The task brief for this sprint requires either a research note grounding
real-world mine data (per the C-1 torpedo-model precedent) or an explicit,
non-fabricated statement that research isn't needed. Which applies to C-2, and
why?

## Decision

**No background research agent is invoked; research is not required to author
this slice's constants**, for a reason structurally different from C-1:

- C-1 (torpedoes) needed research because DESIGN-40 defines the torpedo-model
  **schema** (§1) but deliberately leaves the actual model catalog (specific
  torpedoes with specific speeds/ranges/warheads) unspecified — that catalog had
  to be grounded against NavWeaps/NHHC/primary sources or it would have been
  fabricated.
- DESIGN-35 does the opposite: it defines both the mine-type **schema** (§2) and
  the actual **shipped numeric constants** that parameterize it directly in the
  design document — sweeping resistance by mine type (§9), severity weights by
  outcome (§15, deferred but still doc-specified), decay retention by mine type
  (§21), standoff thresholds (§16), sweeping base values (§7), dual-equipment
  mode multipliers (§8). There is no open catalog to ground; DESIGN-35 already
  did the "content authoring" the design owner apparently intended for the
  mechanical constants.
- The only place mine warfare has an open content catalog analogous to
  torpedo models is **specific historical minefields / mine designations**
  (e.g., a real WWI North Sea Mine Barrage entry, a specific German UMB
  contact-mine model) for the **production content pack** — and that is
  explicitly content-track work, out of scope for this engine-scoping sprint
  (no `content/production/1880/` YAML is touched).

A short research note is still landed at `docs/research/c2-m3-mine-warfare.md`
per the task's instructions, but its content is this finding plus light,
clearly-flagged historical framing (why the six canonical mine types map to real
mine-warfare history) — not primary-source-verified numeric grounding, since
none of DESIGN-35's shipped numbers require it. The note explicitly says so
rather than fabricating verification that didn't happen.

## Deferred (recorded)

- Production-pack historical mine-type content (real minefields/models,
  grounded research) — content track, triggered whenever a production scenario
  needs mine-warfare content authored (not scheduled by this sprint).

## Rationale / authority

`.ai/SPRINT-PLAN.md`'s content research model requires grounding when content is
**authored** (nations, hulls, weapons, aircraft, electronics, era progression) —
DESIGN-35's mechanical constants are not authored content, they are canonical
ruleset values already fixed by the governing design document. Claiming
"research-grounded" for numbers that were never independently verified against
a primary source would itself violate the "research, don't invent" rule in
reverse (fabricating a provenance claim). Stating plainly that research isn't
needed is the correct, honest resolution.
