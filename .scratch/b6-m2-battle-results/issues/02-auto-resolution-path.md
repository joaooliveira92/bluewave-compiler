- **Type:** grilling
- **Status:** resolved
# B-6: Auto-Resolution Path — `resolveBattleAuto` orchestrator

## Question

How does a monthly turn deterministically convert a pending battle (+ B-1
manifest) into a campaign result without a player?

## Answer

**Locked.** `@bluewave/combat` exposes a pure orchestrator:

```
resolveBattleAuto(input: {
  battle: BattleInstance;            // phase "pending"/"resolving"
  manifest: BattleManifest;          // B-1 canonical manifest (battleSeed set)
  attackerNation: NationState;       // resolved ships/units on attacker side
  defenderNation: NationState;
  attackerFleetIds: string[];
  defenderFleetIds: string[];
  strategicWeather: StrategicWeatherState;
  resolveUnitType / strength seams (from campaign designs);
  rulesetVersion; formulaVersion; rngVersion; campaignMonth;
}): BattleResolutionResult
```

Behaviour, in order and deterministic:
1. Build the `TacticalBattleState` (units from committed ships via the
   `promoteTacticalUnit` / division mapping from B-1), initialize
   `BattleWeatherInitialization` from `strategicWeather` + battle context,
   and derive the battle RNG from the manifest `battleSeed` (keyed streams, no
   ambient RNG).
2. Loop `advanceMinutes` (B-2 engine + B-3 gunnery + B-4 damage + B-5 weather)
   minute by minute, calling `evaluateBattleEnd` (§32 precedence) after each
   minute's effects are resolved; hard cap at `DEFAULT_MAX_BATTLE_MINUTES` 360.
3. On battle end emit `BattleResolutionResult`:
   `battleEndReason`, `elapsedMinutes`, `winnerId`/`loserId`
   (side whose combatants are no longer viable), `damageReport` (shipId →
   accumulated structure+flotation loss), `survivors`/`sunk` per side,
   `eventLedgerHash`, `resultHash`.
4. Fail-closed: missing manifest → fall back to M1 `BattleResolver` (never a
   crash); unsupported asset time → `AUTO_RESOLUTION_UNAVAILABLE`.

**Why here:** keeps `@bluewave/combat` pure and testable; `phase-engine` stays a
thin adapter. Mirrors the B-2..B-5 boundary rule (ADR-0018/20/22).