# M3 Capability Registry and Acceptance Evidence

> Governed by DESIGN-55 §7 (Capability Registry), §8 (Readiness State), §9
> (Acceptance Contract), §10 (Acceptance Evidence). Durable form of the C-6 gate.
> Sign-off: `M3_ADVANCED_SURFACE_WARFARE` **COMPLETED** (DESIGN-55 §23) at the C-6
> closure on branch `dev` (2026-08-29), with recorded limitations below.

## Acceptance predicate (DESIGN-55 §9)

For the whole milestone the validate run evidences:

- **Contracts resolved:** no `OPEN DECISION` marker remains in any governing M3
  doc (DESIGN-34/35/40/41/42/48); the M3 decisions reached the ADR threshold and
  are recorded: ADR-0031 (C-1 torpedo scope/integration), ADR-0033 (C-2 mine
  warfare scope), ADR-0034/0035/0036/0037 (C-3 submarine scope/blue-water
  representation/detection modifier/screening-balance semantics),
  ADR-0039 (C-4 coastal-defense scope), ADR-0040 (C-5 smoke + damage-control
  scope).
- **Implementation at required boundaries:** C-1..C-5 landed all six M3
  capability families across `@bluewave/combat` (torpedo, mine, submarine,
  coastal-defense, smoke, damage-control modules).
- **Tests:** full suite green across every engine package (contracts 20,
  diagnostics 7, deterministic 11, random 16, content-compiler 14, campaign 107,
  campaign-engine 79, events 25, commands 16, persistence 47, combat 2524,
  ai 22, phase-engine 145, compiler-cli 95, cross-process 14); the sole red
  engine suite is the pre-existing separately-tracked broken import
  `content-schema/test/nation.test.ts` (not M3-scoped); desktop has 2
  pre-existing unrelated failures (campaignBridge NOT_IMPLEMENTED→INVALID_PAYLOAD,
  ConstructionWizard "ship name" assertion over-match).
- **Auto-resolution:** `@bluewave/combat` auto-resolves all M3 weapon families
  (torpedo launches/tracks/hits, submarine mission effectiveness, coastal
  artillery effectiveness, mine-pressure lifecycle, smoke drift/decay, damage
  control progression) deterministically within the minute-advance tactical
  engine; `BattleResolver`/`StrengthCalculator` unmodified throughout.
- **Save/replay/hashes:** `@bluewave/persistence` save/load + `ReplayVerifier`
  round-trip; `ReplayVerifier` reproduced the closing hash;
  `scripts/verify-golden-hashes.cjs` 10/10.
- **Determinism:** cross-process child runs byte-identical across all M3
  modules (torpedo, mines, submarines, coastal-defense, smoke, damage-control
  determinism tests); goldens regenerated where engine wiring added a new
  minute-advance stage (C-5 smoke step 5.5, C-5 damage-control step 8.6) under
  ADR-0007 with documented cause.
- **Content validation:** production-pack test green (`.ai/reports/*`); no new
  content classifications required for M3 (content authored in CONTENT-1..3
  remains `SUPPORTED_MECHANICAL` where owning mechanics are accepted).

## Registry

Each capability lists: readiness state, implementing packages, governing docs,
primary test suites, acceptance evidence.

| §4 capability | State | Implementing packages | Governing docs | Primary tests | Evidence |
|---|---|---|---|---|---|
| Torpedoes | ACCEPTED | `@bluewave/combat` (torpedoes/) | DESIGN-40 | `combat/test/torpedo/*` (517 tests) | C-1 (ADR-0031) |
| Mines | ACCEPTED | `@bluewave/combat` (mines/) | DESIGN-35 | `combat/test/mines/*` (357 tests) | C-2 (ADR-0033) |
| Submarines | ACCEPTED | `@bluewave/combat` (submarines/) | DESIGN-34 | `combat/test/submarines/*` (294 tests) | C-3 (ADRs 0034–0037) |
| Coastal defenses | ACCEPTED | `@bluewave/combat` (coastal-defense/) | DESIGN-48 | `combat/test/coastal-defense/*` (78 tests) | C-4 (ADR-0039) |
| Smoke | ACCEPTED | `@bluewave/combat` (smoke/) | DESIGN-42 §§7-23 | `combat/test/smoke/*` (203 tests) | C-5 (ADR-0040) |
| Detailed damage control | ACCEPTED | `@bluewave/combat` (damage/ — fire, flooding, resources) | DESIGN-41 §§13-22, §24-25, §27-28 | `combat/test/damage/*` (505 damage-control tests) | C-5 (ADR-0040) |

## Non-blocking limitations (recorded, not dropped)

- Progressive-flooding resolution (DESIGN-40 §18) → deferred to a later M3 follow-up.
- Torpedo evasion (DESIGN-40 §25), damage persistence (§26) → deferred.
- Submarine tactical allocation/loss (DESIGN-34 §§2-3), returning-ship interception (§21),
  ASW resolution application (§22), friendly-fire outcomes (§23-24), strategic attack loss
  application (§19) → deferred (battle machinery / DESIGN-29 unassigned).
- Mine-strike resolution (§11/§14-15/§17-18/§25-26), phase/snapshot wiring, route-strike
  application → deferred (blocked on DESIGN-25 deployment/logistics).
- Smoke→gunnery/spotting integration → deferred to a later combat integration sprint.
- Full terminal damage state machine, survivors/rescue → deferred.
- YAML/ruleset constants for all M3 modules → CONTENT-track (deferred).
- Coastal-defense battle-participation integration, campaign-infrastructure consequence,
  AA progression → deferred.

## Pre-existing, non-blocking, separately-tracked defects

- `content-schema/test/nation.test.ts` — broken import (deleted corpus). Repair
  deferred to the owner at final validation per SPRINT-PLAN.
- `apps/desktop` 2 test failures: campaignBridge NOT_IMPLEMENTED→INVALID_PAYLOAD
  (bridge validation hardening), ConstructionWizard "ship name" assertion over-match
  (test assertion too broad) — both pre-existing, unrelated to M3.

## Sign-off

`M3_ADVANCED_SURFACE_WARFARE`: **COMPLETED** (scoped closure per the limitations
above).

- Acceptance authority: autonomous engineering agent (C-6 gate).
- Evidence hash: see `.ai/reports/c6-m3-acceptance-gate.md`.