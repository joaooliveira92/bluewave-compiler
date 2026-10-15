# 05: Retire the legacy `.bluewave` I/O modules and close test-helper I/O

**What to build:** no production source under the desktop main process performs file I/O outside the
service graph. The retired `.bluewave` content-authoring readers (the project-file and campaign-save
modules that survive only because their tests import them) are removed along with their tests, or, if
the format is still supported, brought behind a service. The remaining test-only helpers that read the
filesystem directly are moved behind the boundary or deleted. `project.ts`/`campaignSave.ts` remain the
only such modules today.

**Blocked by:** 01 — Land the Effect runtime migration on `dev`

**Status:** ready-for-agent

- [ ] A repository search finds no direct filesystem import in desktop main production source except
      inside the service implementations (`ContentArtifact`, `ProjectStore`, the sidecar stores, the
      command queue, `CrashReporter`).
- [ ] The retired `.bluewave` readers are either deleted (with their tests) or wrapped in a service —
      decided and recorded, not left as a hybrid.
- [ ] Test-only helpers that do direct I/O are behind a service or clearly scoped as test fixtures.
- [ ] `pnpm check` stays green; no gameplay/content/golden change.
