# ADR-0051: P-1 — Spawn Heading Follows `directionBp`

## Status

Accepted (2026-10-07). Supersedes ADR-0046 decision 2 (auto-resolution heading override).

Supersedes: ADR-0046 (decision 2).

## Context

`computeInitialMovementStates` labelled 90/270 as east/west, but `directionBp`
uses 0 = +X. ADR-0046 worked around it by overriding unit headings during
auto-resolution projection.

## Decision

Spawn now uses the `directionBp` convention: attacker heading 0 (+X, from the
west edge), defender 180 (from the east edge). The projection override is
removed; with it removed the full combat suite is unchanged, proving it was
redundant.

## Baseline re-pins (ADR-0007)

B-2..B-6 no-op baselines moved only because of the heading change. Verified by
forcing the old 90/270 headings back onto the new spawn: the torpedo and weather
baselines reproduced the OLD hashes exactly. OLD → NEW values are in the test
comments (`torpedo/advance.test.ts`, `weather/advance.test.ts`,
`weather/integration-boundary.test.ts`). Goldens: 10/10 unchanged
(`scripts/verify-golden-hashes.cjs`).

## Consequences

- `test/simulation/spawn.test.ts` pins the convention.
- Older test scenes pass `orderedHeading: 90` to a ship that now starts at 0, so
  their baselines include an initial turn. Harmless for the no-op pins; aligning
  the order headings is optional cleanup.
- The `pursuit.ts` comment and ADR-0046 text still describe the old convention.
