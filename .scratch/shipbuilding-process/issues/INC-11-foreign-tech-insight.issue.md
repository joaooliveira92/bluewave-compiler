# INC-11 — Foreign technology-insight milestones

**State:** READY_FOR_AGENT · **Frontier:** no · **Blocked by:** INC-9
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R24) · **ADR:** none new (DESIGN-13 §13.5 shipped)

## What to build

Make ordering abroad a way to catch up: when the ordering nation lacks the technology, foreign
construction awards research insight at three milestones — the manual's "you may gain insight into the
technology of the building nation".

## Acceptance criteria

- [ ] When the contract references `foreign_construction_insight_v1` and the ordering nation lacks the
      technology, insight is awarded exactly: design-study `500` research micro-points at acceptance,
      construction-observation `1_000` at 50 % paid work, delivery `1_500` at delivery — capped at
      `3_000` per technology family and contract.
- [ ] Insight never grants a technology, bypasses prerequisites, moves availability dates, duplicates a
      milestone, or exceeds the technology's remaining research requirement.
- [ ] A technology already known to the ordering nation awards nothing; eligible families are
      explicitly listed by the compiled design and policy.
- [ ] Tests: unit (each milestone, the cap, no direct grant); boundary (already-known awards nothing);
      determinism (no duplicate award; stable ordering of eligible families).

## Notes for implementator

Posts research micro-points into the existing research model; never flips a technology. Depends only on
the contract from INC-9.
