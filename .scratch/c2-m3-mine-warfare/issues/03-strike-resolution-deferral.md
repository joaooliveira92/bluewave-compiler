# Ticket 03 — Strike-Resolution Deferral

**Type:** decision
**Status:** resolved
**Blocked by:** 01-scope-boundary, 02-phase-integration-boundary

## Question

Mine-strike resolution (§11 battle-mine generation, §14–15 eligibility/outcome,
§17 `BattleMineHazard`, §18 damage application, §25–26 friendly fire) is the part
of DESIGN-35 that actually damages ships — arguably the "point" of mine warfare.
Why defer all of it out of the C-2 first slice rather than including at least the
battle-tactical half (which has a closer engine precedent, `resolveTorpedoes`)?

## Decision

Defer the entire strike-resolution surface to a **C-2 continuation** sprint.
Reasoning, evaluated per candidate half:

1. **Tactical battle-mine hazard (§11, §17, in-battle §14–15/§18)** — this needs a
   new `@bluewave/combat` minute-advance engine stage. Unlike torpedoes (C-1),
   which reused B-4's damage seams directly against an existing per-battle
   `TacticalContact`/launcher model, a mine hazard's *input* is an
   `AreaMinePressureRecord` that doesn't exist as an authoritative type until
   **this** sprint ships it (ticket 01). Building the tactical stage in the same
   sprint that defines its input type is possible but inflates this sprint to
   roughly double C-1's size (C-1 was already "too large for one sprint" per its
   own scoping note) and risks discovering the pressure-record shape is wrong
   only after the tactical consumer is half-built. Sequencing pressure-model →
   tactical-stage (two sprints) is the same discipline C-1 itself used
   internally (INC-1 model before INC-7 engine stage).
2. **Strategic route-transit strike (§13 risk value ships; §14–15 application
   does not)** — a route-transit strike requires an authoritative "a ship is
   currently traveling this route and can be intercepted/struck while doing so"
   mechanic. That mechanic is owned by `deployment-and-logistics.md` (DESIGN-25),
   which `docs/acceptance/m1-capability-registry.md` / ADR-0011 record as
   `CONTENT_ONLY`/deferred at the M1 gate, and `.ai/SPRINT-PLAN.md`'s
   cross-cutting-docs list still shows as **unassigned to any track**. There is
   no existing "ship in transit" authoritative state to strike. Implementing
   §14–15 for routes now would require silently inventing DESIGN-25's core
   mechanic as an undocumented side effect of a mine-warfare sprint — this is
   exactly the ".ai/AUTONOMOUS-AGENT.md" stop condition "a fix materially
   expands scope into a deferred subsystem."
3. **Friendly-fire risk/outcome (§25–26)** — both variants (`hostileStrikeProbabilityBp`
   input) are defined as a multiplier *against* the hostile strike probability
   computed in §14–15. Since §14–15 application is deferred, friendly-fire has no
   input to multiply against; deferred alongside, not independently.

This is a genuine, evidence-based scope narrowing, not scope avoidance: every
deferred item is blocked on a concrete missing dependency (a not-yet-built engine
stage, or a not-yet-accepted DESIGN-25 capability), each recorded here and in the
map/spec "out of scope" sections, with an owning follow-up (C-2 continuation for
the tactical half; DESIGN-25 acceptance as the trigger for the route half).

## Deferred (recorded)

- §11, §17, §18 (in-battle), §14–15 (battle application) — C-2 continuation,
  frontier-ordered after this sprint via a new tactical engine-stage ticket.
- §14–15 (route-transit application) — triggered by DESIGN-25 acceptance, not a
  fixed sprint number; record as a cross-cutting dependency in `.ai/SPRINT-PLAN.md`
  when this sprint's brief is registered.
- §25–26 — deferred alongside whichever half of §14–15 lands first.

## Rationale / authority

`.ai/AUTONOMOUS-AGENT.md` requires stopping (or, for a scoping sprint, explicitly
recording rather than guessing) when "a fix materially expands scope into a
deferred subsystem." DESIGN-25 is a deferred subsystem by the project's own
acceptance registry. Building strike resolution against a mechanic that doesn't
exist yet is not a scoping decision this agent has authority to make silently;
recording the dependency here, with the exact blocking artifact
(`docs/acceptance/m1-capability-registry.md`, ADR-0011), is the correct
resolution — it closes the ambiguity (this is not a silent drop) while keeping
the sprint's actual deliverable achievable.
