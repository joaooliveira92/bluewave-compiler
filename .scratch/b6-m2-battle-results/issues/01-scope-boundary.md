- **Type:** grilling
- **Status:** resolved
# B-6: Scope Boundary — what "battle results → campaign integration" covers

## Question

B-6 must define the precise campendance surface. DESIGN-55 §3 lists M2 as:
tactical movement; spotting/contact; divisions/formations; gunnery; basic armor
& damage; tactical weather; battle results. B-1..B-5 built the engine. What does
"battle results" add, and what is legitimately deferred?

## Answer

**In scope (this sprint):**
1. A campaign-facing auto-resolution path over the B-1..B-5 engine: given a
   battle + its B-1 `BattleManifest` (sides, persistent assets, battle seed,
   weather/env fields, provenance) + the campaign `NationState.fleets[].ships`
   committed to that battle + the area's strategic weather, deterministically
   run the DESIGN-38 minute-advance simulation (movement/spotting/gunnery/
   damage/weather) to a §32 battle end and emit a `BattleResolutionResult`
   (battleEndReason, minutesElapsed, winnerId/loserId, per-ship damageReport,
   event ledger + proof hash), with DESIGN-38 §35 ordering.
2. Wire the phase pipeline: `weather_generation` (order 0.5) publishes per-area
   `StrategicWeatherState` onto the snapshot (deterministic, keyed streams);
   `battle_resolution` (order 8) auto-resolves manifest-carrying pending
   battles via the tactical engine and applies results through the existing
   `applyBattleResult` war-score/victory path + ship damage/loss back to
   fleets + clears `inBattleId` reservations.
3. Determinism: two-process byte-identical; versioned `*_v1` contract surface.

**Deferred (recorded, not fabricated):**
- DESIGN-38 §34 statistical validation study (1_000 paired seeded runs) → REL-1
  packaged smoke; B-6 ships the deterministic auto-resolve + equivalence
  proof-hash, not the empirical distribution study.
- Production climate-profile YAML (region-specific) → CONTENT-track; engine
  ships a canonical default climate profile so the phase is deterministic.
- Player tactical play in-app (renderer control of a battle) → UI-track.
- `@bluewave/combat` `BattleResolver`/`StrengthCalculator` remain the M1
  fallback for battles lacking a manifest; not removed.

**Reasoning:** this is the campaign/battle seam. Without it no accepted M2
capability is reachable from a monthly turn, so M2 cannot be signed per §23.
Everything else in the M2 capability list already shipped in B-1..B-5.