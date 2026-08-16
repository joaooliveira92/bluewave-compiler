# INC-5 — Hit Resolution + Detonation Outcomes

**Type:** implementation
**Status:** open
**Blocked by:** INC-4
**Frontier:** no

## Acceptance (spec AC-13 part 2, AC-14)

- §14 hit resolution: a torpedo hit requires track intersects the target's authoritative
  collision geometry, torpedo traveled ≥ arming distance, depth + target draft compatible,
  no avoidance/decoy/interception/failure result, target remains a legal physical object,
  valid impact substep ordering; `TORPEDO_HIT_RESOLVED` on success; contact does NOT
  guarantee detonation (`test/torpedo/hit-resolution.test.ts`).
- §15 detonation outcomes: closed set `DUD`/`PARTIAL_DETONATION`/`FULL_DETONATION`/
  `PREMATURE_DETONATION`/`MAGAZINE_OR_TUBE_CHAIN_REACTION`/`NO_CONTACT`, each selected
  through an explicit deterministic predicate or keyed random decision; `TORPEDO_DUD`
  for duds; the result records all inputs, probability, random decision, provenance
  (`test/torpedo/detonation.test.ts`).

## Hints

Keyed RNG stream namespacing: `battle/torpedo/...` per ENGINEERING-CONTRACT (hierarchical,
domain-separated). Detonation evaluation considers reliability, fuze, impact geometry,
depth, target protection, damage state.