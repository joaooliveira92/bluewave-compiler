# B-6 Spec — M2 Battle Results → Campaign Integration + M2 Acceptance Gate

- **Sprint:** B-6 (`.ai/SPRINT-PLAN.md` Track B row 6)
- **Kind:** scoping → implementation (this document is the implementation
  spec; B-6-IMPL executes it)
- **Governing docs:** DESIGN-38 §§31–35 (`docs/rules/tactical-combat.md`),
  DESIGN-37 §§19–20/§30–33 (manifest, seed, consequences), DESIGN-31 (war
  score / ADR-0010), DESIGN-42 §1–2 (strategic weather + battle init), DESIGN-55
  §3/§7–10/§23 (M2 capabilities + acceptance gate), DESIGN-06/52 (snapshot+save).
- **Baseline:** B-5-IMPL DONE (2026-08-15, PASS). `@bluewave/combat` has the
  B-2 minute-advance engine (steps 4–8), B-3 `resolveGunnery`, B-4
  `resolveDamage`, B-5 `resolveWeather` + `weather_generation` phase (order 0.5,
  no-op) + `StrategicWeatherState` + battle-init machinery + `evaluateBattleEnd`
  (§32 precedence, `DEFAULT_MAX_BATTLE_MINUTES` 360). `BattleResolver`/
  `StrengthCalculator` unmodified. Goldens 9/9. `applyBattleResult` in
  `phase-engine/src/month.ts` proven (A-3).
- **Target:** M2 capabilities reachable from a monthly turn; M2 signed
  COMPLETED per DESIGN-55 §23. This is the **first snapshot-schema-affecting**
  M2 sprint: campaign snapshot gains per-area `StrategicWeatherState`, so
  **goldens change** (ADR-0007 regeneration with documented old/new + cause).
- **Delivery contract:** ENGINEERING-CONTRACT binding. `BattleResolver`/
  `StrengthCalculator` unmodified. Two-process determinism. ADR-0025.

---

## 1. Scope

### 1.1 Acceptance criteria (mapped to requirement IDs + tests)

| AC | Requirement | Proving test |
|----|-------------|--------------|
| AC-1 | **Strategic-weather snapshot persistence** — `CampaignSnapshot` carries current-month per-area `StrategicWeatherState`; areas ordered canonically; serializer platform-independent (DESIGN-06 §30); only current-month weather persists (no unbounded array). | `campaign/test/strategicWeather.test.ts` |
| AC-2 | **`weather_generation` phase authoritative** — registry order 0.5 executes per-area generation from canonical default `climate_profile_v1` on keyed stream `campaign/weather/<areaId>/<month>`; missing profile → `WEATHER_PROFILE_INCOMPLETE`; `rngAllowed: true`; committed into snapshot before `command_collection`. | `phase-engine/test/weather-generation.test.ts` |
| AC-3 | **Battle init from committed weather** — `resolveBattleAuto` builds `BattleWeatherInitialization` from the battle area's committed `StrategicWeatherState`; missing → `INVALID_BATTLE_WEATHER_INITIALIZATION`; deterministic. | `combat/test/battle-resolution/init-weather.test.ts` |
| AC-4 | **Tactical-state projection** — battle manifest + committed ships (divisions/promotions per B-1) project into `TacticalBattleState` units with realism-independent stats via the existing classifier + seeded RNG derivation (`battle/…/root`, DESIGN-37 §32). | `combat/test/battle-resolution/project.test.ts` |
| AC-5 | **`resolveBattleAuto` orchestrator** — runs minute-advance B-2..B-5 to a §32 battle end; each minute fully resolved before potential end (incl. time-limit §32); emits `BattleResolutionResult` (battleEndReason, elapsedMinutes, winnerId, loserId, survivors/sunk, damageReport, eventLedgerHash, resultHash). | `combat/test/battle-resolution/auto-resolve.test.ts` |
| AC-6 | **Battle-end precedence** — §32 order enforced via `evaluateBattleEnd`; time limit 360 default; terminating-minute effects included; `TACTICAL_STATE_INVARIANT_FAILED` if end prematurely evaluated. | `combat/test/battle-resolution/battle-end.test.ts` |
| AC-7 | **Winner/loser viability rule** — side whose combatants are no longer viable loses (SINKING/FOUNDERED elimination / zero viable HP); equality → mutual_disengagement/§32; recorded deterministically. | `combat/test/battle-resolution/outcome.test.ts` |
| AC-8 | **`battle_resolution` phase wiring** — `month.ts` order-8: for each manifest-carrying pending/resolving battle call `resolveBattleAuto`; result feeds existing `applyBattleResult` (war-score/ADR-0010 + `nationalContributionPoints`), records `BattleInstance.result` + phase `resolved`, clears `inBattleId` reservations. Non-manifest battles use M1 `BattleResolver` fallback (unchanged). | `phase-engine/test/battle-resolution-phase.test.ts` |
| AC-9 | **Ship consequence application** — per-ship damage applied to `fleet ships[*].hitPoints` (clamped ≥0); terminal (SINKING/FOUNDERED or hp==0) ships removed; survivors retain damage; reservations cleared; provenance via battle `warId` records. | `phase-engine/test/battle-consequences.test.ts` |
| AC-10 | **Determinism (two-process)** — identical inputs → identical battle result, damageReport, event + minute hashes across two child runs (node-spawn ×2 byte-compared). | `combat/test/battle-resolution/determinism.test.ts` + cross-process ×2 |
| AC-11 | **Snapshot/save/replay/load** — save→load→replay the new snapshot incl. strategic weather + resolved battle results; no continuation with mismatched shapes; `@bluewave/persistence` + replay green. | `persistence/test`, `phase-engine/test/replay-weather-battle.test.ts` |
| AC-12 | **Goldens regenerated (ADR-0007)** — old→new documented; `verify-golden-hashes.cjs` 9/9 after regeneration; `BattleResolver`/`StrengthCalculator` unmodified (diff). | orchestrator gate |
| AC-13 | **Contracts + reason codes** — new integration surface ships `battle_auto_resolution_v1` (+ climate profile contract) with fail-closed validate guards; in-slice reason codes exact (catalog add + set-equality guard). | `combat/test/battleResolution/contracts.test.ts`, `reason-codes-battle-resolution.test.ts` |
| AC-14 | **M2 acceptance gate material** — `docs/acceptance/m2-capability-registry.md` (§9 seven M2 capabilities ACCEPTED); DESIGN-55 §23 sign-off; PROGRESS/SPRINT-PLAN/report refreshed; non-blocking limitations recorded (stat-study→REL-1, climate YAML→CONTENT, B-1 AC-14→CONTENT). | gate docs + `.ai/reports/b6…-impl.md` |

### 1.2 In scope (implementation increments)

1. **StrategicWeather snapshot + `weather_generation` wiring** (INC-1): snapshot
   field + canonical default `climate_profile_v1` + phase execution +
   `cloneSnapshot`/cross-process child update; ADR for shape.
2. **`resolveBattleAuto` orchestrator in `@bluewave/combat`** (INC-2):
   tactical projection, weather init, minute loop to §32 end, result emission.
3. **`battle_resolution` phase + campaign consequences** (INC-3): phase wiring,
   `applyBattleResult` reuse, ship damage/loss application + reservation
   clearing; ship removal on terminal; `BattleInstance.result` recording.
4. **Determinism + contracts + goldens** (INC-4): two-process ×2 prove,
   `*_v1` contracts rollup + set-equality (INC-1 recorded as ADR-0025), goldens ADR-0007 regen.
5. **M2 acceptance gate + traceability** (INC-5): registry, sign-off, plan/
   PROGRESS/report, roadmap advance pointer.

### 1.3 Out of scope (deferred, recorded)

- DESIGN-38 §34 statistical validation study (1_000 paired runs) → REL-1
  packaged smoke.
- Region-specific climate-profile YAML → CONTENT-track.
- Player tactical-play UI / interactive renderer control → UI-track.
- Crew/officers/analysis/political consequences beyond hp+war-score → M3+.
- `BattleResolver`/`StrengthCalculator` removal (kept as M1 fallback).
- B-1 AC-14 production ship→design linkage → CONTENT-track (unchanged).

### 1.4 Test/version pins

- Serializer orders areas canonically; new `compatibilityVersion` bump documented
  in ADR; old-save continuation either migrated or rejected with a stable
  diagnostic (ADR-0007 §process).
- No ambient time/random/env in any new path.