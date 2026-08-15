# Spec — Desktop Research & Technology screen (engine-built surface)

## Problem

The desktop app (`apps/desktop`) has a complete playable loop but no way to
influence research: `MonthExecutor` already interprets
`SetResearchPriorityCommand` envelopes (B10b, ACCEPTED), the compiled
snapshot already carries the player nation's `ResearchState` (fields,
fieldPriorities, discovered techs, in-progress techs with invested points),
yet the desktop renders only a `knownTechnologyIds` chip. The monthly
`research_progress` phase is therefore never directed by the player.

## Solution

Add a **Research & Technology** screen surfaced through the existing
single-channel `campaign:execute` bridge. Two new commands:

1. `inspectResearchScreen` (payload `sessionId`) → `ResearchScreenProjection`,
   derived, read-only, from the compiled snapshot (`nation.research`):
   research budget, per-field in-progress technologies (techId + invested
   points), discovered technologies, and the player's current field
   priorities. Nothing fabricated — the engine already stores all of it.
2. `setResearchPriorityCommand`
   `{ sessionId, expectedRevision, transportRequestId, fieldPriorities,
   exactTechId? }` → builds a real deterministic
   `SetResearchPriorityCommand` command envelope and queues it on the session;
   the NEXT `commitMonth` hands it (plus any other queued research commands)
   into `MonthExecutor.execute(snapshot, [...commands], seed)`, where the
   existing command_collection phase applies it authoritatively. This mirrors
   exactly how `@bluewave/ai`'s `AiCommandGenerator` issues research
   commands; the engine stays the only mutator of `nation.research`.

Projection package: `packages/campaign-engine/src/research.ts`
(`buildResearchScreenProjection`), contract `apps/desktop/src/shared/research-contract.ts`,
handler `apps/desktop/src/main/commands/researchCommands.ts` (same envelope /
revision / idempotency conventions as `constructionCommands.ts`), renderer
screen `apps/desktop/src/renderer/screens/research/`. New names in
`CAMPAIGN_COMMAND_NAMES` + `CampaignCommandClient` overloads; the bridge name
set is verified by `campaignBridge.test.ts`.

## User stories

- As a player, I can see my nation's research budget, which technologies are
  actively being researched and their invested progress, and which techs I
  have already discovered.
- As a player, I can set research field priorities and the month advance then
  applies them deterministically, with the new priorities visible afterward.
- As a player, I never see fabricated progress: the screen renders only data
  present in the compiled snapshot and engine diagnostics.

## Implementation decisions

- **D1 (authority):** priorities are NOT desktop-mutated. The desktop builds
  one envelope and passes it through `MonthExecutor.execute` on the next
  `commitMonth`, reusing the engine's command_collection
  (`applySetResearchPriority`). If no month is executed the command simply
  stays queued — the screen must state that it applies on the next turn.
- **D2 (idempotency):** envelope idempotency key derived from the player
  session (`campaignId/turn/slot/field`) — same canonical pattern as the AI
  generator; a duplicate `transportRequestId` replays instead of double-queue.
- **D3 (projection derives, never invents):** every field in
  `ResearchScreenProjection` maps one-to-one to `ResearchState`; a debug
  `balance`-hold field must have a real source or be omitted (no fabricated
  numbers).
- **D4 (strict payloads):** `fieldPriorities` is `Record<string, SafeInt>`;
  any unknown field / non-integer value is rejected by the engine's Zod
  boundary, surfaced as the engine code, never a fabricated desktop message.

## Dependencies / related work

- Reuses the compiled snapshot; no `packages/phase-engine` / `packages/combat`
  changes (the B-6 engine sprint is owned by a parallel agent — this slice
  must not touch phase-engine source).
- Extends `CAMPAIGN_COMMAND_NAMES` from 22 → 24 names; `campaignBridge.test.ts`
  is a live canary (name-set equality) and must be updated.
- The `knownTechnologyIds` chip on Overview stays; the screen is additive.

## Testing

- Unit: `researchCommands.test.ts` (inspect projection shape from a compiled
  production campaign; priority command envelope construction + rejection
  of unknown field / non-integer; idempotency replay; stale-revision
  rejection without mutation).
- Unit: `packages/campaign-engine` `research-screen-projection.test.ts`.
- Renderer: `research-screen-state.test.ts` (state reducer) + screen render
  test.
- Restriction: no e2e change required; SERIES stays untouched.
- Determinism: issuing a `SetResearchPriorityCommand` then `commitMonth`
  twice must produce byte-identical final snapshots (two-process check in
  the command test).

## Definition of done

All AC GRID criteria:
- AC-1 | projection renders the real research budget, per-field progress
  (invested points), discovered techs, field priorities from the compiled
  snapshot — no placeholder copy.
- AC-2 | `setResearchCommandPriority` issues a valid engine envelope; a
  `commitMonth` after it shows the engine-applied priorities in the
  projection (field scales match).
- AC-3 | unknown-field/non-integer priorities are rejected with the engine
  diagnostics; session untocuhed.
- AC-4 | idempotent transportRequestId replay and optimistic-concurrency
  `expectedRevision` mismatch (REVISION_MISMATCH) behave like construction;
  no double or partial queue writes.
- AC-5 | two calls with the same seed produce the same hash (determinism
  evidence).
- AC-6 | the bridge CommandNameSet arithmetic canary is updated; desktop
  test suite + full-repo gate green.
- AC-7 | deferred candidates (Diplomacy & War, battle-results surfacing) are
  recorded in the map, not dropped.

## Ready-for-agent pointer

Frontier = lowest-numbered open ticket in `.scratch/desktop-engine-feature-gate/issues/`
whose blockers are all resolved.