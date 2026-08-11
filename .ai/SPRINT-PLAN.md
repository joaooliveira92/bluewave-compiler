# Bluewave Sprint Plan — Full Project Backlog

Status: living backlog. Update as sprints resolve, split, or reorder.

## Purpose

Map every remaining unit of work between the current repository state and a
complete `M5_ELECTRONICS_AND_MISSILE_ERA` (DESIGN-55 §6) plus at least one
`FULLY_SUPPORTED` production scenario (DESIGN-55 §17) — i.e. **every requirement
of `README.md` met**. The goal is that an agent can move from sprint to sprint
without waiting on a human, stopping only at a genuine
`.ai/AUTONOMOUS-AGENT.md` stop condition or a `.ai/templates/decision-request.md`.

Completion is defined by DESIGN-55, not by the presence of code:

- every capability owned by a milestone is `ACCEPTED` (§9, §23);
- every required content feature for a supported scenario is `SUPPORTED_MECHANICAL`
  (§12, §17);
- every reachable era band has complete strategic + tactical coverage; and
- the release validation predicate (§32) and packaged smoke suite (§22) pass.

## Two coordinated workstreams

Every sprint below advances one or both of these workstreams. They are coupled:
a `FULLY_SUPPORTED` scenario requires **both** the mechanics (capabilities
`ACCEPTED`) and the content (features `SUPPORTED_MECHANICAL`). Neither alone
completes a milestone.

- **Workstream M — Mechanics.** The capability/milestone work already laid out in
  the original backlog (Tracks A–E). Driven by `docs/DESIGN-*` documents and
  approved briefs at `.ai/briefs/*`.
- **Workstream C — Content (new, in scope).** Autonomous research and authoring of
  a **production** content pack (real nations, ship classes, technologies, tuned
  constants) needed to make one or more scenarios `FULLY_SUPPORTED`. Previously
  this was declared out of scope and fixtures stayed non-production; that stance is
  reversed here per the project owner.

## How a sprint is executed

Every sprint is one pass through `.ai/IMPLEMENTATION-PROMPT.md`, gated by
`.ai/ENGINEERING-CONTRACT.md`, under the authority and stop conditions in
`.ai/AUTONOMOUS-AGENT.md`. There are two sprint kinds:

- **Scoping sprint** — no milestone brief exists yet. Follow the wayfinder
  convention already established at `.scratch/engine-suite-roadmap/` (see
  `docs/agents/issue-tracker.md`): open a map + numbered issue tickets, resolve
  open questions (research/prototype/grilling/task tickets), close the relevant
  `docs/OPEN-ISSUES.md` candidates, and land a brief at
  `.ai/briefs/<slug>.md` using `.ai/templates/milestone-brief.md`. B9 and B10a–d
  were produced this way — use them as the reference shape.
- **Implementation sprint** — an approved brief exists. Implement it per
  `.ai/IMPLEMENTATION-PROMPT.md` §4–8, with focused tests, a validation report,
  and Conventional Commits.

A capability is not "done" because code exists — see DESIGN-55 §8–9. Treat
`ACCEPTED` as the only status that lets a downstream sprint depend on it, and
**descope nothing silently**: every `docs/OPEN-ISSUES.md` ambiguity must be
closed via research or an ADR before a governing design contract is considered
resolved (§9). `OPEN-ISSUES.md` is currently a header-only audit registry; the
"126 items" claim in `docs/PROGRESS.md` is unreconciled and must be corrected as
part of the M1 acceptance gate (Sprint A-5).

## Content research model (Workstream C)

The project owner has stated the gameplay data itself is a research step that
cannot be supplied in advance. So content is produced **autonomously by the
agent** and is a first-class, scheduled workstream — not a blocker awaiting a
human.

Rules for every content sprint:

- **Research, don't invent.** Use the `/research` skill against high-trust
  primary/secondary sources (official histories, naval reference works, published
  ship-class and timeline data) to ground real nations, hulls, weapons, aircraft,
  electronics, and era progression. Capture findings as Markdown under
  `docs/research/` before authoring YAML.
- **Classify explicitly (DESIGN-55 §12).** Each authored content feature declares
  exactly one release classification. Content whose owning mechanics are not yet
  `ACCEPTED` is authored as `CONTENT_ONLY_LOCKED` and must be proven unreachable
  (§14); it is promoted to `SUPPORTED_MECHANICAL` only when the governing
  capability lands.
- **Balance targets are non-normative.** The agent may tune constants within
  `BALANCE TARGET` bounds autonomously, recording the reasoning. A tuning choice
  that changes authoritative gameplay or cannot be grounded in the sources is a
  decision-request, not a guess.
- **Respect `OPEN DECISION`.** Never silently resolve a documented open decision.
  Close it via research into the canonical answer, an ADR, or an explicit
  decision-request.
- **Fixtures ≠ production.** Development/fixture packs stay explicitly
  non-production. The production pack is a separately authored, validated artifact
  (see CONTENT-0).
- **One production scenario is the acceptance anchor.** Pick and lock a primary
  `FULLY_SUPPORTED` scenario in CONTENT-0; every later content/support check refers
  to it.

## Current verified baseline (2026-08-10)

Verified by running `pnpm -w turbo run build test` directly (32 tasks green,
full turbo cache), not by reading docs:

| Item | Actual state |
| --- | --- |
| B0–B8 | Committed, tests green — matches PROGRESS.md |
| B9 Electron shell | Committed (`fd066c7`, `043f91c`, `8bbb371`, `7022a88`…); desktop build + tests green |
| B10a Economy & Construction | Committed (`bcc14d4`) |
| B10b Research & Ship Design | **PARTIAL — NOT ACCEPTED** (A-0 pass, 2026-08-11). Build green and generic determinism proven, but the brief's 17 acceptance criteria are not satisfied: `SetResearchPriorityCommand` has no lifecycle handler (`lifecycle.ts` rejects it as `UNKNOWN_COMMAND_TYPE`), no cycle detection (`TECHNOLOGY_PREREQUISITE_CYCLE`), no `DesignTemplateSchema`, and design/YAML fixtures are absent. Full per-criterion evidence: `.ai/reports/a0-b10b-acceptance.md`. Do not treat as accepted; B10c depends on a genuinely accepted B10b. |
| B10c Diplomacy & War | Not started; brief ready at `.ai/briefs/b10c-diplomacy-war.md` |
| B10d AI & Scenario Readiness | Not started; brief ready at `.ai/briefs/b10d-ai-scenario.md` |
| M2–M5 | No briefs. Only DESIGN docs exist. No content workstream exists yet (it begins here). |

> **Correction (2026-08-11, A-0 pass):** earlier drafts claimed B10b was "committed and green with nothing but evidence missing." Sprint A-0 re-verified the 17 acceptance criteria against the actual code and found the claim **false**: several criteria have no implementation (priority-command handling, `EXACT_TECHNOLOGY_SELECTION_PROHIBITED`, `TECHNOLOGY_PREREQUISITE_CYCLE` cycle detection, `DesignTemplateSchema`) and most others have no proving tests. The goldens were regenerated for a generic (non-research, no-budget) fixture, so research determinism was never exercised. B10b is therefore **not accepted**; the plan now treats it as a real implementation sprint, not a verify pass.

## Sprint sequence

### Track A — finish M1 (Strategic Campaign Kernel) + its content

Numbers below continue the original A-track series. "C-" rows are the content
workstream paired to each milestone.

| # | Sprint | Kind | Depends on | Notes |
| - | --- | --- | --- | --- |
| A-0 | **B10b acceptance pass** | Implementation (verify) | none | **DONE 2026-08-11 — BLOCKED.** Re-verified all 17 criteria against code. Verdict BLOCKED: 3 criteria unimplemented, 10+ unproven, only 15–17 pass. Evidence: `.ai/reports/a0-b10b-acceptance.md`. This is now the acceptance gate for a real B10b implementation sprint. |
| A-0b | **B10b completion** | Implementation | A-0 | Close the verified acceptance gap: implement `SetResearchPriorityCommand` lifecycle (=B10c blocks on it), exact-tech rejection, prerequisite-cycle detection, `DesignTemplateSchema` + design YAML fixtures, `IMMEDIATE_KNOWLEDGE` handling, and add proof tests for every criterion 1–14. Then re-run A-0 to PASS. Introduce ADR for phase-id alias. |
| A-1 | B9 acceptance pass | Implementation (verify) | none | Run the B9 brief's acceptance criteria and produce the never-written validation report (`b9-desktop-shell.md`, `B9-ELECTRON-BOUNDARY.md`). |
| A-2 | B10a acceptance pass | Implementation (verify) | none | Same — code committed, acceptance evidence missing. |
| A-3 | B10c Diplomacy & War | Implementation | A-0b | Brief ready: `.ai/briefs/b10c-diplomacy-war.md`. |
| A-4 | B10d AI & Scenario Readiness | Implementation | A-3 | Brief ready: `.ai/briefs/b10d-ai-scenario.md`. Lands the 24-month zero-human-input smoke loop — the M1 runtime milestone. |
| A-5 | M1 formal acceptance gate | Gate | A-0…A-4 | Apply DESIGN-55 §9 to every M1 capability; reconcile `docs/OPEN-ISSUES.md` (resolve the stale "126 items" claim and close/ADR every open M1 ambiguity); refresh `docs/PROGRESS.md`; sign `M1_STRATEGIC_CAMPAIGN_KERNEL` COMPLETED per §23. |
| CONTENT-0 | **Content strategy + production-pack charter** | Scoping | none (runs parallel to A-0…) | Decide the production content architecture: pick primary `FULLY_SUPPORTED` scenario(s), start date, reachable era bands (§11/§17), codebase layout, and the production pack module(s). Land a content charter brief + content map. This founders every later content sprint. |
| CONTENT-1 | **M1-era production content** | Scoping/Impl | CONTENT-0 | Research + author the content M1 needs: world geography, nations/governments, initial fleets (real hulls/classes), economy constants, research tech tree, ship-design templates, battleground/mission content — for the era bands the M1 scenario reaches. Existing M1 fixtures stay non-production; the production pack is separate and validated. |

### Track B — M2 Surface Tactical Core

Depends on accepted M1 (DESIGN-55 §3). No briefs exist; every row needs a scoping
sprint before an implementation sprint. Governing docs in parentheses. Each
sprint also lands the tactical content its capability needs (continues CONTENT-1).

| # | Sprint | Governing docs | Content deliverable |
| - | --- | --- | --- |
| B-1 | Battle generation & tactical setup scaffolding | DESIGN-37 (battle-generation.md, 931 lines — largest rules doc, likely splits further during scoping), DESIGN-26 (divisions-and-formations) | Ship data consumed by tactical battles (armor, guns, crew) promoted to reachable-format |
| B-2 | Tactical movement, spotting, contact state | DESIGN-38 (tactical-combat.md) — movement/spotting subset only | Formation/movement constants |
| B-3 | Gunnery | DESIGN-39 (gunnery.md) | Naval gun ballistics stats |
| B-4 | Basic armor & damage | DESIGN-41 (damage-fire-and-flooding.md) — basic subset; detailed damage control deferred to M3 per DESIGN-55 §4 | Armor/damage tables |
| B-5 | Tactical weather & visibility | DESIGN-42 (weather-visibility-and-smoke.md) — weather/visibility subset; smoke deferred to M3 | Weather/visibility constants |
| B-6 | Battle results → campaign integration + M2 acceptance gate | ties back into `@bluewave/combat` and phase-engine `battle_resolution` | M2 content `SUPPORTED_MECHANICAL`; sign M2 COMPLETED |

### Track C — M3 Advanced Surface Warfare

Depends on accepted M1 + M2 (DESIGN-55 §4).

| # | Sprint | Governing docs | Content deliverable |
| - | --- | --- | --- |
| C-1 | Torpedoes | DESIGN-40 | Torpedo types/performance |
| C-2 | Mine warfare | DESIGN-35 | Mine types/laying |
| C-3 | Submarines | DESIGN-34 | Submarine classes |
| C-4 | Coastal defenses | DESIGN-48 (short doc, 48 lines — may fold into C-3 during scoping) | Coastal-defense content |
| C-5 | Smoke + detailed damage control | remainder of DESIGN-42, DESIGN-41 | Damage-control / smoke constants |
| C-6 | M3 acceptance gate | | M3 content `SUPPORTED_MECHANICAL`; sign M3 COMPLETED |

### Track D — M4 Aviation

Depends on accepted M1 + M2 always; any capability using torpedoes/mines/subs/smoke/
detailed damage control also depends on the corresponding M3 capability (DESIGN-55 §5).

| # | Sprint | Governing docs | Content deliverable |
| - | --- | --- | --- |
| D-1 | Aircraft development, squadrons, airbases | DESIGN-43 (768 lines) | Aircraft/squadron/airbase data |
| D-2 | Carrier operations | DESIGN-44 | Carrier + airgroup content |
| D-3 | CAP & strikes | DESIGN-43/44 integration | Mission/CAP constants |
| D-4 | Air defense / AA | DESIGN-45 | AA gun/ship data |
| D-5 | M4 acceptance gate | | M4 content `SUPPORTED_MECHANICAL`; sign M4 COMPLETED |

### Track E — M5 Electronics and Missile Era

Depends on all earlier accepted milestones plus full cross-domain integration
(DESIGN-55 §6) — the heaviest dependency closure in the project.

| # | Sprint | Governing docs | Content deliverable |
| - | --- | --- | --- |
| E-1 | Radar & electronic warfare | DESIGN-46 | Radar/EW equipment data |
| E-2 | Data links & fighter direction | DESIGN-46 remainder | Data-link/FD content |
| E-3 | Missiles, SAM, CIWS | DESIGN-47 | Missile/SAM/CIWS data |
| E-4 | Jets & helicopters | cross-cutting update to DESIGN-43/44/45 for later eras | Jet/helo aircraft data |
| E-5 | Full cross-domain integration + M5 acceptance gate | DESIGN-55 §6, §17 | All remaining content `SUPPORTED_MECHANICAL`; sign M5 COMPLETED |

### Release sprint (project completion)

| # | Sprint | Kind | Depends on | Notes |
| - | --- | --- | --- | --- |
| REL-1 | **Full release validation** | Gate | all of A–E, C-tracks | Materialize the DESIGN-55 §15 scenario support manifest, §17 full-support predicate, §19 era coverage matrix, §18 capability closure, §14 unsupported-content isolation, and §29 release validation report for the production scenario; run the §22 packaged smoke suite (compile → 24 resolvable months → battle auto-resolve for every reachable mission family → save/restart/load → replay at strategic + tactical checkpoints → locked-content reachability → final hash verification). `finalDecision = PASS`. Refresh `docs/PROGRESS.md`, sign release, produce the §24 release support manifest. **This is the human-free completion gate.** |

## Cross-cutting domain docs not yet assigned to a track

These have design docs but no package or milestone owner identified yet; resolve
ownership during the relevant scoping sprint rather than guessing now:

- `docs/domain/fleet-management.md`, `officers-and-personnel.md` — partially covered
  by M1's `FleetState`/`Ship`; crew/personnel mechanics (DESIGN-27, DESIGN-28
  crew-training-and-morale.md) are unassigned — likely folds into B10a/B10c follow-up
  or M2.
- `docs/rules/politics-confidence-and-unrest.md` (DESIGN-18) — unassigned; DESIGN-55
  §20 lists "diplomacy, politics, objectives, war, peace, treaties" together but B10c
  only scoped war/peace/basic diplomacy. Needs its own scoping sprint, likely after
  M1.
- `docs/rules/treaties.md` (DESIGN-30) — explicitly deferred out of B10c; needs its
  own scoping sprint.
- `docs/rules/bases-and-infrastructure.md` (DESIGN-16), `deployment-and-logistics.md`
  (DESIGN-25), `trade-raiding-and-merchant-shipping.md` (DESIGN-33), `blockade.md`
  (DESIGN-32, basic version only landed in B10c) — unassigned; required by DESIGN-55
  §20 strategic/economic coverage before a scenario can be `FULLY_SUPPORTED`.
- `docs/rules/amphibious-operations.md` (DESIGN-36) — DESIGN-55 doesn't list it under
  any milestone's contents explicitly; confirm placement (likely M3) during scoping.
- `docs/domain/strategic-objectives.md`, `possessions-and-territorial-control.md`,
  `world-geography.md` — mostly consumed already by the M1 compiler; verify no gaps
  remain when M2 needs territorial/geographic data for tactical battles, and ensure
  the CONTENT-0 production pack re-authors these with real geography.
- `docs/architecture/intelligence-and-knowledge.md` (DESIGN-29) — fog of war;
  explicitly deferred by B10d, unassigned beyond that; DESIGN-55 §20 requires
  intelligence coverage for full support.

## Immediate next action

The frontier is **A-0b (B10b completion)** — the A-0 acceptance pass (2026-08-11)
proved the committed B10b code does **not** satisfy its 17-criteria brief. Close
that acceptance gap first; nothing downstream (A-3 B10c, A-4 B10d) may start on
an unaccepted B10b. Next in order once A-0b reaches `PASS` on the re-run:

1. Re-run the A-0 acceptance evidence against the completed B10b and record `PASS`.
2. **CONTENT-0 (content strategy + production-pack charter)** — decide the
   production scenario and pack structure so content research proceeds
   autonomously; runs in parallel with the mechanics sprints.

Begin with A-0b.
