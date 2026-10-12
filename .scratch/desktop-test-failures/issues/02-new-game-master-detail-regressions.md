# 02 — New-game master/detail regressions red-gating `pnpm check`

**Type:** task

**Status:** resolved (2026-10-12, effect-v4 Wave 2 gate)

**Blocked by:** none

**Frontier:** no

**What to build:** Repair the three failures that left `pnpm check` red on `dev`
after `6dbe595d` (archetype + fleet-method deck commit), so the Wave 2 exit gate
(ticket 15 of `.scratch/effect-v4-vendor-migration/`) can pass.

## Observed

Three red tests, all traceable to `6dbe595d`:

1. `apps/desktop/src/renderer/screens/new-game/RulesOfTheNavalAgeScreen.test.tsx`
   — "applies the previewed preset when Next is pressed" fails (unit).
2. `apps/desktop/e2e/new-game-fleet-method.spec.ts` — the manual-build card
   `click()` is intercepted by the top deck card (e2e).
3. `apps/desktop/e2e/theme.spec.ts` — "Fleet Dispatch surface…" expects the
   `globe-panel` background to follow the theme, but it resolved to
   `rgba(0, 0, 0, 0)` (e2e).

## Root causes

1. `6dbe595d` changed `RulesOfTheNavalAgeScreen.handleNext` from the ADR-0127 /
   `naval-age-master-detail` single-press "apply the previewed preset on Next"
   to a two-press "Select" flow, but did not update the screen's test. The
   ADR-0127 decision ("the step's primary action ('Next: Choose Archetype')
   applies a previewed-but-unapplied preset") and the existing test both say
   single-press. The two-press pattern is intended for the *archetype* and
   *fleet-method* screens (their specs assert it), not for this one.
2. `6dbe595d` rewrote the fleet-method e2e to centre-click a non-top deck card.
   The shared `CardDeck` overlaps its cards, so the top card intercepts a centre
   click — the archetype flow already works around this by stepping the listbox
   with the arrow keys and confirming with Enter.
3. `6dbe595d` removed `bg-admiralty-surface` from `GlobePanel`'s section, so the
   `globe-panel` testid no longer resolves to the active theme surface.

## Acceptance criteria

- [x] `RulesOfTheNavalAgeScreen` restored to the ADR-0127 single-press behaviour;
      its test passes unmodified.
- [x] `GlobePanel` restored to `bg-admiralty-surface`; the theme e2e passes.
- [x] The fleet-method e2e drives the overlapping deck by keyboard (arrow + Enter),
      matching the archetype flow, rather than centre-clicking a covered card.
- [x] `pnpm check` green end-to-end (33 e2e passed).

## Resolution (2026-10-12)

- `RulesOfTheNavalAgeScreen.tsx`: `handleNext` applies the pending preset and
  advances in one press (`selectPreset` + `applyPreset`), primary label constant
  "Next: Choose Archetype"; `applyPreset` import restored.
- `GlobePanel.tsx`: `bg-admiralty-surface` restored on the `globe-panel` section.
- `e2e/new-game-fleet-method.spec.ts`: replaced `manual.click()` with
  `listbox.press("ArrowRight")` + `listbox.press("Enter")`.

Evidence: `pnpm check` EXIT 0 — preflight/format/lint/lint:effect/scripts/
licenses/typecheck 37/37/build 20/20/test:run/balance-reports all green, desktop
e2e 33 passed. Rules suite 29/29.
