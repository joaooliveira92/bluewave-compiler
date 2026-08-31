# 03 — Engagement formula + disruption + ammunition + damage

**What to build:** Implement the engagement resolution formula effectiveDefenseBp = floor(baseDefenseBp * director * radar * crew * damage * ammunition * targetProfile * weather * saturation / 10_000^8) with floor-once rounding, disruption severity levels (LIGHT/MODERATE/SEVERE/MISSION_ABORT) with stacking, basic ammunition consumption, and simplified system-level damage/power state.

**Blocked by:** 02 — Layer resolution + eligibility (heavy/medium/light) + CIWS

**Status:** ready-for-agent

- [ ] AC-11: Engagement formula: effectiveDefenseBp = 9-factor product, floor-once
- [ ] AC-12: Disruption severity levels + stacking rules
- [ ] AC-13: Ammunition consumption + empty system contributes zero
- [ ] AC-14: Simplified damage/power state + local control multiplier