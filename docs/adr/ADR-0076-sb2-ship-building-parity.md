# ADR-0076: SB-2 ship-building parity with the reference design screen

## Status

Accepted 2026-10-09. Beneath DESIGN-21/22/23 and ADR-0063/0064 (SB-1). Spec: `.scratch/ship-building/parity-spec.md`.

## Context

The owner compared the Drawing Board with the Rule the Waves 3 design screens and approved five parity features: yard fit, ship type and class code, armour coverage and scheme, a turret and battery editor, and click-to-place on the hull plan. Mechanics are matched; the UI is not cloned.

## Decisions

1. **Yards are forecast-only (ticket 31).** Construction (`phase-engine`) does not choose or consume a yard; only the workshop forecast does. The Drawing Board therefore lists every yard with its fit, the limits a hull exceeds and the months at that yard (`forecast.yards`, `yardMisfits`), labelled "forecast only". A preferred-yard control is deliberately not built: it would change the forecast without changing what is built. It returns when the engine consumes yards.
2. **No invented data in the UI.** Every new control edits a draft field or displays a compiled value; display conventions are labelled as such (the legend chips of ADR-free commit e290270 already do this for the hull plan).
3. **Prefer exposing the existing model to adding fields (ticket 33).** The armour model already carries per-region length, height, thickness, material and obliquity, and a compiled coverage figure, so the armour scheme is edits to those regions (`set_armour_regions` is one atomic, undoable step), not new draft fields. Any field a later ticket does add (34) is optional with a documented default, so existing drafts, goldens and persistence stay valid.
4. **Balance constants for new effects live in `balance.yaml`** and are marked PLACEHOLDER until research pass 2 is applied.
5. **Era scope is the EARLY band.** Aircraft, CIWS, radar directors, HAA factor, oil/turbine/aluminium, mines, a custom-graphics tab and the BC type stay deferred.

## Update 2026-10-09

Decision 1 is superseded by ADR-0077: construction now builds a designed ship at the yard chosen when its design is compiled (the same rule as the forecast), so the Drawing Board's yard list is no longer "forecast only". A preferred-yard control is still not built; it would have to be an option on `SubmitDesign`, because the yard is fixed in the design version.

## Consequences

Players see which yards could build a design and why not, without a control that implies the engine honours it. Later tickets build on optional draft fields, so older saves load unchanged.
