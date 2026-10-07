# ADR-0049: P-1 — Damage Control Runs in Every Auto-Resolved Battle

## Status

Accepted (2026-10-07). Supersedes ADR-0047 decisions 1–3.

## Context

ADR-0047 gated the per-ship damage-control stage on the battle containing a unit
with `torpedoArmament`, to keep AC-6's byte-identical freeze for unarmed
battles, recording the gate as a deviation from DESIGN-41 §13/§19/§44 (fire and
flooding resolve every tactical minute in every battle).

## Decision

1. `resolveBattleAuto` builds and sends the per-ship `damageControl` map to
   `advanceMinute` in every battle. `shouldWireDamageControl` is removed.
2. Spec AC-6 is amended: the hash freeze applies only while the stage has
   nothing to progress.

## Findings

Removing the gate left the unarmed baselines byte-identical (minute and result
hashes). Shell-created fire and flooding *sources* (`createdFireSources`,
`createdFloodingSources`) appear only in the damage event record and are never
persisted into `ShipDamageState.fireRecords` / `floodingRecords`, so unarmed
battles have no records for the stage to progress. The DESIGN-41 deviation is
therefore closed structurally, but shell fires still do not burn. That gap is
tracked as ticket 10; it will move unarmed hashes and must be re-pinned through
the ADR-0007 process with this ADR as context.

## Consequences

- No hash migration is needed for this change; goldens are unaffected.
- The pinned unarmed fire baseline now documents a wired-but-quiet stage.
