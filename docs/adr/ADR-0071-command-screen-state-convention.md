# ADR-0071: One command-screen lifecycle convention

## Status

Accepted 2026-10-08. Decision + first shared step only; the full migration is a
follow-up ticket (see "Deferred").

## Context

Two conventions coexist for screens that load a projection and issue a
revision-checked command (optimistic concurrency via `{expectedRevision,
transportRequestId}`):

1. `useCommandScreenWorkflow` (`lib/command-screen-workflow.ts`) — a deep module
   whose `State extends RequestLifecycle` (mutable `revision` / `pendingRequest` /
   `requiresRefresh` / `notice` fields). Used by Construction, Fleet, Division
   organisation, and the Treasury budget panel.
2. Hand-rolled discriminated-union state machines — Research and Diplomacy each
   carry a `kind` union (`idle | loading | load-failed | loaded | submitting |
   submitted | rejected-with-revision`) and re-implement the load/submit/reject/
   retry wiring on top of it.

The duplicated wiring can drift: a transport-identity or revision-handling fix
must be made in two places. But the two state shapes are genuinely different, so
a blind "move Research and Diplomacy onto `useCommandScreenWorkflow`" would force
a different state model onto them (and their components/tests).

## Decision

1. **One orchestration convention is the target.** A single hook owns mounting
   load, refresh-on-stale, retry, revision capture, and transport identity for
   every command screen.
2. **The convention is generic over the screen's state, not fixed to
   `RequestLifecycle`.** The screen keeps its state shape (discriminated union or
   mutable) and supplies its own phase transitions; the hook supplies the
   lifecycle orchestration. This preserves the union screens' exhaustiveness
   checks.
3. **Immediate shared step.** The three-outcome envelope → state fold is
   extracted to `foldCommandResult` in `command-screen-workflow.ts`; both
   hand-rolled hooks use it. This single-sources the most error-prone part
   (mapping success/rejected/error and the stale revision) without touching a
   screen's state shape.
4. **Full migration deferred** to a follow-up ticket: generalize the workflow's
   adapter to accept the lifecycle transitions, migrate Construction/Fleet/
   Treasury and Research/Diplomacy onto it, and delete the second convention.

## Consequences

Until the migration, two orchestration hooks remain, but result folding is
single-sourced. The follow-up touches five screens' hooks and their tests. It is
a rewrite of the state wiring, not a behaviour change, so the screens' render
tests are the guardrail.

## Deferred (recorded, not guessed)

- Generalize `useCommandScreenWorkflow` (or add a sibling) so `State` need not
  extend `RequestLifecycle`, with the adapter carrying `beginLoading`,
  `loadSuccess`, `loadFailure`, `beginSubmit`, `submitSuccess`,
  `submitRejected`, and `transportFailure`.
- Migrate the five command screens onto it and delete the hand-rolled wiring.
