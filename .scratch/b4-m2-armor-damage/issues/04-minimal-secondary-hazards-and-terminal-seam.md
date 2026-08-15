# Ticket 04 — Minimal Secondary Hazards & Terminal-State Seam

**Type:** decision
**State:** RESOLVED
**Blocked by:** 03

## Question
Stages 6 and 8 of DESIGN-41 §3 (secondary hazards, terminal-state evaluation) are
normative but their subsystems are largely M3/C-5. What does B-4 include?

## Decision
- **Stage 6 (secondary hazards):** only **magazine/ammunition reaction** (the
  first and most fundamental §10 hazard) is in-slice, triggered by a
  full/critical penetration into a magazine or turret magazine-adjacent zone.
  It fires once the owning mechanical integration (B-3 energy seam) is present
  and uses a **keyed deterministic draw** (domain-separated
  `battle/ship/damage/magazine` stream) for the reaction. The other §10 hazard
  classes (torpedo/mine-store, aviation-fuel/ordnance, boiler/machinery,
  electrical, fire spread, flooding spread, steering/command, crew-casualty) are
  **recorded-deferred to M3/C-5**. When no in-slice hazard applies, Stage 6
  emits a successful empty record.
- **Stage 8 (terminal-state evaluation):** basic detection only —
  `flotationReserve == 0` → initiates `SINKING` (§31 with the shipped
  `sinkingDurationMinutes` formula `clamp(10,360, floor(baseSurvivalMinutes ×
  flotationFactorBp × stabilityFactorBp × damageControlFactorBp / 10_000^3))`);
  catastrophic structural breakup (§32 first bullet) → `FOUNDERED`. No
  stabilization / abandonment / scuttling / capture / recovery / sinking credit /
  victory points this sprint (recorded → M3/C-5 + B-6).

## Rationale / authority
DESIGN-41 §10, §31–32 (basic predicates), §3 (no-skip with empty record).
Magazine reaction is inseparable from armor/penetration (an armor slice without
it would be incoherent); the balance of hazards is genuinely M3 operational.

## Consequence
Deterministic damage outcomes drive `DamageEventRecord`s that later sprints
extend without rework; goldens unaffected (no such events in existing fixtures).