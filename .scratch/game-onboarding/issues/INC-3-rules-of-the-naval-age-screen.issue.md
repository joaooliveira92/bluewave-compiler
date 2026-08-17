# INC-3 — Rules of the Naval Age screen (preferences + presets)

**What to build:** Replace today's `RulesetOptionsSection`/`ScenarioSection`
raw-dropdown screen with one merged "Rules of the Naval Age" screen per
[the assembled spec](../spec.md) §2. Three sections top to bottom: preset
picker (Cadet/Admiral/Naval Historian/Alternate History/Custom pills) pinned
at top; Era & Scale (scenario/era select + fleet size); Historical
Uncertainty (research speed, technology variation, historical budget,
tactical realism, difficulty), each with a hand-authored plain-language
blurb beneath its value instead of a bare dropdown item. Presets pre-fill
the six real engine setting ids without locking — editing any one after
picking a preset reverts the pill to "Custom." A qualitative,
fleetSize-derived "estimated starting navy" readout replaces the doc's
numeric ship-count ranges.

**Blocked by:** INC-1

**Status:** done

- [x] Preset picker applies the exact six-setting bundles from the spec's
      table for Cadet/Admiral/Naval Historian/Alternate History
- [x] Editing any of the six settings after selecting a named preset reverts
      the picker to "Custom," with no confirmation dialog
- [x] Era & Scale card shows scenario/era select + fleet size
- [x] Historical Uncertainty card shows all five settings, each with a
      hand-authored 1–2 line blurb per value (~15–18 blurbs total)
- [x] Qualitative fleet-size readout shown (e.g. "Reduced fleet — faster
      turns, fewer ships to manage" for `small`), no numeric ship-count
      ranges and no nation+fleet-size low-budget warning anywhere
- [x] No Aviation Development toggle or any of the doc's other
      unbacked "clone-friendly options" present
- [x] Component tests cover preset selection, revert-to-Custom-on-edit, and
      the qualitative readout for each fleet size value
