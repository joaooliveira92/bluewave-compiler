# 07 — Per-ship damage control in the minute engine

**Blocked by:** none

**Status:** DONE (2026-10-06, ADR-0047; reviews: NEEDS_REWORK → repairs F1/F5–F8 → APPROVE)

**Frontier:** no

## Problem (evidence)

`advanceMinute` step 8.6 (`packages/combat/src/simulation/engine.ts`) runs ONE
`DamageControlContext` and writes the same `fireRecords`/`floodingRecords` onto EVERY ship's
damage state. It cannot be wired into auto-resolution as is. Without it, torpedo flooding is
created but never progresses, so a Whitehead hit barely changes the damage report.

## What to build

- `damageControl` keyed per ship (contexts derived from each ship's damage state).
- Flooding progression feeding flotation / terminal status (§32 battle end).
- Wire into `resolveBattleAuto`; prove a torpedo hit can founder a 1880 ironclad over time.
