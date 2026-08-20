# INC-6 — Overview dashboard upgrade

**What to build:** The upgraded Overview dashboard, per [the assembled
spec](../spec.md) §6 — the center of the strategic loop.

- **Header summary:** appointment title → the real `admiralName`; campaign
  name (M1 identity); fleet-strength summary, active-construction-project
  count, and highest-foreign-tension as **fresh derivations** (not aggregate
  reads); current date/funds/projected balance per INC-14's header.
- **Naval Position:** active ships by ship type (derived); total monthly
  maintenance **re-derived** fresh from ships (never the raw `maintenanceCost`,
  0 pre-first-commit); "largest port capacity" (port-`level` proxy — no real
  dock entity); active construction count; construction expenditure +
  research expenditure from INC-1's economy fields.
- **Foreign Situation:** top three highest-tension relationships with tension
  score + label via `tensionLabel` (imported, never re-derived). Tension
  trend **cut** (no previous-turn tension stored).
- **Immediate Priorities panel:** INC-2's projection, hard cap 5, severity-
  sorted, `destination` links, the spec's empty-state copy verbatim.
- **Recent Developments:** draws from the most recent Monthly Naval Estimates
  report's entries (INC-12; forward dependency — honest empty state until
  then).
- **Advance Month:** primary action visible without scrolling (unchanged).

**Blocked by:** INC-1, INC-2, INC-14

**Status:** done (INC-6 impl, 2026-08-19 — overview derivations + tensionLabel + cap-5 priorities + honest empty states)

- [x] All header/naval-position/foreign-situation fields derive from real
      snapshot data (fresh derivations, no aggregate reads where the spec
      says derive)
- [x] Maintenance is re-derived from ships, never the raw `maintenanceCost`
- [x] Priorities panel renders INC-2's output with cap-5 + severity sort +
      destination links + the spec's empty-state copy
- [x] Tension labels use `tensionLabel`/`isHighTension` (imported, not
      renderer-re-derived); no tension-trend indicator exists
- [x] Recent Developments hooks the naval-estimates report (INC-12) with an
      honest empty state until it lands
- [x] Component tests cover the derivations + the priorities panel
- [x] Goldens 10/10 unchanged
