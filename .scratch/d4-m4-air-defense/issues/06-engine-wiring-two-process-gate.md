# 06 — Engine wiring + two-process + gate

**What to build:** Wire the `resolve_air_defense` stage at step 7.8 (after air-combat 7.7, before resolveSensorsSpotting 8), with optional AirDefenseContext in AdvanceMinuteInput and strict no-op when absent. Prove two-process determinism via child process, ensure BattleResolver/StrengthCalculator remain unmodified, and pass final validation gate.

**Blocked by:** 05 — Records + ordering + reason codes + contracts + guaranteed disruption (DONE 2026-09-22, traceability closed 2026-10-06)

**Status:** ready-for-agent (frontier — unblocked)

**Frontier:** yes

- [ ] AC-18: Engine stage at step 7.8, strict no-op
- [ ] AC-19: Two-process determinism (child process)
- [ ] AC-20: BattleResolver/StrengthCalculator unmodified