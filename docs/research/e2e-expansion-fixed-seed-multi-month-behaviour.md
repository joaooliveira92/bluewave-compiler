# Fixed-seed multi-month behaviour & suite wall-clock

**Research note for ticket 02** (`.scratch/desktop-e2e-expansion/issues/02-fixed-seed-multi-month-behaviour.md`)

## 1. Question

What deterministically happens when the fixed-seed Austria-Hungary campaign (seed `ba44581c2f1d8e5c9753ffc80be8e6a0`, nation `austria_hungary`, scenario `bluewave-1880-production`) advances past month 1? What do the Research, Diplomacy, Construction, Treasury screens show at month 2–3? Does any battle generate in 12 months? What does the existing cross-process test already prove, and what is the e2e suite's wall-clock budget?

## 2. Sources consulted

| Source | Path / URL | Verified |
|--------|-----------|----------|
| Cross-process determinism test | `packages/cross-process-test/test/cross-process.test.ts` | read |
| Production-pack loop test | `packages/cross-process-test/test/production-pack-loop.test.ts` | read |
| Run-child harness | `packages/cross-process-test/src/run-child.ts` | read |
| MonthExecutor source | `packages/phase-engine/src/month.ts` | read |
| Research phase source | `packages/phase-engine/src/research.ts` | read |
| Diplomacy phase source | `packages/phase-engine/src/diplomacy.ts` | read |
| Command lifecycle + validation | `packages/commands/src/lifecycle.ts` | read |
| Campaign compiler | `packages/campaign/src/compiler.ts` | read |
| Campaign state types | `packages/campaign/src/state.ts` | read |
| SaveStore + snapshot serialization | `packages/persistence/src/store.ts`, `snapshotSerialization.ts` | read |
| E2E fixtures | `apps/desktop/e2e/fixtures.ts` | read |
| E2E specs | `apps/desktop/e2e/smoke.spec.ts`, `mvp-loop.spec.ts`, `continuance.spec.ts` | read |
| Playwright config | `apps/desktop/playwright.config.ts` | read |
| CLI source | `apps/compiler-cli/src/commands.ts`, `main.ts` | read |
| Production content | `content/production/1880/economies.yaml`, `constructions.yaml`, `research.yaml`, `designs.yaml`, `countries.yaml`, `fleets.yaml`, `pack.json` | read |
| Golden hashes | `golden/hashes.json` | read |
| Research execution (CLI compile + vitest programmatic) | `/tmp/bw-research/` (one-off script), `packages/cross-process-test/test/` (temporary) | *run* |

## 3. Findings

### 3.1 Month 2–3 observable deltas

Compiled the production pack `content/production/1880` via `CampaignCompiler`, then ran `MonthExecutor.execute` 3 times with turn-number increment between calls, using seed `ba44581c2f1d8e5c9753ffc80be8e6a0`.

**Command sequence:**
- Month 1: `SetResearchPriority` (GUNNERY=4, all 15 fields specified; the validator requires ALL canonical field ids)
- Month 2: `SetResearchPriority` (MACHINERY=4, different weights), `DeclareWar` (target: austria_hungary→italy), `budget_project` (projectId: `con_aut_tegetthoff`, budget: 20)
- Month 3: no commands (observes carry-over effects)

#### (a) Research — observable priority change

Yes, the `SetResearchPriority` command produces an instantaneous observable change. The snapshot's `fieldPriorities` are updated in the `command_collection` phase and visible on the very next snapshot read:

- Turn 0 (initial): `{"GUNNERY":2,"MACHINERY":2}` (from `research.yaml`)
- Month 1 (turn 1): full 15-field set with `GUNNERY:4, MACHINERY:2, ...` (command 1 applied)
- Month 2 (turn 2): `MACHINERY:4, GUNNERY:2, ...` (command 2 applied)

**IMPORTANT constraint for e2e spec authors**: A `SetResearchPriority` command MUST include all 15 canonical research field ids (`HULL_CONSTRUCTION`, `MACHINERY`, `SHIP_DESIGN`, `GUNNERY`, `FIRE_CONTROL`, `TORPEDOES`, `SUBMARINES`, `MINES_AND_ASW`, `AVIATION`, `CARRIER_OPERATIONS`, `RADAR_AND_ELECTRONICS`, `MISSILES`, `AMPHIBIOUS_OPERATIONS`, `INFRASTRUCTURE`, `DAMAGE_CONTROL`). Missing any field causes rejection with `RESEARCH_PRIORITY_CONSTRAINT_VIOLATED`. At least 1 and at most 5 fields must have weight 4 (HIGH). Valid weights are 4 (HIGH), 2 (MEDIUM), 1 (LOW).

**Research budget / tech progression**: 

Austria-Hungary's initial research state has only one tech (`hc_wrought_iron_hull`, cost 50, already completed). No other techs have their prerequisites met in 1880. The research phase's `findEligibleTechsForField` returns zero eligible technologies. When no eligible fields exist, the research phase `continue`s past the nation — **neither the research budget deduction nor the `researchBudget: 0` reset occurs**. The researchBudget of 20 persists unchanged across months. No tech points are invested, no techs are discovered.

A future e2e assertion on the Research screen would show:
- `fieldPriorities` reflecting the last accepted `SetResearchPriority` command
- `researchBudget` always 20 (no deduction because no eligible tech)
- `technologies` unchanged (only `hc_wrought_iron_hull`, completed)
- No `discoveredTechs` ever added

#### (b) Diplomacy — observable war declaration

Yes, a `DeclareWar` command produces an observable change in the snapshot's `wars` and `politics.relations`:

- Month 2 (turn 2), after command submission: `wars.wars` contains:
  ```json
  { "id": "war_austria_hungary_italy_1880-02", "status": "DECLARED_NOT_ACTIVE",
    "attackerWarScore": 0, "defenderWarScore": 0,
    "attackerId": "austria_hungary", "defenderId": "italy" }
  ```
- `politics.relations` entry for `austria_hungary`-`italy` changes from `"relation":"neutral","tension":5` to `"relation":"at_war","tension":15`.
- War persists as `DECLARED_NOT_ACTIVE` across all later months — the `resolveDiplomacyPhase` never promotes it to `ACTIVE` (it only processes blockades).
- Month 3: same war entry, no escalation, no war-score changes (no blockades declared on the war).

**Battle generation**: Even though `DECLARED_NOT_ACTIVE` wars trigger the `battle_generation` phase, `generateBattles` returned zero manifests/battles across 12 months. Reason: AUT fleet is in area `auh_adriatic_coast`, ITA fleet is in `ita_tyrrhenian_coast` — separate sea areas with no co-located forces.

#### (c) Construction — observable progress and completion

Yes, a `budget_project` command produces progressive and completion effects:

- Turn 0: `con_aut_tegetthoff`: `completedWork: 85`, `totalWork: 100`, `status: "ACTIVE"`
- Month 1 (no budget command): unchanged, still 85/100
- Month 2 (budget 20 applied): `completedWork: 100`, `status: "COMPLETED"` (85 + 20 = 105, clamped to 100)
- Month 3: construction_processing phase moves the completed ship into the fleet. A new `Ship` is created with hitPoints from the design (`des_aut_tegetthoff`: hitPoints=36).

**Completed ship details** (appears in fleet in month 3):
```json
{ "id": "ship-aut_tegetthoff-2", "name": "Ship Tegetthoff",
  "classId": "Tegetthoff", "hitPoints": 36, "speed": 7,
  "firepower": 18, "armor": 356, "isUnderConstruction": false }
```

The ship's maintenance cost (3/turn from floor(36×10/100) = 3) starts affecting treasury in month 3.

#### (d) Treasury — concrete before/after figures

| Turn | Month | AUT treasury | Δ from prev | Drivers |
|------|-------|-------------|-------------|---------|
| 0    | —     | 240         | —           | Initial (from `economies.yaml`) |
| 1    | Jan 1880 | 225      | -15         | Maintenance (6) + Obligation (9) |
| 2    | Feb 1880 | 190      | -35         | Maintenance (6) + Obligation (9) + Budget command (20) |
| 3    | Mar 1880 | 172      | -18         | Maintenance (9, includes new ship) + Obligation (9) |

**Revenue**: monthly_revenue phase produces 0 for AUT because `baseResources: 0` → `navalAppropriationRateBp` (2000) has no effect. The revenue calculation is `floor(floor(baseResources * rateBp / 10000) / 12) = 0`.

**Appropriation**: no construction funds are appropriated because `computeConstructionCap(nation)` = `floor(floor(baseResources / 12) / 100)` = 0.

**Research budget deduction**: does NOT occur because the research phase finds no eligible techs and `continue`s past the treasury-deduction code. The `researchBudget` of 20 remains on the snapshot each month.

### 3.2 Battle generation within 12 months

**None.** No battle manifests, no BattleInstance entries, no battle seeds in any of the 12 executed months. The compiled scenario starts with zero wars (all relations neutral). The only war (AUT vs ITA, declared in month 2) remains `DECLARED_NOT_ACTIVE` with opposing fleets in different sea areas. The `generateBattles` function (`@bluewave/combat`) finds no eligible missions.

This means:
- A prospective "Battle Arena" fog-of-war feature has no battle to stage under this seed/scenario within the first year.
- Any e2e assertion about battle contents cannot be keyed to this seed — a different seed (or a scenario with pre-deployed active wars) would be needed.

### 3.3 Cross-process determinism scope

What `packages/cross-process-test` already proves for the fixed-seed month advance:

**`test/cross-process.test.ts`** (2-nation synthetic fixture):
- Two child-process invocations produce **byte-identical** hashes for: content artifact, initial snapshot, closing snapshot, command ledger, event ledger, financial ledger, random/decision ledger, replay verification, battle generation.
- Golden reference hashes (`golden/hashes.json`) are available and all match.

**`test/production-pack-loop.test.ts`** (real `content/production/1880` pack):
- Compiles the real 14-nation production pack
- Advances one month via `MonthExecutor.execute` with a `budget_project` command against UK's `con_gbr_inflexible`
- Saves, loads, replays → all match deterministically
- This test runs in ~132ms.

**Conclusion for e2e design**: The cross-process byte-determinism of compile + single-month advance + replay is already proven at the unit/integration level. The e2e suite should NOT re-prove byte-determinism — that's a unit property, not a UI property. The e2e layer proves the UI correctly **renders** the deterministic output.

### 3.4 Wall-clock budget

| Factor | Value | Source |
|--------|-------|--------|
| Workers | 1 | `playwright.config.ts` `workers: 1` |
| Per-test timeout | 120 s | `playwright.config.ts` `timeout: 120_000` |
| Electron launch timeout | 60 s | `fixtures.ts` `electron.launch({timeout: 60_000})` |
| Landing-text wait timeout | 15 s | `fixtures.ts` `getByText(LANDING_TEXT).waitFor({timeout: 15_000})` |
| Overview heading wait | 30 s | `mvp-loop.spec.ts` `toBeVisible({timeout: 30_000})` |
| Spec files | 3 (`smoke.spec.ts`, `mvp-loop.spec.ts`, `continuance.spec.ts`) | `apps/desktop/e2e/` |
| Tests per file | 1 (smoke), 6 (mvp-loop, serial), 5 (continuance, serial) | count from specs |
| **Estimated boot time per test** | ~12–20 s | Electon launch (~8–15s) + window load + landing text. No recorded data; this is an estimate based on typical Electron cold-start on macOS. |
| **Estimated action time per test** | ~5–30 s | Varies: smoke (~5s), compile/Advance Month (~30s each), Replay (~15s) |
| **Estimated suite total** | ~4–8 min | 12 boots × ~15s avg boot + ~10s avg action ≈ 300–500s. CI with 2 retries: up to 15–25 min. |

**No recorded CI durations exist in the repo.** The only test-results directory (`apps/desktop/test-results/`) contains artifacts from a partial local run that failed (2 timing-out tests in `continuance.spec.ts` and `mvp-loop.spec.ts`). The times above are estimates derived from the harness shape (one Electron boot per test via the fixture).

If the suite grew by N serial screens (each adding a new test that boots once and asserts one screen):
- Each additional N tests = N boots + N action cycles
- At workers:1, each added test adds ~20–50s to the total wall clock
- The 120s per-test timeout accommodates screen interactions but any test that triggers a recompile (campaign:compile via UI) may push close to that bound.

## 4. Key grounded values for e2e spec authors

| Assertion target | Concrete value(s) for spec | Source |
|-----------------|---------------------------|--------|
| Treasury at turn 0 | 240 | `economies.yaml:5` |
| Treasury after month 1 (no budget cmd) | 225 | run output |
| Treasury after month 2 (budget 20 + war) | 190 | run output |
| Treasury after month 3 (new ship active) | 172 | run output |
| Research priorities after month 1 | full 15-field set, GUNNERY=4 | run output (command 1) |
| Research priorities after month 2 | full 15-field set, MACHINERY=4 | run output (command 2) |
| Construction project ID | `con_aut_tegetthoff` | `constructions.yaml:51` |
| Project complete after budget 20 | 100/100 COMPLETED | run output month 2 |
| War ID after DeclareWar month 2 | `war_austria_hungary_italy_1880-02` | run output month 2 |
| War status | `DECLARED_NOT_ACTIVE` | run output months 2–12 |
| Battles in 12 months | 0 | run output (not generated) |
| AUT fleet area | `auh_adriatic_coast` | `campaign-state.json` |
| ITA fleet area | `ita_tyrrhenian_coast` | `campaign-state.json` |

## 5. Deferred / could not establish

- **Exact per-phase timing for the shell's bridge code**: the `MonthExecutor` runs 12 phases in sequence; which bridge IPC calls the desktop app makes, and which UI screens "Advance Month" triggers, are not observable from the engine layer. Those facts belong in a separate desktop-bridge research note.
- **A battle-generation trigger seed**: this seed produces zero battles with AUT-ITA. Finding a seed that does produce a battle requires running the `generateBattles` combinatoric search — deferred to a "seed hunting" ticket if the battle-arena feature needs an e2e-assertable battle.
- **Actual CI wall-clock times**: no CI runs recorded in the repo. The estimates above are from dry-code analysis of the harness shape. An actual CI artifact would give real seconds.