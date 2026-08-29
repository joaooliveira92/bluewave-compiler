# Validation Report: M2 "First Month at the Admiralty" — INC-5 (Research allocation edit UX)

## Outcome

`PASS`

## Scope delivered

One frontier-ordered implementation ticket (commit `a0079ed`, 2026-08-19, 5 files, 167 insertions):

**INC-5 — Research allocation edit UX** (spec §10 + §17 — the one editable allocation surface in M2).

- **5-HIGH cap in the draft reducer** — `apps/desktop/src/renderer/screens/research/research-screen-state.ts` (`setDraftWeight`): raising a 6th field to `HIGH` is rejected (returns the existing draft reference — `===` identity, no silent redistribution). The caller must first lower another `HIGH` field. `MAX_HIGH_PRIORITY_FIELDS` + `CANONICAL_RESEARCH_FIELD_IDS` imported from `@bluewave/campaign-engine` (never re-declared). `draftHighCount` / `draftIsSubmittable` mirror the engine's `1..5` HIGH validation (at least one HIGH, at most `MAX_HIGH_PRIORITY_FIELDS`).
- **Real `SetResearchPriorityCommand` via the existing desktop command path** — `ResearchScreen` / `useResearchScreen` / `research-screen-state` draft → `draftToPriorities` whole-record `fieldPriorities` payload in canonical field order (stable for idempotency). One priority change per command, `expectedRevision` + `transportRequestId` optimistic-concurrency flow unchanged. No new command name, no new payload shape.
- **Projected monthly progress as a pure largest-remainder derivation** — `deriveProjectedResearchAllocations(researchBudget, draft)`: `floor(weight/totalWeight * budget)` per field + remainders sorted descending → distribute the remaining units one-by-one. Sums exactly to `researchBudget` (when >0). Read-only, shown in the screen alongside the draft controls. Mirrors `packages/phase-engine/src/research.ts:largestRemainderAllocation` (`computeResearchResources` is identity `BP 10_000`).
- **Renderer-only "unsaved changes" indicator** — `isDraftDirty(projection, draft)` (`committed !== edited` per canonical field). Only meaningful on this surface (the only surface with a draft). Shown as "Unsaved changes" in the header.
- **Autosave after a successful `SetResearchPriority`** — `apps/desktop/src/main/commands/researchCommands.ts` (`setResearchPriorityCommand`): after `queueResearchEnvelope`, persists via `new SaveStore().save(record.state, record.saveDir)`. If the save throws, the queued envelope is rolled back via `deleteQueuedResearchCommand` (`pendingCommands.ts:deletePendingEnvelope` + `researchWorkspace.ts:deleteQueuedResearchCommand`) and the IPC returns `SAVE_FAILED` (spec §17 persistence contract — domain command not successful until persistence succeeds). No partial in-memory state remains (construction-slice pattern).
- **Wired on the existing Research & Technology screen** — `ResearchScreen.tsx` (field priority toggles per `WEIGHT_OPTIONS` HIGH/Med/Low, 6th-HIGH disabled with helper text, projected allocations read-only, Submit disabled when `!canSubmit || !dirty || !highCountValid`). All numbers from the projection; the screen never computes authoritative values.

Design decisions (recorded):

- 5-HIGH enforcement lives in the pure reducer (not the component) so the identity check (`===`) is testable and the component stays a thin view.
- Largest-remainder uses floating `weight/totalWeight * budget` with `Math.floor` + sorted remainders — integer-exact for the `researchBudget` range (safe integer) and weight sum ≤ 40 (10 fields × HIGH=4); matches the phase-engine's integer allocation within 1 unit.
- Autosave failure surfaces as `SAVE_FAILED` + in-memory rollback — same pattern as the construction slices; the envelope never reaches `MonthExecutor` when persistence fails.

## Requirements evidence

1. **Field priorities editable per the weight model with the 5-HIGH cap (6th HIGH rejected, no redistribution)** — `research-screen-state.test.ts` "rejects a 6th HIGH (returns same reference, no silent redistribution)" + `ResearchScreen.test.tsx` "disables the 6th HIGH toggle".
2. **Real `SetResearchPriorityCommand` via the existing desktop path (whole-record payload, one change per command)** — `researchCommands.test.ts` / `ResearchScreen` submit path calls `setResearchPriorityCommand` with `draftToPriorities` payload; `draftToPriorities` canonical-order test.
3. **Projected progress is a pure derivation, read-only** — `deriveProjectedResearchAllocations` tests: sums to budget, largest-remainder property, 0 when budget 0, frozen result.
4. **Autosave after successful research-priority command (SAVE_FAILED rollback, no partial state)** — `researchCommands.test.ts` "persists via SaveStore after queue" + "on SAVE_FAILED deletes the queued envelope and returns SAVE_FAILED".
5. **Unsaved-changes indicator (renderer-only, only on this surface)** — `isDraftDirty` tests + `ResearchScreen` "shows Unsaved changes when dirty, hides when clean".
6. **Goldens 10/10 unchanged; two-process determinism byte-identical** — `verify-golden-hashes.cjs` + `cross-process-test` (below) — no snapshot/phase change (desktop + campaign-engine projection only).

## Validation (orchestrator gate)

- `pnpm -w turbo run build --force` — **18/18, 0 cached** (ResearchScreen `26.51 kB`, full desktop bundle 1.7 MB).
- `pnpm tsc -b` — **clean, 0 errors**.
- `pnpm lint` — **no findings in any of the 5 changed files**; 21 pre-existing unrelated errors in untouched files (`prototype/desktop-e2e-harness/*` any-types, `content-schema/test/nation.test.ts` broken import, `packages/combat/test/torpedo/records.test.ts` unused var, `packages/campaign-engine/test/priorities.test.ts` empty pattern) — same 21 as B-3/B-5/INC-14+2 gates, not introduced here.
- `pnpm format --check` — **all 5 changed files clean**; 77 pre-existing unrelated format issues in tracked files not touched this ticket (prototype drafts etc.).
- `pnpm --filter @bluewave/desktop test` — **70 files / 507 tests passed** (10.15s; includes ResearchScreen + research-screen-state suites).
- `node scripts/verify-golden-hashes.cjs` — **"All 10 hashes match golden reference"** (no authoritative hash change — desktop-only + read-only derivation).
- `node packages/cross-process-test/dist/run-child.js` (×2) — **byte-identical** (cmp clean) — cross-process determinism holds (no new RNG stream; `deriveProjectedResearchAllocations` is pure).
- Scope-specific suites: `research-screen-state.test.ts` (cap, submittability, dirty, derivation) + `ResearchScreen.test.tsx` (toggle + 6th-HIGH disabled + unsaved indicator + projected progress) + `researchCommands.test.ts` (queue + autosave + SAVE_FAILED rollback) — all green.

## Changed files

- `apps/desktop/src/renderer/screens/research/research-screen-state.ts` — `setDraftWeight` 5-HIGH cap, `isDraftDirty`, `deriveProjectedResearchAllocations`, `draftHighCount`/`draftIsSubmittable`/`draftToPriorities`.
- `apps/desktop/src/renderer/screens/research/ResearchScreen.tsx` — editable priority toggles, projected progress, unsaved indicator, 6th-HIGH guard.
- `apps/desktop/src/main/commands/researchCommands.ts` — autosave via `SaveStore` after `queueResearchEnvelope`; `SAVE_FAILED` rollback.
- `apps/desktop/src/main/pendingCommands.ts` — `deletePendingEnvelope(sessionId, transportRequestId)`.
- `apps/desktop/src/main/researchWorkspace.ts` — `deleteQueuedResearchCommand` wrapper.

## Traceability

- Spec §10 (research allocation — field-level priorities, cap, projection) + §17 (autosave persistence contract) + §17.4 (report = real `CommitMonthResponse`; not changed).
- Commit `a0079ed` on `dev` (ahead of `origin/dev` by 1 at report time).
- Issue `.scratch/game-onboarding-first-month/issues/INC-5-research-allocation-ux.issue.md` → `Status: done`.
