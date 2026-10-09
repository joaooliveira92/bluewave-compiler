# ADR-0085: Design studies gate design approval

## Status

Accepted 2026-10-09. Implements DESIGN-21 sections 3 and 8-18 in the phase engine; supersedes the same-month approval ADR-0066 introduced.

## Context

DESIGN-21 requires every design submitted for approval to create or reference one `DesignStudy` (section 3), and defines
the similarity criteria (sections 9-17) and the derived-design study discount (section 18). The `SubmitDesign` command
(ADR-0066) put a compiled design straight into the catalog in the month it was committed, with no study time or cost. This
ADR records opening a study instead, and the study constants chosen for the shipped 1880 pack.

## Decisions

1. **Submit opens a study, not an approval.** `applySubmitDesign` (phase-engine) compiles the draft as before, then — when
   the ship-building content carries study rules — calls `startDesignStudy` instead of adding the design to
   `snapshot.designs`. A second submission of a design that is already approved *or already in study* is rejected
   (`DESIGN_REJECTED`).
2. **Study terms.** `studyTerms` (ship-design) computes base work/cost and the discounted final values in integer
   canonical units: `baseStudyWork = baseWorkMonths`, `baseStudyCost = max(minFinalCost, ceil(designCostUnits * costBp /
   10_000))`, and, for a derived design, `final = max(minimum, ceil(base * (10_000 - discountBp) / 10_000))`. Rounding is
   CEILING and each minimum is exactly `1` (section 18). `formulaVersion` is `design_study_v1`.
3. **Similarity and lineage.** `assessSimilarity` compares the candidate with the family's newest comparable member (the
   newest member that still carries its `sourceDraft`) in the fixed criterion order of sections 10-16. Every criterion
   passing makes it a derived design: it keeps the discount and stays in the family. Any criterion failing is **not** a
   rejection: it records the failed criteria and opens a **new** family at full cost (section 17). A family's first design
   has no baseline and is never derived.
4. **Funding.** `fundDesignStudies` runs each month before construction is funded, nation by nation and study by study in
   `designStudyId` order. A study advances exactly one month of work when `ceil(remainingCost / remainingWork)` is
   affordable from the treasury above the nation's expense reserve; otherwise it makes no progress and takes no payment
   (section 3: a study receiving no paid work receives no progress). Payment is an appropriation in the `DESIGN_STUDY`
   ledger category with a matching `budgetChanged` event.
5. **Approval.** In the month the final work is paid the study becomes `COMPLETED` and `approve()` adds the design to
   `designs` and creates or extends its family — the same snapshot shape `SubmitDesign` produced before studies.
6. **Determinism.** All study arithmetic is integer/CEILING; ordering is by id; `projectHash` is
   `sha256(canonicalSerialize(identity))` over the fixed identity (including `formulaVersion`); the study is a pure
   function of the snapshot, content, and month.
7. **Content constants.** The shipped 1880 `balance.yaml` `study:` block is `costBp: 300` (3 % of the design's first-ship
   cost), `baseWorkMonths: 4`, `derivedDiscountBp: 2500` (the rules' own value, permitted `1500..3500`), `minFinalWork: 1`,
   `minFinalCost: 1`. `costBp` and `baseWorkMonths` are game-design constants, not historical data; `derivedDiscountBp`
   and the minimums are the values section 18 fixes. A missing or out-of-range block throws
   `DERIVED_DESIGN_DISCOUNT_CONTRACT_MISSING`. A pack with no `study:` block approves same-month (the pre-study behavior).
8. **Bridge surface.** `submitDesignCommand` returns a `DesignStudyPreview` (`months`, `cost`, `derived`, `discountBp`,
   `baselineClassName`, `newFamily`, `failedCriteria`) so the Drawing Board states the study's terms when a design is
   queued. The preview is planned with the same `planDesignStudy` the engine will open; the engine stays the sole mutator
   and the desktop only queues the envelope.

## Consequences

- A new class is approved in the fifth month after submission (four months of work; the submission month pays the first),
  and a month without the money delays it further. Tests that assumed same-month approval were migrated: the engine's
  submit/revise tests pin `study: null`, the desktop bridge tests advance months until the study completes, and
  `design-study.test.ts` covers the study path itself.
- `DesignStudy` lives on `NationState.designStudies` (optional, so packs without studies and older fixtures stay valid) and
  is carried through `snapshotClone`.
- The ruleset defines the study discount now; future national or event study modifiers apply after it in ascending
  modifier-id order (section 18), which needs no change here.

## Alternatives considered

- **Reject a dissimilar design.** Rejected: section 17 requires a similarity failure to change lineage and study cost,
  never to reject an otherwise legal design.
- **A study that cannot stall.** Rejected: section 3 explicitly allows a study to make no progress in a month it is not
  paid, so the player can fund it later.
