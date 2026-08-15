# Validation Report: Desktop Diplomacy & War screen (B10c surface)

## Outcome

`PASS`

## Scope delivered

The desktop app gains its first diplomacy surface (B10c was ACCEPTED in the
engine; the desktop previously could neither view relations/wars/blockades nor
issue any of the 7 commands):

- **Projection** `buildDiplomacyScreenProjection`
  (`packages/campaign-engine/src/diplomacy.ts`) — pure, read-only, one-to-one
  derivation over `politics.relations`, `wars.wars`, `wars.blockadeState` and
  `world.areas`: known nations (id + name), player-facing relation rows
  (kind/tension/nap/since + partner), player-membered wars (sides, war scores,
  status, player side), player blockades, and world areas (for the honest
  `DeclareBlockade` picker).
- **Bridge** — `CAMPAIGN_COMMAND_NAMES` 24 → 26: `inspectDiplomacyScreen`
  (read projection) + `submitDiplomacyCommand` (one generic command; the
  payload `command` is a Zod-discriminated union over the 7 B10c bodies).
- **Authority (spec D1)** — the desktop ONLY queues engine envelopes through a
  shared per-session command queue; `MonthExecutor` command_collection (order
  2) + `resolveDiplomacyPhase` (order 6.5) are the sole mutators of
  politics/wars/blockades. Issue-time validity = the ENGINE's own public
  `CommandLifecycle.validate(envelope, snapshot)` (codes + messages surfaced
  verbatim — no hand-mirrored validators).
- **Queue generalization** — `apps/desktop/src/main/pendingCommands.ts`
  replaces the research-only queue with a shared `CommandEnvelope<CommandBody>`
  per-session queue (fingerprint idempotency over the canonical body);
  `researchWorkspace.ts` is a thin facade; `commitMonth` drains ALL pending
  envelopes through the existing promotion seam; empty-command campaigns stay
  byte-identical.
- **Renderer** — `apps/desktop/src/renderer/screens/diplomacy/`: Relations
  card (per-nation rows + action controls), Wars card (AcceptPeace on ACTIVE
  member wars), Blockades card; honest copy ("applies by the engine on the
  next turn advance"), engine-code rejection notices, honest empty states.

Explicitly deferred (recorded, not dropped): tactical battle-outcome
surfacing, trade agreements / treaties / strategic objectives.

## Requirements evidence

| AC | Deliverable | Proving tests |
| -- | ----------- | ------------- |
| AC-1 | projection renders real relations/wars/blockades/nations/areas | `diplomacy-screen-projection.test.ts`; `diplomacyCommands.test.ts` inspect |
| AC-2 | all 7 commands issue valid engine envelopes; commitMonth applies (war/alliance visible) | `diplomacyCommands.test.ts` (7 types + integration DeclareWar/FormAlliance + mixed research+diplomacy drain) |
| AC-3 | invalid commands rejected at issue with engine code, session untouched | `diplomacyCommands.test.ts` (DECLARE_WAR_INVALID_TARGET, ALLIANCE_FORMATION_INELIGIBLE, BLOCKADE_NOT_AT_WAR) |
| AC-4 | idempotent replay + revision mismatch + distinct same-type commandIds | `diplomacyCommands.test.ts` |
| AC-5 | same seed + same command → identical hash (twin sessions) | `diplomacyCommands.test.ts` determinism |
| AC-6 | canary updated; suites + gate green; empty-command campaigns byte-identical | desktop 343, campaign-engine 46, cross-process 14, goldens 10/10 |
| AC-7 | deferred recorded; known limitations documented | map + tick-mto3 |

## Commands and observed results

```text
$ git status
clean worktree delta = this slice only (no phase-engine/combat/commands-cpc/ai changes)

$ pnpm -w turbo run build --force
18 tasks successful, 0 cached

$ pnpm -w exec tsc -b
exit 0 (clean)

$ cd apps/desktop && pnpm exec vitest run --no-watch
47 files passed / 343 tests passed

$ cd packages/campaign-engine && pnpm exec vitest run --no-watch
7 files passed / 46 tests passed

$ cd packages/cross-process-test && pnpm exec vitest run --no-watch
3 files passed / 14 tests passed (two-process)

$ node scripts/verify-golden-hashes.cjs
All 10 hashes match golden reference

$ pnpm -w turbo run test --concurrency=4
28 successful / 29 total; only @bluewave/content-schema#test fails =
the sole documented pre-existing unrelated test/nation.test.ts broken import

$ pnpm -w turbo run lint --filter=@bluewave/desktop --filter=@bluewave/campaign-engine
0 warnings / 0 errors both
```

## Determinism evidence

- Twin in-process sessions with the same command + seed → identical final
  `rawHash` (diplomacyCommands.test.ts determinism).
- Envelope `expectedSnapshotHash` at issue equals the engine's recompute;
  refreshed at drain against the promotion-seam snapshot (the value the
  lifecycle validates).
- Golden hashes 10/10 UNCHANGED (read-only projection + envelope queue; empty
  command batches drain `[]`).
- Cross-process child (existing) green 14/14.

## Canonical artifact changes

None. No engine/combat/phase-engine goldens changed.

## Tests added

- `packages/campaign-engine/test/diplomacy-screen-projection.test.ts` (6+).
- `apps/desktop/src/main/commands/diplomacyCommands.test.ts` (22: 7 types,
  engine-code rejections, idempotency + distinct commandIds, revision mismatch,
  DeclareWar/FormAlliance/minxed drain integrations, determinism).
- `apps/desktop/src/renderer/screens/diplomacy/diplomacy-screen-state.test.ts`
  (reducer) + `DiplomacyScreen.test.tsx` (render/empty/reject).
- Updated: `campaignBridge.test.ts` canary (24→26), registry render test.

## Security and cancellation

- IPC Zod-discriminated union; empty strings rejected; unknown command type
  rejected; `nationId` never on the wire (always the session player slot).
- Renderer imports nav `campaign-engine` types + shared contract + ui only.
- No filesystem/network/ambient-clock/env in new code; deterministic UTC
  envelope timestamp (AI scheme).

## Performance observations

Constant-size queue handoff — none.

## Known limitations (recorded, not silently fixed)

1. DeclareBlockade `areaId` membership is an UPSTREAM engine gap
   (`validateDeclareBlockade` doesn't check `world.areas`); unreachable via
   the honest UI (picker only offers `projection.areas`), desired fix upstream,
   desktop must NOT hand-mirror (spec D1). See map.
2. During-drain same-batch command rejection is silent-by-design (e.g.
   Blockade then Peace in one turn) — `command_collection` re-validates
   against the mutating snapshot; future work to surface per-envelope drain
   outcomes in `CommitMonthResponse`. Recorded, not dropped.
3. Pre-existing unrelated repo failures NOT introduced here (engine `nation.test.ts`
   content-schema import break).

## Commits

See `git log` on `dev` for this sprint's Conventional Commits.