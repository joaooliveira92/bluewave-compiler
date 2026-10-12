# ADR-0130: BULGE refit kind

## Status

Accepted (2026-10-12).

## Context

The reference manual's rebuild list (BUILDING SHIPS, printed p32) includes "add
bulges, which will increase torpedo protection but will also reduce speed". The
refit-kind union in `@bluewave/ship-design` (`MAINTENANCE_REFIT` …
`ROLE_CONVERSION`) had no bulge action. SB-3 `INC-12` adds it as a first-class
rebuild, extending the armour/rebuild subset already delivered by SB tickets
21/28 (ADR-0067 §3, ADR-0078).

## Decision

### 1. A `BULGE` refit kind

`RefitKind` gains `BULGE`, running as a `REBUILD` project type so it passes
through the retained-hull path (`rebuild_validation_v1`, DESIGN-23 §21) and the
normal compile like every other rebuild. The authored balance gives it a rule
(`projectType: REBUILD`, torpedo-work scope, no equipment categories).

### 2. The blister is modelled as added hull mass

`RefitPlan.bulge` carries the blister's added mass, which is folded into the
hull's target displacement before `compileDesign` runs. The compile therefore
re-derives displacement, stability and the achievable speed, and the speed
penalty the manual describes emerges from the heavier hull with unchanged
installed power. A `BULGE` refit without a blister fails with
`REFIT_BULGE_REQUIRED`; a blister under any other kind fails with
`REFIT_BULGE_KIND_MISMATCH`.

### 3. Versioned constants (BALANCE TARGET)

The manual gives directions, not numbers. Two authored constants are declared:
`bulgeProtectionGainBp` (the torpedo-protection gain credited to a bulged ship)
and `bulgeSpeedPenaltyBp` (the nominal speed penalty recorded for evidence).
The realised speed penalty is the compile's own, from the added mass.

## Consequences

- The manual's bulge action is available inside the existing rebuild validation
  and compile path; no new engine command or project type is introduced.
- No value is invented in code: the protection gain and nominal penalty are
  authored `balance.yaml` constants marked BALANCE TARGET.
- The rebuild surface (UI) that offers the action is a follow-up (`INC-12b`); a
  UI change needs a captured screen (AGENTS.md).

## Alternatives considered

- **Model bulges as armour regions (a `TORPEDO_BELT` edit under
  `ARMOUR_MODIFICATION`).** Rejected: the manual lists bulges as their own
  rebuild action with a speed penalty, not an armour-plate change, and the
  union should name it so the AI and UI can offer it directly.
- **Set the speed penalty directly on the design.** Rejected: speed is derived
  by the compile from power and displacement; overriding it would bypass the
  validation the ticket requires.
