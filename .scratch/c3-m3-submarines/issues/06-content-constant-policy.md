# Ticket 06 — Content / Constant Policy & Research Scope

**Type:** decision
**Status:** resolved
**Blocked by:** 01

## Question

Does C-3 require a primary-source research/grounding pass (like DESIGN-40
torpedo models), or are DESIGN-34's constants already exact shipped integers
(like DESIGN-35 mines)?

## Decision

- **No background research agent invoked.** Every mechanical constant C-3 ships
  is a `MUST`-level exact integer already inside DESIGN-34: policy weights §5,
  reliability multipliers §7, remote-efficiency table §9, long-range ASW
  vulnerability §10, screening ratio/opportunity table §18, sea-state scale +
  detection/observation/attack/surface-snorkel multipliers §13–17, friendly-fire
  base probability §23. There is no open catalog (unlike DESIGN-40's
  `torpedo_models_v1`, which required grounding real torpedo models).
- `docs/research/c3-m3-submarines.md` records this finding plus **light historical
  framing** for the five canonical submarine types (coastal, medium/long-range,
  minelaying, missile) — explicitly non-normative context, NOT a grounding
  requirement or a source of authoritative constants.
- **No production-pack YAML change** (`content/production/1880/` untouched;
  goldens unchanged). The "content deliverable" is the engine-versioned constant
  set wired directly from DESIGN-34's own integers.
- Balance targets are non-normative (SPRINT-PLAN content rules): any tuning would
  be recorded; none is expected since DESIGN-34 ships exact values.

## Rationale / authority

Mirrors C-2 ticket 06 / ADR-0033: exact shipped integers need no grounding;
light historical framing is included for readability only and explicitly flagged
non-normative. No authoritative value is invented or tuned.
