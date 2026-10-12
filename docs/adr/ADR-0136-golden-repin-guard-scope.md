# ADR-0136: Scope the golden re-pin guard to the reference run's real inputs

## Status

Accepted (2026-10-12).

## Context

`verify-golden-repin.mjs` (ADR-0007) fails any commit that edits "authoritative"
source without re-pinning `golden/hashes.json` in the same commit. Its
`isAuthoritativeSource` was a blanket predicate: any `packages/<authoritative>/src`
file, or *any* `content/production/` file. That is broader than the reference run
it protects.

The reference run is `packages/cross-process-test/src/run-child.ts`, which
`verify-golden-hashes.cjs` executes. It compiles an **in-code synthetic fixture**
and never reads authored content, and that fixture declares no naval-profile or
ship-building/design collection. So two classes of change are flagged even though
they cannot move `golden/hashes.json`:

- authored `content/**` (the reference run reads none of it); and
- the dock-record plumbing (`dock.ts`, `nationCompleteness.ts`, `nationProfile.ts`,
  the `NationDockState` type, the naval-profile schema, dock order eligibility, and
  the dock clone), which the fixture never exercises.

Commit deff5d30 (ADR-0135) changed exactly those paths. `pnpm check:golden`
proved all ten reference hashes unchanged, but the guard still flagged it. It was
pushed to `origin/dev` before a `Golden-Repin: not-needed` trailer was added, and
force-push is prohibited, so the previous session advanced
`scripts/golden-repin.baseline` past it. That is a blanket gate weakening: it
grandfathers *every* path in that commit, and every commit before it, for the sake
of one no-output change.

## Decision

1. **Restore the baseline to `bee03042`** — the commit the guard landed on top of —
   so the ratchet covers deff5d30 again.
2. **Scope `isAuthoritativeSource` to the reference run's real inputs.** The
   predicate now excludes authored `content/**` (the run uses an in-code fixture)
   and a reviewed, reasoned `REFERENCE_RUN_EXEMPTIONS` list of paths that the
   fixture cannot exercise. Everything else under `packages/<authoritative>/src`
   stays gated.
3. **Exemptions are evidence-bearing and reviewed.** Each entry carries a reason
   tied to the fixture's declared collections; adding one is a gate change
   recorded here. `scripts/test/verify-golden-repin.test.mjs` pins both the exempt
   and the non-exempt cases (including a sibling ship-design module that stays
   gated).
4. **The `Golden-Repin: not-needed` trailer remains the escape** for a no-output
   code change, and the baseline ratchet remains for pre-guard history.

## Consequences

- A no-output authored-content change needs neither a re-pin nor a baseline move,
  and the guard no longer produces false positives for the dock-record feature.
- The exemption list is explicit and minimal: a future change to any *other*
  source file is still gated. A change to an exempted file is still caught by
  `check:golden` if it ever moves a hash; the exemption only removes the redundant
  same-commit re-pin demand for paths the fixture cannot reach.
- `scripts/golden-repin.baseline` no longer needs the deff5d30 carve-out.

## Alternatives considered

- **Keep the baseline at deff5d30.** Rejected: a blanket grandfather for one
  no-output change weakens the gate for every earlier path and hides the omission.
- **Reachability analysis from `run-child.ts`.** Rejected: the transitive package
  graph reaches every package (phase-engine depends on ship-design and ai), so
  reachability alone does not separate exercised from inert code.
- **Runtime execution tracing.** Rejected as a gate: too slow and non-hermetic for
  a pre-commit check; the explicit list is reviewable and deterministic.
