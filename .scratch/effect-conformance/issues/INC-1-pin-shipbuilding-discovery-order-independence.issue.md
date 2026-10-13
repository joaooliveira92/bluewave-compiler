# INC-1 — Pin `discoverShipBuildingFiles` order-independence

**Type:** implementation
**Status:** open
**Blocked by:** None (can start immediately)
**Frontier:** yes

**What to build:** `discoverShipBuildingFiles` feeds the compiled content surface but is
not exercised by the golden fixture, so a regression in its host-directory iteration
order would reach no hard gate. Pin its order-independence with a focused test so the
discovered groups are provably stable regardless of how the host filesystem enumerates
directory entries, then either keep or remove the existing sorted-enumeration guarantee
based on what the test proves. This closes the one residual from ticket 06 (the
determinism-advisory gating verdict).

## Acceptance criteria

- [ ] A test asserts the returned `ShipBuildingFileGroups` are identical under a
      shuffled/creation-order-different directory iteration (not only the natural order),
      covering the recursive part files, naval profiles, and reference designs.
- [ ] The test lives beside the existing content-compiler discovery tests and uses the
      existing enumeration-order pin shape (`packages/persistence/test/persistence.test.ts`
      F6 total order is the prior art).
- [ ] If the test shows the current explicit `.sort()` (and UK-first nation order) is
      load-bearing, it stays; the ticket records which guarantee the test pins.
- [ ] `pnpm --filter @bluewave/content-compiler exec vp test run` is green; no production
      behaviour and no compiled surface changes (the golden content artifact hash is
      unchanged).
- [ ] `pnpm preflight` stays green.

## Notes for implementator

- `packages/content-compiler/src/shipBuildingDiscovery.ts` — `listYamlFiles` sorts in
  place; `listReferenceDesignFiles` pins UK first then `starters`/`historical`. The test
  must prove those orders, not merely restate them.
- Prefer a real temporary directory written in a non-lexical creation order over mocking
  `readdirSync`, so the assertion is external behaviour.
- No changes to `content/` or to the compiled artifact.

## Answer

_(empty)_
