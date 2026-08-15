# Wayfinder Map: Desktop Engine-Feature Gate

## Current state

The desktop app (`apps/desktop`) has a complete playable loop (desktop-mvp):
New Game → compile → Overview → Simulation (`commitMonth` against the real
`MonthExecutor`) → Construction (submit/replace/cancel, real command
lifecycle) → Fleet (read-only) → Save/Load/Verify/Replay/Recover.

The engine has since **accepted** (ACCEPTED/committed) capabilities the desktop
never surfaces:

- **Research & Ship Design** (B10b, `SetResearchPriorityCommand`, research
  fields, discovery, design templates) — desktop renders only a
  `knownTechnologyIds` chip on Overview; there is no research screen, no
  field-priority setting, no way to influence the monthly
  `research_progress` phase.
- **Diplomacy & War** (B10c — 7 commands: DeclareWar, AcceptPeace,
  FormAlliance, BreakAlliance, FormNonAggressionPact, BreakNonAggressionPact,
  DeclareBlockade, `resolveDiplomacy` order 6.5, war score model) — desktop
  shows only `knownEnemyNations` on Overview; nothing to view relations or
  issue the commands.
- **Tactical battle results** (B-2..B-6) — `commitMonth` already auto-resolves
  battles inline, but the desktop's `CommitMonthResponse.closingSnapshot`
  surfaces only `activeWars: unknown[]`; the resolved battle outcomes
  (winner/loser, war-score deltas, ship losses) live in `snapshot.wars` and
  are never shown.

## Destination

A gated, prioritized set of desktop features that surface **engine-built**
capabilities (nothing fabricated), starting with the rain/number-one frontier
increment this sprint, and a decision record for what is deferred and why.

## Gate: candidate features (engine-built, desktop-missing)

| #  | Feature                            | Engine anchor                                        | Desktop today            | Frontier? |
| -- | ---------------------------------- | ---------------------------------------------------- | ------------------------ | --------- |
| 1  | **Research & Design screen**       | B10b `SetResearchPriorityCommand`; `ResearchState`, field priorities, discovered techs, progress | none                | **YES**   |
| 2  | **Diplomacy & War screen**         | B10c 7 commands + relations model + war score   | `knownEnemyNations` only  | deferred  |
| 3  | Battle results surfacing (winner/loser/war-score in Simulation turn report) | B-6 `applyBattleResult`, `battle.phase === "resolved"` | `activeWars: unknown[]` | deferred |

Deferred items are tracked in this map (never silently dropped).

## Outcome of tickets

- [01-gate](issues/01-gate.md) — **resolved**: gate = features the engine
  already builds; frontier this sprint = Research & Technology screen.
- [02-bridge-command-surface](issues/02-bridge-command-surface.md) —
  resolved: `inspectResearchScreen` (read-only projection) + a
  `setResearchPriorityCommand` issuing a real `SetResearchPriorityCommand`
  envelope through the same `campaign:execute` channel; other commands stay
  stubs.
- [03-diplomacy-ticket-decide](issues/03-diplomacy-decide.md) — resolved:
  Diplomacy & War is gated out of this sprint (needs relation-issuing across
  a full matrix with appreciable UI-surface scope); recorded as the next
  candidate, not dropped.

## Frontier delivered: Research & Technology screen (2026-08-15)

All four INC tickets resolved and committed on `dev`. Delivered:

- **Feature:** Research & Technology renderer screen
  (`apps/desktop/src/renderer/screens/research/`) surfacing the real compiled
  research state (budget, field priorities, in-progress tech work + invested
  points, discovered techs, current project), with field-priority edit
  controls through the shell's optimistic-concurrency flow.
- **Bridge:** `inspectResearchScreen` + `setResearchPriorityCommand` (22 → 24
  `campaign:execute` commands), Zod wire validation, common idempotency /
  revision conventions.
- **Authority (spec D1):** the desktop only queues a real
  `SetResearchPriorityCommand` envelope; `MonthExecutor`'s command_collection
  is the sole mutator of `nation.research`. Delivery seam: player slot
  promoted to `slots[0]` for the `execute()` call (the engine authorizes
  human commands against `slots[0]` only), canonical slot order restored
  before persist.
- **Determinism:** two OS-process runs of the research issue + commitMonth
  child are byte-identical; goldens 10/10 unchanged; cross-process suite
  green; desktop suite 298/298 + campaign-engine 40/40 green.
- **ADR(s):** none new required — this slice changes no authoritative engine
  behavior; the seam is recorded here and in `commitMonth.ts` in-code, and the
  divergences (stricter desktop field-registry validation; `exactTechId`
  refused at issue) are logged in the INC ticket trail.

## Not yet specified (deferred, recorded)

- **Diplomacy & War screen** (B10c — the next frontier in this gate queue:
  relations matrix + the 7 issueable commands + war-score view).
- **Tactical battle outcome surfacing** in the turn report (B-6 follow-up;
  `closingSnapshot.activeWars` today is `unknown[]`).
- Research **design template** authoring UI (`designViewer`/create) — out of
  scope; the engine compiles designs but desktop re-authoring is not needed to
  render progress/discovery.