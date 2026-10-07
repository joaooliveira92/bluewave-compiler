# 08 — Reconcile spawn.ts heading convention

**Blocked by:** none

**Status:** DONE (2026-10-07, ADR-0051)

**Frontier:** no

`computeInitialMovementStates` labels 90/270 as east/west, but `directionBp` uses 0 = +X.
Auto-resolution overrides it (ADR-0046). Fix at the source, and re-pin the B-2..B-6 no-op
baselines through the ADR-0007 golden process with this ticket as the reason.
