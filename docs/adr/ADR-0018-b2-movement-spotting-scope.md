# ADR-0018 (B-2): Tactical Movement/Spotting/Contact Scope & Integration Boundary

## Status

Accepted

## Context

B-2 is the second M2 sprint: the DESIGN-38 (`docs/rules/tactical-combat.md`)
**movement / spotting / contact-state** subset. B-1 already shipped the
`TacticalBattleState` scaffolding and a strategic strength-based `BattleResolver`
(AUTO_RESOLVE default per ADR-0017). DESIGN-38 §3 defines a 15-step tactical
minute pipeline; §20 movement state; §19 contact-constrained targeting; §8 core
tactical state. The existing combat package has typed placeholders (`MovementState`,
`ContactTrack`, named-but-empty pipeline phases) but **no** movement kinematics,
detection model, contact lifecycle, or minute-advance simulation.

Two questions were open: (1) how much of DESIGN-38 B-2 should actually implement,
and (2) whether the new simulation should be wired into the monthly phase pipeline,
replacing the accepted `BattleResolver` auto-resolution path.

## Decision

1. **Scope = movement/spotting/contact subset.** B-2 implements, as a pure
   deterministic engine in `@bluewave/combat` over `TacticalBattleState`:
   movement kinematics (position/propulsion/turning/formation stations, §20, §3
   steps 5–6), a detection/spotting model (spotting, step 8), a contact/
   knowledge lifecycle (step 4, §19), and a `TacticalClock`-driven minute-advance
   that runs steps 4–8 in DESIGN-38 order. Gunnery (B-3), armor/damage (B-4),
   weather modifiers (B-5), smoke (M3), ECM/radar (M5), collisions/grounding
   resolution, and phase-pipeline wiring are deferred to their named sprints.
2. **Baseline clear-daylight visibility only.** Weather/smoke/visibility constants
   (DESIGN-42) land in B-5; B-2 uses a neutral baseline multiplier (1.0) so later
   sprints multiply without changing B-2 semantics.
3. **Engine-only — not wired into the phase pipeline.** B-2 does **not** modify the
   campaign snapshot schema, the phase registry, or `battle_resolution`;
   `BattleResolver` and `StrengthCalculator` remain unmodified (as from B-1).
   Results→campaign integration is **B-6**. Collisions/grounding (step 7) emit
   successful **empty** records this sprint (a recorded hook, not a silent skip).
4. **Content = engine versioned constants.** The formation/movement "content
   deliverable" is shipped as `*_v1` versioned constants with `SHIPPED_*_CONTRACT`
   + validate guards, grounded in `docs/research/b2-m2-movement-spotting.md`.
   No production-pack YAML (`content/production/1880/`) change; golden hashes remain
   unchanged (no ADR-0007 regeneration). A future tactical-constants collection may
   absorb them at integration.

## Consequences

- B-2 adds engine capability without disturbing the accepted M1 strategic auto-
  resolution path; goldens stay 9/9 and `BattleResolver` is verifiably unmodified.
- B-2's relationship to DESIGN-38 is bounded and explicit: steps 4–8 implemented,
  step 7 empty-recorded, steps 10–15 (damage, withdrawal, battle end) not yet
  reached (later M2/M3).
- Collisions are deferred rather than silently skipped, per ENGINEERING-CONTRACT
  failure policy (explicit `resolve_collisions_grounding` empty record).
- Station/formation/sensor constants are authoritative and versioned; tuning is a
  balance-bound decision, not a decision-request.

## Related requirements

- DESIGN-38 §3, §8, §19, §20, §35, §36 (subset).
- DESIGN-26 (formations), DESIGN-07 (fixed-point), DESIGN-55 §3 (M2 dependency).

## Related ADRs

- ADR-0017 (B-1-6 auto-resolution scope), ADR-0016 (B-1-5 manifest/seed),
  ADR-0007 (cross-process determinism).
