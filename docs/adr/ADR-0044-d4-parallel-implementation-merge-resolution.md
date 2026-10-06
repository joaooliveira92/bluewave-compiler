# ADR-0044: D-4 Air Defense — Merge Resolution: adopt the 2026-09-22 `origin/dev` implementation

## Status

Accepted (2026-10-06)

## Context

D-4 (Air Defense, DESIGN-45) INC-2..INC-5 were implemented twice, in parallel,
from the shared base `1f85ea6`:

- **Local `dev` (2026-08-31, `9a13bc2`..`f2ebae7`)** — a coarser module split
  (`layer-resolution.ts`, `scaling.ts`, `reason-codes.ts`,
  `air-defense-attack.ts`) with complete INC-5 traceability (evidence report,
  ADR-0042/ADR-0043, `SPRINT-PLAN.md`/`PROGRESS.md` DONE lines, frontier at
  INC-6).
- **`origin/dev` (2026-09-22, `2d18cec`..`53ec75f`)** — the same increments
  redone three weeks later on the shared branch with a finer module split
  (`eligibility.ts`, `heavy-aa-eligibility.ts`, `medium-aa-eligibility.ts`,
  `light-aa-eligibility.ts`, `attack.ts`,
  `reasonCodes.ts`, `director-scaling.ts`, …), plus material the local run never
  shipped: `arcDegreesMax`/`roundsPerEngagement`/`magazineCapacity`/
  `localControlSupported` schema fields, `AIR_DEFENSE_SYSTEM_DEFINITION_FIELD_KEYS`
  contract pinning, magazine-seeded ammunition, and the full §17 threat
  comparator for §27 step 4. Its INC-5 docs lag its code (the INC-5 feature
  commit landed without the traceability update).

`git merge origin/dev` left 28 files conflicted. The auto-merged hunks were not
safe either: unioning both sides re-introduced a second copy of the INC-1 reason
code literals (`reason-codes.ts` vs `reasonCodes.ts`/`constants.ts`) and added
`localControlMultiplierBp` to the system-definition schema, which breaks the
`air_defense_v1` field-key pinning asserted by the contract test. A
hunk-by-hunk reconciliation would have produced a third, hybrid implementation.

## Decisions

### 1. `origin/dev` (`53ec75f`) is authoritative for the air-defense module

Every path under `packages/combat/src/air-defense/` and
`packages/combat/test/air-defense/` is taken from `origin/dev`. The local
2026-08-31 implementation of INC-2..INC-5 is superseded. Shared INC-1 evidence
(`.ai/reports/d4-m4-air-defense-inc1-system-definitions.md`), the D-4 tickets,
`spec.md`, and `map.md` are kept from either side as merged.

### 2. Superseded artifacts removed (recorded here, never silently dropped)

- **Source**: `air-defense-attack.ts`, `reason-codes.ts`, `scaling.ts`.
- **Tests**: `air-defense-attack.test.ts`, `ciws-eligibility.test.ts`,
  `layer-order.test.ts`, `light-aa-windows.test.ts`, `medium-aa-timing.test.ts`,
  `test-helpers.ts` (all bound to the removed local API);
  `constants.test.ts` reverted to the shared base version — its added
  `GUIDED_WEAPON` window assertion targets a constant the retained
  implementation does not ship.
- **Reports**: `d4-m4-air-defense-inc3-engagement-disruption-ammunition-damage.md`,
  `d4-m4-air-defense-inc4-director-scaling-radar-saturation-ciws-redundancy.md`,
  `d4-m4-air-defense-inc5-records-ordering-reason-codes-contracts.md`
  (superseded by `…-inc3-engagement-formula.md` and `…-inc4-director-scaling.md`).
- **ADRs**: `ADR-0042-ciws-compatible-terminal-defense.md` (superseded by
  `adr-0042` decision 5 — the §18 matrix plus the `profileEligibility` gate that
  makes CIWS heavy/medium ASM engagement require a declared capability) and
  `ADR-0043-air-defense-ordering-proxy-deferred-sam.md` (superseded by the
  retained `ordering.ts` §27.4 full §17 comparator per `adr-0042` decision 12;
  the six `_DEFERRED` SAM/terminal markers ship in `reasonCodes.ts`).

### 3. ADR numbering

`adr-0042-d4-air-defense-layer-resolution-eligibility.md` keeps **0042**; the
local `ADR-0042-ciws-compatible-terminal-defense.md` is removed. Number
**0043** is retired with its superseded ADR and is not reused; this decision
takes **0044**.

### 4. INC-5 traceability is deferred, not dropped

The retained INC-5 implementation (commit `53ec75f`) is code-complete and green,
but its evidence report, ADR-0042 INC-5 decisions, and the INC-5 DONE lines in
`SPRINT-PLAN.md`/`PROGRESS.md` were never written by that run. Those remain
outstanding and are recorded as the frontier in both documents rather than being
back-filled from the superseded run's numbers.

## Consequences

- One implementation, one source of truth for every module and reason code; the
  merge validation gate is green (`tsc -b` clean, lint 0/0, 357 air-defense /
  3594 combat tests, format clean).
- `.ai/reports/` holds INC-1..INC-4 evidence for the retained run only; INC-5
  evidence is the next doc task before INC-6 (engine stage wiring).
- The next ADR number is **0045**.
- The 2026-08-31 local INC-2..INC-5 work survives only as history in
  `git log`; anything of lasting value from it (INC-1 report formatting, ticket
  statuses) was carried over.

## Related

- `adr-0042-d4-air-defense-layer-resolution-eligibility.md` (the retained D-4
  decisions 1–13)
- ADR-0007 (golden hash regeneration process)
- `.scratch/d4-m4-air-defense/spec.md` (D-4 spec and AC coverage)
