# 02 — Author national profiles for the remaining playable nations

**Type:** implementation
**Status:** open
**Blocked by:** none
**Frontier:** yes
**Spec:** `.scratch/playable-loop/spec.md`; ADR-0096

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
