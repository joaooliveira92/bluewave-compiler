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

- 2026-10-08: "Suggest fixes" added (ship-design `suggestFixes`: deterministic neighbourhood of explainable edits, each previewed by recompiling, ranked by serious-finding reduction, never introduces a blocker); Drawing Board shows them with Apply buttons and the before/after counts. Verified in the built app with `pnpm snap` (fill 400 t coal -> suggestion "Reduce coal bunkers to 60 t", blocking 2 -> 0).

- 2026-10-08: "AI alternatives" panel (generate from the current design with the same rules; load a candidate as the working design, history reset). Verified in the built app: 4 distinct valid candidates. Desktop suite 808 passing.

- 2026-10-08: Drawing Board now opens in a full-size modal; hull plan with gun-arc layer, topside load meter, comparison with the starting design, edit history with jump-to-step, design file save/open, revision preview and "Apply revision" for ships whose design the engine kept. Rebuilt on the UI kit (Accordion, Alert, AlertDialog confirms, Attachment, Badge, ButtonGroup, Checkbox, ContextMenu, DropdownMenu, HoverCard, Popover). Verified in the built app with `pnpm snap`: project "Probe Class" revised end to end (select, edit, Apply, confirm dialog, queued as Free change).
