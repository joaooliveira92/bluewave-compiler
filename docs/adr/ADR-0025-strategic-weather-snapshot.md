# ADR-0025 (B-6 INC-1): Strategic Weather Snapshot Persistence + Authoritative `weather_generation` Wiring

## Status

Accepted 2026-08-15

## Context

B-5 (ADR-0022) shipped the pure strategic-weather generation engine
(`generateStrategicWeather` in `@bluewave/combat`), the `StrategicWeatherState`
surface, and a registered-but-no-op `weather_generation` phase (order 0.5) whose
campaign wiring was explicitly deferred to B-6. B-6 INC-1 must make the phase
**authoritative**: every month, for every strategic area, generate the
current-month per-area `StrategicWeatherState` from a canonical climate source
and persist it on the `CampaignSnapshot` so the B-6 battle-initialization
increments can initialize battle weather from a committed per-area state.

Three design decisions reached the ENGINEERING-CONTRACT ADR threshold and are
recorded here instead of left implicit:

1. **The compiled snapshot carries no calendar date.** `CampaignSnapshot`
   (packages/campaign/src/state.ts) has `turnNumber` (0 = start month) but no
   scenario id / start date, and the weather stream's month ids are
   `"YYYY-MM"` (e.g. `1880-02`). The month id must be derived WITHOUT
   wall-clock/env/locale (determinism contract).
2. **No climate profile exists at the campaign layer.** `@bluewave/combat`
   shipped the engine surface but no canonical default profile; region YAML is
   CONTENT-track (deferred, spec §1.3).
3. **The snapshot schema changes** (new fields) — an old save must not
   continue under the new shape (spec §1.4 migration stance).

## Decision

1. **Snapshot fields (canonical, versioned).** `CampaignSnapshot` gains three
   REQUIRED fields (mirroring the `battleManifests` precedent — required
   surface + defensive reads at consumers):
   - `startYear: number`, `startMonth: number` — the campaign's authoritative
     start calendar date (DESIGN-03 §1/§2 anchor).
   - `strategicWeather: CampaignWeatherState[]` — the CURRENT campaign month's
     per-area states only (no unbounded growth; history lives in ledgers).
     **Canonically ordered by areaId** (array preserves order through the
     canonical serializer — DESIGN-06 §30 — and through `SaveStore`'s JSON
     path; no Map/Record special-casing needed). The state type is structured
     in `@bluewave/campaign` (`CampaignWeatherState`, same precedent as
     `BattleManifest`) so campaign stays dependency-free; `@bluewave/combat`'s
     `StrategicWeatherState` is structurally identical.
   - Shape/field names recorded here; the phase engine commits and
     `cloneSnapshot` deep-clones it.

2. **Month-id derivation (never wall-clock/env/locale).** New pure helpers in
   `@bluewave/campaign` (timeline.ts, exported via index):
   `monthId(year, month)` → `"YYYY-MM"` zero-padded and
   `campaignMonthId(startYear, startMonth, turnNumber)` =
   `fromLinear(toLinear(start, month) + turnNumber)` rendered `YYYY-MM`.
   `MonthExecutor` derives the campaign month from the snapshot's OWN start
   fields, so the weather stream domain is `campaign/weather/<areaId>/<month>`
   with a real calendar month id.

3. **Compile-time start stamping.** `CampaignCompiler` stamps
   `startYear`/`startMonth` on the compiled snapshot. Resolution order
   (documented on the new optional `CampaignCompilerInput.campaignStart`
   input): (1) `campaignConfiguration.scenarioId` → the canonical scenario's
   start (DESIGN-03 §1 — every scenario starts January of its identifier
   year); (2) the validated explicit `campaignStart` input; (3) the canonical
   default `DEFAULT_CAMPAIGN_START` — scen_1880, January 1880 — used when a
   content-pack campaign is compiled without DESIGN-03 configuration (the
   proven `run-child`/desktop paths; all shipped production/fixture content is
   1880-based). A malformed `campaignStart` (year `< 1800` or month outside
   1..12) FAILS the compile with `INVALID_CAMPAIGN_START` (stable diagnostic,
   never a silent fallback). The desktop New-Game path threads the selected
   scenario's start via `createInitialCampaignState`.

4. **Shipped canonical default climate profile** — `defaultClimateProfile_v1`
   in `@bluewave/combat` (weather/default-climate-profile.ts, exported via the
   weather barrel): `climateProfileId "default"`, `climateVersion
   "weather_climate_v1"`, four seasons (winter/spring/summer/autumn, assigned
   by calendar month) with canonical-legal ranges (sea state 0..9, all
   basis-point quantities 0..10_000, wind direction 0..359 integer, base
   visibility > 0), and NO transition tables (absent = the ADR-0022 §8
   no-transition policy). The `seasonAssignment` enumerates the WHOLE
   canonical simulation span (1880-01 .. 1970-12) because the engine keys on
   the full `"YYYY-MM"` month id — a year-independent 12-entry map would fail
   with `WEATHER_PROFILE_INCOMPLETE` for any non-1880 campaign month. The map
   is frozen, computed once with pure integer calendar arithmetic (never
   ambient time); an out-of-span month fails closed. This profile is the
   canonical climate source until the CONTENT-track supplies region
   profiles.

5. **Authoritative phase wiring.** `MonthExecutor` runs `weather_generation`
   right after `opening_validation` (registry order 0.5), before
   `monthly_revenue`/`command_collection`: areas are iterated in sorted areaId
   order; each area's state is generated via
   `generateStrategicWeather({ areaId, month: campaignMonthId(...),
   climateProfile, campaignSeed, priorState, randomLedger })` with
   `randomLedger` = the phase's own ledger (every keyed draw recorded, port
   pattern). `rngAllowed: true` holds — the ONLY randomness is the keyed
   stream inside the engine; the phase itself consumes none. The climate
   source is a per-area map (`StrategicWeatherPhaseOptions.climateProfiles`);
   when absent every area uses `defaultClimateProfile_v1` (the canonical
   default IS the source, no fallback). An area with NO profile fails closed
   via `collector.addError("WEATHER_PROFILE_INCOMPLETE", …, { stage:
   "weather_generation" })` and gets no committed state — never a crash, never
   a silent skip.

6. **Compatibility bump + migration stance (spec §1.4).**
   `CURRENT_COMPATIBILITY_VERSION` 1.0.0 → **1.1.0**:
   - old (1.0.0) saves are REJECTED with the stable
     `PERSISTENCE_COMPATIBILITY_MISMATCH` diagnostic — no silent continuation
     with mismatched shapes, no migration engine needed at this point
     (a 1.0.0 save has no start fields / weather; the shape cannot be
     reconstructed).
   - `SaveStore` round-trips the new fields automatically (`to/fromStorableSnapshot`
     spread the snapshot; `strategicWeather` is a JSON-native array).
   - Goldens regenerate under ADR-0007 with `scripts/regenerate-golden-hashes.cjs`
     (the sanctioned mechanism — never hand-edited), old→new documented in the
     change description.

## Consequences

- Every compiled snapshot carries a canonical start date and an empty
  `strategicWeather`; every executed month commits one deterministic state per
  world area, sorted by areaId — the cross-process child and `ReplayVerifier`
  subset-hashes now include the field, so save/load/replay/goldens PROVE the
  weather lands on the snapshot.
- The resulting hashes change in exactly the expected keys:
  `initialSnapshotHash`, `closingSnapshotHash`, `commandLedgerHash`,
  `financialLedgerHash` (financial entries carry the real month id),
  `randomDecisionLedgerHash` (+8 weather decisions per fixture area; 3 fixture
  areas → 24),
  `replayVerificationHash`; `contentArtifactHash`, `eventLedgerHash` (this
  flow's events timestamp by turn), and `battleGenerationHash` remain
  unchanged (content compiler and battle generation untouched; go through
  ADR-0007 with the recorded before/after).
- `BattleResolver`/`StrengthCalculator` are NOT modified (diff-checked).
- Region-specific climate YAML stays CONTENT-track (recorded deferral).
- The desktop app threads the scenario start into the compile (2 lines) so a
  non-1880 scenario never gets a wrong start stamp.

## Related requirements

DESIGN-01 §1/§2 (scenarios/timeline), DESIGN-31, DESIGN-42 §1 (strategic
weather provenance), DESIGN-55 §3, spec B-6 AC-1/AC-2/AC-11/AC-12 §1.4;
ENGINEERING-CONTRACT (determinism, serialization, persistence/compat).

## Related ADRs

ADR-0022 (weather scope), ADR-0007 (goldens), ADR-0003 (serializer/hash),
ADR-0006 (campaign architecture).