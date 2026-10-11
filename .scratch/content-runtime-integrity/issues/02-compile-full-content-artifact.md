# 02 — Compile the full content surface into one hash-pinned artifact

**Type:** implementation
**Status:** resolved
**Blocked by:** 01
**Frontier:** no

## What to build

The content compiler validates and normalizes the **complete** authored surface
— the content-pack collections *and* the ship-building catalogue (components,
propulsion plants, hull forms, balance, armament families/models/mounts/
ammunition, per-nation naval profiles, per-nation reference designs,
technologies) — into a single deterministic generated artifact plus a manifest
that carries a semantic content version and a content hash.

Designer-facing `content:check` (validate, write nothing) and `content:build`
(emit the artifact) are aliases over the existing compiler CLI — not a second
pipeline. A malformed or cross-referentially broken file fails with a diagnostic
pointing at the file and field path.

This is the producer half of "validated content is the only thing that runs":
today the ship-building subtree is never compiled — it is read raw at runtime.

## Acceptance criteria

- [ ] `content:build` emits a generated artifact + manifest (semantic content
      version + SHA-256) covering both the content-pack collections and the
      ship-building catalogue.
- [ ] `content:check` validates without writing and returns the same accept /
      reject decisions as `content:build`.
- [ ] Two consecutive builds over unchanged content produce byte-identical
      artifacts (deterministic).
- [ ] Duplicate IDs and dangling cross-file references — in **any** collection,
      including ship-building — fail with a file + field-path diagnostic.
- [ ] Generated output is inert data (no executable content) and generated files
      are marked do-not-edit.
- [ ] Existing `bwc compile` / `bwc validate` behavior and wire formats for the
      content-pack boundary are unchanged.

## Notes

- Grounds on the compiler-stage and content-parsing ADRs; extends the national
  content pipeline (per-nation profiles/reference designs) to a compiled
  artifact.
- An ADR is needed for the generated-artifact location, format, and versioning
  scheme (inert JSON preferred over generated TypeScript; generated TS is only
  justified if a literal ID union is genuinely needed by internal tooling).
- Keep the artifact deterministic and hash-stable: it becomes the runtime
  identity consumed by ticket 03.
- This is the producer slice (no UI). It is verifiable on its own via the CLI
  and fixtures.
## Comments

**Resolved.** The ship-building catalogue (components, plants, hull forms,
balance, armament families/models/mounts/ammunition, per-nation naval profiles,
per-nation reference designs) now flows through the **same four compiler stages**
as the content-pack collections: `CompilerInput` gained optional ship-building
file groups, Parse extracts each wrapper mapping, Validate applies each
collection's content-schema and rejects duplicate IDs / dangling cross-file
references with the source file + field path (`DUP-ID`, `REF`), Normalize sorts
canonically, and Compile emits the bundle.

- `content:check` (validate, write nothing) and `content:build` (emit artifact)
  are designer-facing aliases over the existing `Compiler`, discovering the
  ship-building files by the same convention the desktop loader uses. `bwc
  compile` / `bwc validate` are unchanged (no ship-building groups → byte-compatible
  `content-pack` artifact).
- `content:build` writes `content-artifact.json` (inert JSON, `generatedBy`
  do-not-edit marker, includes `shipBuilding`) plus `content-manifest.json`
  (semantic `contentVersion` from `pack.json` + SHA-256 `bodyHash` under the
  `content-bundle` envelope). Canonical output location `content/generated/<scenario>/`
  is git-ignored (never a second source of truth). Root scripts `pnpm content:check`
  / `pnpm content:build` added.
- Production pack verified: `content:check` passes; two builds are byte-identical
  (artifact SHA-256 `b54fd387…`).
- ADR-0122 (compiled content bundle) records format/location/versioning and the
  "no committed artifact" decision.

Tests: `content-compiler` 18 (full-surface compile, bundle omission, duplicate-ID,
dangling-ref); `compiler-cli` content-surface 4 (check-writes-nothing, artifact
coverage, byte-identical builds, check/build agree on rejection). `pnpm preflight`
green; full suite 1621 passing.
