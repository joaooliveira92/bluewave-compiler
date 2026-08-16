# Map: Campaign Commissioning Flow

**Label:** wayfinder:map

## Destination

A written **spec** for the campaign commissioning flow — everything between nation
selection and the existing strategic dashboard (diagnosis-doc steps 1–9: nation
confirmation → choose era/scale/uncertainty/fleet-method → admiral & campaign
identity → commissioning review → world-generation presentation → opening
strategic briefing). The spec hands off to implementation tickets once done. It
stops at the **existing, unchanged** Overview dashboard — the dashboard redesign
and guided-first-month tour (doc steps 10–11) are a future effort, not this one.

## Notes

- Source idea: [01-diagnosis.md](./01-diagnosis.md) — a Rule the Waves 3-inspired
  design doc. Treat it as inspiration/reference copy, not a binding spec — several
  of its proposals were cut or reshaped during charting (see Out of scope below).
- Domain: Bluewave Compiler, a naval strategy game (apps/desktop, packages/campaign,
  packages/campaign-engine).
- Existing flow this replaces/reorders: `apps/desktop/src/renderer/shell/useNewGameFlow.ts`
  (draft state machine: preferences → archetype → nation → launch → open campaign),
  `campaign-shell-state.ts` (screen modes), `campaign-screen-registry.tsx`.
- Existing screens to extend rather than rebuild from scratch:
  `screens/new-game/nation-selection/` (NationSelectionScreen + DossierSlidePanel),
  `screens/new-game/NewGameArchetypeScreen.tsx` (+ `archetype-consequence.ts`,
  3-dimension economy/industry/combat allocation), `screens/new-game/components/`
  (RulesetOptionsSection, ScenarioSection) under CampaignPreferencesScreen-adjacent
  new-game preferences screen.
- Engine already supports 5 canonical scenarios (1880/1900/1920/1935/1960) and full
  setting-id sets (fleet size, research speed, tech variation, historical budget,
  legacy fleet mode, tactical realism, difficulty) — see `packages/campaign/src/scenario.ts`.
  No engine work should be needed for era/scale/uncertainty; only for the fleet-method
  semantics called out below.
- Every ticket here is a **grilling** ticket — HITL, always invoke `/grilling` and
  `/domain-modeling`. Reach for `/prototype` if a screen's layout needs to be seen to
  be judged, not just described.
- Each resolved ticket's answer is the corresponding section of the spec; once all
  tickets are resolved, assemble the sections into a single spec document as the
  final act of this effort (not itself a ticket).

## Decisions so far

- [Nation confirmation screen](./issues/01-nation-confirmation.md) — evolves
  the existing `DossierSlidePanel` accordion in place (no new full-screen
  route); appointment title replaces the static header label, no date shown;
  new fields (doctrine, budget category, shipbuilding capacity, research
  strengths/weaknesses, regions, characteristics, rivals, difficulty rating)
  fold into the existing Economy/Military/Diplomacy tabs, hand-authored for
  all 10 nations, presentation-only (no engine changes); difficulty is a
  fixed 1–5 cosmetic tier tracking commitment complexity, not fleet size;
  buttons: Change Nation (collapse panel), Continue as [Nation] (renamed from
  Confirm Selection), Recommended Setup (applies Admiral preset + default
  fleet method); flow-reorder in `useNewGameFlow.ts` deferred to final spec
  assembly, out of scope here.
- [Preferences screen redesign + named presets](./issues/02-preferences-and-presets.md) —
  one "Rules of the Naval Age" screen (preset picker + Era & Scale + Historical
  Uncertainty cards) replaces `RulesetOptionsSection`/`ScenarioSection`; five
  named presets pre-fill (not lock) the six real engine setting ids, editing
  after picking one reverts to Custom; ~15–18 hand-authored plain-language
  blurbs for the five uncertainty settings; "estimated starting navy" cut
  down to a qualitative fleetSize-only readout (no numeric ship-count
  ranges, no nation-budget low-budget warning — no numeric data exists to
  back either).
- [Archetype re-skin + Admiral/Campaign Identity step](./issues/03-archetype-and-identity.md) —
  archetype screen confirmed as-is (named presets already exist in the
  engine, no changes needed); new Identity step (admiral name, campaign
  name, naming convention, ship-name reuse, measurement system) sits
  immediately after Archetype, both names required, three enums default to
  historical/disabled/imperial, all UI-only capture with nothing wired to
  `compileCampaign`.
- [Define legacy-fleet-mode semantics](./issues/04-legacy-fleet-mode-semantics.md) —
  `generated` = doc's Option A (inherit an existing navy, the recommended
  default); `disabled` = Option B (manual build, automatic generation turned
  off); `historical` = Option C (curated, historically-inspired fleet — *not*
  a manual-history-recreation mode, despite the name). No 4th id needed.
  Actual fleet-generation/build/curation behavior is out of scope for this
  spec — nothing in the engine branches on this id yet; the mapping only
  makes the Starting-Fleet-Method screen's copy (ticket 05) truthful.
- [Starting-fleet-method screen](./issues/05-starting-fleet-method-screen.md) —
  three-card select (Inherit/Manual-build/Curated), no UI-level era-gating
  despite the doc's 1900-only framing (engine allows all three in every
  era); default is `generated`/Inherit; all three cards are descriptive-only
  (no numeric previews); manual-build stays fully selectable with a "not yet
  available in detail" note rather than being hidden or grayed out.
- [Final commissioning review screen](./issues/06-commissioning-review.md) —
  summary table reuses tickets 01/02/03/05's exact settled vocabulary
  (nation, era, fleet size, the five uncertainty settings + active preset
  label, starting fleet method, archetype, the three Identity enums,
  admiral/campaign name); cuts the doc's Aviation development/Tutorial
  adviser/Economic model rows entirely (no engine backing); strategic
  forecast panel templated from ticket 01's per-nation dossier data + a
  settings-keyed pressures list, not hand-authored per nation×era; "Save as
  Preset" and "Generate Another Starting Fleet" buttons both cut entirely
  (no persistence layer / no generation logic to back either) — only Back
  and Begin Commission ship.
- [World-generation presentation](./issues/07-world-generation-presentation.md) —
  cosmetic checklist reveal, no real progress-reporting, `compileCampaign`'s
  bridge contract untouched; the indeterminate native save-directory dialog
  buried inside that one opaque call is handled by racing a ~2.5–3s bounded
  cosmetic sequence against the real call and freezing on the last line if
  it runs longer (flagged rough edge, not fixed here); doc's four flavor-text
  lines reused verbatim; auto-advances into the Opening Strategic Briefing
  on success; `SAVE_LOCATION_CANCELLED` silently returns to Commissioning
  Review, the other five failure reasons show a real error state.
- [Opening strategic briefing](./issues/08-opening-strategic-briefing.md) —
  5-page linear briefing (Appointment / State of the Navy / Treasury /
  Foreign Intelligence / Immediate Concerns), each page shipping only what's
  derivable from real engine data (with joins spelled out per page) and
  cutting the rest rather than inventing new domain concepts: no
  reserve/overseas ship states or oldest-capital-ship, no "other naval
  expenses" remainder, no estimated-enemy-ship-counts or intelligence-quality
  tiering, no "understaffed region" concern category (leans on the
  out-of-scope Regional Commitments model); qualitative treasury status kept
  as lightweight threshold logic; closes with "Take command" into the
  existing, unchanged Overview dashboard.

## Not yet specified

_(empty — the charting session ticketed everything sharp; nothing left in fog within scope)_

## Out of scope

- **Regional Commitments briefing page + any "required regional presence" domain
  model** — no possessions/regions-with-required-presence concept exists yet
  (only a possessions/ports layer on the world map with owner/name/location, no
  "required presence" semantics). Modeling that is its own domain-modeling effort.
- **Dashboard priorities/checklist panel and Guided First Month tour** (diagnosis
  doc steps 10–11) — future effort once the commissioning flow itself is solid.
- **Redesigning the archetype dimension system** to match the doc's
  Strategist/Engineer/Politician/Commander framing — the engine's existing
  Economy/Industry/Combat 3-dimension system stays; doc flavor layers on top as
  presentation only.
- **"Compare Nations" button** — cut, no dependency issues, just not core.
- **App-wide metric/imperial unit conversion and generated ship-naming logic** —
  the *settings* (naming convention, ship-name reuse, measurement system) are
  captured and shown in the commissioning review, but wiring them to reformat
  numbers or generate names throughout the app is later work.
- **"Guided inspection" / "Delegate routine administration" briefing-close
  buttons** — no destination exists for them yet (see dashboard/guided-tour
  exclusion above); only "Take command" ships in this spec.
- **Doc's "Aviation Development" toggle and "additional clone-friendly
  options"** (battle frequency, AI design quality, automation toggles,
  fog-of-war level, tutorial adviser, ironman mode, etc.) — none exist as
  engine setting ids, no surface to spec against. Ruled out resolving
  [Preferences screen redesign + named presets](./issues/02-preferences-and-presets.md).
- **Numeric "Estimated starting navy" ship-count ranges + nation-budget
  low-budget warning** as the diagnosis doc describes them — would need new
  engine/nation-budget data work the map's Notes rule out; kept only as a
  qualitative fleetSize-derived readout instead. Ruled out resolving
  [Preferences screen redesign + named presets](./issues/02-preferences-and-presets.md).
