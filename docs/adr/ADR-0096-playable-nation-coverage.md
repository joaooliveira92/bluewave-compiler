# ADR-0096: Playable nations must have an authored national profile

## Status

Accepted 2026-10-10.

## Context

The 1880 production pack marks **ten** nations `isPlayable: true` (uk, germany,
france, usa, japan, italy, russia, austria_hungary, spain, qing), but only
**three** (uk, france, germany) have an authored national naval profile in
`ship-building/naval-profiles.yaml` — the national identity (component variants,
doctrine, industrial character) added by ADR-0089/0090/0092. An unauthored nation
still resolves a generic, nation-neutral ship-building environment, so the game is
*playable* but offers no national flavor where the design promises it.

`validateAllNations` (`packages/ship-design/src/nationCompleteness.ts`) only
validates the nations that have a profile, so the gap was silent: a playable nation
with no profile passed every release gate.

## Decision

1. **A playable nation is expected to have an authored national profile.** The first
   release ships uk, france, germany.
2. **Unauthored playable nations are a recorded content gap, not a silent one.** The
   shipped set is `profiled ∪ UNAUTHORED_PLAYABLE`, where `UNAUTHORED_PLAYABLE`
   (currently the other seven) is an explicit allowlist in the release-gate test.
3. **The release gate enforces the invariant.** `productionNationCoverage.test.ts`
   fails if a playable nation is neither profiled nor allowlisted, if a profiled
   nation is not playable, or if an allowlisted nation has since been profiled. The
   allowlist may only shrink.
4. **Authoring the remaining profiles is content work**, tracked in
   `.scratch/playable-loop/` (nation coverage ticket). Until then the new-game flow
   continues to offer all ten playable nations with the generic environment.

## Alternatives considered

- **Author all seven now.** Correct end state, but a large sourcing/authoring effort;
  out of scope for this decision.
- **Mark the seven `isPlayable: false`.** Rejected: it contradicts DESIGN-04's ten
  canonical slots; the missing piece is profile content, not playability.
- **Leave it silent.** Rejected: a playable nation without identity is exactly what
  the release gate exists to catch.

## Consequences

- The gap is enforced and visible; it cannot grow by accident.
- `validateAllNations` still validates every authored profile (existing test).
- Content workload is explicit: seven national profiles.
