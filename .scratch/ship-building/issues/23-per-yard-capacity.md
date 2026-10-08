# 23: Per-yard capacity scaled to maxDisplacement

**Type:** implementation
**Status:** open
**Blocked by:** none
**Frontier:** yes

Source: ADR-0067 §6. `yardCapacityWorkPerMonth` is a global PLACEHOLDER (20,000,000) that makes the capacity schedule nearly irrelevant to the forecast. Replace it with per-yard capacities scaled to each yard's maximum displacement so the "limited by <line>" bottleneck is meaningful, with boundary and determinism tests.

## Comments
