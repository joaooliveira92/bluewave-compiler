# 35: Click-to-place on the hull plan

**Type:** implementation
**Status:** resolved
**Blocked by:** 34 (resolved)
**Frontier:** yes

Spec: `parity-spec.md` F5. Place/move/remove fittings from the plan with keyboard parity and the same edits.

Acceptance:
- Pure `placement-tools.ts`: `stationAtX` (snap 10 permille), `zoneAtStation` (never MISSION), `sideAtY` (centre band, starboard
  above, port below), `placeEdit`, `moveEdit` (move plus side as one batch), `nudgeEdit`, `clientToPlan`.
- "Place on plan" / "Move on plan" toolbar; the plan SVG stays a static image and its click layer is a pointer shortcut for
  exactly what the toolbar does. Keyboard parity: component and fitting selects, four nudge buttons (10 and 50 permille toward
  bow or stern), a side select. A status line says what happened or what is missing.

## Comments

### 2026-10-09 orchestrator

Implemented. Not built, with reasons: **drag to move** and **clicking a marker to select it** (the SVG is a static `role="img"`;
interactive children would be nested-interactive, so selection is by the Fitting select), **auto place** (still no defined
semantics). Note: the shipped components declare no `allowedZones`, so the zone-refusal branch is covered by the pure tests
(place, move, nudge) but cannot be reached through shipped content in a render test; a vacuous render test for it was
written, caught by an explicit `toBeDefined`, and replaced by the reachable "nothing selected" refusal.
Tests: `placement-tools.test.ts` (pure), DrawingBoard render tests (place by click, move by buttons, missing-selection notice, off by default).
construction screens: 16 files / 163 tests; typecheck and lint exit 0.
