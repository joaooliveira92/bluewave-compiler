# CONTENT-2 — 01: PRE_WAR slice scope

## Question

The `SPRINT-PLAN.md` describes CONTENT-2 as an ambiguous *"and/or"* of
**deployment** (unassigned), **blockades** (B10c blocked), **PRE_WAR-band
content**, and "battleground/mission content flagged in the CONTENT-1 charter"
(the CONTENT-1 brief contains no such flag). Which concrete slice should
CONTENT-2 deliver now?

## Type

decision

## Status

resolved

## Notes

- Own capabilities that are `ACCEPTED`: Economy (B10a), Research (B10b),
  Ship Design (B10b), Construction (B10a), the M1 strategic pipeline.
- Deployment (DESIGN-25) is unassigned; Blockade (DESIGN-32) owner is B10c,
  which is blocked on the victory-classification decision request.
- The DesignTemplate schema and research-field registry are implemented and
  tested (A-0b PASS), so the compiler can already consume more techs/designs.

## Blocked by

None (this slice). The deferred deployment/blockade slice is blocked, which is
why it is deferred here.

## Answer

**CONTENT-2 = the PRE_WAR-band (Jan 1900 – Dec 1919) technology + ship-design
continuation** of `content/production/1880/`. It is authorable now because both
own capabilities (Research, Ship Design) are `ACCEPTED`, the compiler can
consume the records with zero engine change, and every tech's prerequisites are
within the already-authored set. This keeps CONTENT-2 `SUPPORTED_MECHANICAL`
with no unreachable-locked content.

Deferred (documented, not fabricated):
- **Deployment** (DESIGN-25) — unassigned subsystem; will be scoped when the
  strategic/economic coverage (DESIGN-55 §20) is claimed, after ownership is
  resolved in a Track A/B scoping sprint.
- **Blockades** (DESIGN-32, B10c) — blocked on the separate decision request.
- **AVIATION / CARRIER_OPERATIONS** PRE_WAR techs — real 1911–19 scout aviation,
  but the aviation unit mechanic is M4 (not accepted); authoring a reachable
  AVIATION research tech now would reference an unsupported unit family. Deferred
  to the D-track content sprints.

Sources: `SPRINT-PLAN.md` §Immediate next action; `.ai/AUTONOMOUS-AGENT.md`
stop conditions; DESIGN-55 §12/§14/§20.