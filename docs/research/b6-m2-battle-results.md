# Research — B-6 M2 Battle Results → Campaign Integration (auto-resolution + consequences)

> Sprint: B-6 (`@bluewave/combat`, `@bluewave/campaign`, `@bluewave/phase-engine`;
> `.scratch/b6-m2-battle-results`).
> Purpose: ground the B-6 integration contract — **battle auto-resolution
> orchestrator**, **battle-end semantics**, **campaign consequences (war score,
> ship loss, reservations)**, and **strategic-weather snapshot persistence** — in
> the canonical DESIGN-31/37/38/42/55 contracts before wiring.
> This note is **contract grounding**: where a normative integer or predicate is
> pinned by a DESIGN document, B-6 ships it verbatim; where a value is
> historically-sourced rather than primary-authoritative it is flagged
> **BALANCE TARGET** and deferred to the CONTENT-track. No canonical rule is
> silently invented; open points are recorded as decisions/ADRs.

## 1. Battle-end semantics (DESIGN-38 §32) — normative, B-6 ships verbatim

Battle end is evaluated in this precedence order (already implemented as
`BATTLE_END_PRECEDENCE` in `packages/combat/src/battleEnd.ts`):

1. scenario-specific terminal condition;
2. no viable combatants on one side;
3. objective completion with declared immediate-end effect;
4. one side completes withdrawal;
5. mutual disengagement;
6. time limit.

Every battle has a positive-integer maximum duration; shipped default **360**
battle minutes (`DEFAULT_MAX_BATTLE_MINUTES`). A time-limit end MUST still
resolve all current-minute effects before finalization — the auto-resolver must
apply the terminating minute's gunnery/damage/weather before declaring end.

Implication for `resolveBattleAuto`: after `evaluateBattleEnd(input).ended===true`
the battle is final; the terminating minute's effects are part of the result.

## 2. Auto-resolution requirements (DESIGN-38 §§33–34) — normative

- Auto-resolution MUST be available for every accepted battle manifest
  (§33). Campaign continuity MUST NOT require player tactical command.
- Auto-resolution consumes the same manifest, campaign asset state, battle
  seed, weather, objectives, realism-independent ship/force statistics, and
  ruleset/formula versions as tactical play (§33), and MUST NOT add ambient
  randomness or wall-clock dependence.
- The battle seed is already derived deterministically (DESIGN-37 §32;
  `deriveBattleSeed`, keyed stream `battle/battle_id/root`). B-6 must feed that
  exact seed into the tactical engine so the auto-result is a deterministic
  function of the manifest.
- §34 statistical validation (1_000 paired seeded runs, ≤10% mean relative
  error, ≤10 pp loss-rate / mission-success differences, ≤5 pp side bias)
  validates the auto-resolver against a distinct fast resolver in packaged
  smoke → **deferred to REL-1**; B-6 delivers the deterministic auto-run +
  equivalence proof-hash (recorded deferral, not a fabricated pass).

## 3. Campaign consequences (DESIGN-31 war score; DESIGN-37 §20/§"battle result")

- Battle outcomes feed each side's **war score** (DESIGN-31; integer, −100..100,
  victory classification + magnitudes per ADR-0010; defeated ships contribute to
  `participantMemberships[].nationalContributionPoints` via the existing
  `applyBattleResult` in `month.ts`).
- "Allied damage, loss, ammunition, fuel, crew, officer, experience, and
  political results MUST apply to the owning participant through campaign
  provenance" (DESIGN-37 §19/§20-463). B-6 ships the narrower, existing-proved
  seam: ship HP damage + removal on terminal (SINKING/FOUNDERED) + war score +
  contribution, each attributed via the battle's `warId`/`battleId` provenance
  records. Crew/officers/analysis are not implemented anywhere yet (M3+).
- The `BattleResult` shape `applyBattleResult` already consumes
  (`winnerId`, `loserId`, `damageReport`) — B-6 must produce exactly this from
  the tactical engine, preserving the A-3 war-score/victory classification
  (ADR-0010) unchanged.

## 4. Weather provenance (DESIGN-42 §1/§2/B-5)

- B-5 ships `StrategicWeatherState` (per-area, per-month) + a no-op
  `weather_generation` phase + fail-closed `INVALID_BATTLE_WEATHER_INITIALIZATION`.
- B-6 makes `weather_generation` authoritative: per-area generation keyed by
  `campaign/weather/<areaId>/<month>` from a canonical **climate profile** (engine
  default `climate_profile_v1`; region-specific YAML is CONTENT-track, deferred).
- Battle init consumes the **battle area's** committed strategic weather; missing
  → fail closed. So the snapshot must carry per-area current-month weather →
  golden regression under ADR-0007 (ticket 05).

## 4. Snapshot shape & migration (DESIGN-06/52/55 §28)

- `CampaignSnapshot` gains `strategicWeather` (current-month per-area states
  only; historical weather lives in ledgers). This is a **serialized-schema
  change**: old saves must be either migrated or rejected with a stable
  diagnostic — per ADR-0007 process, documented old→new hash + cause (ticket 05).
- The serializer must order areas canonically (DESIGN-06 §30) so the hash is
  platform-independent (no filesystem/env order).
- `cloneSnapshot` in `month.ts` and the cross-process child also change in the
  same commit so save/load+replay+goldens stay consistent.

## Deferred / owners

- DESIGN-38 §34 statistical validation study (1,000 paired) → **REL-1**
  (packaged smoke; `.ai/SPRINT-PLAN.md` REL-1 row).
- Region-specific climate-profile YAML → **CONTENT-track** (C-track).
- Player tactical play UI / renderer control of a battle → **UI-track**.
- `BattleResolver`/`StrengthCalculator` (M1 fallback path) — kept, not removed.
- Combat/officer/analysis consequences beyond HP+war-score → **M3+** rows.

## Sources (referenced this sprint)

- DESIGN-18/31/37 §19-20/§29-30/§32-34, DESIGN-42 §§1–2/§24–30, DESIGN-55 §3/§7–10/§23/§28 (authoritative; shipped verbatim).
- B-1..B-5 reports + ADR-0010/0013/0018/0019/0020/0021/0022 (engine state before B-6).
- `packages/combat/src/battleEnd.ts` (§32), `generation/seed.ts` (§32 seed),
  `phase-engine/src/month.ts` `applyBattleResult` (A-10 contract), `registry.ts`
  (phase orders 0.5/8), `cross-process-test/src/run-child.ts` (golden surface).
- Historical grounding pending → content-track research notes reach span
  (`docs/research/content-1..3-*`) used only as BALANCE TARGET background.