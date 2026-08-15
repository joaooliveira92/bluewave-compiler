- **Type:** task
- **Status:** ready-for-agent
- **Blocked by:** INC-2

# INC-3: `battle_resolution` phase wiring + campaign consequences

## Acceptance criteria (spec AC-8, AC-9, AC-11)

- `month.ts` order-8: for each pending/resolving battle with a manifest, call
  `resolveBattleAuto`; without a manifest, keep the M1 `BattleResolver`
  fallback (unchanged) — no crash, stable diagnostic when malformed.
- Result feeds the existing `applyBattleResult` (war-score / ADR-0010 victory
  classification / `nationalContributionPoints`) using its existing
  `winnerId/loserId/damageReport` contract — no re-derivation.
- Per-ship damage applied to `fleets[].ships[].hitPoints` (clamped ≥0);
  terminal (SINKING/FOUNDERED or hp==0) ships removed from fleets; survivors
  retain damage; `inBattleId` reservations cleared; `BattleInstance.result` +
  phase `resolved` recorded.
- Save→load→replay round-trips the new snapshot incl. weather + resolved battle
  results; persistence/replay green.

## Tests

`phase-engine/test/battle-resolution-phase.test.ts`,
`phase-engine/test/battle-consequences.test.ts`,
`phase-engine/test/replay-weather-battle.test.ts`, integration (`phase-engine/test`).

## Blocking notes

Depends on INC-2 (`resolveBattleAuto`). Must not re-order or weaken the A-3
war-score path. Ship removal must preserve deterministic iteration order.