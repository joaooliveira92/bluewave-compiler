# ADR-0073: P-1 — Withdrawal / Disengagement So Battles Can End Without Elimination (Ticket 12)

## Status

Accepted (2026-10-08). Ticket 12 of `.scratch/p1-battles-that-matter`.

## Context

After ADR-0053 every sweep battle (120/120) ended `no_viable_combatants` with a mean
of 2.8 of 4 ships sunk for equal fleets. `viability.ts` wired `withdrawalCompletedSide`
and `mutualDisengagement` to false, flooding is a one-way drain (ADR-0050/0053), and
the only other exit was the 360 min time limit. Lethality constants cannot change
this; the auto-resolver needs a break-off rule.

## Decision

1. **Existing §32 ids, no new reason.** `battleEnd.ts` already carries
   `withdrawal_complete` and `mutual_disengagement` in `BATTLE_END_PRECEDENCE`
   (after `objective_immediate`, before `time_limit`). The predicate feeds those
   slots of `evaluateBattleEnd`; nothing is invented.
2. **Predicate (integer only).** Ship strength = the ADR-0026 hp mapping at a
   10 000 scale (`hpOfState(state, 10_000)`: 50/50 structure + flotation, terminal
   ship = 0). Side strength = `floor(sum(ship strength) / ship count)` bp, equal
   weights. A side whose strength is **strictly below**
   `WITHDRAWAL_STRENGTH_THRESHOLD_BP = 2_000` (20%) breaks off.
3. **Evaluation.** After each fully resolved minute, inside `decideBattleEnd`:
   elimination (`no_viable_combatants`, incl. the ADR-0026 tie) is decided first
   and wins; otherwise exactly one side below threshold -> `withdrawal_complete`
   (`withdrawnSide` returned); both below in the same minute ->
   `mutual_disengagement`; else `time_limit` / continue.
4. **Outcome.** `withdrawal_complete`: the withdrawing nation is `loserId`, the
   other `winnerId`. `mutual_disengagement`: no winner/loser (like the ADR-0026
   tie). Ships are not removed: survivors/sunk lists reflect the state when the
   battle ended. The break-off is **instantaneous** (no retreat phase; the
   withdrawing side takes no further fire) — this is an auto-resolver rule, a
   tactical retreat model is out of scope.
5. **No randomness.** The predicate reads only damage state; no new stream, no
   ledger entries. Versioned in the `battle_auto_resolution_v1` contract
   (`withdrawalStrengthThresholdBp`, canonical-value guard in
   `validateBattleAutoResolutionContract`); a re-fit is a new ADR.
6. **Calibration** (30 seeds, sweep test, ticket-11 matchups; equal fleets row
   shown = disengagement share / mean sunk / mean length / attacker-defender-none):

   | threshold | equal-fleet disengage | mean sunk | length (min) | 30kn-vs-14kn fast wins |
   | --- | --- | --- | --- | --- |
   | 5000 | 100% | 0.00 | 32.8 | 73% |
   | 3000 | 100% | 0.03 | 42.8 | 90% |
   | 2500 | 100% | 0.17 | 45.4 | 77% |
   | **2000** | **97%** | **0.37** | **47.9** | **80%** |
   | 1500 | 97% | 0.57 | 50.2 | 80% |
   | 1000 | 93% | 0.87 | 52.5 | 77% |

   2000 chosen: well inside every acceptance bound, and it keeps a thin tail of
   genuine eliminations (3%) and torpedo kills (0.83 sunk) so the sinking model
   is still exercised. Because flooding drains slowly then crosses a cliff, no
   threshold in the plausible range leaves a majority eliminating; the ticket's
   >= 20% bar is exceeded by a wide margin at every value tried.

## Re-pinned baselines (ADR-0007)

The shared prefix of every battle is byte-identical (minute hashes 0..N-1 are a
strict prefix of the old pins); only the end minute, end reason, and therefore the
result hash move. Cause for all: this predicate alone.

| Pin | Old | New |
| --- | --- | --- |
| `auto-resolve.test.ts` baseline #1 (default 10-gun fixture) result hash | `bee00786083a802b...` (no_viable_combatants, min 54) | `53b93ad7252fdb04...` (withdrawal_complete, min 48); last minute `aaca0a19...` -> `9205ea66...` |
| `ac6-damage-control-gate.test.ts` baseline #2 (4-gun fixture) result hash | `f762c5855afeca5e...` (no_viable_combatants, min 70) | `24dd6c7876d435229...` (withdrawal_complete, min 52); minute list truncated to the first 52 (identical entries) |

Other test updates (behavioural, not hash): `outcome.test.ts` and
`auto-resolve.test.ts` winner/loser e2e now assert withdrawal semantics
(elimination winner/loser stays proven at decision level);
`gunnery-fidelity.test.ts` / `shell-sources-persist.test.ts` accept
withdrawal / mutual disengagement as the end reason; `cause-of-loss.test.ts` pins
seed `cause-8` (default fixture sinks one ship, flooding, before withdrawal).
`torpedo-foundering.test.ts` (heavy fixtures, >= 3 founder) is unchanged and green.
`verify-golden-hashes.cjs` is the gate for golden fixtures.

## Consequences

- Sweep (30 seeds; `docs/research/p1-balance-sweep.md`): equal fleets 97%
  disengagement / 0% time_limit / 3% no_viable, mean sunk 0.37, mean length 47.9
  min (30-90 OK); 30 kn vs 14 kn fast side 80% (ADR-0072 >= 50% holds);
  torpedoes vs unarmed 97% attacker win, 4.0 tubes / 1.97 hits, torpedo row intact.
- The sweep tripwire's `sinkMean > 0` per-matchup bound is relaxed to `>= 0`
  (a no-sinking disengagement is now legitimate) and replaced by the ticket's
  hard bounds for equal fleets (disengage + time_limit >= 20%, sunk < 2.0).
- Winner determination for ordinary battles now flows through withdrawal
  (weaker side loses) — campaign consumers read `winnerId` as before.
- Deferred: a retreat/pursuit phase for the withdrawing side, per-doctrine or
  per-nation morale thresholds, and any UI wording for the new end reasons.
