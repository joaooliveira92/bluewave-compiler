# ADR-0134: Versioning and changelog policy

## Status

Accepted (2026-10-12).

## Context

The desktop package shipped with `version: "0.0.0"` and no release had ever been
cut. `CHANGELOG.md` wrote all player-facing history under a single `## Unreleased`
heading, while authoritative compatibility was pinned separately in
`CURRENT_COMPATIBILITY_VERSION`. Those three numbers (package version, changelog
heading, compatibility constant) had no rule tying them together, so a release
could ship with them out of step, and the changelog had to be assembled by hand
from memory.

## Decision

1. **Semantic versioning.** Releases are `vMAJOR.MINOR.PATCH`. The released
   desktop version (`apps/desktop/package.json`) is the release version; the tag
   is `v<version>`; the two are equal. Pre-`1.0` history is not renumbered.
2. **One compatibility number.** A release's `CURRENT_COMPATIBILITY_VERSION`
   (`@bluewave/persistence`) equals the released desktop version. A save written
   by release `X` is continued only by release `X` (the reject-on-mismatch policy,
   ADR-0113); bumping the compatibility constant is therefore part of bumping the
   release version, not an independent act.
3. **The changelog is human-authored, machine-seeded.** `CHANGELOG.md` is the
   player-facing record and is written by hand. `scripts/changelog.mjs` renders a
   draft section from the Conventional Commit subjects between two refs
   (`--from <ref> --version vX.Y.Z`), grouped `feat → Added`, `fix/revert →
   Fixed`, `perf/refactor → Changed`. At release time the curated section is
   reconciled against that draft, so history and changelog cannot drift silently.
4. **Cutting a release is a `dev → main` boundary.** `CHANGELOG.md`'s
   `## Unreleased` content moves under `## vX.Y.Z`, the desktop version and the
   compatibility constant are set to `X.Y.Z`, and the tag `vX.Y.Z` is pushed,
   which triggers `release.yml` to build a draft release.

## Consequences

- The release version is the single knob; the tag, package version, and
  compatibility constant are checked for coherence rather than kept in sync by
  convention.
- Commit subjects become load-bearing: the changelog draft is only as good as the
  Conventional Commit discipline already enforced (`check-commit-msgs.cjs`).
- No release tooling (changesets/semantic-release) is added: the generator is a
  small script with tests, consistent with the repo's dependency posture.

## Alternatives considered

- **Full changelog automation** (generate the file from commits). Rejected: the
  existing changelog is deliberately player-facing prose, not commit subjects;
  automating it would degrade it.
- **`changesets`/`semantic-release`.** Rejected: a large dependency and a
  different source of truth for a single-package release line.
