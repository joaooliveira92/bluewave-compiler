# Spec — Restore the ADR-0053 auto-resolution lethality target after ADR-0094

**Status:** delivered (ADR-0098)
**Origin:** ADR-0094 §5/§7; `.ai/reports/p1-battles-that-matter-acceptance.md`; ADR-0053

## Problem

ADR-0094 corrected the armament-to-combat **caliber unit scale** (micrometres). That
fix is right, but it changed the measured balance: production-scale penetration is
now `PARTIAL` where the legacy inflated fixtures produced `FULL`, so equal 2×10-gun
30 kn fleets grind to a **~321-minute mean** and typically sink **no** ships
(`sinkMean = 0.00`), ending by `time_limit`/withdrawal. ADR-0053's length target for
equal fleets is **30–90 minutes**. The sweep tripwire was relaxed to
`[30, 360]` (`packages/combat/test/balance/p1-balance-sweep.test.ts:233`) to stay
green, so the regression is recorded but unaddressed. Long, indecisive battles are a
playability defect.

## Solution

Run ADR-0053's method again, on top of the corrected caliber unit: a 30-seed sweep,
**one lever at a time**, until the equal-fleet mean lands in **30–90 min** with a
meaningful share of non-elimination endings and a gun-count advantage still decisive.
Record the tuning as a new ADR; re-pin every affected baseline and golden per ADR-0007.

## Candidate levers (to be tested, not pre-committed)

1. **Armor resistance / thick-armor threshold** — the fixed `304_800` µm discount vs
   the regime-scaled plate is what pushes production guns to `PARTIAL`. Evaluate
   scaling resistance with plate thickness rather than an absolute constant
   (this may need a research note — it edges toward the deferred ballistics model).
2. **Damage per outcome band** — `HIT_DAMAGE_OUTCOME_BP` for `PARTIAL_PENETRATION`
   (previously inert per ADR-0053 because detonations dominated; that is no longer
   true after the correction).
3. **Flotation reserve / flood rate** — `FLOAT_UNIT` and persisted-breach drains
   (ADR-0050) remain the effective lethality knobs once penetration is weaker.
4. **Magazine hit share / detonation chance** — re-measure now that hits are weaker.

## User stories

- As a player, an even battle ends in a decision (sinking or disengagement) inside
  30–90 minutes, not a 5-hour stalemate.
- As a maintainer, the balance target is enforced by a tripwire that is not relaxed
  to hide a regression.

## Implementation decisions

- New ADR (next free number) with the tuning log table, the chosen levers, and the
  forced-old-constant reproduction proof (ADR-0007 re-pin discipline).
- Preserve determinism: no RNG-shape change; cross-process and golden gates stay green.
- Any content-authored constant change goes through the normal compile path, not a
  fixture-only edit.

## Testing

- `pnpm --filter @bluewave/combat test` green, including `p1-balance-sweep.test.ts`.
- Tighten the equal-fleet tripwire back to `30 <= lenMean <= 90`.
- `node scripts/verify-golden-hashes.cjs` and the cross-process child green.
- 30-seed sweep written to `docs/research/p1-balance-sweep.md` (`BALANCE_SWEEP_WRITE=1`).

## Out of scope

- Historical ballistics (`docs/research/ballistics-model-deferred.md`).
- Tactical (player-fought) balance; this is auto-resolution only.
- The known `time_limit`/snowball non-elimination limit — ADR-0073 disengagement is
  already wired; use it, do not re-open the model.

## Definition of done

- Equal-fleet mean length in 30–90 min across 30 seeds; gun-count advantage still
  decisive; `sinkMean < 2.0` with a non-trivial disengagement share.
- ADR recorded; baselines + goldens re-pinned; full `pnpm check` green.
