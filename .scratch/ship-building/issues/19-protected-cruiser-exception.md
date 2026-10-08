# 19: Protected-cruiser class exception

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** yes

Spec: `.scratch/ship-building/spec.md`; decision: ADR-0067. The RTW3 manual lets `CL` carry single mounts up to 8 in (protected-cruiser exception). Bluewave `classification.ts` has none, so a ship like HMS Blake (single 9.2 in gun, 3-6 in deck) has no clean class.

Acceptance: define the exception as a versioned ruleset constant in the classification rules (and `docs/rules/ship-classification.md`), with boundary tests at the limits, an invalid-design test, and a determinism check. Do not change the strict CA `> 6 in` bound (ADR-0067 §1).

## Comments

### 2026-10-08 implementator

Added the protected-cruiser exception as ruleset data: `protectedCruiserExceptionVersion: 1` and `clProtectedMaxGunUm` (8 in) in `DESIGN_22_EARLY`; new `ClassFacts` fields `deckUm` and `maxHeavyMountBarrels`; `isProtectedCruiser` predicate (no main belt, armour deck > 0, every gun above 6 in single-mounted, gun <= 8 in) consulted only by the CL gun bound. CA `> 6 in` bound, displacement and speed bounds unchanged. Rules doc `docs/rules/ship-classification.md` sections 9 and 27 updated. Note: a 9.2 in single-mount ship (HMS Blake) still has no class under the manual's 8 in limit; this is by ADR-0067, recorded in the invalid-design test.

Tests (`packages/ship-design/test/classification.test.ts`): 8 in exact / +1 um boundary, twin mount, belt, no deck, unchanged displacement/speed/CA bounds, 9.2 in invalid design finding, determinism.

Validation (packages/ship-design): `pnpm test` 28 files / 244 tests pass; `pnpm typecheck` clean; `pnpm lint` clean; `vp fmt --check` clean for changed files (only pre-existing `test/references.test.ts` flagged, untouched).
