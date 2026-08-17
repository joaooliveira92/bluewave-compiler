# Preferences screen redesign + named presets

**Type:** grilling
**Status:** resolved
**Blocked by:** none

## Question

Spec the redesigned "Rules of the Naval Age" screen that merges era, campaign
scale, and historical-uncertainty settings into one screen (kept merged, not
split into 4 separate full-screen steps per the diagnosis doc — see the map's
Notes for why), replacing today's raw-dropdown `new-game-preferences` screen
(`RulesetOptionsSection`, `ScenarioSection`).

Cover:
- How each existing setting (scenario/era, fleet size, research speed,
  technology variation, historical budget, tactical realism, difficulty) is
  presented with the doc's plain-language explanations instead of bare
  dropdowns.
- The named preset system: Cadet / Admiral / Naval Historian / Alternate
  History / Custom — what settings each bundle maps to, and how selecting a
  preset vs. going Custom interacts with the underlying setting ids.
- The campaign-scale estimate panel (doc's "Estimated starting navy" ranges)
  and the low-budget warning (e.g. small nation + small fleet) — both must be
  computed from real engine data/rules, not hard-coded.
- Does NOT cover legacy-fleet-mode / starting-fleet-method — that's a
  separate, blocked ticket (04/05).

## Answer

**Screen**: One "Rules of the Naval Age" screen replaces both `RulesetOptionsSection`
and `ScenarioSection`. Three grouped `GlassCard` sections, top to bottom:
1. **Preset picker** (pinned at top — Cadet / Admiral / Naval Historian /
   Alternate History / Custom pills).
2. **Era & Scale** — scenario/era select (today's `ScenarioSection` dropdown) +
   fleet size.
3. **Historical Uncertainty** — research speed, technology variation,
   historical budget, tactical realism, difficulty — each rendered as a
   labeled choice with the setting's plain-language blurb beneath it instead
   of a bare `SelectItem` value.

**Presets → real engine setting-id bundles** (all six ids sourced from
`packages/campaign/src/scenario.ts` / `fleetSize.ts` / `researchSpeed.ts` /
`technologyVariation.ts`):

| Preset | fleetSize | researchSpeed | technologyVariation | historicalBudget | tacticalRealism | difficulty |
|---|---|---|---|---|---|---|
| Cadet | small | standard | none | standard | standard | easy |
| Admiral | standard | standard | some | standard | standard | normal |
| Naval Historian | large | slow | none | historical | realistic | hard |
| Alternate History | standard | fast | considerable | standard | standard | normal |
| Custom | — no bundle; whatever six values are currently set | | | | | |

**Preset/Custom interaction**: presets **pre-fill**, they don't lock. All six
dropdowns stay live; editing any one of them after picking a named preset
silently reverts the preset pill to "Custom" (no confirmation, no locked
state) — matches the existing `onPreferenceChange` wiring, no new UI state
needed.

**Copy authorship**: the plain-language blurb under each of the five
uncertainty settings' values (research speed, technology variation,
historical budget, tactical realism, difficulty — roughly 15–18 short
blurbs across all setting values) is hand-authored as part of the spec this
ticket produces, same pattern as ticket 01's nation dossier copy. The
diagnosis doc's own prose covers research speed and technology variation
directly; historical budget, tactical realism, and difficulty need original
1–2 line blurbs describing gameplay consequence, not just restating the
label.

**Estimated starting navy / low-budget warning — cut down to qualitative,
not numeric**: no engine surface computes ship-count ranges today, and
nation data (`nationFlavorText.ts` / `nationPresentationCatalog.ts`) is
qualitative flavor text, not numbers — there is nothing to compute the
doc's literal "6–10 capital ships" ranges from without new engine/data
work, which the map's Notes rule out for this ticket. Kept in reduced form:
a short qualitative readout derived only from the fleetSize preset's
relative `FLEET_SIZE_BPS` multiplier (e.g. "Reduced fleet — faster turns,
fewer ships to manage" for `small`, "Recommended default" for `standard`,
etc.) — no per-nation numbers, no ship-count ranges, no low-budget
nation+fleet-size cross-warning (that would need numeric nation budget data
that doesn't exist).

**Out of scope** (ruled out this session, not fog):
- Doc's "Aviation Development" toggle (Historical/Delayed) — no engine
  setting id backs it (confirmed: no aviation setting anywhere in
  `packages/campaign`).
- Doc's "additional clone-friendly options" (battle frequency, AI design
  quality, automatic fleet organization/deployment, detailed officer
  management, fog-of-war level, manual/auto tactical battles, tutorial
  adviser, pause-on-events, ironman mode) — none exist as engine setting
  ids; no surface to spec against.
- Numeric "Estimated starting navy" ship-count ranges and the
  nation+fleet-size low-budget warning as the doc describes them — would
  require new engine/nation-budget data work, which is out of scope per the
  map's Notes ("No engine work should be needed for era/scale/uncertainty").
