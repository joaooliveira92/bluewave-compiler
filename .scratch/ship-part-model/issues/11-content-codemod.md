# 11: One-shot content codemod, pipeline switch and save-compatibility activation (P2)

**Type:** implementation
**Status:** open
**Blocked by:** 09, 10
**Frontier:** no
**Requirements:** SPM-R20, SPM-R21 (activation), SPM-R24 (campaign goldens), SPM-R26 (P2 gate) · Stories 29, 30, 33, 48

## What to build

Production content is rewritten once, deterministically, into parts, platforms and
loadouts, and the game compiles from it. The only non-numeric differences players could
observe are the nine approved central-battery reclassifications.

- The codemod applies the in-memory translations of tickets 03–05 to the files on disk
  (§9.2–9.4). One legacy placement becomes one loadout entry; entries are never split or
  merged.
- The production compile path switches to the parts pipeline. The legacy pipeline stays
  available to the harness as the baseline.
- Save compatibility 2.0.0 is activated **in the same change** as the rewritten content
  and the pipeline switch, so pre-2.0.0 saves start being refused exactly when the new
  content goes live. Development fixtures are converted with ticket 10's tool, if one
  was needed.
- The changelog announces the save-compatibility bump.
- The equivalence report is re-run and committed. Expected: zero `changed`; `reclassified`
  only on the nine D18 paths.
- The artifact re-pin is recorded under the golden re-pin guard (ADR-0136), with the
  report attached. Campaign goldens re-pin only if every difference traces to an R1
  reclassification.
- This lands as a single-purpose commit, staged by explicit pathspec with the staged set
  verified (shared-index rule).

## Acceptance criteria

- [ ] A codemod property test on generated legacy drafts proves
      `mountCount × gunsPerMount = barrels`, one entry per placement, and that invalid
      input is rejected.
- [ ] Running the codemod twice is a no-op, and it produces byte-identical output across
      processes.
- [ ] The committed P2 report passes every gate from tickets 08 and 09.
- [ ] Combat and campaign goldens are unchanged, or there is a recorded re-pin whose every
      difference is an approved reclassification.
- [ ] The rewritten content, the canonical pipeline and compatibility version 2.0.0
      arrive in one commit. No intermediate commit has old content with 1.2.0 saves
      refused, or new content with 1.2.0 saves accepted.
- [ ] Save-load seam tests from ticket 10 pass with the real current version (2.0.0).
- [ ] `compileDesign` routes loadout derivation through `deriveAfterFit`, so an invalid loadout
      yields fit findings and no derived metrics in the production pipeline (the barrier
      criterion of ticket 06, closed at stage level only there). A seam test proves it.
- [ ] The schema carries what ticket 06 could not evaluate, each with a fit check and test, or
      a recorded ADR deferral: platform availability windows, loadout-entry identity with
      duplicate and containment-cycle checks, and unlocked-technology requirements.
- [ ] `pnpm snap` of the Shipbuilding workspace, started with a 1.2.0 draft, shows the
      default design, a clean console and the preserved draft file.
- [ ] `pnpm check` is green.
