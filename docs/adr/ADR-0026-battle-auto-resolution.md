# ADR-0026 (B-6 INC-2): Battle Auto-Resolution Orchestrator — `resolveBattleAuto`

## Status

Accepted 2026-08-15

## Context

B-6 INC-1 (ADR-0025) made `weather_generation` authoritative and committed
per-area `StrategicWeatherState` to the campaign snapshot. INC-2 must close the
campaign→tactics seam: a monthly turn deterministically resolves a pending
battle (B-1 manifest + committed ships + committed strategic weather) into a
campaign result WITHOUT a player (DESIGN-38 §33 auto-resolution must be
available for every accepted manifest; §34 validation deferred to REL-1).

The B-2..B-5 engine (`advanceMinute`) resolves movement/weather/gunnery per
minute but applies NO damage: B-4 shipped `resolveDamage` as a module
(`damage/engineWiring.ts`) that nothing consumed. INC-2 wires that loop closed:
a pure orchestrator `resolveBattleAuto` that (a) projects the manifest +
committed ships into `TacticalBattleState`, (b) initializes battle weather from
the committed strategic state, (c) advances minute-by-minute with gunnery hits
converted into damage impacts, (d) evaluates DESIGN-38 §32 battle end after
each fully-resolved minute, and (e) emits a deterministic
`BattleResolutionResult` for the campaign layer (INC-3).

Several decisions reached the ENGINEERING-CONTRACT ADR threshold (numerics,
RNG, canonicalization, determinism) and are recorded here rather than left
implicit:

## Decision

1. **Engine seam: strict no-op `damage` context in `advanceMinute`.** The
   minute-advance engine gains an optional `damage?: DamageContext`. When
   absent (the B-2..B-5 status quo) the stage is a strict no-op: zero events
   appended, per-minute hashes byte-identical to the committed baseline. When
   present, every `HIT` `GunneryEventRecord` is synthesized into a
    `GunneryImpact` (B-4 seam) and applied via `resolveDamage` at step 9-10
    (substep 3, priority 10, `damage_impact` ledger events; the authoritative
    event hash is recomputed by `BattleLedger.append` over the canonical event
    surface — the damage record's own `recordHash` is a derived report value,
    not the ledger event hash). The auto-resolver drives the loop
   minute-by-minute itself (calling `advanceMinute`) so §32 end can be
   evaluated after each minute.
2. **`resolveBattleAuto` input/output contract** — pinned exactly as the
   shipped `ResolveBattleAutoInput`/`BattleResolutionResult` surface in
   `battleResolution/resolve.ts`: `battleId/areaId/campaignMonth/manifest/
   attacker/defender/strategicWeather/campaignSeed/ruleset/formula/rng
   versions/maxMinutes(360)/optional RandomLedger` in;
   `battleEndReason/elapsedMinutes/winnerId?/loserId?/survivor+sunk per side/
   damageReport/eventLedgerHash/minuteHashes/resultHash/provenance` out.
   No ambient clock/random/env/fs anywhere.
3. **Seed & RNG authority.** Battle seed derived exactly per DESIGN-37 §32 via
   `deriveBattleSeed` (family `battle/battle_id/root`, keyed on the canonical
   pre-seed manifest hash + campaign seed + campaign month + war/area/mission/
   opportunity). One `RandomEngine(battleSeed)` feeds: gunnery hit draws
   (existing `gunnery/accuracy/hit:` streams), weather progression (existing
context damage keyed draws), and the hit-zone selection draw
    `battle/damage/hit_zone:<battleId>:<minute>:<substep>:<targetShipId>:<salvoBatteryId>`
    (see 6) — keyed by target AND salvo (each battery fires ≤1 salvo/minute, so
    batteryId is a stable per-salvo ordinal) so every HIT draws its zone from a
    distinct stream; multi-impact minutes never reuse a stream.
4. **Projection (realism-independent, DESIGN-38 §9/§33).** Promote only
   `manifest.persistentAssets` ships present in the owning nation's fleets and
   not under construction; battle `assetId == campaign ship id`; sides split
   by manifest with the nation's participant list validated; units ordered by
   canonicalized asset sort. Movement spawns on the canonical default area box
   `DEFAULT_AREA_BBOX` (20 km × 10 km; attackers west edge heading 90°, defenders
   east edge heading 270°) at full designed speed converted to basis-point
   knots (`floor(ums × 1_944 / 1_000_000_000)`); no realism-mode modifiers.
   Divisions project via the existing `projectPermanentDivision` when ships
   are present. A manifest asset missing from both nations fails closed with
   `BATTLE_AUTO_RESOLUTION_FAILED` + stable diagnostic (never partial result).
5. **Battle weather (AC-3).** `buildBattleWeather` resolves the climate and
   daylight profiles by the strategic state's `climateProfileId` / `
   daylightProfileId` from the SHIPPED registries (`defaultClimateProfile_v1`
   under id `default`; a new canonical `default_daylight_v1` 24h profile);
   unknown id -> `WEATHER_PROFILE_INCOMPLETE`. Local variation =
   `LOCAL_VARIATION_POLICY_NONE` (never rerolled weather). Canonical date/time
   anchors: battleDate `"<campaignMonth>-15"` at 06:00 (360 minutes since
   midnight); solar geometry resolved from the profile at minute 0 so init and
   engine agree. Missing `strategicWeather` -> `INVALID_BATTLE_WEATHER_
   INITIALIZATION` (fail-closed per AC-3).
6. **Damage mapping + hp.**
   - Canonical ship layout: four zones (`BELT` = belt armor ×10_000 bp,
     `DECK` ×5_000, `SUPERSTRUCTURE` ×2_500, `MAGAZINE` ×8_000, the magazine
     critical). Penetration per ADR-0021 linear `caliber×velocity/1000`
     (velocity 762 m/s, normal ≤0° impact) compared, via the B-4 armor model
     (manufacturing + canonical HARVEY quality family bp multiplier), against
     the struck zone; outcomes `SPLINTER`/`PARTIAL`/`FULL`/`PASS_THROUGH`/
     `CRITICAL` map to structural damage fractions
     (`HIT_STRUCTURAL_DAMAGE_BASE 2_000` × outcome bp: 2_500/5_000/10_000/
     4_000/20_000). Hull breach (BELT/MAGAZINE + full/overpen) adds flotation
     damage at 50% of structural. Structural+flotation scores use the
     canonical full-integrity units: `STRUCTURE_UNIT 100_000`, `FLOAT_UNIT
     50_000`, `STABILITY_INITIAL_BP 8_000` (same scale B-4 fixtures use).
   - **hp mapping (`damageReport`).** Battle hp = terminal
     (`SINKING`/`FOUNDERED`) ? 0 : `floor(maxHitPoints × (structureBp +
     flotationBp) / 20_000)`, where each contribution is the current reserve
     as basis points of its unit, clamped [0,10_000]. `damageReport[shipId] =
     max(0, ship.hitPoints at battle start - current hp)` — integer ≥0, fully
     deterministic, documented here as the authoritative battle-loss mapping.
   - Hit-zone selection: one keyed draw per salvo (uniform over the four
      zones) from the battle stream family — the only additional random sink
      beyond the existing gunnery and weather draws; each draw is recorded in
      the random ledger (stream id, entity key = target ship, reason code
      `DAMAGE_HIT_ZONE_DRAW`). Damage-internal draws
     (fire/flooding/magazine in `resolveDamage`) consume per-call-serialized
     streams suffixed `:<battle>:<minute>:<substep>:<callN>` so multi-
     impact minutes never reuse a stream. Without an engine the damage
     stage is the documented deterministic-null path (draw 0, first zone).
7. **Battle end (AC-6/AC-7).** After every fully-resolved minute, the
   resolver checks viability (all ships `SINKING`/`FOUNDERED` or structure and
   flotation both exhausted) and calls `decideBattleEnd` which routes through the
   existing `evaluateBattleEnd` (§32 precedence). The ONLY reachable reasons
   this slice: `no_viable_combatants` and `time_limit` (scenario-terminal /
   objective / withdrawal / mutual-disengagement report false — never
   invented). Terminating-minute effects ARE part of the result: a side whose
   last ship is terminal in minute N ends on minute N (no_viable beats
   time-limit). **Tie-break:** both sides non-viable in the same minute ⇒
   `reason = "no_viable_combatants"`, `winnerId`/`loserId = null` —
   deterministic, no human judgment (reconciled by handle `applyBattleResult`
   in INC-3 which must accept a null winner: a plain tie contributes to no
   war score). `time_limit` ends also yield null winner/loser.
8. **Result hashing.** `eventLedgerHash` = sha256 of the canonicalized
   (sorted §35) event ledger; `minuteHashes` = the engine's per-minute hashes;
   `resultHash` = domain-separated envelope
   (`battle-auto-resolution-result`, `battle_auto_resolution_v1`)
   over the full non-hash result surface + version pins, so any input
   (including ruleset/formula/rng version) change flips the hash.
9. **Contracts + reason codes.** `battle_auto_resolution_v1`
   (`SHIPPED_BATTLE_AUTO_RESOLUTION_V1` + `validateBattleAutoResolutionContract`,
   fail-closed). Two NEW in-slice codes owned here
   (`BATTLE_AUTO_RESOLUTION_FAILED`, `BATTLE_VIABILITY_EVALUATION_FAILED`),
   recorded in `battleResolution/reasonCodes.ts` and under set-equality guard
   in `reason-codes-battle-resolution.test.ts`. §36 auto-resolution codes are
   REUSED (`AUTO_RESOLUTION_UNAVAILABLE`/`AUTO_RESOLUTION_VALIDATION_FAILED`
   already ship in the generation/combat catalogs) — never redefined.

## Consequences

- `resolveBattleAuto` is the deterministic campaign→tactics seam: identical
  inputs + campaign seed ⇒ identical result, damageReport, per-minute and
  event-ledger hashes across processes (proven by two-child byte-compare).
- The existing B-2..B-5 minute-advance consumers keep byte-identical hashes
  when no damage context is supplied (engine strict no-op).
- `BattleResolver`/`StrengthCalculator` remain unmodified (M1 fallback kept).
- New decision constants (reload 60 s, base accuracy 4_000 bp, velocity 762
  m/s are BALANCE TARGET anchors; production tuning is a version
  bump under the same contract, never silent.
- INC-3 (phase wiring + consequences) must accept a null winner/loser from
  time-limit/tie-end battles and map survivors/sunk into fleet hp damage.
- Cross-process child `run-battle-resolution-child` extends the existing
  run-* harness; the repo's `packages/cross-process-test` child is NOT touched
  this increment (INC-3 natural point, recorded deferral).

## Acknowledged limits (deferred, recorded)

- §32 scenario-terminal / objective / withdrawal / mutual-disengagement
  predicates: not implemented this slice (the auto-resolver reports
  false — the engine stages owning them land later).
- No magazine/fire persistence across minutes (fire/flooding sources are
  created per-hit; progressive flooding is M3/C-5).
- Statistical validation (DESIGN-38 §34, 1_000 paired runs) → REL-1.

## Related requirements

DESIGN-38 §§32–33/§35–37, DESIGN-37 §29–32, DESIGN-41 §8/§29–32/§45–48,
DESIGN-42 §1–2, DESIGN-55 §3; ENGINEERING-CONTRACT (determinism, arithmetic,
RNG domain separation, hashing).

## Related ADRs

ADR-0025 (INC-1), ADR-0022 (weather scope), ADR-0021 (B-4 armor/damage scope),
ADR-0020 (B-3 gunnery scope/reason codes), ADR-0018 (B-2 integration
boundary), ADR-0007 (cross-process determinism/goldens).