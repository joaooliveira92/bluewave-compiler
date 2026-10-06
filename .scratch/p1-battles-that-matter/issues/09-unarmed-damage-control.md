# 09 — Run damage control in EVERY auto-resolved battle

**Spec:** ../spec.md — amends AC-6, closes the DESIGN-41 §13/§19/§44 deviation (ADR-0047)

**Blocked by:** 07

**Status:** open

**Frontier:** no (blocked until 07 is reviewed, gated, and committed)

## Problem (canonical end state)

ADR-0047 gates the damage-control stage on the battle containing a unit with
`torpedoArmament` so AC-6's byte-identical freeze holds for unarmed battles.
DESIGN-41 §13 says fire and flooding resolve once per authoritative tactical
minute in *every* battle, so unarmed battles currently let shell-induced
fire/flooding records sit unprogressed (pre-P-1 behaviour, recorded deviation).

## What to build

- Run the per-ship damage-control stage in every `resolveBattleAuto` battle,
  removing the torpedo-armament gate.
- Amend spec AC-6 (hash freeze no longer holds for unarmed battles) and record
  the amendment.
- Re-pin the affected baselines/goldens through the ADR-0007 process with
  ADR-0047 decision 3 as the authoritative cause (old/new hash + migration
  assessment).
- Tests: unarmed battle with a shell-induced fire shows progression across
  minutes; determinism two-process; §32 end still correct.
