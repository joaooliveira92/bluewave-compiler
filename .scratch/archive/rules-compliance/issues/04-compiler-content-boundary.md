# 04: Compiler content boundary — loader owns I/O, manifest decoded

**Type:** implementation
**Status:** resolved
**Blocked by:** None (can start immediately)
**Frontier:** no

**What to build:** Two seams leak past the compiler boundary: the parse stage
reads files straight from disk inside its `run`, and the manifest is parsed with
`JSON.parse(...) as SurfaceManifest`. Move all filesystem reads into the compiler
loader, hand the stage an immutable map of file-name → text, and decode the
manifest with the existing strict content schema so a malformed manifest fails
with a `MANIFEST` diagnostic instead of a cast. The stage becomes pure and
testable from an in-memory input; the compiled artifact and its body hash are
unchanged. Ship two scoped gates — `assert-no-stage-io` (no `node:fs` under the
stage directory) and `assert-boundary-decode-compiler` (no boundary cast in the
loader) — so the rule stays frozen.

## Acceptance criteria

- [ ] The parse stage performs no filesystem reads; its input carries the file
      contents.
- [ ] The compiler loader decodes the manifest with the strict schema; a
      malformed manifest produces a `MANIFEST` diagnostic naming the file.
- [ ] A new `assert-no-stage-io` gate fails when a stage imports `node:fs`/
      `node:child_process` and passes on the real tree.
- [ ] A new `assert-boundary-decode-compiler` gate fails on a boundary
      `JSON.parse(...) as T` fixture and passes on the real tree.
- [ ] Both gates ship bad-fixture / good-fixture pairs, are registered in
      `run-gates.mjs`, and are invoked by CI (`verify-check-parity` green).
- [ ] `content:check` / `content:build` / `content:verify` are green and the
      artifact body hash is unchanged.

## Notes

- Respects ADR-0004 (stages do no ambient I/O) and ADR-0105 (strict boundary
  policy; excess keys rejected).
- The stage test can now drive `ParseStage` from an in-memory content map.
