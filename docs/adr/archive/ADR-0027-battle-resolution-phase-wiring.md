# ADR-0027 (B-6 INC-3): Battle-Resolution Phase Wiring + Campaign Consequences

## Status

Accepted 2026-08-15

## Context

INC-2 (ADR-0026) shipped `resolveBattleAuto`, the pure deterministic
campaign→tactics seam, but left it unconsumed. INC-3 must wire it into the
monthly phase pipeline: the `battle_resolution` phase (registry order 8) in
`packages/phase-engine/src/month.ts` routes each pending/resolving battle
through the tactical auto-resolver and applies its consequences to the
campaign (war score, per-ship damage/loss, reservations, `BattleInstance.result`).

The surrounding campaign code already owns the authoritative war-score seam:
the A-3 `applyBattleResult` (month.ts) consumes
`{ winnerId, loserId, damageReport }` and implements ADR-0010 victory
classification + `nationalContributionPoints`. INC-3 reuses it unchanged rather
than re-deriving war score.

Several decisions reach the ENGINEERING-CONTRACT ADR threshold (a snapshot
schema change, a new null-winner code path, and a fail-closed/fallback policy for
the battle_resolution phase) and are recorded here.

## Decision

1. **A-3 `applyBattleResult` is called ONLY for decided battles; its body and
   contract are UNCHANGED.** A decided tactical result (both
   `winnerId`/`loserId` non-null) is fed verbatim into the existing
   `applyBattleResult({ winnerId, loserId, damageReport })` — the A-3/ADR-0010
   war-score path (victory classification, magnitude, and
   `nationalContributionPoints`) is byte-identical to pre-INC-3.
2. **Null-winner tie / time-limit handling (ADR-0026 §7).** When
   `resolveBattleAuto` returns `winnerId`/`loserId` null (`time_limit`, or
   `no_viable_combatants` with both sides non-viable in the same minute), the
   phase applies **no war score, no victory classification, and no contribution
   delta** (it does NOT call `applyBattleResult`), but it STILL:
   - applies per-ship damage/loss and terminal-ship removal,
   - clears `inBattleId` reservations on every ship that fought,
   - records `BattleInstance.result` (with null winner/loser) and sets phase
     `resolved`.
   This does NOT change ADR-0010 semantics for decided battles — the tie path
   is new and out-of-band.
3. **Campaign `BattleResult` shape: `winnerId`/`loserId` become `string | null`**
   (`packages/campaign/src/state.ts`). The persisted `BattleInstance.result`
   must represent a tie, and null is the honest, explicit representation
   (mirrors `BattleResolutionResult.winnerId: string | null`). This is a
   type-level schema widening only — the generic JSON save/load (SalesStore +
   `canonicalSerialize`) round-trips `null` with no persistence-code change, and
   the M1 `BattleResolver` (which always decides) remains source-compatible.
   Serialized output for decided battles is unchanged (they carry string ids).
4. **Manifest-less battles keep the M1 `BattleResolver` strength path exactly as
   today** (unchanged). A pending battle with no `manifestHash` resolves via
   the legacy strength resolver — the accepted M1 auto-resolution.
5. **Manifest battle whose auto-resolution fails closed falls back to M1, never
   crashes, never a partial mutation.** `resolveBattleAuto` throws a stable
   `BluewaveError` BEFORE applying any consequence (missing committed weather for
   the battle area → `INVALID_BATTLE_WEATHER_INITIALIZATION`; missing design for
   a promoted ship → `TACTICAL_UNIT_PROMOTION_INVALID`; malformed manifest
   → `BATTLE_AUTO_RESOLUTION_FAILED`/`AUTO_RESOLUTION_UNAVAILABLE`). The phase
   catches it, records the diagnostic, and resolves that battle via the M1
   legacy path — a COMPLETE legacy result, never a partially-applied tactical
   result. This also preserves the existing battle_generation phase tests whose
   generated battles lack the committed-weather/design prerequisites.
6. **A `manifestHash` with NO matching stored manifest is a corrupted
   invariant**: the phase records `BATTLE_AUTO_RESOLUTION_FAILED` and applies
   NO mutation (the battle stays pending). Never a silent skip.
7. **Fail-closed weather gate.** A manifest battle whose area has no committed
   strategic weather from the `weather_generation` phase records
   `INVALID_BATTLE_WEATHER_INITIALIZATION` and resolves via the M1 fallback
   (decision 5), not a partial auto result.
8. **Determinism.** `resolveBattleAuto` is invoked with the month's campaign
   seed and the month's `RandomLedger`; battles are processed in
   `snapshot.wars.battles` order; ships in the battle's fleets are iterated in
   canonical fleet order. Two identical `MonthExecutor.execute` calls → byte-
   identical closing snapshot + battle results + random ledger.
9. **Goldens unchanged for battle reasons.** The cross-process child's main loop
   runs a `budget_project` on a neutral (no-war) fixture, so `battle_resolution`
   is unexercised in the golden run; a new battle-resolution child hash key was
   NOT added, and `golden/hashes.json` stays 10/10 (the INC-1 weather change was
   already regenerated under ADR-0007).

## Consequences

- The tactical result is the single deterministic source of battle outcomes at
  the monthly turn; every consequence is recorded (battle result + ship
  damage + reservations cleared) with no silent skips.
- `applyBattleResult` (A-3) and the M1 `BattleResolver`/`StrengthCalculator`
  remain unmodified.
- `BattleInstance.result` may now carry null winner/loser for tie/time-limit
  ends; old saves that never recorded such a result are unaffected.
- The ship-consequence application is exposed as the pure exported
  `applyBattleConsequences(snapshot, battle, result)` so it is unit-testable
  (hp clamp ≥ 0, sunk removal, reservation clearing) independent of the phase.

## Related requirements

DESIGN-38 §§32–33/§35, DESIGN-37 §19–20/§30–32, DESIGN-31/ADR-0010, DESIGN-55
§3/§23; ENGINEERING-CONTRACT (determinism, immutable transitions, arithmetic,
no silent skips).

## Related ADRs

ADR-0026 (INC-2 `resolveBattleAuto`), ADR-0025 (INC-1 weather snapshot),
ADR-0007 (goldens/determinism).
