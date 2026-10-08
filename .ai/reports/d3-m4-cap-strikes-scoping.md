# Validation Report: D-3 M4 Aviation CAP & Strikes Scoping

## Outcome

`PASS` — D-3 scoping complete with spec, brief, research note, wayfinder map with 6 resolved decision tickets, and 8 implementation tickets.

## Scope delivered

D-3 scoping sprint for M4 Aviation air-combat tactical integration (DESIGN-43 §§22-31 mission roles + DESIGN-44 carrier strike operations in tactical combat). Delivered:

1. **Research note** — `docs/research/d3-m4-air-combat-model.md` (320 lines, 7 sections). Grounded 6-factor squadron-quality air-to-air exchange formula: quality ratio, numerical advantage, altitude, surprise, defender survival, escort. Primary sources: existing Bluewave combat formulas (gunnery, torpedoes) + historical wargame models (Carrier 1990, Carriers at War 1992, Uncommon Valor 2002, Flattop 1977). Key findings: 6 factors vs gunnery's 17; combatIndex = (speed+firepower+maneuverability)/3; CAP engagement order (escort first, then bombers); disruption axis reduces bombing accuracy.

2. **Wayfinder map** — `.scratch/d3-m4-cap-strikes/map.md` — updated with 6 resolved decision tickets (1 research via research subagent, 5 task resolved in spec), remaining fog cleared.

3. **Spec** — `.scratch/d3-m4-cap-strikes/spec.md` — 22 acceptance criteria (AC-1..AC-22) mapped to requirement IDs + proving tests, 8 implementation increments (INC-1..INC-8) with blocking edges, scope boundary (§1.3), reason-code map (16 shipped + 3 deferred markers), minute-advance stage position (step 1 substep 1, before gunnery substep 2), 5 `*_v1` contracts plan.

4. **Implementation tickets** — 8 frontier-ordered issue files at `.scratch/d3-m4-cap-strikes/issues/INC-1..8.md` with blocking edges.

5. **Brief** — `.ai/briefs/d3-m4-cap-strikes.md` — milestone brief following established pattern.

6. **`.ai/specs/` pointer** — `.ai/specs/d3-m4-cap-strikes.md`.

### Deferred (recorded in spec §1.3)

- AA / air defense (→ D-4)
- Experience/fatigue modifiers (DESIGN-28, unassigned)
- Content YAML constants (CONTENT-track)
- Player UI (desktop-track)
- Strategic AI mission planning (AI package)
- Multiple CAP passes per minute (future micro-update)
- Fuel endurance model beyond basic check (future M4)

## Requirements evidence

| AC          | Requirement                                                                                                                                                                                      | Status | Evidence                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | --------------------------------------------------------- |
| AC-1..AC-22 | All CAP patrol, detection, interception, exchange, disruption, strike state machine, bombing, torpedo, damage, egress, recovery, records, ordering, reason codes, contracts, wiring, determinism | SCOPED | Spec `.scratch/d3-m4-cap-strikes/spec.md` §1.2 full table |

## Commands and observed results

```text
(Scoping sprint — no compilation or test execution required per SPRINT-PLAN.md scoping sprint definition. Artifacts are spec, brief, research note, wayfinder map, and implementation tickets. Verification is by file presence and content review.)
```

## Determinism evidence

N/A — scoping sprint, no code changes.

## Canonical artifact changes

None — no golden hashes affected; scoping sprint edits only `.scratch/`, `.ai/`, `docs/` metadata files.

## Tests added

None — scoping sprint. Tests are specified in the implementation tickets (INC-1..INC-8).

## ADRs and dependencies

No new ADR this sprint. ADR deferred to INC-8 (engine wiring + scope/integration boundary ADR). Dependency on:

- D-1 (aircraft model definitions, squadron lifecycle, basing) — ACCEPTED
- D-2 (carrier operations state, deck cycles, launch rates, recovery, records) — ACCEPTED
- B-2 (spotting model for CAP detection) — ACCEPTED
- C-1 (torpedo hit resolution for air-launched torpedoes) — ACCEPTED
- B-4/C-5 (resolveDamage pipeline) — ACCEPTED
- `@bluewave/random` (keyed RNG streams) — available

## Changed files

```
Added:
  .ai/briefs/d3-m4-cap-strikes.md                    — milestone brief
  .ai/specs/d3-m4-cap-strikes.md                     — spec pointer
  .scratch/d3-m4-cap-strikes/map.md                  — wayfinder map (6 resolved tickets)
  .scratch/d3-m4-cap-strikes/spec.md                 — full spec (22 ACs, 8 INCs)
  .scratch/d3-m4-cap-strikes/issues/INC-1-cap-patrol-detection.md
  .scratch/d3-m4-cap-strikes/issues/INC-2-exchange-formula.md
  .scratch/d3-m4-cap-strikes/issues/INC-3-strike-disruption-state-machine.md
  .scratch/d3-m4-cap-strikes/issues/INC-4-transit-bombing-accuracy.md
  .scratch/d3-m4-cap-strikes/issues/INC-5-torpedo-attack-damage.md
  .scratch/d3-m4-cap-strikes/issues/INC-6-egress-recovery.md
  .scratch/d3-m4-cap-strikes/issues/INC-7-records-codes-contracts.md
  .scratch/d3-m4-cap-strikes/issues/INC-8-engine-wiring-gate.md
  docs/research/d3-m4-air-combat-model.md            — research note (320 lines, 6-factor formula)
Modified:
  .ai/SPRINT-PLAN.md                                  — D-3 scoping DONE, next action D-3-IMPL
  docs/PROGRESS.md                                    — M4 entry updated
```

## Git and remote status

- Branch: `dev`
- Working tree: clean (prior state) + new/modified files as above
- Push status: ahead of origin/dev by 10 commits

## Secondary consistency check

- All 6 decision tickets resolved and recorded in map.
- Spec references all 22 ACs with INC mapping, scope boundary, reason-code map, minute-advance stage position, and contract plan.
- 8 INC tickets are frontier-ordered with blocking edges declared.
- Research note 320 lines, grounded against existing combat formula patterns + historical wargame models with source citations.
- No OPEN-ISSUES.md candidates closed (none relevant to air combat existed).
- `BattleResolver`/`StrengthCalculator` unmodified (no code changes).
