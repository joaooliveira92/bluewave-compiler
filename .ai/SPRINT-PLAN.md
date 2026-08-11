# Bluewave Sprint Plan — Full Project Backlog

Status: living backlog. Update as sprints resolve, split, or reorder.

## Purpose

Map every remaining unit of work between the current repository state and a
complete `M5_ELECTRONICS_AND_MISSILE_ERA` (DESIGN-55 §6), so an agent can move
from sprint to sprint without waiting on a human, stopping only at a genuine
`.ai/AUTONOMOUS-AGENT.md` stop condition or a `.ai/templates/decision-request.md`.

## How a sprint is executed

Every sprint is one pass through `.ai/IMPLEMENTATION-PROMPT.md`, gated by
`.ai/ENGINEERING-CONTRACT.md`, under the authority and stop conditions in
`.ai/AUTONOMOUS-AGENT.md`. There are two sprint kinds:

- **Scoping sprint** — no milestone brief exists yet. Follow the wayfinder
  convention already established at `.scratch/engine-suite-roadmap/` (see
  `docs/agents/issue-tracker.md`): open a map + numbered issue tickets, resolve
  open questions (research/prototype/grilling/task tickets), and land a brief
  at `.ai/briefs/<slug>.md` using `.ai/templates/milestone-brief.md`. B9 and
  B10a–d were produced this way — use them as the reference shape.
- **Implementation sprint** — an approved brief exists. Implement it per
  `.ai/IMPLEMENTATION-PROMPT.md` §4–8, with focused tests, a validation report,
  and Conventional Commits.

A capability is not "done" because code exists — see DESIGN-55 §8–9. Treat
`ACCEPTED` as the only status that lets a downstream sprint depend on it.

## Research requirement (why some sprints can't be pre-scoped now)

Two distinct kinds of "research" show up in this backlog:

1. **Scope/decision research** — resolving an implementation-detail ambiguity
   before a brief can be written (e.g. `.scratch/engine-suite-roadmap/research/electron-packaging.md`).
   Every M2–M5 sub-milestone below needs a pass like this before it has a brief.
   Use the `/research` skill or a wayfinder ticket for this.
2. **Domain/content research** (real ship classes, historical timelines, tuned
   combat constants) — **out of scope for every engine milestone in this plan.**
   B0 and B3 already establish that fixtures stay explicitly non-production
   (`.ai/briefs/B0-BOOTSTRAP.md`, `.ai/briefs/B3-B7-VERTICAL-SLICE.md`); DESIGN-55
   §12 keeps "content" (`SUPPORTED_MECHANICAL` vs `CONTENT_ONLY_LOCKED`) separate
   from milestone/capability readiness. Building a real historical content pack
   is a separate initiative this plan does not schedule — flag it explicitly if
   it becomes the next priority after M5.

## Current verified baseline (2026-08-10)

`docs/PROGRESS.md`'s status table is stale — it still reads "B9–B10: Not yet
started" despite committed work through B10a. Verified by running
`pnpm -w turbo run build test lint` directly, not by reading docs:

| Item | Actual state |
| --- | --- |
| B0–B8 | Committed, tests green (154+ tests) — matches PROGRESS.md |
| B9 Electron shell | Implemented across 5 commits through `fd066c7`; desktop build + 5 tests green | 
| B10a Economy & Construction | Implemented, committed at `bcc14d4` |
| B10b Research & Ship Design | **In progress, uncommitted.** Working tree has ~35 modified/new files rewriting `research_progress` → `resolve_research`, adding `CompiledDesignVersion`/`DesignFamily`, `SetResearchPriorityCommand` type, and `designFiles` to `CampaignFiles`. Was not buildable when this session started. |
| B10c, B10d | Not started; briefs ready at `.ai/briefs/b10c-diplomacy-war.md`, `.ai/briefs/b10d-ai-scenario.md` |
| M2–M5 | No briefs. Only DESIGN docs exist. |

### What this session found and fixed (uncommitted, not yet reviewed by you)

The uncommitted B10b WIP did not build. Root causes were mechanical fixture/typing
staleness from widening shared types (`CommandBody`, `CampaignFiles`, `ResearchState`)
without updating every call site — bounded, zero-ambiguity repairs per
`.ai/AUTONOMOUS-AGENT.md` "Autonomous authority":

- `packages/campaign/src/compiler.ts` — unsafe indexed access on `rec["mainGuns"]` (TS7053).
- `packages/commands/src/lifecycle.ts` — `authorize`/`reserve`/`resolve` read `envelope.body.*`
  without the same `as BudgetProjectCommand` narrowing `validate()` already used, broken by
  `CommandBody` widening to include `SetResearchPriorityCommand`.
- `packages/phase-engine/src/financial-ledger.ts` — re-indexing `this.transactions[index]`
  under `noUncheckedIndexedAccess` instead of reusing the just-pushed `tx`.
- `designFiles` missing from 8 `CampaignFiles` literals across
  `packages/campaign/test/campaign.test.ts` (×4), `apps/compiler-cli/src/commands.ts`,
  `packages/cross-process-test/src/run-child.ts`, `packages/phase-engine/test/integration.test.ts`.
- `ResearchState` literals missing the new `fieldPriorities`/`researchBudget`/`activeCandidates`/
  `discoveredTechs` fields in `packages/phase-engine/test/month.test.ts` (×3) and
  `apps/compiler-cli/test/cli.test.ts` (×1).
- `packages/phase-engine/test/integration.test.ts:531` asserted the old phase id
  `"research_progress"`; the registry and every other reference already use `"resolve_research"`
  (matches the brief's stated canonical id) — updated the assertion.

**Full workspace `build`, `test`, and `lint` are now green except one real failure**,
left unresolved deliberately because fixing it means guessing at unreviewed B10b behavior:

- `packages/phase-engine/test/month.test.ts > MonthExecutor > populates all ledgers`
  expects `randomLedger.all.length > 0` after a plain month execution. The rewritten
  `resolveResearchPhase` (DESIGN-20 pipeline) only draws RNG when a nation has at least
  one `HIGH` field priority and an eligible technology to allocate against; the test's
  `createSnapshot()` fixture has neither (`fieldPriorities: {}`, no compiled `technologies`
  in `snapshot.world`), and there are no pending battles either, so nothing draws
  randomness this month. This is a legitimate behavior change from the old
  always-roll-dice research phase — the fixture needs a real `HIGH` priority field plus
  a matching compiled technology (see `packages/phase-engine/test/integration.test.ts`'s
  richer YAML fixture, e.g. `MACHINERY: 4`, for the shape), not a loosened assertion.

None of this is committed. Nothing has been pushed. Say the word and I'll commit the
stabilization fixes separately from finishing B10b, per Conventional Commits.

## Sprint sequence

### Track A — finish M1 (Strategic Campaign Kernel)

| # | Sprint | Kind | Depends on | Notes |
| - | --- | --- | --- | --- |
| 0 | **Close out in-flight B10b** | Implementation (resume) | none | Resolve the `populates all ledgers` fixture gap above, then run full `.ai/IMPLEMENTATION-PROMPT.md` §6 validation against `.ai/briefs/b10b-research-design.md` acceptance criteria (17 items). This is the actual current frontier — do this first. |
| 1 | B9 acceptance pass | Implementation (verify) | none | Code looks complete; run the full B9 brief's acceptance criteria and produce the validation report that was never written. |
| 2 | B10a acceptance pass | Implementation (verify) | none | Same — code is committed, acceptance evidence isn't. |
| 3 | B10c Diplomacy & War | Implementation | Sprint 0 (B10b) | Brief ready: `.ai/briefs/b10c-diplomacy-war.md`. |
| 4 | B10d AI & Scenario Readiness | Implementation | Sprint 3 | Brief ready: `.ai/briefs/b10d-ai-scenario.md`. Gates the 24-month zero-human-input smoke test — this is the M1 completion gate. |
| 5 | M1 formal acceptance | Gate | Sprints 0–4 | Apply DESIGN-55 §9 predicate to every M1 capability; refresh `docs/PROGRESS.md` and `docs/OPEN-ISSUES.md` (currently just a header despite PROGRESS.md claiming 126 items — reconcile or correct that claim); sign `M1_STRATEGIC_CAMPAIGN_KERNEL` complete per §23. |

### Track B — M2 Surface Tactical Core

Depends on accepted M1 (DESIGN-55 §3). No briefs exist; every row needs a scoping
sprint before an implementation sprint. Governing docs in parentheses.

| # | Sprint | Governing docs |
| - | --- | --- |
| B-1 | Battle generation & tactical setup scaffolding | DESIGN-37 (battle-generation.md, 931 lines — largest rules doc, likely splits further during scoping), DESIGN-26 (divisions-and-formations) |
| B-2 | Tactical movement, spotting, contact state | DESIGN-38 (tactical-combat.md) — movement/spotting subset only |
| B-3 | Gunnery | DESIGN-39 (gunnery.md) |
| B-4 | Basic armor & damage | DESIGN-41 (damage-fire-and-flooding.md) — basic subset; detailed damage control deferred to M3 per DESIGN-55 §4 |
| B-5 | Tactical weather & visibility | DESIGN-42 (weather-visibility-and-smoke.md) — weather/visibility subset; smoke deferred to M3 |
| B-6 | Battle results → campaign integration + M2 acceptance gate | ties back into `@bluewave/combat` and phase-engine `battle_resolution` |

### Track C — M3 Advanced Surface Warfare

Depends on accepted M1 + M2 (DESIGN-55 §4).

| # | Sprint | Governing docs |
| - | --- | --- |
| C-1 | Torpedoes | DESIGN-40 |
| C-2 | Mine warfare | DESIGN-35 |
| C-3 | Submarines | DESIGN-34 |
| C-4 | Coastal defenses | DESIGN-48 (short doc, 48 lines — may fold into C-3 during scoping) |
| C-5 | Smoke + detailed damage control | remainder of DESIGN-42, DESIGN-41 |
| C-6 | M3 acceptance gate | |

### Track D — M4 Aviation

Depends on accepted M1 + M2 always; any capability using torpedoes/mines/subs/smoke/
detailed damage control also depends on the corresponding M3 capability (DESIGN-55 §5).

| # | Sprint | Governing docs |
| - | --- | --- |
| D-1 | Aircraft development, squadrons, airbases | DESIGN-43 (768 lines) |
| D-2 | Carrier operations | DESIGN-44 |
| D-3 | CAP & strikes | DESIGN-43/44 integration |
| D-4 | Air defense / AA | DESIGN-45 |
| D-5 | M4 acceptance gate | |

### Track E — M5 Electronics and Missile Era

Depends on all earlier accepted milestones plus full cross-domain integration
(DESIGN-55 §6) — the heaviest dependency closure in the project.

| # | Sprint | Governing docs |
| - | --- | --- |
| E-1 | Radar & electronic warfare | DESIGN-46 |
| E-2 | Data links & fighter direction | DESIGN-46 remainder |
| E-3 | Missiles, SAM, CIWS | DESIGN-47 |
| E-4 | Jets & helicopters | cross-cutting update to DESIGN-43/44/45 for later eras |
| E-5 | Full cross-domain integration + M5 acceptance gate | DESIGN-55 §6, §17 — this is project completion |

## Cross-cutting domain docs not yet assigned to a track

These have design docs but no package or milestone owner identified yet; resolve
ownership during the relevant scoping sprint rather than guessing now:

- `docs/domain/fleet-management.md`, `officers-and-personnel.md` — partially covered
  by M1's `FleetState`/`Ship`; crew/personnel mechanics (DESIGN-27, DESIGN-28
  crew-training-and-morale.md) are unassigned — likely folds into B10a/B10c follow-up
  or M2.
- `docs/rules/politics-confidence-and-unrest.md` (DESIGN-18) — unassigned; DESIGN-55
  §20 lists "diplomacy, politics, objectives, war, peace, treaties" together but B10c
  only scoped war/peace/basic diplomacy.
- `docs/rules/treaties.md` (DESIGN-30) — explicitly deferred out of B10c; needs its
  own scoping sprint, probably after B10d.
- `docs/rules/bases-and-infrastructure.md` (DESIGN-16), `deployment-and-logistics.md`
  (DESIGN-25), `trade-raiding-and-merchant-shipping.md` (DESIGN-33), `blockade.md`
  (DESIGN-32, basic version only landed in B10c) — unassigned.
- `docs/rules/amphibious-operations.md` (DESIGN-36) — DESIGN-55 doesn't list it under
  any milestone's contents explicitly; confirm placement (likely M3) during scoping.
- `docs/domain/strategic-objectives.md`, `possessions-and-territorial-control.md`,
  `world-geography.md` — mostly consumed already by the M1 compiler; verify no gaps
  remain when M2 needs territorial/geographic data for tactical battles.
- `docs/architecture/intelligence-and-knowledge.md` (DESIGN-29) — fog of war;
  explicitly deferred by B10d, unassigned beyond that.

## Immediate next action

Sprint 0 (finish the uncommitted B10b work already in the tree) is ready to run
right now — it's the only sprint with no open scope question except the one
fixture/RNG gap documented above, which just needs the research phase's RNG
condition understood well enough to give the test a legitimate `HIGH`-priority
field + eligible technology. Recommend starting there.
