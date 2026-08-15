# Wayfinder Map: Desktop Diplomacy & War screen

## Current state

The desktop-engine-feature-gate effort (`.scratch/desktop-engine-feature-gate/`)
delivered the **Research & Technology** screen and recorded **Diplomacy & War**
as the next candidate in its gate queue.

The engine has B10c ACCEPTED and fully wired:
- 7 diplomay commands (`DeclareWar`, `AcceptPeace`, `FormAlliance`,
  `BreakAlliance`, `FormNonAggressionPact`, `BreakNonAggressionPact`,
  `DeclareBlockade`) processed by `MonthExecutor`'s command_collection — the
  SAME drained-envelope path the desktop's research screen now uses.
- `resolveDiplomacyPhase` (order 6.5) applies monthly war-score / blockade
  effects inside `commitMonth`.
- Snapshot carries `politics.relations` (`DiplomaticRelation`: relation kind,
  tension, nap flag, since), `wars.wars` (`WarDeclaration`), and
  `wars.blockadeState` (`BlockadeState`).
- `CommandLifecycle.validate` is **public** — the desktop can run the engine's
  own per-command validation at issue time (stronger than the research hand
  mirror).

The desktop has **no diplomacy surface**: Overview shows only
`knownEnemyNations`; the player cannot view or issue any of the 7 commands.

## Destination

A Diplomacy & War screen gated to B10c: read-only projection of relations /
wars / blockades for the player's nation, plus issue of the 7 engine commands
through the existing single `campaign:execute` channel, engine-authoritative
(the desktop only queues envelopes; `MonthExecutor` applies them). Uses the
committed desktop-mvp + research screen patterns verbatim.

## Gate: frontier rule (inherited from desktop-engine-feature-gate)

Same rule: gate = **engine-built, ACCEPTED, and absent from the desktop**.
B10c qualifies; this sprint's frontier = Diplomacy & War.

## Decision tickets (in `.scratch/desktop-diplomacy-war/issues/`)

- [01-scope](issues/01-scope.md) — resolved: B10c relations/wars/blockades
  surface + all 7 commands; no treaty/objective UI (engine has none yet).
- [02-drain-command-surface](issues/02-drain-command-surface.md) — resolved:
  generalize the per-session pending-envelope queue from `researchWorkspace`
  into a shared command bridge so research + diplomacy + future command
  families drain through ONE seam; `CommandLifecycle.validate` called at issue
  time (authoritative engine codes, no hand mirror).
- [03-renderer-shape](issues/03-renderer-shape.md) — resolved: relations grid
  (per known nation: relation kind, tension, nap, since + issueable action),
  wars list (war id, sides, war scores, status), blockades list. Honest copy:
  "applies on the next turn advance". (Includes the `areas` picker extension.)

## Frontier delivered: Diplomacy & War screen (2026-08-15)

All four INC tickets resolved. Delivered per the spec (AC-1..AC-7 PASS):
projection + `inspectDiplomacyScreen` + `submitDiplomacyCommand` (7 types,
engine-authoritative issue-time validation) + generalized shared command
queue (`pendingCommands.ts`) + renderer screen. Goldens 10/10 unchanged;
cross-process 14/14; desktop 313; campaign-engine 46. Evidence:
`.ai/reports/desktop-diplomacy-war.md`. Next candidate in the gate queue:
tactical battle-outcome surfacing (B-6 follow-up).

## Deferred (recorded, not dropped)

- Tactical battle-outcome surfacing (B-6 follow-up — separate queue item).
- Trade agreements / treaties / strategic objectives (not built in the engine).

## Known limitations (reviewed 2026-08-15, recorded — must not be silently
## "fixed" by a hand-mirror in the desktop)

1. **DeclareBlockade `areaId` membership is an engine gap, not here.** The
   engine's `validateDeclareBlockade` (`packages/commands/src/lifecycle.ts:485`)
   checks only non-empty + duplicate-triple, never that the area exists in
   `snapshot.world.areas`; a hand-crafted IPC payload could commit a blockade
   on a phantom area. The shipped UI only offers `projection.areas` (real
   world areas), so this is unreachable through the honest path. Desired fix is
   upstream (add `world.areas` membership to the validator); the desktop must
   NOT hand-mirror area validation (would break spec D1's
   `CommandLine.validate`-only posture).
2. **During-drain command rejection is silent by design.** A command valid at
   issue can be rejected at drain when an earlier envelope in the same batch
   changed state (e.g. DeclareBlockade then AcceptPeace of the same war in one
   turn) — `command_collection` re-validates against the mutating snapshot and
   the month still succeeds. The honest copy ("applies next turn") doesn't
   promise drain-result surfacing. Future work: surface per-envelope drain
   outcomes in `CommitMonthResponse`. Not addressed in this slice.