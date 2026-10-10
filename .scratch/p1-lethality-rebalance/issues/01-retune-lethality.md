# 01 — Re-tune auto-resolution lethality to the ADR-0053 target

**Type:** implementation
**Status:** open
**Blocked by:** none
**Frontier:** yes
**Spec:** `.scratch/p1-lethality-rebalance/spec.md`

## Scope

Rework auto-resolution lethality so equal 2×10-gun 30 kn fleets resolve in **30–90
minutes** with meaningful non-elimination endings and a decisive gun-count
advantage, on top of the ADR-0094 caliber correction.

## Acceptance

- `p1-balance-sweep.test.ts` equal-fleet tripwire tightened to `30 <= lenMean <= 90`.
- `pnpm --filter @bluewave/combat test` green; goldens (`verify-golden-hashes.cjs`) and
  cross-process determinism green.
- ADR with the 30-seed tuning log, chosen levers, and the forced-old-constant
  reproduction proof.
- 30-seed sweep refreshed in `docs/research/p1-balance-sweep.md`.

## Notes

Start by re-measuring the four candidate levers (spec) on the current tree; do not
guess. One lever at a time, pinning each measured row, exactly as ADR-0053 did.
