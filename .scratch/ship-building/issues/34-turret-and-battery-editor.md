# 34: Turret and battery editor

**Type:** implementation
**Status:** resolved
**Blocked by:** 32 (resolved)
**Frontier:** yes

Spec: `parity-spec.md` F4. Named positions, add/delete/clear turret, mount kind, battery summary, auto-place.

Acceptance (revised on inspection; add/duplicate/move/remove per fitting already existed in the Arrangement panel):
- `batterySummary` and `mountNames` (A, B forward / Y, X aft; "Port 1" for wings) pure helpers in `batteries.ts`.
- `set_side` (the mount side had no UI path) and `batch` (several edits as one undoable step) edits; `changeKindsOf`.
- Batteries panel: grouped by role and calibre with named mounts, totals, rounds per gun for the whole battery
  (clamped per mount) and "Clear" with confirmation; side selector and name badge in the placements rows.

## Comments

### 2026-10-09 orchestrator

Implemented as revised. Deferred, with reasons: **auto place** (no defined zone/station semantics that stay valid with the
placement validator; revisit with ticket 35's click-to-place), **mount kind** (turret/casemate/pedestal is baked into each
component id, so it is chosen by choosing the component), **sponson radius / asymmetric mounts / "turret era"** (no
mechanics in the domain yet; would be invented data). Tests: `batteries.test.ts` (14), desktop `batteryView.test.ts`
and a render test (names, side, clear-then-undo in one step). ship-design 34 files / 353 tests; construction screens 15 files / 141 tests.
