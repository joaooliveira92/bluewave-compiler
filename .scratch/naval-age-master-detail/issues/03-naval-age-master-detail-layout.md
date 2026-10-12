# INC-3 — Rework Rules of the Naval Age into two-pane master/detail

**Type:** implementation
**Status:** open
**Blocked by:** 01
**Frontier:** no
**Requirements:** NAM-1, NAM-2, NAM-4, NAM-5, NAM-6, NAM-8; AC-1, AC-2, AC-5, AC-7, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14; DESIGN-51, DESIGN-03, DESIGN-02, BW-ARC-002

## What to build

Rework the **live** `Rules of the Naval Age` screen into a two-pane master/detail
surface (stacked at narrow widths), wired to the existing new-game state.

- **MASTER (left):** a **preset deck** of the four `PRESET_DEFINITIONS`
  (Cadet / Admiral / Naval Historian / Alternate History) built on the shared
  deck + master selector from INC-1 — listbox semantics and Fleet Dispatch
  interaction parity (arrow wrap, 32px/360ms wheel, Enter confirms, drag-to-fling
  changes focus, tapping any visible card selects).
- **DETAIL (right):** a vertical, scrollable column holding a **focused-preset
  detail panel** (name, tagline, the six settings, Active/Select state) and the
  **relocated `EraScaleSection` and `HistoricalUncertaintySection`**, fully
  functional.

Semantics: moving focus only **previews** the bundle (no commit); Enter or a tap
calls the existing `selectPreset(presetId)` so the six settings flow through
`DraftPreferences` and `detectActivePreset` still derives Active/"Custom" — no
state fork. Preserve the `Back` action and the `"Next: Choose Archetype"` primary
action / `onNext(preferences, options)` flow. Adopt a full-bleed master/detail
shell (the current centred `max-w-4xl` column cannot host the split).

Deliverable: the live preset step looks and behaves like the Fleet Dispatch step,
shows each preset's actual six settings, and keeps every existing control working.

## Acceptance

- [ ] At `lg`+ the master listbox and detail region are siblings in a two-pane split; at narrow widths they stack into one scroll column.
- [ ] The master renders exactly four `role="option"` presets with the accessible names Cadet / Admiral / Naval Historian / Alternate History.
- [ ] Arrow Right/Down advances and Left/Up retreats, both wrapping via the shared `normalizeIndex`; wheel uses 32px/360ms; Enter confirms; drag-to-fling changes focus; tapping a non-top card selects it.
- [ ] The focused-preset panel shows name, tagline, and all six settings with an Active/Select state; moving focus previews without committing preferences.
- [ ] `EraScaleSection` (era, campaign seed, fleet size) and `HistoricalUncertaintySection` render in the right column and remain functional.
- [ ] Selecting a preset applies its exact six-setting bundle via `selectPreset`; editing any one setting afterwards reverts the derived active preset to Custom.
- [ ] `Back` and `"Next: Choose Archetype"` / `onNext(preferences, options)` are preserved with an unchanged payload.
- [ ] Screen render tests are reworked in place so the pre-rework `BounceCards`/single-column code fails them.
- [ ] No new `as unknown` casts; one component per file; barrel public surface.
