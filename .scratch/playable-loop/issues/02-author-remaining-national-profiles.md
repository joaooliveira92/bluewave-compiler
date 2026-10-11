# 02 — Author national profiles for the remaining playable nations

**Type:** implementation
**Status:** done
**Blocked by:** none
**Frontier:** no
**Spec:** `.scratch/playable-loop/spec.md`; ADR-0096, ADR-0108

## Outcome

All seven nations (usa, japan, italy, russia, austria_hungary, spain, qing) are profiled with six
classified `DOCTRINE_TEMPLATE` starters each; `UNAUTHORED_PLAYABLE` is empty and the gate asserts full
playable-nation coverage. See ADR-0108 and `docs/nations/national-content-completeness.md`.

## Scope

Close the ADR-0096 content gap: author national naval profiles (and classified
opening starters) for the seven playable nations currently in `UNAUTHORED_PLAYABLE`
(usa, japan, italy, russia, austria_hungary, spain, qing), one nation at a time.

## Acceptance

- `validateAllNations` returns zero issues for the newly authored nation.
- The nation is removed from `UNAUTHORED_PLAYABLE` in
  `packages/ship-design/test/productionNationCoverage.test.ts`.
- When the list is empty, the gate asserts full playable-nation coverage.

## Notes

Content, not code: research via the `research` skill / `docs/research/`, following
`docs/agents/adding-a-nation.md`. Provenance labels required (no release placeholders).
