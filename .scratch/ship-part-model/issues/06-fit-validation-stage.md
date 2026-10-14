# 06: Fit validation before derivation (P1)

**Type:** implementation
**Status:** resolved (stage level; production wiring and four validations deferred, see "Deferred work")
**Blocked by:** 03
**Frontier:** no
**Requirements:** SPM-R12 · Stories 23, 24, 27

## What to build

A ship designer gets a clear, structured finding when a loadout does not fit, before any
derived calculation runs. Fit validation is a pure stage, run in this order:

1. the slot exists;
2. interface match **and** every constraint, checked on the resolved spec;
3. `mountCount` bounds, including nested entries;
4. lifecycle at the design month;
5. national access and hard limits (the stricter of national and platform wins);
6. placement.

Findings are sorted: `FIT_COUNT_EXCEEDED`, `FIT_INTERFACE_MISMATCH`,
`FIT_CONSTRAINT_VIOLATED`, `FIT_NOT_YET_AVAILABLE` (with the date), `FIT_UNAVAILABLE`
(with `supersededBy`) and `FIT_NATION_ACCESS`. Expected errors are findings; only
invariant breaks throw (ADR-0152).

## Acceptance criteria

**Framework completeness.** All `FIT_*` rules, their ordering, the diagnostics and the
barrier that stops derivation all exist:

- [x] Design-compile seam tests produce each `FIT_*` finding from a hand-built fixture
      loadout, including a nested over-full `guns` slot and a slot with 0–3 forward mounts.
- [x] Findings are deterministically ordered, and stay identical across runs and when the
      input entries are permuted.
- [x] An invalid loadout yields its findings, and no derived metrics are computed from it.
      Closed at **stage level only**: `deriveAfterFit(fit, derive)` withholds `derive` for a
      non-`ACCEPTED` result. `compileDesign` does not yet route loadout derivation through
      it, so the barrier is not enforced in the production pipeline (ticket 11).
- [x] A national limit stricter than the platform's wins, and vice versa (ADR-0089).

**Content-family coverage.** This ticket proves the gun slice only:

- [x] Every gun loadout from ticket 03 passes validation on the compatibility slot
      templates, with no new findings.
- [x] No placeholder content is invented for torpedo or other families. Tickets 04 and 05
      add their own fixtures, and ticket 08 verifies all 823 placements together.
- [x] Launcher fixtures (handed over from ticket 04): a torpedo whose `diameterUm` differs
      from the launcher's `boreDiameterUm` is `FIT_CONSTRAINT_VIOLATED` on the `torpedo`
      slot's `diameterUmEqualsBore`, unless the launcher carries a `DQ-TORPEDO-001` waiver
      whose `forPart` is that torpedo. Inputs: `buildLauncherPartModel` in ship-design.
- [x] Remaining-family fixtures (handed over from ticket 05):
  - a plant entry whose `params.installedKw` is outside the plant part's `installedKw`
    parameter range is a finding;
  - an armour material fits an `armour.<region>` slot, and a non-armour part there is
    `FIT_INTERFACE_MISMATCH`;
  - an ammunition part nests in a gun mount. The mount's `ammunition` slot is
    hand-built in the fixture, because today's mount parts declare only `guns`.

  Inputs: `buildPlantPartModel`, `buildArmourPartModel`, `buildAmmunitionPartModel` and
  `buildFittingPartModel` in ship-design.

## Resolution

Implemented in `packages/ship-design/src/partFit.ts` (traversal, stages),
`partFitConstraints.ts` (slot constraints on the resolved spec) and `partFitTypes.ts` (the
contract). ADR-0154 §16 records the decisions. Tests: `partFit.test.ts` (67, synthetic
hand-built fixtures, every record decoded through the strict schemas) and
`partFitProduction.test.ts` (23, production adapters and all 91 designs).

- **Result.** `ACCEPTED` / `REJECTED` (findings) / `NOT_EVALUABLE` (data issues). Findings
  are sorted by the ticket's code order, then path. Paths are identifier-based
  (`entries/<slot>/<part>#<n>`), so shuffled input gives byte-identical output.
- **Added codes (distinct failures the ticket's list did not name).** `FIT_UNKNOWN_SLOT`
  (stage 1), `FIT_COUNT_BELOW_MINIMUM` (a declared `mountCount.min`) and `FIT_PLACEMENT`
  (stage 6). Data issues are `FIT_DATA_*`.
- **Implemented.** `validateLoadoutFit` and `deriveAfterFit` are implemented and tested.
  `deriveAfterFit(fit, derive)` runs `derive` only for `ACCEPTED`.
- **Barrier: stage level, not production.** `compileDesign` is **not** wired through
  `deriveAfterFit`, because P1 must not change results (SPM-R19) and drafts have no loadout
  until the codemod. Production-pipeline enforcement is deferred to ticket 11.
- **Side inputs (typed, explicit).** `nation` (`nationId`, `deniedParts`,
  `maxGunCalibreUm`), `ammunitionCompatibility` (gun part ids per ammunition part; the legacy
  `compatibleGun*` facts have no part field) and `mountCountRanges` (the legacy `PARAM_RANGE`
  count range, adapter-side).
- **Not evaluable by the present domain model, so not implemented and not claimed.**
  Platform availability windows (no such field); loadout-entry identity and containment-cycle
  checks (no entry id: the schema rejects an `id`, so duplicate ids and cycles cannot be
  expressed); unlocked-technology requirements (technology `requires` has no
  unlocked-technology input). These remain explicit follow-up work, see below.

## Deferred work

| Item | Owner |
| --- | --- |
| Route `compileDesign` loadout derivation through `deriveAfterFit` (production barrier) | ticket 11 |
| Candidate pipeline runs fit before derivation in the harness | ticket 08 (stage-level seam suffices) |
| Surface fit findings through `validateLoadout` | ticket 07 |
| Platform availability windows: schema field, then a fit stage | ticket 11 (schema and codemod), with the stage added in 07/11 |
| Loadout-entry identity, duplicate and cycle checks: schema field, then checks | ticket 11 (schema and codemod) |
| Unlocked-technology requirement input and stage | ticket 07 (`availableParts` input), enforced in 11 |
| Ambiguous magazine representation | tickets 08 and 11 |
- **Ambiguous magazines.** Reported as `unresolved` (`FIT_MAGAZINE_AMBIGUOUS` /
  `FIT_MAGAZINE_UNDETERMINED`), never chosen; no `rounds` or `magazineRef` is created. Tickets
  08 and 11 still own the representation.
- **Production.** All 91 designs (823 placements, 230 gun and 28 tube placements) are
  `ACCEPTED` with no findings, data issues, waivers or unresolved relationships; the legacy
  compile raises none of `TECH_UNAVAILABLE`, `COMPONENT_OBSOLETE` or `PARAM_RANGE` for them.
  Production tube entries nest no torpedo (torpedo parts are ticket 13's), so launcher bore
  and the five waivers are exercised on all 17 variants with a fixture torpedo that carries
  only the structured diameter.
