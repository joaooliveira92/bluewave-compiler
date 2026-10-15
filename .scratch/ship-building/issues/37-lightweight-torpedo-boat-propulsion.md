# 37: Lightweight propulsion model for 1880 torpedo craft

**Type:** decision + implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** yes

Source: the January-1880 reference-design pass (`docs/research/ship-building-1880-ships-by-nation.md`). The only propulsion
plant available in 1880 is `compound_cylindrical` (195 kg/kW), so a ~28 t first-class torpedo boat (e.g. HMS TB2, 460 ihp,
20 kn) cannot be modelled: the plant alone weighs ~58 t at its 300 kW minimum, more than the whole boat. Every 1880 torpedo
boat in the research (UK TB2/Lightning, French N°27, German Ulan, Austro-Hungarian III/IV) is therefore absent from the
reference set. This is a modelling gap, not a missing content entry.

## Acceptance criteria

- At least one propulsion configuration appropriate for ~25–80 t torpedo craft (a locomotive-boiler/compound set),
  introduced no later than 1880-01 and available in the January 1880 campaign.
- Validate the complete machinery mass (engines + boilers + water + auxiliaries), not merely engine mass, against the
  hull's displacement budget.
- The new plant must not be exploitable by larger classes (a `maxKw`/mass penalty that makes it unattractive above
  torpedo-craft size), and must not let a battleship buy cheap power.
- Add one historically grounded torpedo-boat reference design (e.g. HMS TB2 class, 1879) that is valid at 1880-01.
- The design classifies as DD (or the intended small-combatant class) with no BLOCKING/CRITICAL finding and no negative
  mass margin.
- Source the plant's mass and fuel curve to a primary/near-primary source (White 1894 machinery table is the lead; its
  "single large locomotive boiler, first-class torpedo boat 1890-93" row is 43–49 kg/kW) or record the estimate.

## Comments

- 2026-10-10 created from the January-1880 reference-design review.
- 2026-10-15 resolved. New plant `compound_locomotive_tb` (coal, 2-cyl compound + single locomotive boiler):
  `weightMilliKgPerKw 46000` (46 kg/kW ESTIMATE — the complete-machinery figure, inside White 1894 p.562's
  sourced 43–49 kg/kW band applied to 1880; `auxWeightBp` is 0), `volumeLitrePerKw 60`, coal SFC adapted from
  the 1890 loco plant (ESTIMATE), `reliabilityBp 8000`, `minKw 150`/`maxKw 600` (a battleship's power falls
  outside the range → BLOCKING `PLANT_SIZE_RANGE`), `fromMonth 1880-01`, `requires [mac_compound_engine]`.
  `torpedo_boat_form.lengthMinMm` 30000→24000 to admit the 1877–79 first-class boats. New reference design
  `tb2_1879` (HMS TB2 class, 1878–79): 26.3 m × 3.1 m × 1.60 m, 28 t, 343 kW (460 ihp), 20 kn, 1×14-in tube
  (stand-in for the 16-in), compiles clean — zero findings, DD, ledger 28,771 kg vs 28,000 target. Added to UK
  and France `domesticPlants`.
  Validation (worktree `sprint/ship-building-30`): uncached build 0/24 cache hit; `pnpm format`/`lint`
  (0 errors)/`typecheck` green; `pnpm test:run` 293 files / 2049 passed; `pnpm test:heavy` 12 passed;
  `pnpm test:e2e` 30 passed; `pnpm check:golden` all 11 hashes match; `pnpm check:determinism` byte-identical;
  `pnpm check:equivalence` byte-identical; `pnpm check:balance-reports` ok; `pnpm content:verify` hash
  `ffee6cd4…`; `pnpm preflight` green.
  Reviewer pass: NEEDS_REWORK → repaired (reworded the unsourced "no electrical plant" claim to an explicit
  approximation; strengthened the margin assertion; added the plant to UK/France `domesticPlants`; added a
  UK-nation-context compile test). The `packages/ship-design/src/equivalenceReport.ts` `PINNED_COVERAGE`
  bump (constant only, reference-run-inert) is committed with `Golden-Repin: not-needed`.

## Deferred

- Small-craft funnel + light dynamo: the model has no correctly-sized small-craft funnel or light dynamo, so
  `tb2_1879` omits both (an unsourced approximation). Follow-up needed to author small-craft versions and fit
  them to the torpedo-boat reference designs.

