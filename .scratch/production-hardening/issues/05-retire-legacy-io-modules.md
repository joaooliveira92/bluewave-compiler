# 05: Retire the legacy `.bluewave` I/O modules and close test-helper I/O

**What to build:** no production source under the desktop main process performs file I/O outside the
service graph. The retired `.bluewave` content-authoring readers (the project-file and campaign-save
modules that survive only because their tests import them) are removed along with their tests, or, if
the format is still supported, brought behind a service. The remaining test-only helpers that read the
filesystem directly are moved behind the boundary or deleted. `project.ts`/`campaignSave.ts` remain the
only such modules today.

**Blocked by:** 01 — Land the Effect runtime migration on `dev`

**Status:** resolved

- [x] A repository search finds no direct filesystem import in desktop main production source except
      inside the service implementations (`ContentArtifact`, `ProjectStore`, the sidecar stores, the
      command queue, `CrashReporter`).
- [x] The retired `.bluewave` readers are either deleted (with their tests) or wrapped in a service —
      decided and recorded, not left as a hybrid.
- [x] Test-only helpers that do direct I/O are behind a service or clearly scoped as test fixtures.
- [x] `pnpm check` stays green; no gameplay/content/golden change.

## Comments

**Decision: the legacy `.bluewave`/campaign-save readers are deleted, not wrapped.** They had no
production importer — only their own tests — and the research inventory
(`docs/research/effect-apps-runtime-02-io-service-inventory.md` §4) already flagged them as
"dead/legacy and must not be migrated as if live". Wrapping dead readers in a service would preserve
a format nothing supports.

Deleted (`git rm`):

- `apps/desktop/src/main/project.ts` (the `.bluewave` project reader/writer: `loadContentDirectory`,
  `saveProjectFile`, `loadProjectFile`, `extractProject`, …) + `apps/desktop/test/project.test.ts`.
- `apps/desktop/src/main/campaignSave.ts` (`loadCampaignSave`) + `apps/desktop/test/campaignSave.test.ts`.
- `apps/desktop/src/main/campaignSaveSchema.ts` (`LoadSaveResultSchema`/`LoadSaveResult`) — the return
  shape of the now-deleted `loadCampaignSave`; after that deletion it survived only because
  `campaignCommandSchemas.test.ts` imported it, i.e. the same class the ticket retires. Its
  `describe("LoadSaveResultSchema …")` block and import were removed from that test. (The ticket named
  `project.ts`/`campaignSave.ts`; this schema is part of the same legacy bridge and leaving it would be
  the "hybrid" the ticket forbids.)

Two doc comments that pointed at the deleted `main/project.ts` were reworded
(`commands/continuityCommands.ts`, `shared/continuity-contract.ts`).

**Criterion 1 — the remaining fs importers in `apps/desktop/src/main` are all service implementations:**

- `contentArtifact.ts` (`ContentArtifact`), `runtime/projectStore.ts` (`ProjectStore`),
  `runtime/sidecarStores.ts` + its implementations `drawingBoardDraft.ts`/`uiState.ts`/`monthlyReports.ts`
  (`DraftStore`/`UiStateStore`/`ReportsStore`), `pendingCommands.ts` (`CommandQueueStore`),
  `crashSupport.ts` (`CrashReporter`).
- `commands/researchDeterminismChild.ts` is the one remaining fs importer outside a service: a
  determinism child process spawned by `researchCommands.test.ts` (only reference). It is clearly
  scoped as a test fixture (its own `mkdtempSync`/`tmpdir`), satisfying criterion 3, and is not on any
  production path.

**Evidence:** `rg -ln 'from "node:fs' apps/desktop/src/main --glob '!*.test.ts'` → the service files
above + `researchDeterminismChild.ts` only; a repo-wide search for every deleted symbol / path
(`project\.js|campaignSave|campaignSaveSchema|loadCampaignSave|LoadSaveResult`) across `apps/desktop`
(and `--glob '!node_modules' --glob '!dist'`) → no dangling references (the only remaining mentions are
point-in-time research/ADR records, which are historical and not rewritten); `pnpm --filter
@bluewave/desktop exec vp test run src/main/campaignCommandSchemas.test.ts` → 58 pass; `pnpm typecheck`
exit 0; `pnpm lint` 0/0; `pnpm format` clean; `pnpm preflight` exit 0. Full `pnpm check` run for this
commit (no golden/content change — the deleted modules were not on any authoritative path).
