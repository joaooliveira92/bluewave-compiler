# INC-5 — Hit Resolution + Detonation Outcomes

**Type:** implementation
**Status:** done (2026-08-16, orchestrator pipeline, commit `a2ed7c3`) — AC-13 p2 + AC-14 green
(`hit-resolution.test.ts` + `detonation.test.ts`, 350/350 torpedo, 1366/1366 combat); reviewer
NEEDS_REWORK resolved (fuze carrier HIGH-1, reliability binding MEDIUM-2, contract pin MEDIUM-3,
LOW-4/5 docs); report `.ai/reports/c1-m3-torpedoes-inc5-hit-detonation.md`; ADR-0031.
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