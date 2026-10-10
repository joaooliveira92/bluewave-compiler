# 03 — Save compatibility policy and test

**Type:** decision + test
**Status:** open
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
