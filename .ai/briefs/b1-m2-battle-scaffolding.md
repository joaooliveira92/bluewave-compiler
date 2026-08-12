# Milestone B-1 — M2 Battle Generation & Tactical Setup Scaffolding (scoping)

> Scoping sprint deliverable for `B-1` (Track B, M2 Surface Tactical Core).
> Produced through the orchestrator pipeline: spec-creator → research → reviewer
> (see `.ai/ORCHESTRATION.md`). Implementation spec:
> [`.ai/specs/b1-battle-scaffolding.md`](../specs/b1-battle-scaffolding.md).
> Research: [`docs/research/b1-battle-scaffolding.md`](../../docs/research/b1-battle-scaffolding.md).

## Objective

Scope + plan B-1: **battle generation** (strategic contest → tactical battle) and
**tactical setup scaffolding** — promote campaign ship data into a reachable
tactical format, the divisions/formations data model, the battle manifest/seed/
reservations, and the deterministic generation pipeline integrated into the
monthly phase pipeline ahead of `battle_resolution`.

## Canonical requirements

- DESIGN-37 (`docs/rules/battle-generation.md`) — governing for generation.
- DESIGN-26 (`docs/domain/divisions-and-formations.md`) — divisions/formations.
- DESIGN-38 (`docs/rules/tactical-combat.md`) §8 tactical-state scaffolding (cross-ref).
- DESIGN-55 §2/§3 (M2 depends on accepted M1 campaign, battle-generation,
  persistence, auto-resolution boundaries) and §13/§14 (unsupported isolation).
- M1 is COMPLETED (A-5 gate). ENGINEERING-CONTRACT binding.

## Scope (from spec §1)

- Ship→tactical-unit promotion + ship-type classifier (INC-1).
- Permanent-division aggregate + invariants + command surface (INC-2).
- Battle-generation pipeline: 15 stages, 9-mission registry, opportunities,
  sides, forces, eligibility, division preservation, mandatory/optional roles,
  allied caps, reachability, repair, rejection (INC-3-4).
- Manifest canonicalization + seed + reservations + auto-resolution proof (INC-4-5).
- `battle_generation` phase (order 7.5) + save/load/replay + goldens (INC-6).
- Only `FLEET_BATTLE` + `CRUISER_BATTLE` reachable in B-1 (registered-but-unreachable
  empty records for the other seven → no `UNSUPPORTED_CONTENT_REACHABLE`).

## Out of scope (deferred)

Movement/spotting (B-2), gunnery (B-3), armor/damage (B-4), weather (B-5), battle
results→campaign integration (B-6); torpedoes/mines/subs/coastal/smoke (M3),
aviation (M4), radar/missiles (M5); fog of war; player battle UI/decline beyond the
command contract; division training; campaign split/merge/transfer commands.
`BattleResolver`/`StrengthCalculator` remain unmodified all sprint.

## Acceptance (summary; full table in spec §2, AC-1..AC-14)

14 acceptance criteria each mapped to REQ-* ids + proving tests; definition of
done checklist in spec §7; validation commands in spec §6 (full orchestrator gate
incl. two golden-regen boundaries at INC-2 and INC-6 per ADR-0007).

## Decisions / ADRs

Routine (versioned-constant + ADR), no human decision-request required:
B-1-1 package boundary; B-1-2 ship-type classifier; B-1-3 reachable mission
subset; B-1-4 headless decision policy; B-1-5 manifest-hash/seed bootstrap;
B-1-6 auto-resolution-proof scope; **B-1-7 reachable opportunity predicate**
(add per reviewer; author before INC-3).

## Stop conditions (permanent rules additionally)

- If an implementator finds an internally contradictory DESIGN-37/26 statement
  _after_ the B-1 ADRs that changes authoritative manifests → decision-request.
- If a golden hash changes without a documented authoritative cause → stop.

## Required delivery (next: implementation sprint B-1-IMPL)

- Implement spec increments INC-1..INC-6 via the pipeline (implementator/reviewer
  per increment; orchestrator validation gate + commit before each).
- Update traceability (SPRINT-PLAN B-1 row → done/impl, PROGRESS, validation report
  `.ai/reports/b1-m2-battle-scaffolding.md`).
- Conventional Commits on `dev`; no self-merge.
