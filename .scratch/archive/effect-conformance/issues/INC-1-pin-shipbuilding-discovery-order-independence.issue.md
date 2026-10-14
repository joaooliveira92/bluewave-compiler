# INC-1 — Pin `discoverShipBuildingFiles` order-independence

**Type:** implementation
**Status:** resolved
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

Resolved. Added `packages/content-compiler/test/shipBuildingDiscovery.test.ts`.

- The test builds a real temporary ship-building tree in a deliberately
  non-lexical write order (nested `naval-profiles` + `parts`, three
  `reference-designs` nations with `starters`/`historical` + extras), then drives
  `discoverShipBuildingFiles` twice over the *same* tree: once with the real
  `readdirSync`, once with a thin `node:fs` wrapper that reverses every
  directory read. Both must equal the canonical expected groups, and each other.
- The reversed-read call is the load-bearing assertion: it forces a different
  host iteration order regardless of the underlying filesystem, so the test
  proves the explicit `.sort()` in `listYamlFiles` and the UK-first
  `nationOrder` comparator (plus the `starters`→`historical`→extras ordering)
  are what make the result stable. Temporarily removing `.sort()` makes the test
  fail — verified during implementation.
- **Guarantee pinned:** the explicit sorted/UK-first ordering **stays**; the test
  pins it (recursive part/naval-profile files lexicographic, reference designs UK
  then nations lexical, conventional files first then lexical extras,
  ADR-0109). A second case pins that a missing tree yields empty groups.
- No production or compiled-surface change (no `content/` or artifact change).
- Commands: `pnpm --filter @bluewave/content-compiler exec vp test run test/shipBuildingDiscovery.test.ts`
  green (2 tests); `pnpm preflight` green.

Closes ticket 06's `F-06-R` residual.
