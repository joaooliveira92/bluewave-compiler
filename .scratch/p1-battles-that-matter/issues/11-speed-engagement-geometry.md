# 11 — Speed / engagement geometry (14 kn should not beat 30 kn)

**Spec:** ../spec.md — follow-up from ADR-0053 (lethality tuning)

**Blocked by:** none

**Status:** ready-for-agent

**Frontier:** yes

## Problem (evidence)

`docs/research/p1-balance-sweep.md` (ADR-0053 sweep, 30 seeds, equal 2 BB fleets):
the 14 kn side beat the 30 kn side 63% before tuning (30 kn: 30%, no winner 7%)
and 100% after ADR-0053 (14 kn wins 30/30). Pursuit steers every ship at full
designed speed straight at the nearest enemy (`pursuit.ts`), so the fast fleet
overshoots/passes through and spends more minutes at unfavourable bearings and
range bands, while the slow fleet holds the engagement. Speed confers no
tactical advantage (no range keeping, no breaking off, no closing choice), and
the fixed spawn geometry (20 km x 10 km box, opposed edges) fixes the start.

## What to build (design change, not a constant)

- Engagement geometry in the auto-resolver: let the faster side choose and hold
  a favourable range band (or break off), instead of both sides charging.
- Decide how speed advantage interacts with the range curve and disengagement
  (see ticket 12 if filed), via ADR.
- Sweep acceptance: 30 kn vs 14 kn equal-gun fleets: faster side wins >= 50%.
- Re-pin affected baselines through ADR-0007 and regenerate the sweep.
