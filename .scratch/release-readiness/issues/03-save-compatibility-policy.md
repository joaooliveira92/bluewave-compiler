# 03 — Save compatibility policy and test

**Type:** decision + test
**Status:** resolved
**Blocked by:** none
**Frontier:** yes
**Spec:** `.scratch/release-readiness/spec.md`

## Scope

The persistence contract currently **rejects** a save whose compatibility version does
not match (`packages/persistence/src/compatibility.ts`, DESIGN-52). Decide and encode
the policy for the first release: reject with a clear, user-facing message, or migrate.

## Acceptance

- An ADR recording the policy (migration is a product promise; reject-on-mismatch must
  be surfaced to the player, not a cryptic diagnostic).
- A saved fixture per released compatibility version, loaded in CI; the corpus is the
  regression net for the next bump.
- If migration is chosen: a versioned migration path with a golden round-trip test.
- If reject is chosen: the UI presents a human-readable "this save is from an
  incompatible version" message.

## Notes

No released version exists yet, so start the corpus with the v1 format at first release.

## Resolution

**Decision: reject-on-mismatch (strict version equality), documented in
`docs/adr/ADR-0113-save-compatibility-policy.md`.** Migration stays a product
promise; no migration engine ships. The stable
`PERSISTENCE_COMPATIBILITY_MISMATCH` diagnostic is the rejection signal, and it
is already user-facing: `loadCampaign` forwards `collector.all.map(d =>
d.message)` to the bridge, and `useCampaignFiles.openCampaign` renders it as
`Load failed: LOAD_FAILED — <diagnostic>`. No production UI/bridge change was
needed (verified by a new case in `continuityCommands.test.ts`).

Acceptance mapping:

- **ADR recording the policy** → `docs/adr/ADR-0113-save-compatibility-policy.md`
  (indexed in `docs/adr/README.md` via `pnpm adr:index`; ADR-0113 added to the
  Foundations section of `scripts/adr-index.cjs`).
- **Saved fixture per released compatibility version** → first-release seed:
  `packages/persistence/test/save-compatibility-policy.test.ts` round-trips a
  snapshot at the locked `CURRENT_COMPATIBILITY_VERSION` (`1.1.0`) and asserts
  that constant is the release lock. No released version exists yet, so the
  corpus starts here and grows on each future bump (ADR-0113 §5).
- **Migration chosen?** No — reject is chosen; no migration path is built.
- **UI human-readable message** → reject chosen; the message already reaches the
  renderer readably, and `continuityCommands.test.ts` now proves it (stored
  version tampered to `1.0.0` → the bridge diagnostics carry
  `Save compatibility version "1.0.0" does not match current engine version`).
- **Content-hash stability guard** → already present in
  `apps/desktop/src/main/shipBuildingContent.test.ts` (64-hex shape + stability
  across calls + distinctness from the armament hash); left unchanged, no
  production hash semantics touched.

## Comments
