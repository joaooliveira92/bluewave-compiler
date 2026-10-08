# 18: Desktop Drawing Board UI, staged

**Type:** implementation
**Status:** open
**Blocked by:** 14
**Frontier:** no

Spec: `.scratch/ship-building/spec.md` (see §26 row SB-18). Acceptance: the ACs named in the spec for this slice,
with unit, boundary, invalid-design, serialization and determinism tests per spec §22.

## Comments

- 2026-10-08 v1 landed: "Drawing Board" tab on the Construction screen (`apps/desktop/src/renderer/screens/construction/drawing-board/`). Local-only: bundled EARLY-band content (`@content` alias), undoable edit log, live `buildWorkshopView` panels (hull, machinery, components + zone/station, protection, validation with why/consequence/remedies, performance, weight summary, forecast, dev-metric label). 7 component tests; desktop suite 806 passing; verified in the built app with `pnpm snap` (screenshot + aria: regions present, console clean).
- Not yet: side-profile/zone drawing, protection diagram, arc overlay, comparison with existing classes, variant/revision history UI, save-as-class, derive-variant, AI candidates panel, submit-for-construction (needs SB-14), requirement editing. Remedy buttons (apply + preview deltas) next.
