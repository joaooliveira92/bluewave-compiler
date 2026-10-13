# VisualEra model and year bands

**Type:** grilling
**Status:** resolved
**Blocked by:** 01

## Question

Define the dedicated 4-value `VisualEra` (V / P / D / L) that selects a part's appearance,
derived from the **campaign year**, and pin its exact boundaries and relation to the repo's
`EraBand`s:

- Recommended mapping from the manual's year ranges (research note §5): V ≤ 1895,
  P ≤ 1905, D ≤ 1935, L beyond — chosen so a part's look can change *within* an `EraBand`
  and the model survives new repo bands.
- Confirm the boundary years are balance/display constants (no manual numeric schedule), and
  record them as a versioned ruleset constant + ADR if surprising or hard to reverse.
- Decide how `VisualEra` is computed from a campaign month (mirror `eraBandOf`) and whether
  the *design year* or the *campaign year* governs (proposal: design year, so a rebuild
  re-styles consistently).
- Decide the interaction with repo canon scenarios (1880/1900/1920/1935/1960): repo canon is
  authoritative; the manual's 1890/1900/1920/1935 set is reference only.

## Answer

Resolved autonomously.

- `VisualEra` = `VICTORIAN | PRE_DREADNOUGHT | DREADNOUGHT | LATE_DREADNOUGHT`, with the
  manual's letters (V/P/D/L) kept only as `code` for traceability.
- **Bands by year** (inclusive upper bounds): `VICTORIAN` ≤ 1895, `PRE_DREADNOUGHT` 1896–1905,
  `DREADNOUGHT` 1906–1935, `LATE_DREADNOUGHT` ≥ 1936. These are **display constants**, not
  manual facts: the manual's ranges overlap and give no tie-break (research note §5.2.2). They
  are versioned as `VISUAL_ERA_RULESET = "ship-visual-era/1"` and recorded in ADR-0148.
  The EARLY band (1880–1899) therefore spans V and P, so a ship's look changes inside the band.
- `visualEraOf(month)` mirrors `eraBandOf`: parses `YYYY-MM`; returns `null` for a malformed
  month (never a silent default). Years before 1896 (including pre-1880) are `VICTORIAN`.
- **Governing time:** the design month: the month the design is drawn in (`month` on the
  workspace). `DesignDraft` carries no month, so the workspace month is the design month today;
  when a stored class records its design month, that month governs, so a refit is drawn in its
  original style.
- Repo canon (1880/1900/1920/1935/1960) is authoritative; the manual's scenario starts are
  reference only and play no part in `VisualEra`.
