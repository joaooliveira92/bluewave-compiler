# 05 — Records + ordering + reason codes + contracts + guaranteed disruption

**What to build:** Implement AirDefenseEngagementRecord per engagement with canonical ordering, 20 shipped reason codes + set-equality guard + 6 deferred SAM markers, contracts (air_defense_v1, aa_director_scaling_v1, radar_saturation_v1, ciws_redundancy_v1) with fail-closed validate*Contract guards, and guaranteed light-AA disruption opportunity.

**Blocked by:** 04 — Director scaling + radar saturation + CIWS redundancy

**Status:** done

- [x] AC-7: Guaranteed disruption opportunity for light AA
- [x] AC-15: Engagement records + ordering per §27
- [x] AC-16: 20 shipped reason codes + set-equality guard + 6 deferred markers (SAM)
- [x] AC-17: Contracts: air_defense_v1, director_scaling_v1, radar_saturation_v1, ciws_redundancy_v1