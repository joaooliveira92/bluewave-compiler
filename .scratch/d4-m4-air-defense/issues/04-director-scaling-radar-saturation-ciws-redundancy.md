# 04 — Director scaling + radar saturation + CIWS redundancy

**What to build:** Implement director assignment order per §11, director scaling table (§12: 0→5_000, 1→10_000, 2→18_000, 3→25_000, 4→31_000), radar-directed medium-AA saturation diminishing returns (§14: 1-4→10_000, 5-6→5_000, 7-8→2_500, 9+→500), and CIWS redundancy schedule (§16: 1-4→10_000, 5-6→5_000, 7-8→1_500, 9+→500).

**Blocked by:** 03 — Engagement formula + disruption + ammunition + damage

**Status:** DONE (2026-09-22 — PASS, orchestrator pipeline)

- [x] AC-8: Director assignment order + scaling table values
- [x] AC-9: Radar-directed group saturation diminishing returns
- [x] AC-10: CIWS redundancy schedule

**Validation (orchestrator gate):** build 18/18 forced, `tsc -b` clean, typecheck 33/33,
air-defense lint 0/0, sprint-file format clean, combat 3508/3508 (incl. air-defense
271/271), goldens 10/10, two-process `success: true`. Desktop 6→5 failures +
compiler-cli parallel timeout verified pre-existing at clean baseline.
Report: `.ai/reports/d4-m4-air-defense-inc4-director-scaling.md`.
Commit: `ef0950f` (+docs commit).