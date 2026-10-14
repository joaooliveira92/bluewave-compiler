# Validation Report: P-2 ship-building ticket 28 (rebuild reachability + cancellation settlement)

## Outcome

`PASS_WITH_LIMITATIONS`. The ticket's deliverable is complete and the change's own
gate is green. Two **pre-existing, unrelated** reds in the shared `dev` tree
(another effort's package/history) stop the single `pnpm check` command from
exiting 0; both are documented below and neither is touched by this change.

## Scope delivered

Ticket `.scratch/ship-building/issues/28-rebuild-projects.md`, remaining items 5
and 6:

- **28e — the rebuild surface is reachable in the live designer.** The
  `RebuildPanel` (validator report + start-rebuild) previously lived only in the
  unreferenced `screens/construction/drawing-board/DrawingBoard.tsx` (ADR-0153
  removed that host). It is now mounted in the live `ShipbuildingWorkspace`'s
  Review section as a third tab (`findings` / `rebuild` / `finish`), with a
  "Rebuild a completed ship…" entry in the design-actions menu. The workspace
  passes its own working draft, content and `editCount`, so the panel's "load a
  ship's design → edit → check → start rebuild" flow works unchanged.
- **Cancellation with settlement (DESIGN-23 §23; DESIGN-11).** A real engine
  `CancelConstructionProject` command: validated at issue time, applied in
  `command_collection`, sets the project `CANCELLED`, settles the work already
  done explicitly (`consumedWork`/`refundedAmount`/`lostAmount`/`salvageableAmount`
  — pay-as-you-go: no refund, no fabricated salvage), releases a `REBUILD`'s
  target ship from **this** project's unavailability (old design kept, no ship
  spawned), and records a deterministic `ConstructionProjectCancelled` event. A
  player surface ("Cancel project") on the Construction screen's "Under
  construction" card queues the command through the shared seam. ADR-0158.

Deferred (recorded, not guessed): partial-hull **salvage credit** belongs to the
unimplemented §26 scrapping subsystem and is an explicit `0`; cancellation of a
foreign-contract project stays a DESIGN-16 contract outcome (refused by this
command with `FOREIGN_CONTRACT_FUNDED_BY_SCHEDULE`).

## Requirements evidence

- DESIGN-23 §20/§22/§23 — `applyCancelConstructionProject` (`packages/phase-engine/src/cancelConstructionProject.ts`), `cancellationSettlement`, the ship-release guard; `packages/phase-engine/test/cancel-construction-project.test.ts` (10).
- DESIGN-11 settlement contract — `validateCancelConstructionProject` (`packages/commands/src/payloadValidation.ts`), `CommandLifecycle.resolve` case; `packages/commands/test/cancel-construction-project.test.ts` (4).
- Cancellation record — `ConstructionProjectCancelled` in `@bluewave/events` (envelope + schema) and `constructionProjectCancelledEvent` in `packages/phase-engine/src/events.ts`; `packages/events/test/{events,validation}.test.ts`.
- 28e reachability — `ShipbuildingWorkspace.tsx` + `design-sections.ts`; `ShipbuildingWorkspace.test.tsx` (Review→Rebuild tab, menu entry); captured with `pnpm snap`.
- Player surface — `ProjectsCard.tsx`, `useConstructionScreen.ts`, `constructionStatusCommands.ts`, campaign bridge; `ProjectsCard.test.tsx`, `useConstructionScreen.test.tsx`, `constructionStatusCommands.test.ts` (queued → `commitMonth` → `CANCELLED`), `campaignBridge.test.ts`, `responseMappers.test.ts`.
- `rebuildProjectProblems` treats a `CANCELLED` rebuild as terminal — `packages/phase-engine/test/rebuild-projects.test.ts`.

## Commands and observed results

```text
pnpm preflight                         -> 37/37 passed (19.06s)
pnpm typecheck                          -> 40 successful, 40 total
pnpm format                             -> All matched files use the correct format.
pnpm lint                               -> 0 warnings, 0 errors
pnpm lint:effect                        -> 352 warnings, 0 errors
pnpm test:scripts                       -> 0 failed (duration ~1.2s)
pnpm check:licenses                     -> ok (167 deps, 10 licenses)
pnpm build                              -> 22 successful, 22 total
pnpm content:verify                     -> content hash 3f57ba1f…, lock verified
pnpm check:golden                       -> All 11 hashes match golden reference
pnpm check:determinism                  -> two runs byte-identical
pnpm check:equivalence                  -> two fresh processes byte-identical
pnpm check:balance-reports              -> ok (reports match the benchmark)
pnpm test:e2e                           -> 30 passed (2.6m)
pnpm -r --filter='!./vendor/*' --filter='!@bluewave/content-codemod' exec vp test run
                                        -> 292 files passed / 2017 passed, 1 skipped
```

Focused suites (exact): commands 6 files/47; events 5/43; phase-engine
`cancel-construction-project` + `rebuild-projects` 23; desktop construction
dir + responseMappers + constructionStatusCommands + campaignBridge +
ShipbuildingWorkspace 27 files/342.

**Two pre-existing, unrelated reds in the shared tree (not this change):**

```text
pnpm test:run   -> packages/content-codemod/test/determinism.test.ts
                   "is unaffected by input enumeration order" > 5000ms timeout
                   under full-parallel load; PASSES in isolation
                   (pnpm --filter @bluewave/content-codemod test: 4 files/30 tests)
pnpm check:golden-repin -> 2 commit(s) changed authoritative source without a
                   re-pin/trailer: 3bd8edb8, 7ccced3f (ship-part-model effort;
                   3bd8edb8 predates this session)
```

Neither file is in this change's scope; the concurrent `ship-part-model` session
owns `packages/content-codemod` and those commits. Not fixed here (would edit
another effort's package / rewrite history).

## Determinism evidence

- Reference run: `node scripts/verify-cross-process-determinism.cjs` — two runs byte-identical.
- Golden hashes: 11/11 match `golden/hashes.json` (unchanged; this change touches no golden input).
- The applier reads only the snapshot and its inputs; the event timestamp is `${campaignMonth}-01T00:00:00.000Z`; sequence via `ctx.nextSeq()`. No clock/env/RNG.
- Cross-process hash values: unchanged from the pre-change golden reference (no re-pin needed).

## Canonical artifact changes

None. No content, save, or golden artifact changes; `content:verify` hash
`3f57ba1f…` and goldens 11/11 are unchanged. No migration.

## Tests added

Unit/invariant (settlement arithmetic incl. zero-work, refusals, order); end-to-end
applier through the real `MonthExecutor` (CANCELLED + released ship + event +
determinism); command payload validation (issue time); desktop queued path
(issue → queue → `commitMonth` → CANCELLED) and renderer hook; response-mapper
rendering of the new event; `ProjectsCard` cancel control; workspace Review→Rebuild
reachability; `rebuildProjectProblems` CANCELLED boundary.

## Security and cancellation

No new IPC beyond the whitelisted command name; the engine remains the sole
mutator; the desktop command is schema-decoded and engine-validated at issue time.
No filesystem/shell/temp-file surface introduced. Cancellation is a status
transition, not an abort signal path.

## ADRs and dependencies

- **ADR-0158** (amends DESIGN-23 §23): the cancellation settlement policy and the
  rebuild release. Recorded in `docs/adr/AMENDMENTS.md`, the DESIGN-23 header, and
  the ADR index. No new dependency.

## Known limitations and deferred requirements

- Partial-hull salvage value is an explicit `0` (deferred to the §26 scrapping
  subsystem) — recorded in ADR-0158, not fabricated.
- The UI offers "Cancel project" for the steerable ship-building states; a
  freshly-started `PLANNED` rebuild and an `IMPOUNDED` project are engine-cancellable
  but not surfaced (documented in ADR-0158).
- Two pre-existing unrelated reds above remain in the shared `dev` tree.
