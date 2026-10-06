# 05 — Records + ordering + reason codes + contracts + guaranteed disruption

**What to build:** Implement AirDefenseEngagementRecord per engagement with canonical ordering, 20 shipped reason codes + set-equality guard + 6 deferred SAM markers, contracts (air_defense_v1, aa_director_scaling_v1, radar_saturation_v1, ciws_redundancy_v1) with fail-closed validate*Contract guards, and guaranteed light-AA disruption opportunity.

**Blocked by:** 04 — Director scaling + radar saturation + CIWS redundancy

**Status:** DONE (2026-09-22 — implementation landed in commit `53ec75f`; traceability closed 2026-10-06: report `.ai/reports/d4-m4-air-defense-inc5-records-ordering-reason-codes-contracts.md` + ADR-0042 decisions 14-20; re-validated in the 2026-10-06 `origin/dev` merge gate: 357 air-defense / 3594 combat tests green, `tsc -b`/lint/format clean, goldens 10/10, two-process `success: true`)

- [x] AC-7: Guaranteed disruption opportunity for light AA
- [x] AC-15: Engagement records + ordering per §27
- [x] AC-16: 20 shipped reason codes + set-equality guard + 6 deferred markers (SAM)
- [x] AC-17: Contracts: air_defense_v1, director_scaling_v1, radar_saturation_v1, ciws_redundancy_v1