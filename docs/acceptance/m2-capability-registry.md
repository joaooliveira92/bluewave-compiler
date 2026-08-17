# M2 Capability Registry and Acceptance Evidence

> Governed by DESIGN-55 §7 (Capability Registry), §8 (Readiness State), §9
> (Acceptance Contract), §10 (Acceptance Evidence). Durable form of the B-6 gate.
> Sign-off: `M2_SURFACE_TACTICAL_CORE` **COMPLETED** (DESIGN-55 §23) at the B-6
> closure on branch `dev` (2026-08-15), with recorded limitations below.

## Acceptance predicate (DESIGN-55 §9)

For the whole milestone the validate run evidences:

- **Contracts resolved:** no `OPEN DECISION` marker remains in any governing M2
  doc (DESIGN-38/39/41/42/37); the M2 decisions reached the ADR threshold and
  are recorded: ADR-0013 (ship type classifier), ADR-0014/0015 (missions/
  reachability), ADR-0018 (B-2 scope/integration), ADR-0019 (contact shape),
  ADR-0020 (B-3 scope/reason codes), ADR-0021 (B-4 armor/damage),
  ADR-0022 (B-5 weather scope), ADR-0025 (B-6 strategic-weather snapshot),
  ADR-0026 (B-6 auto-resolution orchestrator), ADR-0027 (B-6 phase wiring +
  consequences).
- **Implementation at required boundaries:** B-1..B-6 landed all seven M2
  capability families across `@bluewave/combat` + `@bluewave/campaign` +
  `@bluewave/phase-engine`.
- **Tests:** full suite green across every package (combat 900, campaign 107,
  phase-engine 108, persistence 26, cross-process 14, content-compiler 14, ai
  22, commands 16, events 9, deterministic 11, random 16, contracts 20,
  diagnostics 7); the sole red suite is the pre-existing separately-tracked
  broken import `content-schema/test/nation.test.ts` (not M2-scoped).
- **Auto-resolution:** `@bluewave/combat` `resolveBattleAuto` (DRING-INC-2)
  deterministically auto-resolves every manifest-carrying campaign battle
  through the tactical engine; the M1 `BattleResolver` remains the accepted
  fallback for manifest-less battles (DESIGN-38 §33).
- **Packaged smoke / statistical study (DESIGN-38 §34, 1_000 paired runs):**
  deferred to REL-1 (packaged smoke; recorded, not claimed).
- **Save/replay/hashes:** `@bluewave/persistence` save/load + `ReplayVerifier`
  round-trip resolved battle results + strategic weather; `ReplayVerifier`
  reproduced the closing hash; `scripts/verify-golden-hashes.cjs` 10/10.
- **Determinism:** two independent child-process runs byte-identical; goldens
  unchanged by B-6 post-INC-1 (INC-1 regenerated under ADR-0007 with a
  documented cause).
- **Content validation:** production-pack test still green (weather/battle
  content additions are CONTENT-track in later sprints).

## Registry

Each capability lists: readiness state, implementing packages, governing docs,
primary test suites, acceptance evidence.

| §3 capability | State | Implementing packages | Governing docs | Primary tests | Evidence |
|---|---|---|---|---|---|
| Tactical movement | ACCEPTED | `@bluewave/combat` (movement/, simulation/) | DESIGN-38 §§3-8 | `combat/test/movement/*`, `combat/test/simulation/*` | B-2 (ADR-0018/0019); 900 combat tests |
| Spotting & contact | ACCEPTED | `@bluewave/combat` (spotting/, contact/, targeting.ts) | DESIGN-38 §§8/28 | `combat/test/spotting/*`, `combat/test/contact/*` | B-2 |
| Tactical divisions & formations | ACCEPTED | `@bluewave/combat` (tactical/division.ts), `@bluewave/campaign` (division.ts), `@bluewave/phase-engine` (division commands) | DESIGN-26; DESIGN-37 | `phase-engine/test/diplomacy-war*` (division), `combat/test/tactical/*` | B-1 (ADR-0012) |
| Gunnery | ACCEPTED | `@bluewave/combat` (gunnery/, gunnery_ballistics) | DESIGN-39 | `combat/test/gunnery/*`, `combat/test/reason-codes-gunnery.test.ts` | B-3 (ADR-0020) |
| Basic armor & damage | ACCEPTED | `@bluewave/combat` (armorModel, damage/, terminalSeam) | DESIGN-41 §§1-9/14-20/45-48; DESIGN-39 §§16-24 | `combat/test/damage/*` | B-4 (ADR-0021) |
| Tactical weather | ACCEPTED | `@bluewave/combat` (weather/), `@bluewave/campaign` (strategicWeather), `@bluewave/phase-engine` (weather_generation) | DESIGN-42 §§1-6/24-30 | `combat/test/weather/*`, `phase-engine/test/weather-generation.test.ts` | B-5 (ADR-0022) + B-6 INC-1 (ADR-0025) |
| Battle results | ACCEPTED | `@bluewave/combat` (battleResolution/, battleEnd.ts), `@bluewave/phase-engine` (battle_resolution phase) | DESIGN-38 §§31-35; DESIGN-37 §§29-32; DESIGN-31/ADR-0010 | `combat/test/battle-resolution/*`, `phase-engine/test/battle-{resolution-phase,consequences}.test.ts` | B-6 INC-2/3 (ADR-0026/0027) |

## Non-blocking limitations (recorded, not dropped)

- DESIGN-38 §34 statistical auto-resolution study (1_000 paired seeded runs) →
  REL-1 packaged smoke (`finalDecision` gate).
- Region-specific climate-profile YAML → CONTENT-track (C-track).
- Player tactical-play UI / interactive renderer control of a battle → UI-track
  (auto-resolution is the authoritative campaign path, DESIGN-38 §33).
- Crew/officers/analysis/political ship consequences beyond hp + war score →
  M3+ (DESIGN-27/28/33 rows).
- B-1 AC-14 production `fleets.yaml` → `designs.yaml` `designVersionId` linkage →
  CONTENT-track.
- Smoke clouds (§§7-23) and detailed damage control → M3/C-5 (DESIGN-42/41).

## Pre-existing, non-blocking, separately-tracked defects

- `content-schema/test/nation.test.ts` — broken import (deleted corpus). Repair
  deferred to the owner at final validation per SPRINT-PLAN.
- `apps/desktop` renderer test/lint debt (missing `@testing-library/react` +
  package-name import fix) → desktop track.

## Sign-off

`M2_SURFACE_TACTICAL_CORE`: **COMPLETED** (scoped closure per the limitations
above).

- Acceptance authority: autonomous engineering agent (B-6 gate).
- Evidence hash: see `.ai/reports/b6-m2-battle-results-impl.md`.
