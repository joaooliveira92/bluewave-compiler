# ADR-0067: Ship classification and refit rules versus the RTW3 manual

## Status

Accepted 2026-10-08. Evidence: `docs/research/rtw3-official-manual-ship-rules-and-1890s-history.md` and `docs/research/rtw3-ship-design-guide-danger-honk.md`.

## Decision

1. **CA main-gun bound stays strictly above 6 in** (`docs/rules/ship-classification.md` §11, `classification.ts`). The RTW3 manual says "at least 6 in"; Bluewave deliberately gives a 6 in gun to `CL`. This is an intentional deviation, not a bug.
2. **No pre-1925 speed cap.** The 21 kn claim from a Steam comment has no support in the manual or elsewhere; `machinery.ts` keeps no date-based speed cap.
3. **`ARMOUR_MODIFICATION` stays broader than the manual's rebuild list** (manual p. 32: +1 in deck, remove conning tower, change upper belt). Bluewave allows the whole `ARMOUR_SCHEME` category under the REBUILD limits (life, fatigue, growth budget, cost), per spec §16. Turret-only armour removal from the community guide is not adopted. `RefitPlan` gained optional `armourSet` / `armourRemove` armour-region edits (ticket 21), legal only under `ARMOUR_MODIFICATION` and counted in net added mass, growth budget and cost through the normal compile path; the `ARMOUR_SCHEME` component category remains in `allowedCategories` but no content uses it.
4. **Community-guide values are not constants.** Hit-zone percentages (e.g. turret top), build-month figures and tech years from the guide are unverified balance values and are not copied.
5. **Deferred, not dropped:** turret-top hit region, main/secondary/tertiary battery distinction, all-or-nothing armour scheme (post-1900 abstractions). The protected-cruiser exception (ticket 19) and build-time-by-displacement (ticket 20) are implemented; the build-time table still has ESTIMATE rows (300, 3,000, 9,000, 20,000 t) and a Wikipedia-only 12,000 t row that must be replaced with verified data before release, and the forecast is labelled provisional until then.
6. **`yardCapacityWorkPerMonth` raised 2,000,000 to 20,000,000 (PLACEHOLDER).** At 2M a Majestic-size hull could not finish within `maxMonths`. With 20M the historical table time normally sets the forecast (`months = max(historical, capacity schedule)`), so the yard-line bottleneck text appears only for over-large or over-loaded builds. Per-yard capacities scaled to each yard's maximum displacement are the proper follow-up.

## Consequences

Items 1-4 needed no change to existing rules; tickets 19 (protected-cruiser exception) and 21 (refit armour edits) added code. Build-time constants must be derived from history and verified against Conway's or Brassey before use (ticket 20).
